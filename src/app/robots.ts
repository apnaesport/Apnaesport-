import { type MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/profile/', '/settings/', '/social/'],
    },
    sitemap: 'https://apnaesport.vercel.app/sitemap.xml',
  }
}
