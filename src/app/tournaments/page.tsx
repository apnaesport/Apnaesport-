
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import type { Tournament, Game } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; 

const placeholderGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://placehold.co/40x40.png" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://placehold.co/40x40.png" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://placehold.co/40x40.png" },
];

const placeholderTournaments: Tournament[] = [
  {
    id: "t1-lol", name: "LoL Summer Skirmish", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/400x200.png", description: "Weekly LoL tournament.",
    status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 5)), participants: [], maxParticipants: 16, prizePool: "$200", bracketType: "Single Elimination", organizerId: "admin-user"
  },
  {
    id: "t2-valo", name: "Valorant Champions Tour", gameId: "game-valo", gameName: "Valorant", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/400x200.png", description: "Official Valorant regional qualifier.",
    status: "Live", startDate: new Date(new Date().setDate(new Date().getDate() - 2)), participants: Array(10).fill({ id: '', name: ''}), maxParticipants: 32, prizePool: "$5,000", bracketType: "Double Elimination", organizerId: "admin-user"
  },
  {
    id: "t3-cs", name: "CS:2 Open League", gameId: "game-cs", gameName: "Counter-Strike 2", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/400x200.png", description: "Open league for aspiring CS:2 pros.",
    status: "Completed", startDate: new Date(new Date().setDate(new Date().getDate() - 20)), endDate: new Date(new Date().setDate(new Date().getDate() - 15)), participants: Array(25).fill({ id: '', name: ''}), maxParticipants: 64, prizePool: "$1,000", bracketType: "Round Robin", organizerId: "admin-user"
  },
    {
    id: "t4-lol", name: "LoL Community Cup", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/400x200.png", description: "Fun community cup for all skill levels.",
    status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 12)), participants: [], maxParticipants: 32, prizePool: "In-game rewards", bracketType: "Single Elimination", organizerId: "community-user"
  },
];

export default function AllTournamentsPage() {
  const tournaments = placeholderTournaments; 
  const { user } = useAuth(); 

  return (
    <div className="space-y-8">
      <PageTitle 
        title="All Tournaments" 
        subtitle="Browse all active, upcoming, and completed tournaments."
        actions={
          user && ( 
            <Button asChild>
              <Link href="/tournaments/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Tournament
              </Link>
            </Button>
          )
        }
      />

      {tournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-10">
          No tournaments match your criteria. Try adjusting filters or check back later.
        </p>
      )}
    </div>
  );
}
