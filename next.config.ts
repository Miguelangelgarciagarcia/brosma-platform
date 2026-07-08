import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Cabeceras de seguridad aplicadas a toda la app.
// CSP se mantiene razonablemente estricta en PRODUCCIÓN; en desarrollo se
// relaja 'script-src' porque Next.js/React usan eval() y websockets para
// hot-reload y herramientas de depuración (esto NUNCA pasa en producción).
const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY", // evita que /login o el panel se carguen dentro de un iframe (clickjacking)
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://res.cloudinary.com",
      "font-src 'self' data:",
      `connect-src 'self' https://res.cloudinary.com${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
