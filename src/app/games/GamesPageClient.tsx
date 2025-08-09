
"use client";

import { useState, useMemo } from 'react';
import type { Game } from '@/lib/types';
import { GameCard } from '@/components/games/GameCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { AdPlacement } from '@/components/shared/AdPlacement';

interface GamesPageClientProps {
  allGames: Game[];
}

export default function GamesPageClient({ allGames }: GamesPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { settings } = useSiteSettings();

  const filteredGames = useMemo(() => {
    if (!searchTerm) {
      return allGames;
    }
    return allGames.filter(game =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allGames]);

  // Create an array that includes the ad
  const itemsWithAd: (Game | { isAd: true })[] = [...filteredGames];
  if (settings?.gamesPageAdKey) {
    // Insert ad at the 4th position (index 3)
    if (itemsWithAd.length >= 3) {
      itemsWithAd.splice(3, 0, { isAd: true });
    } else {
      itemsWithAd.push({ isAd: true }); // Add at the end if not enough items
    }
  }


  return (
    <>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search games..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {itemsWithAd.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {itemsWithAd.map((item, index) => {
            if ('isAd' in item) {
                return <AdPlacement key="ad-games" adKey={settings.gamesPageAdKey!} type="video" className="sm:col-span-2 lg:col-span-1" />;
            }
            return <GameCard key={item.id} game={item} />;
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-10">
          No games match your search or none are available. Admins can add games via the admin panel.
        </p>
      )}
    </>
  );
}
