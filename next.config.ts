import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// Load fleet-shared environment variables (if present)
loadEnv({ path: resolve(process.cwd(), ".env.fleet") });

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
};

const basePath = process.env.BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH;
if (basePath) {
  config.basePath = basePath;
}

export default config;
