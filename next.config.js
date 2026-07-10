/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,

  // Pin the file-tracing root to this app so Next doesn't get confused by the
  // stray package-lock.json stub in the parent workspace folder.
  outputFileTracingRoot: __dirname,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
    ],
  },

  // Renamed from experimental.serverComponentsExternalPackages in Next 15.
  serverExternalPackages: ['firebase-admin', '@google-cloud/firestore'],

  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons', 'framer-motion', 'recharts'],
  },

  async headers() {
    // Content-Security-Policy is intentionally permissive on script/style
    // ('unsafe-inline'/'unsafe-eval') because Next.js and Firebase inject inline
    // runtime; it still meaningfully constrains where scripts/connections/frames
    // may load from (Firebase, Google auth, Cloudinary). frame-ancestors 'none'
    // blocks clickjacking on login/checkout.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://widget.cloudinary.com https://upload-widget.cloudinary.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://plus.unsplash.com https://lh3.googleusercontent.com https://graph.facebook.com https://platform-lookaside.fbsbx.com https://www.google-analytics.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://api.cloudinary.com https://www.google-analytics.com",
      "frame-src 'self' https://*.firebaseapp.com https://apis.google.com https://accounts.google.com https://upload-widget.cloudinary.com",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests",
    ].join('; ');

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=()' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
    ];

    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;