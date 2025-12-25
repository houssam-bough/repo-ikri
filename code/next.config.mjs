/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // For mobile static export builds with Capacitor
  // If you rely on API routes (SSR), prefer server.url in capacitor.config.ts
  // Uncomment the following line only if your pages are SSG-compatible
  // output: 'export',
}

export default nextConfig
