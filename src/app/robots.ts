import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aorgo-bd.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/seller/', '/checkout', '/cart', '/profile'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
