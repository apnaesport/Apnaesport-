

import { PageTitle } from "@/components/shared/PageTitle";
import type { Metadata } from 'next';
import { getTopPlayersByProPoints } from "@/lib/tournamentStore";
import { ProBoardClient } from "./ProBoardClient";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";
import type { UserProfile } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

export const metadata: Metadata = {
  title: "The Pro Board - Where Legends Rise | Apna Esport",
  description: "Only the best make it to the Apna Esport Pro Board. Earn Pro Points, climb the ranks, and become a legend. See the top 50 players in the community.",
  keywords: ["Pro Board", "Apna Esport rankings", "top players", "esports legends", "pro gaming leaderboard", "competitive gaming ranks"],
};

export const dynamic = 'force-dynamic';

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


export default async function ProBoardPage() {
    const topPlayers = await getTopPlayersByProPoints(50);
    const initialTopPlayers = topPlayers.map(player => serializeObject(player));


    return (
        <div className="space-y-8">
            <PageTitle 
                title="THE PRO BOARD" 
                subtitle="Where Skill Meets Fame. Only the best make it here." 
            />
             <div className="flex justify-center">
                <AdsterraBlock format="leaderboard" />
            </div>
            <ProBoardClient initialPlayers={initialTopPlayers} />
             <div className="flex justify-center mt-8">
                <AdsterraBlock format="leaderboard" />
            </div>
             <div className="text-center py-10 border-t border-border mt-8">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
                   The Pro Board isn’t for everyone — it’s for those who never stop improving.
                </h3>
                <p className="text-muted-foreground mb-6">🔥 Play more. Win more. Be remembered forever. 🔥</p>
                <a href="/tournaments" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-transform transform hover:scale-105">
                    Become a Legend →
                </a>
            </div>
        </div>
    );
}
