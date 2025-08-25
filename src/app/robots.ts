
import { type MetadataRoute } from 'next'

// The base URL should be set in your environment variables for production
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apnaesport.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all crawlers to access the public parts of the site
      {
        userAgent: '*',
        allow: [
          '/',
          '/landing',
          '/tournaments',
          '/games',
          '/community',
          '/creators',
          '/about',
          '/contact',
          '/privacy',
          '/terms',
          '/auth/login',
          '/auth/register',
        ],
        // Disallow crawling of private user-specific pages and the admin area
        disallow: [
          '/admin/',
          '/profile/',
          '/settings/',
          '/notifications/',
          '/stats/', 
          '/rewards/',
        ],
      },
    ],
    // Point to the sitemap location
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
