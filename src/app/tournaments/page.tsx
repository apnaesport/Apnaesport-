
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getTournamentsFromFirestore } from "@/lib/tournamentStore";
import TournamentsPageClient from './TournamentsPageClient';
import type { Tournament } from "@/lib/types";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

// Helper to convert Firestore Timestamps to a serializable format for Client Components
const serializeTournament = (tournament: Tournament): any => {
    const safeToDate = (ts: Date | Timestamp | any): Date | null => {
        if (!ts) return null;
        if (ts.toDate) return (ts as Timestamp).toDate(); // Firestore Timestamp
        if (ts instanceof Date) return ts; // Already a Date
        try {
            const date = new Date(ts);
            if (!isNaN(date.getTime())) return date;
        } catch (e) {
            // ignore
        }
        return null;
    };
    
    const createdAtDate = safeToDate(tournament.createdAt);
    const updatedAtDate = safeToDate(tournament.updatedAt);
    const startDateDate = safeToDate(tournament.startDate);
    const endDateDate = safeToDate(tournament.endDate);

    return {
      ...tournament,
      id: tournament.id, // ensure id is there
      // Convert all date-like fields to ISO strings for serialization
      startDate: startDateDate ? startDateDate.toISOString() : new Date().toISOString(),
      endDate: endDateDate ? endDateDate.toISOString() : undefined,
      createdAt: createdAtDate ? createdAtDate.toISOString() : new Date().toISOString(),
      updatedAt: updatedAtDate ? updatedAtDate.toISOString() : new Date().toISOString(),
      // Add a pre-formatted date string
      formattedStartDate: startDateDate ? format(startDateDate, "PPPp") : "Date TBD"
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
