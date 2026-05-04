import type { NextConfig } from "next";

// Import env to validate at build time
import "./src/env.js";

const nextConfig: NextConfig = {
  /**
   * Experimental features for Next.js 15 App Router
   */
  experimental: {
    // React Compiler for automatic memoisation (React 19 compatible)
    reactCompiler: false,
  },

  // typedRoutes disabled: dynamic wizard routes with query strings (/apply/[step]?applicationId=...)
  // produce RouteImpl errors. Re-enable in Phase 9 when all routes are finalized.
  // typedRoutes: true,

  /**
   * Strict CSP-ready image domains
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
      },
    ],
  },

  /**
   * Security headers — enforced on all routes.
   * Inline scripts are disallowed (CSP); tightened further in Phase 9.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  /**
   * Redirect bare /api/trpc/* to avoid direct URL leaks
   */
  async redirects() {
    return [];
  },

  /**
   * Bundle analyser hook (enabled via ANALYZE=true)
   */
  ...(process.env.ANALYZE === "true"
    ? {
        webpack(config) {
          return config;
        },
      }
    : {}),
};

export default nextConfig;
