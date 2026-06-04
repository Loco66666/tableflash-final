import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
  prefix: string;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  storage: "redis" | "memory";
};

type MemoryHitBucket = {
  timestamps: number[];
};

const memoryHits = new Map<string, MemoryHitBucket>();
const redisLimiters = new Map<string, Ratelimit>();
let hasWarnedAboutMemoryFallback = false;

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

function getRedisLimiter(input: RateLimitInput) {
  const config = getRedisConfig();

  if (!config) {
    return null;
  }

  const windowSeconds = Math.max(1, Math.ceil(input.windowMs / 1000));
  const limiterKey = `${input.prefix}:${input.limit}:${windowSeconds}`;
  const cachedLimiter = redisLimiters.get(limiterKey);

  if (cachedLimiter) {
    return cachedLimiter;
  }

  const redis = new Redis({
    url: config.url,
    token: config.token,
  });

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(input.limit, `${windowSeconds} s`),
    prefix: input.prefix,
  });

  redisLimiters.set(limiterKey, limiter);

  return limiter;
}

function memoryLimit(input: RateLimitInput): RateLimitResult {
  if (process.env.NODE_ENV === "production" && !hasWarnedAboutMemoryFallback) {
    hasWarnedAboutMemoryFallback = true;
    console.warn(
      "[rate-limit] Shared Redis/Upstash env vars are missing; using per-instance memory rate limiting.",
    );
  }

  const now = Date.now();
  const windowStart = now - input.windowMs;
  const hitKey = `${input.prefix}:${input.key}`;
  const bucket = memoryHits.get(hitKey) ?? { timestamps: [] };
  const recentHits = bucket.timestamps.filter((timestamp) => timestamp > windowStart);

  if (recentHits.length >= input.limit) {
    const retryAfterMs = input.windowMs - (now - recentHits[0]);

    memoryHits.set(hitKey, { timestamps: recentHits });

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      storage: "memory",
    };
  }

  recentHits.push(now);
  memoryHits.set(hitKey, { timestamps: recentHits });

  return {
    allowed: true,
    retryAfterSeconds: 0,
    storage: "memory",
  };
}

export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const limiter = getRedisLimiter(input);

  if (!limiter) {
    return memoryLimit(input);
  }

  try {
    const result = await limiter.limit(input.key);

    return {
      allowed: result.success,
      retryAfterSeconds: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      storage: "redis",
    };
  } catch (error) {
    console.error("[rate-limit] Redis rate limit failed, falling back to memory", error);

    return memoryLimit(input);
  }
}
