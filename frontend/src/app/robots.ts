import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Mismo fallback que sitemap.ts: sin NEXT_APP_URL quedaba "undefined/sitemap.xml"
  const baseUrl = process.env.NEXT_APP_URL || "http://localhost:3001";

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
