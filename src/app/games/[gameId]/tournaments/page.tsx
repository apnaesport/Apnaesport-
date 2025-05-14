
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import type { Game, Tournament } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, AlertTriangle } from "lucide-react"; // Added AlertTriangle
import { useAuth } from "@/contexts/AuthContext"; 
import { getGameDetails as fetchGameDetails, getTournamentsForGame as fetchTournamentsForGame, subscribe } from "@/lib/tournamentStore"; // Updated imports
import { useEffect, useState, use } from "react"; // Added 'use'

interface GameTournamentsPageProps {
  params: { gameId: string };
}

export default function GameTournamentsPage({ params }: GameTournamentsPageProps) {
  const resolvedParams = use(params); // Use React.use() to unwrap params
  const { gameId } = resolvedParams;

  const { user } = useAuth(); 
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const gameDetails = fetchGameDetails(gameId);
    setGame(gameDetails);
    if (gameDetails) {
      setTournaments(fetchTournamentsForGame(gameId));
    }
    setIsLoading(false);

    const unsubscribe = subscribe(() => {
      const updatedGameDetails = fetchGameDetails(gameId);
      setGame(updatedGameDetails);
      if (updatedGameDetails) {
        setTournaments(fetchTournamentsForGame(gameId));
      }
    });
    return () => unsubscribe();
  }, [gameId]);


  if (isLoading) {
    return (
      <div className="text-center py-10">
        <PageTitle title="Loading Game Tournaments..." />
        {/* Add Skeleton loaders here if desired */}
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
      <div className="relative h-48 md:h-64 rounded-lg overflow-hidden group mb-8 shadow-lg">
        <Image 
          src={game.bannerUrl || `https://placehold.co/1200x300.png`} 
          alt={`${game.name} banner`} 
          layout="fill" 
          objectFit="cover"
          className="transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="game background art"
          onError={(e) => (e.currentTarget.src = `https://placehold.co/1200x300.png?text=${encodeURIComponent(game.name)}`)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <div className="flex items-center">
            <Image 
              src={game.iconUrl} 
              alt={game.name} 
              width={64} height={64} 
              className="rounded-lg mr-4 border-2 border-background shadow-md" 
              data-ai-hint="game logo large"
              onError={(e) => (e.currentTarget.src = `https://placehold.co/64x64.png?text=${game.name.substring(0,2)}`)}
            />
            <PageTitle title={`${game.name} Tournaments`} className="mb-0" />
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
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
          <TabsTrigger value="upcoming">Upcoming ({upcomingTournaments.length})</TabsTrigger>
          <TabsTrigger value="live">Live ({liveTournaments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTournaments.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6">
          {upcomingTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} />)}
            </div>
          ) : <p className="text-muted-foreground py-4">No upcoming tournaments for {game.name} right now.</p>}
        </TabsContent>
        <TabsContent value="live" className="mt-6">
          {liveTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveTournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} />)}
            </div>
          ) : <p className="text-muted-foreground py-4">No live tournaments for {game.name} at the moment.</p>}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          {completedTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} />)}
            </div>
          ) : <p className="text-muted-foreground py-4">No completed tournaments for {game.name} yet.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
