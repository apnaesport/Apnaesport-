

import { PageTitle } from "@/components/shared/PageTitle";
import type { Metadata } from 'next';
import { getTopPlayersByProPoints } from "@/lib/tournamentStore";
import { ProBoardClient } from "./ProBoardClient";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";
import type { UserProfile } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
             <header className="mb-6 flex justify-center">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden w-full max-w-2xl">
                    <CardHeader className="flex flex-col items-center gap-4 text-center">
                        <div className="p-1 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/20">
                            <div className="h-16 w-16 bg-background/80 rounded-lg flex items-center justify-center">
                                 <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent">AE</span>
                            </div>
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/80">
                                Apna Esport Elite Leaderboard
                            </CardTitle>
                            <CardDescription className="text-lg font-semibold">
                                The Pro Board
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </header>
             <div className="flex justify-center">
                <AdsterraBlock format="leaderboard" />
            </div>
            <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
              <ProBoardClient initialPlayers={initialTopPlayers} />
            </Suspense>
             <div className="flex justify-center mt-8">
                <AdsterraBlock format="leaderboard" />
            </div>
             <div className="text-center py-10 border-t border-border mt-8">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
                   The Pro Board isn’t for everyone — it’s for those who never stop improving.
                </h3>
                <p className="text-muted-foreground mb-6">🔥 Play more. Win more. Be remembered forever. 🔥</p>
                <Button asChild size="lg" className="shadow-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105">
                    <Link href="/tournaments">
                        Become a Legend →
                    </Link>
                </Button>
            </div>
        </div>
    );
}
