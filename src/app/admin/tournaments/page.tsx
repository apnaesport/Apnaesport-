
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Eye, Loader2 } from "lucide-react";
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
import { useState, useEffect, useCallback } from "react"; 
import { useToast } from "@/hooks/use-toast";
import { getTournamentsFromFirestore, deleteTournamentFromFirestore } from "@/lib/tournamentStore";

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Store ID of tournament being deleted

  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    try {
      const tournamentsFromDb = await getTournamentsFromFirestore();
      setTournaments(tournamentsFromDb);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      toast({ title: "Error", description: "Could not fetch tournaments.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);


  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (confirm(`Are you sure you want to delete the tournament: "${tournamentName}"? This action cannot be undone.`)) {
      setIsDeleting(tournamentId);
      try {
        await deleteTournamentFromFirestore(tournamentId);
        toast({ title: "Tournament Deleted", description: `"${tournamentName}" has been removed.`, variant: "destructive" });
        await fetchTournaments(); // Re-fetch to update the list
      } catch (error) {
        console.error("Error deleting tournament:", error);
        toast({ title: "Error", description: `Could not delete "${tournamentName}".`, variant: "destructive" });
      }
      setIsDeleting(null);
    }
  };

  if (isLoading && tournaments.length === 0) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading tournaments...</p>
      </div>
    );
  }

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
                    disabled={isDeleting === tournament.id || isLoading}
                  >
                    {isDeleting === tournament.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No tournaments found. Use "Create New Tournament" to add some.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
