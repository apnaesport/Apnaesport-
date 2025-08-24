
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, UserProfile } from "@/lib/types";
import { Heart, Megaphone } from "lucide-react";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { AdsterraBlock } from '@/components/ads/AdsterraBlock';
import { checkForDailyLoginBonus } from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";
import { Coins } from "lucide-react";

interface DashboardPageClientProps {
    stats: StatItem[];
    featuredTournament?: Tournament;
    liveTournaments: Tournament[];
    allGames: Game[];
}

export default function DashboardPageClient({ stats: initialStats, featuredTournament, liveTournaments, allGames }: DashboardPageClientProps) {
    const { user, refreshUser } = useAuth();
    const { settings, loadingSettings } = useSiteSettings();
    const { toast } = useToast();
    const adContainerRef = useRef<HTMLDivElement>(null);
    const hasCheckedBonus = useRef(false);

    // This effect handles the daily login bonus check when the user visits the dashboard.
    useEffect(() => {
        const checkBonus = async () => {
            if (user && !hasCheckedBonus.current) {
                hasCheckedBonus.current = true; // Prevent re-checking on re-renders
                try {
                    const bonusAwarded = await checkForDailyLoginBonus(user);
                    if (bonusAwarded) {
                        toast({
                            title: ( <div className="flex items-center gap-2"><Coins className="h-5 w-5 text-yellow-500" /><span>+5 AE Points!</span></div>),
                            description: "Your daily login bonus has been added.",
                        });
                        await refreshUser(); // Refresh user data to show new points total
                    }
                } catch (error) {
                    console.error("Failed to check for daily login bonus", error);
                }
            }
        };
        checkBonus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); 

    const stats = useMemo(() => {
        const userRankStat: StatItem = { 
            title: "Your AE Points", 
            value: user?.points ?? 0,
            icon: "BarChart3", 
            change: `Your Rank: N/A` // Rank calculation removed for performance
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
