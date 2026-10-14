import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy tuned for a static Next.js App Router deployment
 * without per-request nonces:
 * - `script-src 'unsafe-inline'`: Next.js injects inline hydration/bootstrap
 *   scripts that can't be nonce-hashed from `next.config.ts`. In dev we also
 *   allow `'unsafe-eval'` (React's dev-mode error overlays rely on `eval`).
 * - `style-src 'unsafe-inline'`: Tailwind utilities + runtime inline styles
 *   (e.g. React Flow, html-to-image) are applied via inline `<style>`.
 * - `img-src` allows `blob:`/`data:` for the PNG diagram export.
 * - `connect-src 'self' ws:` keeps HMR websockets working in development.
 * For a stricter, nonce-based policy see `node_modules/next/dist/docs` →
 * "How to set a Content Security Policy (CSP)" (uses a proxy + nonce).
 */
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // Point 6 (audit): don't advertise the framework via the `X-Powered-By`
  // response header.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
