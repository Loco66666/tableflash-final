import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envFilePath = resolve(process.cwd(), ".env.local");

function parseEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();

        return [key, value];
      }),
  );
}

const fileEnv = parseEnvFile(envFilePath);

function hasEnv(name) {
  return Boolean(process.env[name] || fileEnv[name]);
}

function hasAny(names) {
  return names.some((name) => hasEnv(name));
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const missing = required.filter((name) => !hasEnv(name));

if (!hasAny(["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"])) {
  missing.push("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
}

if (missing.length > 0) {
  console.error("Production env preflight failed. Missing:");
  for (const name of missing) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}

console.log("Production env preflight passed. No secret values were printed.");

if (
  !(
    hasEnv("UPSTASH_REDIS_REST_URL") && hasEnv("UPSTASH_REDIS_REST_TOKEN")
  ) &&
  !(hasEnv("KV_REST_API_URL") && hasEnv("KV_REST_API_TOKEN"))
) {
  console.warn("Redis env vars are missing; rate limiting will use the in-memory fallback.");
}
