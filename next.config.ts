import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Optional real-time collaboration relay (multi-PC mode, see
 * `src/lib/collab/transport.ts`). When `NEXT_PUBLIC_COLLAB_WS_URL` points to
 * another origin, that origin must be allow-listed in `connect-src` —
 * otherwise the browser CSP silently blocks the WebSocket in production.
 */
function collabWsOrigin(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
const collabOrigin = collabWsOrigin(process.env.NEXT_PUBLIC_COLLAB_WS_URL);

/**
 * Primary PartyKit relay (`party/server.ts` + `createPartyKitTransport`).
 * The env holds a bare `host[:port]` (dev `localhost:1999`, prod
 * `modelizia-collab.<account>.partykit.dev`) or a full ws(s) URL — normalise
 * it to an https origin: CSP matches `wss://…` requests against `https://…`
 * sources (CSP3 scheme upgrade), while dev's plain `ws:` is already allowed
 * by the `isDev` branch below.
 */
function partyKitOrigin(host: string | undefined): string | null {
  if (!host) return null;
  try {
    return new URL(host.includes("://") ? host : `https://${host}`).origin;
  } catch {
    return null;
  }
}
const partykitOrigin = partyKitOrigin(process.env.NEXT_PUBLIC_PARTYKIT_HOST);

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
 * - `script-src` also allows `https://va.vercel-scripts.com`, the loader
 *   injected by `@vercel/analytics` (the beacons themselves POST to
 *   `/_vercel/insights/*` on this very origin, so `connect-src 'self'`
 *   already covers them).
 * - `connect-src` also carries the optional collaboration relays: the
 *   PartyKit host (`NEXT_PUBLIC_PARTYKIT_HOST`) and any generic WS relay
 *   (`NEXT_PUBLIC_COLLAB_WS_URL`), otherwise the production WebSocket is
 *   silently blocked by the CSP.
 * - `worker-src 'self' blob:` permits the `blob:` URL Monaco uses when
 *   bootstrapping a worker. Monaco's own workers are currently disabled —
 *   Turbopack cannot bundle them, so `installMonacoEnvironment()` makes
 *   `MonacoEnvironment.getWorker` throw and Monaco falls back to its
 *   main-thread worker (see `src/lib/monaco/monaco-environment.ts`). We keep
 *   `blob:` here so that the CSP is not the reason a future worker would fail:
 *   if worker bundling ever becomes possible, a blocked `blob:` bootstrap would
 *   surface as the same opaque rejection we just fixed.
 * For a stricter, nonce-based policy see `node_modules/next/dist/docs` →
 * "How to set a Content Security Policy (CSP)" (uses a proxy + nonce).
 */
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}${collabOrigin ? ` ${collabOrigin}` : ""}${partykitOrigin ? ` ${partykitOrigin}` : ""}`,
  "worker-src 'self' blob:",
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
