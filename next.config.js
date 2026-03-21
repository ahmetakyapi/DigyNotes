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
      // Genel fallback — kullanıcı gönderilen URL'ler için
      // Not: Üretimde bunu kısıtlamayı düşün
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
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
