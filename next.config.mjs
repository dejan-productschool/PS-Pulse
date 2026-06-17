import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so an unrelated lockfile in a parent directory
  // doesn't get picked up for output file tracing.
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
