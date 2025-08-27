
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getTournamentsFromFirestore } from "@/lib/tournamentStore";
import TournamentsPageClient from './TournamentsPageClient';
import type { Tournament } from "@/lib/types";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";

// Helper to convert Firestore Timestamps to a serializable format for Client Components
const serializeTournament = (tournament: Tournament): any => {
  const serialized: { [key: string]: any } = { ...tournament };
  for (const key in serialized) {
    const value = serialized[key as keyof Tournament];
    // Safely check for Timestamp by looking for the .toDate() method
    if (value && typeof value === 'object' && typeof (value as any).toDate === 'function') {
      serialized[key] = (value as any).toDate().toISOString();
    } else if (value instanceof Date) {
      serialized[key] = (value as Date).toISOString();
    }
  }
  return JSON.parse(JSON.stringify(serialized));
};


export default async function AllTournamentsPage() {
    // Fetch all tournaments regardless of their type for the main list
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
            <div className="flex justify-center">
                <AdsterraBlock format="leaderboard" />
            </div>
            <TournamentsPageClient allTournaments={serializableTournaments} />
        </div>
    );
}
