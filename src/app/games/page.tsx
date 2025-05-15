
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { GameCard } from "@/components/games/GameCard";
import type { Game } from "@/lib/types";
import { getGamesFromFirestore } from "@/lib/tournamentStore";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton"; 
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function GamesPage() {
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const gamesFromDb = await getGamesFromFirestore();
      setAllGames(gamesFromDb);
      setFilteredGames(gamesFromDb); 
    } catch (error) {
      console.error("Error fetching games:", error);
      toast({ title: "Error", description: "Could not fetch games.", variant: "destructive" });
      setAllGames([]);
      setFilteredGames([]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

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
            disabled={isLoading}
          />
        </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading games...</p>
        </div>
      ) : filteredGames.length > 0 ? (
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
    </div>
  );
}
