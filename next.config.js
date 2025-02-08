/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['m.media-amazon.com', 'images.app.goo.gl'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig 