import type { NextConfig } from "next";

/**
 * In development the frontend runs on :3000 while the API runs on :8000.
 * We proxy /api to the backend so the app can always use same-origin
 * relative URLs — identical to how nginx behaves in Docker/production.
 * Production builds skip the rewrite and rely on the reverse proxy.
 */
const DEV_API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  transpilePackages: ["@toolbox/api-client"],
  async rewrites() {
    if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    return [{ source: "/api/:path*", destination: `${DEV_API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
