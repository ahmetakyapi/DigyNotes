/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['m.media-amazon.com', 'images.app.goo.gl'],
  },
}

module.exports = nextConfig 