
import { PageTitle } from "@/components/shared/PageTitle";
import type { Metadata } from 'next';
import { getTopPlayersByMonthlyWins } from "@/lib/tournamentStore";
import { LeaderboardClient } from "./LeaderboardClient";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";
import type { UserProfile } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

export const metadata: Metadata = {
  title: "Hall of Fame - Top Players | Apna Esport",
  description: "Discover the top-performing players on Apna Esport. See who has the most tournament wins this month and check out their stats.",
};

// Helper function to serialize Firestore Timestamps
const serializeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(serializeObject);
    
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value && typeof value.toDate === 'function') {
                newObj[key] = value.toDate().toISOString();
            } else if (value instanceof Date) {
                newObj[key] = value.toISOString();
            } else {
                newObj[key] = serializeObject(value);
            }
        }
    }
    return newObj;
};


export default async function LeaderboardPage() {
    const topPlayers = await getTopPlayersByMonthlyWins(20);
    const initialTopPlayers = topPlayers.map(player => serializeObject(player));


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
