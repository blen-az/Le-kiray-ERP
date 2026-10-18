import type { NextConfig } from "next";

/**
 * When BACKEND_URL is set (e.g. on Vercel), requests to /api/* are proxied to the
 * NestJS backend. The browser then only talks to the frontend's own origin, so the
 * HttpOnly refresh cookie is first-party and no custom domain or CORS setup is needed.
 * Pair it with NEXT_PUBLIC_API_URL=/api.
 */
const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    if (!backendUrl) return [];
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
