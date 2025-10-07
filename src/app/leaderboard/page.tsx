
import { PageTitle } from "@/components/shared/PageTitle";
import type { Metadata } from 'next';
import { getTopPlayersByMonthlyWins } from "@/lib/tournamentStore";
import { LeaderboardClient } from "./LeaderboardClient";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";
import type { UserProfile } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";

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
             <header className="mb-6">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-1 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/20">
                            <div className="h-16 w-16 bg-background/80 rounded-lg flex items-center justify-center">
                                 <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent">AE</span>
                            </div>
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                                Apna Esports
                            </CardTitle>
                            <CardDescription className="text-lg font-semibold">Elite Leaderboard</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </header>
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
