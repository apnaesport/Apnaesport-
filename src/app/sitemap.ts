
import { MetadataRoute } from 'next'
import { getTournamentsFromFirestore, getGamesFromFirestore, getCommunitiesFromFirestore } from '@/lib/tournamentStore';
import type { Timestamp } from 'firebase/firestore';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apnaesport.vercel.app';

// Helper function to safely convert Firestore Timestamps
const toDate = (timestamp: Timestamp | Date | undefined): Date => {
    if (timestamp instanceof Date) {
        return timestamp;
    }
    if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
        return (timestamp as Timestamp).toDate();
    }
    return new Date(); // Fallback to now
};


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static Routes - these are the main, public-facing pages of your site.
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/landing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
     {
      url: `${BASE_URL}/tournaments`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/creators`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/games`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
     {
      url: `${BASE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  try {
    // Dynamic Tournament Routes
    const tournaments = await getTournamentsFromFirestore();
    const tournamentRoutes: MetadataRoute.Sitemap = tournaments.map(tournament => {
        return {
            url: `${BASE_URL}/tournaments/${tournament.id}`,
            lastModified: toDate(tournament.updatedAt),
            changeFrequency: 'daily',
            priority: 0.9,
        }
    });

    // Dynamic Game Routes
    const games = await getGamesFromFirestore();
    const gameRoutes: MetadataRoute.Sitemap = games.map(game => {
        return {
            url: `${BASE_URL}/games/${game.id}/tournaments`,
            lastModified: toDate(game.updatedAt),
            changeFrequency: 'weekly',
            priority: 0.8,
        }
    });

    // Dynamic Community Routes
    const communities = await getCommunitiesFromFirestore();
    const communityRoutes: MetadataRoute.Sitemap = communities.map(community => {
        return {
            url: `${BASE_URL}/community/${community.id}`,
            lastModified: toDate(community.updatedAt),
            changeFrequency: 'daily',
            priority: 0.7,
        }
    });

    return [...staticRoutes, ...tournamentRoutes, ...gameRoutes, ...communityRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return only static routes if there's an error fetching dynamic data
    return staticRoutes;
  }
}
