
import { MetadataRoute } from 'next'
import { getTournamentsFromFirestore, getGamesFromFirestore } from '@/lib/tournamentStore';

const BASE_URL = 'https://apnaesport.vercel.app'; // Corrected domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/tournaments`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/games`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
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
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
  ];

  // Dynamic Tournament Routes
  const tournaments = await getTournamentsFromFirestore();
  const tournamentRoutes: MetadataRoute.Sitemap = tournaments.map(tournament => {
    const updatedAt = (tournament.updatedAt as any)?.toDate ? (tournament.updatedAt as any).toDate() : new Date();
    return {
        url: `${BASE_URL}/tournaments/${tournament.id}`,
        lastModified: updatedAt,
        changeFrequency: 'daily',
        priority: 0.9,
    }
  });

  // Dynamic Game Routes
  const games = await getGamesFromFirestore();
  const gameRoutes: MetadataRoute.Sitemap = games.map(game => {
    const updatedAt = (game.updatedAt as any)?.toDate ? (game.updatedAt as any).toDate() : new Date();
    return {
        url: `${BASE_URL}/games/${game.id}/tournaments`,
        lastModified: updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
    }
  });


  return [...staticRoutes, ...tournamentRoutes, ...gameRoutes];
}
