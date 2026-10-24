/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow next/image to serve Sanity CDN images when components are
    // migrated incrementally. Harmless for the current <img> usage.
    domains: ['cdn.sanity.io'],
  },
}

module.exports = nextConfig
