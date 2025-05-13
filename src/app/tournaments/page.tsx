
import { PageTitle } from "@/components/shared/PageTitle";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import type { Tournament, Game } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
// For filtering - would require client component or server actions
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";

// Placeholder data
const placeholderGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://picsum.photos/seed/lol-icon/40/40" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://picsum.photos/seed/valo-icon/40/40" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://picsum.photos/seed/cs-icon/40/40" },
];

const placeholderTournaments: Tournament[] = [
  {
    id: "t1-lol", name: "LoL Summer Skirmish", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://picsum.photos/seed/lol-icon/40/40",
    bannerImageUrl: "https://picsum.photos/seed/t1-banner/400/200", description: "Weekly LoL tournament.",
    status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 5)), participants: [], maxParticipants: 16, prizePool: "$200", bracketType: "Single Elimination"
  },
  {
    id: "t2-valo", name: "Valorant Champions Tour", gameId: "game-valo", gameName: "Valorant", gameIconUrl: "https://picsum.photos/seed/valo-icon/40/40",
    bannerImageUrl: "https://picsum.photos/seed/t2-banner/400/200", description: "Official Valorant regional qualifier.",
    status: "Live", startDate: new Date(new Date().setDate(new Date().getDate() - 2)), participants: Array(10).fill({ id: '', name: ''}), maxParticipants: 32, prizePool: "$5,000", bracketType: "Double Elimination"
  },
  {
    id: "t3-cs", name: "CS:2 Open League", gameId: "game-cs", gameName: "Counter-Strike 2", gameIconUrl: "https://picsum.photos/seed/cs-icon/40/40",
    bannerImageUrl: "https://picsum.photos/seed/t3-banner/400/200", description: "Open league for aspiring CS:2 pros.",
    status: "Completed", startDate: new Date(new Date().setDate(new Date().getDate() - 20)), endDate: new Date(new Date().setDate(new Date().getDate() - 15)), participants: Array(25).fill({ id: '', name: ''}), maxParticipants: 64, prizePool: "$1,000", bracketType: "Round Robin"
  },
    {
    id: "t4-lol", name: "LoL Community Cup", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://picsum.photos/seed/lol-icon/40/40",
    bannerImageUrl: "https://picsum.photos/seed/t4-banner/400/200", description: "Fun community cup for all skill levels.",
    status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 12)), participants: [], maxParticipants: 32, prizePool: "In-game rewards", bracketType: "Single Elimination"
  },
];

export default function AllTournamentsPage() {
  const tournaments = placeholderTournaments; // Replace with actual data fetching and filtering logic

  return (
    <div className="space-y-8">
      <PageTitle 
        title="All Tournaments" 
        subtitle="Browse all active, upcoming, and completed tournaments."
        actions={
          <Button asChild>
            <Link href="/tournaments/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Tournament
            </Link>
          </Button>
        }
      />

      {/* Filters Section - Would require client component or server actions */}
      {/* 
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-card">
        <div>
          <Label htmlFor="search-tournament">Search by Name</Label>
          <Input id="search-tournament" placeholder="Tournament name..." />
        </div>
        <div>
          <Label htmlFor="filter-game">Filter by Game</Label>
          <Select>
            <SelectTrigger id="filter-game">
              <SelectValue placeholder="All Games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              {placeholderGames.map(game => (
                <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="filter-status">Filter by Status</Label>
          <Select>
            <SelectTrigger id="filter-status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="Live">Live</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      */}

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
