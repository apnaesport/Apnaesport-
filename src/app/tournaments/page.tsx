import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getTournamentsFromFirestore } from "@/lib/tournamentStore";
import TournamentsPageClient from './TournamentsPageClient';
import type { Tournament } from "@/lib/types";

// Helper to convert Firestore Timestamps to a serializable format for Client Components
const serializeTournament = (tournament: Tournament): any => {
  return JSON.parse(JSON.stringify(tournament, (key, value) => {
    // Firestore Timestamps have a toDate method
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      return value.toDate().toISOString();
    }
    return value;
  }));
}


export default async function AllTournamentsPage() {
    const allTournaments = await getTournamentsFromFirestore();
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
            <TournamentsPageClient allTournaments={serializableTournaments} />
        </div>
    );
}
