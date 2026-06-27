/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['firebase-admin', 'jwks-rsa', 'jose', '@google-cloud/firestore'],
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons', 'framer-motion'],
    workerThreads: false,
    cpus: 1,
  },
};
module.exports = nextConfig;