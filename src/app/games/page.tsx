
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { GameCard } from "@/components/games/GameCard";
import type { Game } from "@/lib/types";
import { getGames, subscribe } from "@/lib/tournamentStore";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";


export default function GamesPage() {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const gamesFromStore = getGames();
    setAllGames(gamesFromStore);
    setFilteredGames(gamesFromStore);
    setIsLoading(false);

    const unsubscribe = subscribe(() => {
      const updatedGames = getGames();
      setAllGames(updatedGames);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredGames(allGames);
    } else {
      setFilteredGames(
        allGames.filter(game =>
          game.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, allGames]);

  return (
    <div className="space-y-8">
      <PageTitle
        title="Browse Games"
        subtitle="Find your favorite games and discover active tournaments."
      />
       <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search games..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-10">
          No games match your search or none are available.
        </p>
      )}
    </div>
  );
}

const CardSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-60 w-full" />
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-6 w-1/2" />
    <Skeleton className="h-10 w-full" />
  </div>
);
