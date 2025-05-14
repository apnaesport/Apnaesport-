
"use client";

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
import { useState, useEffect } from "react"; 
import { useToast } from "@/hooks/use-toast";
import { getTournaments, deleteTournamentFromStore, subscribe } from "@/lib/tournamentStore"; // Updated imports

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const tournamentsFromStore = getTournaments();
    setTournaments(tournamentsFromStore);
    setIsLoading(false);

    const unsubscribe = subscribe(() => {
      setTournaments(getTournaments());
    });
    return () => unsubscribe();
  }, []);


  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (confirm(`Are you sure you want to delete the tournament: "${tournamentName}"? This action cannot be undone.`)) {
      setIsLoading(true); // Visually indicate loading, though action is client-side
      try {
        deleteTournamentFromStore(tournamentId);
        toast({ title: "Tournament Deleted", description: `"${tournamentName}" has been removed.`, variant: "destructive" });
      } catch (error) {
        console.error("Error deleting tournament:", error);
        toast({ title: "Error", description: `Could not delete "${tournamentName}".`, variant: "destructive" });
      }
      setIsLoading(false);
    }
  };

  if (isLoading && tournaments.length === 0) return <p>Loading tournaments...</p>;

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Tournaments"
        subtitle="Create, edit, and oversee all platform tournaments."
        actions={
          <Button asChild>
            <Link href="/tournaments/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Tournament
            </Link>
          </Button>
        }
      />

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
                  {/* Edit functionality would require a dedicated edit page similar to create tournament */}
                  {/* <Button variant="outline" size="sm" asChild disabled>
                    <Link href={`/admin/tournaments/${tournament.id}/edit`} title="Edit Tournament (Coming Soon)">
                       <Edit className="h-4 w-4" />
                    </Link>
                  </Button> */}
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    title="Delete Tournament" 
                    onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                    disabled={isLoading} // Disable while any delete operation is in progress
                  >
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
