
"use client";

import { useState, useCallback, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getTournamentsFromFirestore, deleteTournamentFromFirestore, updateTournamentInFirestore } from "@/lib/tournamentStore";

interface AdminTournamentsClientProps {
  initialTournaments: Tournament[];
}

export default function AdminTournamentsClient({ initialTournaments }: AdminTournamentsClientProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isTogglingFeature, setIsTogglingFeature] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    try {
      const tournamentsFromDb = await getTournamentsFromFirestore();
      setTournaments(tournamentsFromDb);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      toast({ title: "Error", description: "Could not refresh tournaments.", variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (confirm(`Are you sure you want to delete the tournament: "${tournamentName}"? This action cannot be undone.`)) {
      setIsDeleting(tournamentId);
      try {
        await deleteTournamentFromFirestore(tournamentId);
        toast({ title: "Tournament Deleted", description: `"${tournamentName}" has been removed.`, variant: "destructive" });
        await fetchTournaments();
      } catch (error) {
        console.error("Error deleting tournament:", error);
        toast({ title: "Error", description: `Could not delete "${tournamentName}".`, variant: "destructive" });
      }
      setIsDeleting(null);
    }
  };

  const handleToggleFeatured = async (tournament: Tournament) => {
    setIsTogglingFeature(tournament.id);
    try {
      await updateTournamentInFirestore(tournament.id, { featured: !tournament.featured });
      toast({
        title: "Featured Status Updated",
        description: `"${tournament.name}" is now ${!tournament.featured ? "featured" : "not featured"}.`,
      });
      await fetchTournaments();
    } catch (error) {
      console.error("Error updating featured status:", error);
      toast({ title: "Error", description: "Could not update featured status.", variant: "destructive" });
    }
    setIsTogglingFeature(null);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Game</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead className="text-center">Featured</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleFeatured(tournament)}
                  disabled={isTogglingFeature === tournament.id}
                  title={tournament.featured ? "Unmark as Featured" : "Mark as Featured"}
                  className="h-8 w-8"
                >
                  {isTogglingFeature === tournament.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Star className={cn("h-5 w-5", tournament.featured ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                  )}
                </Button>
              </TableCell>
              <TableCell className="space-x-1 sm:space-x-2 whitespace-nowrap text-right">
                <Button variant="outline" size="icon" asChild className="h-8 w-8">
                  <Link href={`/tournaments/${tournament.id}`} target="_blank" title="View Tournament">
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  title="Delete Tournament"
                  onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                  disabled={isDeleting === tournament.id || isTogglingFeature === tournament.id}
                  className="h-8 w-8"
                >
                  {isDeleting === tournament.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-24">
                No tournaments found. Use "Create New Tournament" to add some.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
