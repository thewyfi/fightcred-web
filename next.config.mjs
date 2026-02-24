import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Skip static generation errors - pages are dynamically rendered
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};
if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}
export default nextConfig;
