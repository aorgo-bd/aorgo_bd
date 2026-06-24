/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["undici"],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};
module.exports = nextConfig;
