const OG_TRACE = ["./assets/og-fonts/**"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // TMDB poster görselleri
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      // RAWG oyun görselleri
      {
        protocol: "https",
        hostname: "media.rawg.io",
      },
      // Open Library kitap kapakları
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      // Kullanıcı avatar'ları (Gravatar vb.)
      {
        protocol: "https",
        hostname: "*.gravatar.com",
      },
      // No catch-all host: it turned /_next/image into an open proxy. User-supplied
      // covers/avatars render via customLoader/unoptimized (ERR-006), never the optimizer.
    ],
  },
  // Share cards read their fonts from disk (src/lib/og-fonts.ts); file tracing can't
  // see a path built from process.cwd(), so ship the files with those routes.
  // (Top-level since Next 15; it used to live under `experimental`.)
  outputFileTracingIncludes: {
    "/opengraph-image": OG_TRACE,
    "/posts/[id]/opengraph-image": OG_TRACE,
    "/profile/[username]/opengraph-image": OG_TRACE,
  },
  // Turbopack (the Next 16 default bundler) guesses the workspace root from the nearest
  // lockfile; pin it so a stray lockfile in a parent folder can't move it.
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // No `eslint` key: Next 16 removed it and `next build` no longer lints;
  // `npm run lint` runs ESLint on its own (CI runs it as a separate step).
  async headers() {
    return [
      // Güvenlik header'ları — tüm sayfalar
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Baseline only: no script/style/img/connect limits (inline Next scripts,
          // JSON-LD, Quill and covers from any host must keep working).
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
