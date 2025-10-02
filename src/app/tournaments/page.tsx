
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getTournamentsFromFirestore } from "@/lib/tournamentStore";
import TournamentsPageClient from './TournamentsPageClient';
import type { Tournament } from "@/lib/types";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";
import { format } from "date-fns";

// Helper to convert Firestore Timestamps to a serializable format for Client Components
const serializeTournament = (tournament: Tournament): any => {
    return {
      ...tournament,
      id: tournament.id, // ensure id is there
      // Convert all date-like fields to ISO strings for serialization
      startDate: tournament.startDate ? new Date(tournament.startDate as any).toISOString() : new Date().toISOString(),
      endDate: tournament.endDate ? new Date(tournament.endDate as any).toISOString() : undefined,
      createdAt: tournament.createdAt ? new Date(tournament.createdAt as any).toISOString() : new Date().toISOString(),
      updatedAt: tournament.updatedAt ? new Date(tournament.updatedAt as any).toISOString() : new Date().toISOString(),
      // Add a pre-formatted date string
      formattedStartDate: tournament.startDate ? format(new Date(tournament.startDate as any), "PPPp") : "Date TBD"
    };
};


export default async function AllTournamentsPage() {
    // Fetch all tournaments regardless of their type for the main list
    const allTournaments = await getTournamentsFromFirestore();
    // Serialize the data before passing it to the client
    const serializableTournaments = allTournaments.map(serializeTournament);

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
            <div className="flex justify-center">
                <AdsterraBlock format="leaderboard" />
            </div>
            <TournamentsPageClient allTournaments={serializableTournaments} />
        </div>
    );
}
