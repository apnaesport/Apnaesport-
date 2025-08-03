import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getTournamentsFromFirestore } from "@/lib/tournamentStore";
import TournamentsPageClient from './TournamentsPageClient';

export default async function AllTournamentsPage() {
    const allTournaments = await getTournamentsFromFirestore();

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
            <TournamentsPageClient allTournaments={allTournaments} />
        </div>
    );
}
