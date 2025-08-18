
import { type MetadataRoute } from 'next'

// The base URL should be set in your environment variables for production
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apnaesport.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all crawlers to access the site
      {
        userAgent: '*',
        allow: '/',
        // Disallow crawling of private/admin pages and auth routes
        disallow: [
          '/admin/',
          '/profile/',
          '/settings/',
          '/auth/',
          '/notifications/',
          '/stats/', // Disallowing stats as it's a locked/user-specific page
        ],
      },
      // You can add more specific rules for other bots if needed
      // Example for Googlebot
      // {
      //   userAgent: 'Googlebot',
      //   allow: ['/'],
      //   disallow: ['/admin/'],
      // },
    ],
    // Point to the sitemap location
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
