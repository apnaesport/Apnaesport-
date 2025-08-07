import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getTournamentsFromFirestore } from "@/lib/tournamentStore";
import TournamentsPageClient from './TournamentsPageClient';
import type { Tournament } from "@/lib/types";

// Helper to convert Firestore Timestamps to ISO strings for serialization
const serializeTournament = (tournament: Tournament): any => {
  const newTournament = { ...tournament };
  for (const key of Object.keys(newTournament)) {
    const value = (newTournament as any)[key];
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      (newTournament as any)[key] = value.toDate().toISOString();
    }
  }
   if (newTournament.matches) {
    newTournament.matches = newTournament.matches.map((match: any) => {
      const newMatch = {...match};
      if (newMatch.startTime && typeof newMatch.startTime === 'object' && 'toDate' in newMatch.startTime) {
        (newMatch.startTime as any) = newMatch.startTime.toDate().toISOString();
      }
      return newMatch;
    });
  }
  return newTournament;
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
