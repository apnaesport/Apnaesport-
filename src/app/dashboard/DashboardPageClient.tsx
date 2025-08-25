
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, UserProfile } from "@/lib/types";
import { Heart, Megaphone, Coins, Gift } from "lucide-react";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { AdsterraBlock } from '@/components/ads/AdsterraBlock';
import { isDailyBonusAvailable } from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardPageClientProps {
    stats: StatItem[];
    featuredTournament?: Tournament;
    liveTournaments: Tournament[];
    allGames: Game[];
}

const DailyBonusCard = ({ bonusAvailable }: { bonusAvailable: boolean }) => {
    if (!bonusAvailable) {
        return null;
    }

    return (
        <Card className="bg-gradient-to-tr from-green-500 to-emerald-600 text-white shadow-lg overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Gift className="h-6 w-6"/>
                    Daily Bonus Ready!
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm opacity-90 mb-4">You have a daily bonus waiting for you.</p>
                <Button asChild className="w-full bg-white text-emerald-700 hover:bg-white/90">
                    <Link href="/rewards">Claim Now</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

export default function DashboardPageClient({ stats: initialStats, featuredTournament, liveTournaments, allGames }: DashboardPageClientProps) {
    const { user, refreshUser } = useAuth();
    const { settings, loadingSettings } = useSiteSettings();
    const [bonusAvailable, setBonusAvailable] = useState(false);

    useEffect(() => {
        const checkBonus = async () => {
            if (user) {
                const available = await isDailyBonusAvailable(user.uid);
                setBonusAvailable(available);
            }
        };
        checkBonus();
    }, [user]);

    const stats = useMemo(() => {
        const userRankStat: StatItem = { 
            title: "Your AE Points", 
            value: user?.points ?? 0,
            icon: "Coins", 
            change: `Your Rank: N/A`
        };
        return [...initialStats, userRankStat];
    }, [initialStats, user]);
    
    
    const recommendedTournaments: Tournament[] = [];

    return (
        <div className="space-y-8">
            <PageTitle title="Dashboard" subtitle="Welcome back to Apna Esport!" />
            
            <section className="flex justify-center">
                <AdsterraBlock format="leaderboard" />
            </section>
            
            {featuredTournament ? (
                <section>
                    <FeaturedTournamentCard tournament={featuredTournament} />
                </section>
            ) : (
                <div className="bg-card p-8 rounded-lg shadow-md text-center">
                    <p className="text-muted-foreground">No featured tournaments right now. Check back soon!</p>
                </div>
            )}

            {recommendedTournaments.length > 0 && (
                <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                    <Heart className="mr-2 h-6 w-6 text-primary fill-primary" />
                    Recommended For You
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                    ))}
                </div>
                </section>
            )}

            <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">Stats Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <DailyBonusCard bonusAvailable={bonusAvailable} />
                {stats.map((stat) => (
                    <StatsCard key={stat.title} item={stat} />
                ))}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">Live Now</h2>
                {liveTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveTournaments.map((tournament) => (
                    <LiveTournamentCard key={tournament.id} tournament={tournament} />
                    ))}
                </div>
                ) : (
                <p className="text-muted-foreground">No tournaments are live right now. Check back soon!</p>
                )}
            </section>

            <section>
                <GamesListHorizontal games={allGames} />
            </section>
        </div>
    );
}
