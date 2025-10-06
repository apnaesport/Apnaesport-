
import { PageTitle } from "@/components/shared/PageTitle";
import type { Metadata } from 'next';
import { getTopPlayersByMonthlyWins } from "@/lib/tournamentStore";
import { LeaderboardClient } from "./LeaderboardClient";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";

export const metadata: Metadata = {
  title: "Hall of Fame - Top Players | Apna Esport",
  description: "Discover the top-performing players on Apna Esport. See who has the most tournament wins this month and check out their stats.",
};


export default async function LeaderboardPage() {
    const initialTopPlayers = await getTopPlayersByMonthlyWins(20);

    return (
        <div className="space-y-8">
            <PageTitle title="Leaderboard" subtitle="See who's dominating the competition this month." />
             <div className="flex justify-center">
                <AdsterraBlock format="leaderboard" />
            </div>
            <LeaderboardClient initialPlayers={initialTopPlayers} />
             <div className="flex justify-center mt-8">
                <AdsterraBlock format="leaderboard" />
            </div>
        </div>
    );
}
