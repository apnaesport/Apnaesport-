
import { PageTitle } from "@/components/shared/PageTitle";
import type { Metadata } from 'next';
import { getTopPlayersByMonthlyWins } from "@/lib/tournamentStore";
import { LeaderboardClient } from "./LeaderboardClient";

export const metadata: Metadata = {
  title: "Hall of Fame - Top Players | Apna Esport",
  description: "Discover the top-performing players on Apna Esport. See who has the most tournament wins this month and check out their stats.",
};


export default async function LeaderboardPage() {
    const initialTopPlayers = await getTopPlayersByMonthlyWins(20);

    return (
        <div className="space-y-8">
            <LeaderboardClient initialPlayers={initialTopPlayers} />
        </div>
    );
}
