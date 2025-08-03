
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Game } from '@/lib/types';
import { GameCard } from '@/components/games/GameCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface GamesPageClientProps {
  allGames: Game[];
}

export default function GamesPageClient({ allGames }: GamesPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGames = useMemo(() => {
    if (!searchTerm) {
      return allGames;
    }
    return allGames.filter(game =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allGames]);

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

      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-10">
          No games match your search or none are available. Admins can add games via the admin panel.
        </p>
      )}
    </>
  );
}
