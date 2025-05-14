
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import type { Game, Tournament } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; 
import { getGameDetails, getTournamentsForGame } from "@/lib/tournamentStore";
import { useEffect, useState, use, useCallback } from "react"; 
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface GameTournamentsPageProps {
  params: { gameId: string };
}

export default function GameTournamentsPage({ params }: GameTournamentsPageProps) {
  const resolvedParams = use(params); 
  const { gameId } = resolvedParams;

  const { user } = useAuth(); 
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const gameDetails = await getGameDetails(gameId);
      setGame(gameDetails);
      if (gameDetails) {
        const gameTournaments = await getTournamentsForGame(gameId);
        setTournaments(gameTournaments);
      } else {
        setTournaments([]); 
        toast({ title: "Not Found", description: "Game not found.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching game/tournament data:", error);
      toast({ title: "Error", description: "Could not fetch data.", variant: "destructive" });
      setGame(undefined);
      setTournaments([]);
    }
    setIsLoading(false);
  }, [gameId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <PageTitle title="Loading Game Tournaments..." className="mt-4 !mb-0" />
      </div>
    );
  }


  if (!game) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <PageTitle title="Game Not Found" />
        <p className="text-muted-foreground">The game you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/games">Back to Games</Link>
        </Button>
      </div>
    );
  }

  const upcomingTournaments = tournaments.filter(t => t.status === "Upcoming");
  const liveTournaments = tournaments.filter(t => t.status === "Live" || t.status === "Ongoing");
  const completedTournaments = tournaments.filter(t => t.status === "Completed");

  return (
    <div className="space-y-8">
      <div className="relative h-48 md:h-64 rounded-lg overflow-hidden group mb-8 shadow-xl border border-border">
        <Image 
          src={game.bannerUrl || `https://placehold.co/1200x300.png`} 
          alt={`${game.name} banner`} 
          layout="fill" 
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint={game.dataAiHint || "game background art"}
          unoptimized={game.bannerUrl?.startsWith('data:image')}
          onError={(e) => (e.currentTarget.src = `https://placehold.co/1200x300.png?text=${encodeURIComponent(game.name)}`)}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 md:p-6 lg:p-8">
          <div className="flex items-center">
            <div className="relative w-16 h-16 md:w-20 md:h-20 mr-4 shrink-0">
              <Image 
                src={game.iconUrl} 
                alt={game.name} 
                layout="fill"
                className="rounded-lg border-2 border-background shadow-md object-cover" 
                data-ai-hint={game.dataAiHint || "game logo large"}
                unoptimized={game.iconUrl?.startsWith('data:image')}
                onError={(e) => (e.currentTarget.src = `https://placehold.co/80x80.png?text=${game.name.substring(0,2)}`)}
              />
            </div>
            <PageTitle title={`${game.name} Tournaments`} className="mb-0 text-white text-shadow !text-2xl md:!text-3xl" />
          </div>
        </div>
      </div>
      
      {user && ( 
        <div className="flex justify-end">
          <Button asChild>
            <Link href={`/tournaments/new?gameId=${game.id}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Tournament
            </Link>
          </Button>
        </div>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="upcoming">Upcoming ({upcomingTournaments.length})</TabsTrigger>
            <TabsTrigger value="live">Live ({liveTournaments.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTournaments.length})</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <TabsContent value="upcoming" className="mt-6">
          {upcomingTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} />)}
            </div>
          ) : <p className="text-muted-foreground py-4 text-center">No upcoming tournaments for {game.name} right now.</p>}
        </TabsContent>
        <TabsContent value="live" className="mt-6">
          {liveTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveTournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} />)}
            </div>
          ) : <p className="text-muted-foreground py-4 text-center">No live tournaments for {game.name} at the moment.</p>}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          {completedTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} />)}
            </div>
          ) : <p className="text-muted-foreground py-4 text-center">No completed tournaments for {game.name} yet.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
