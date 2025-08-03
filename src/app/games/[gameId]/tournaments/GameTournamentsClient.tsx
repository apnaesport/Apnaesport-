
"use client"; 

import type { Game, Tournament } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; 
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { useState, useEffect } from "react";

interface GameTournamentsClientProps {
  game: Game;
  initialTournaments: Tournament[];
}

export default function GameTournamentsClient({ game, initialTournaments }: GameTournamentsClientProps) {
  const { user } = useAuth(); 
  const [tournaments, setTournaments] = useState(initialTournaments);
  
  // This useEffect could be used to fetch updated tournament data in real-time if needed
  useEffect(() => {
    setTournaments(initialTournaments);
  }, [initialTournaments]);

  const upcomingTournaments = tournaments.filter(t => t.status === "Upcoming");
  const liveTournaments = tournaments.filter(t => t.status === "Live" || t.status === "Ongoing");
  const completedTournaments = tournaments.filter(t => t.status === "Completed");

  return (
    <>
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
    </>
  );
}
