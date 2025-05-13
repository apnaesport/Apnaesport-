
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import type { Tournament } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Placeholder data
const placeholderTournaments: Tournament[] = [
  {
    id: "t1-lol", name: "LoL Summer Skirmish", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://picsum.photos/seed/lol-icon/40/40",
    bannerImageUrl: "", description: "", status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 5)), 
    participants: Array(5).fill({id:'', name:''}), maxParticipants: 16, prizePool: "$200", bracketType: "Single Elimination"
  },
  {
    id: "t2-valo", name: "Valorant Champions Tour", gameId: "game-valo", gameName: "Valorant", gameIconUrl: "https://picsum.photos/seed/valo-icon/40/40",
    bannerImageUrl: "", description: "", status: "Live", startDate: new Date(new Date().setDate(new Date().getDate() - 2)), 
    participants: Array(20).fill({id:'', name:''}), maxParticipants: 32, prizePool: "$5,000", bracketType: "Double Elimination"
  },
  {
    id: "t3-cs", name: "CS:2 Open League", gameId: "game-cs", gameName: "Counter-Strike 2", gameIconUrl: "https://picsum.photos/seed/cs-icon/40/40",
    bannerImageUrl: "", description: "", status: "Completed", startDate: new Date(new Date().setDate(new Date().getDate() - 20)), 
    participants: Array(50).fill({id:'', name:''}), maxParticipants: 64, prizePool: "$1,000", bracketType: "Round Robin"
  },
];


export default function AdminTournamentsPage() {
  const tournaments = placeholderTournaments; // Replace with actual data fetching

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Tournaments"
        subtitle="Create, edit, and oversee all platform tournaments."
        actions={
          <Button asChild>
            <Link href="/admin/tournaments/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Tournament
            </Link>
          </Button>
        }
      />

      {/* TODO: Add filtering and search capabilities */}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Game</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.length > 0 ? tournaments.map((tournament) => (
              <TableRow key={tournament.id}>
                <TableCell className="font-medium">{tournament.name}</TableCell>
                <TableCell>{tournament.gameName}</TableCell>
                <TableCell>
                  <Badge variant={tournament.status === "Live" ? "destructive" : tournament.status === "Upcoming" ? "default" : "secondary"}>
                    {tournament.status}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(tournament.startDate), "MMM dd, yyyy")}</TableCell>
                <TableCell>{tournament.participants.length} / {tournament.maxParticipants}</TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/tournaments/${tournament.id}`} target="_blank" title="View Tournament">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/tournaments/${tournament.id}/edit`} title="Edit Tournament">
                       <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="destructive" size="sm" title="Delete Tournament" onClick={() => alert(`Confirm delete tournament: ${tournament.name}`)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No tournaments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
