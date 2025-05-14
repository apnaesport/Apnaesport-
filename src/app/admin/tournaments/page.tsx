
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
import { useState, useEffect } from "react"; // Added useState and useEffect
import { useToast } from "@/hooks/use-toast"; // Added useToast

// Placeholder data - replace with actual data fetching
const initialTournaments: Tournament[] = [
  {
    id: "t1-lol", name: "LoL Summer Skirmish", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png", description: "Weekly LoL tournament", status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 5)), 
    participants: Array(5).fill({id:'', name:''}), maxParticipants: 16, prizePool: "$200", bracketType: "Single Elimination", organizerId: "admin-user"
  },
  {
    id: "t2-valo", name: "Valorant Champions Tour", gameId: "game-valo", gameName: "Valorant", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png", description: "Valorant regional qualifier", status: "Live", startDate: new Date(new Date().setDate(new Date().getDate() - 2)), 
    participants: Array(20).fill({id:'', name:''}), maxParticipants: 32, prizePool: "$5,000", bracketType: "Double Elimination", organizerId: "admin-user"
  },
  {
    id: "t3-cs", name: "CS:2 Open League", gameId: "game-cs", gameName: "Counter-Strike 2", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png", description: "Open CS2 league", status: "Completed", startDate: new Date(new Date().setDate(new Date().getDate() - 20)), 
    participants: Array(50).fill({id:'', name:''}), maxParticipants: 64, prizePool: "$1,000", bracketType: "Round Robin", organizerId: "admin-user"
  },
];


export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const { toast } = useToast();
  // const [isLoading, setIsLoading] = useState(true); // For real data fetching

  // Example: Fetch tournaments from Firestore (uncomment and adapt for real backend)
  // useEffect(() => {
  //   const fetchTournaments = async () => {
  //     setIsLoading(true);
  //     try {
  //       // const q = query(collection(db, "tournaments"));
  //       // const querySnapshot = await getDocs(q);
  //       // const fetchedTournaments: Tournament[] = querySnapshot.docs.map(doc => {
  //       //   const data = doc.data();
  //       //   return { 
  //       //     id: doc.id, 
  //       //     ...data, 
  //       //     startDate: data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate), // Firestore timestamp conversion
  //       //     endDate: data.endDate?.toDate ? data.endDate.toDate() : data.endDate ? new Date(data.endDate) : undefined,
  //       //   } as Tournament;
  //       // });
  //       // setTournaments(fetchedTournaments);
  //       setTournaments(initialTournaments); // Using placeholder for now
  //     } catch (error) {
  //       console.error("Error fetching tournaments:", error);
  //       toast({ title: "Error", description: "Could not fetch tournaments.", variant: "destructive" });
  //     }
  //     setIsLoading(false);
  //   };
  //   fetchTournaments();
  // }, [toast]);

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (confirm(`Are you sure you want to delete the tournament: "${tournamentName}"? This action cannot be undone.`)) {
      // setIsLoading(true);
      try {
        // Example: Delete tournament from Firestore
        // await deleteDoc(doc(db, "tournaments", tournamentId));
        setTournaments(prevTournaments => prevTournaments.filter(t => t.id !== tournamentId));
        toast({ title: "Tournament Deleted", description: `"${tournamentName}" has been removed.`, variant: "destructive" });
      } catch (error) {
        console.error("Error deleting tournament:", error);
        toast({ title: "Error", description: `Could not delete "${tournamentName}".`, variant: "destructive" });
      }
      // setIsLoading(false);
    }
  };

  // if (isLoading) return <p>Loading tournaments...</p>;

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Tournaments"
        subtitle="Create, edit, and oversee all platform tournaments."
        actions={
          <Button asChild>
            <Link href="/tournaments/new"> {/* Changed from /admin/tournaments/new */}
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
                  {/* <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/tournaments/${tournament.id}/edit`} title="Edit Tournament">
                       <Edit className="h-4 w-4" />
                    </Link>
                  </Button> */}
                  <Button variant="destructive" size="sm" title="Delete Tournament" onClick={() => handleDeleteTournament(tournament.id, tournament.name)}>
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
