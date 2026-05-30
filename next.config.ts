import type { NextConfig } from "next";
import path from "path";

const allowedDevOrigins = process.env.TABLEFLASH_ALLOWED_DEV_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },

  ...(process.env.NODE_ENV === "development" && allowedDevOrigins?.length
    ? { allowedDevOrigins }
    : {}),
};

export default nextConfig;