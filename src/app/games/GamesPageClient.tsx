
"use client";

import { useState, useMemo } from 'react';
import type { Game } from '@/lib/types';
import { GameCard } from '@/components/games/GameCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { AdsterraBlock } from '@/components/ads/AdsterraBlock';
import React from 'react';

interface GamesPageClientProps {
  allGames: Game[];
}

export default function GamesPageClient({ allGames }: GamesPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { settings } = useSiteSettings();

  const adFrequency = settings?.adFrequencyInLists || 0;

  const filteredGames = useMemo(() => {
    if (!searchTerm) {
      return allGames;
    }
    return allGames.filter(game =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allGames]);

  const itemsWithAds = useMemo(() => {
    if (!adFrequency || adFrequency <= 0) return filteredGames;

    const newItems: (Game | { isAd: true })[] = [];
    if(filteredGames.length > 0) newItems.push({ isAd: true });
    filteredGames.forEach((item, index) => {
      newItems.push(item);
      if ((index + 1) % adFrequency === 0 && index < filteredGames.length -1) {
        newItems.push({ isAd: true });
      }
    });
    return newItems;
  }, [filteredGames, adFrequency]);


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

      {itemsWithAds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {itemsWithAds.map((item, index) => {
            if ('isAd' in item) {
                return (
                    <div key={`ad-${index}`} className="flex items-center justify-center">
                        <AdsterraBlock format="square" className="h-full min-h-[300px] w-full" />
                    </div>
                );
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
