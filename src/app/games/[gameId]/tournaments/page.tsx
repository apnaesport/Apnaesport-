
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import type { Game, Tournament } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; 

// Placeholder data
const getGameDetails = (gameId: string): Game | undefined => {
  const games: Game[] = [
    { id: "game-lol", name: "League of Legends", iconUrl: "https://placehold.co/80x80.png", bannerUrl: "https://placehold.co/1200x300.png" },
    { id: "game-valo", name: "Valorant", iconUrl: "https://placehold.co/80x80.png", bannerUrl: "https://placehold.co/1200x300.png" },
  ];
  return games.find(g => g.id === gameId);
};

const getTournamentsForGame = (gameId: string): Tournament[] => {
  const baseTournaments: Omit<Tournament, 'id' | 'gameId' | 'gameName' | 'gameIconUrl' | 'organizerId'>[] = [
    {
      name: "Weekly Skirmish",
      bannerImageUrl: "https://placehold.co/400x200.png",
      description: "Join our weekly skirmish for fun and prizes!",
      status: "Upcoming",
      startDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      participants: [],
      maxParticipants: 32,
      prizePool: "$100",
      bracketType: "Single Elimination",
    },
    {
      name: "Champions Cup",
      bannerImageUrl: "https://placehold.co/400x200.png",
      description: "The ultimate test of skill. Compete against the best!",
      status: "Live",
      startDate: new Date(new Date().setDate(new Date().getDate() - 1)),
      participants: Array(10).fill({ id: '', name: ''}),
      maxParticipants: 16,
      prizePool: "$1,000",
      bracketType: "Double Elimination",
    },
    {
      name: "Community Showdown",
      bannerImageUrl: "https://placehold.co/400x200.png",
      description: "A friendly tournament for all skill levels.",
      status: "Completed",
      startDate: new Date(new Date().setDate(new Date().getDate() - 10)),
      endDate: new Date(new Date().setDate(new Date().getDate() - 8)),
      participants: Array(16).fill({ id: '', name: ''}),
      maxParticipants: 16,
      prizePool: "Bragging Rights",
      bracketType: "Round Robin",
    },
  ];
  
  const game = getGameDetails(gameId);
  if (!game) return [];

  return baseTournaments.map((t, index) => ({
    ...t,
    id: `${gameId}-tourney-${index + 1}`,
    gameId: game.id,
    gameName: game.name,
    gameIconUrl: game.iconUrl,
    organizerId: `user-${index}` // dummy organizer
  }));
};

interface GameTournamentsPageProps {
  params: { gameId: string };
}

export default function GameTournamentsPage({ params }: GameTournamentsPageProps) {
  const { gameId } = params;
  const { user } = useAuth(); 
  const game = getGameDetails(gameId); 
  const tournaments = getTournamentsForGame(gameId); 

  if (!game) {
    return (
      <div className="text-center py-10">
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
          onError={(e) => e.currentTarget.src = `https://placehold.co/1200x300.png`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <div className="flex items-center">
            <Image 
              src={game.iconUrl} 
              alt={game.name} 
              width={64} height={64} 
              className="rounded-lg mr-4 border-2 border-background shadow-md" data-ai-hint="game logo large"
              onError={(e) => e.currentTarget.src = `https://placehold.co/64x64.png`}
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
