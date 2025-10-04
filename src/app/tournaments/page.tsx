

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getTournamentsFromFirestore } from "@/lib/tournamentStore";
import TournamentsPageClient from './TournamentsPageClient';
import type { Tournament } from "@/lib/types";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";
import { format } from 'date-fns';
import type { Timestamp } from "firebase/firestore";

export const dynamic = 'force-dynamic';

const toDate = (timestamp: Timestamp | Date | undefined): Date => {
    if (timestamp instanceof Date) {
        return timestamp;
    }
    if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
        return (timestamp as Timestamp).toDate();
    }
    return new Date(); // Fallback to now
};


// Helper to convert Firestore Timestamps to a serializable format for Client Components
const serializeTournament = (tournament: Tournament): any => {
  const startDate = toDate(tournament.startDate);
  
  return {
    ...tournament,
    id: tournament.id,
    startDate: startDate.toISOString(),
    endDate: tournament.endDate ? toDate(tournament.endDate).toISOString() : undefined,
    createdAt: tournament.createdAt ? toDate(tournament.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: tournament.updatedAt ? toDate(tournament.updatedAt).toISOString() : new Date().toISOString(),
    // Add a pre-formatted date string
    formattedStartDate: new Date(startDate).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
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
