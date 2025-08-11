
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
import { AdPlacement } from "@/components/shared/AdPlacement";

interface DashboardPageClientProps {
    stats: StatItem[];
    allUsers: UserProfile[];
    featuredTournament?: Tournament;
    liveTournaments: Tournament[];
    allGames: Game[];
}

export default function DashboardPageClient({ stats: initialStats, allUsers, featuredTournament, liveTournaments, allGames }: DashboardPageClientProps) {
    const { user } = useAuth();
    const { settings, loadingSettings } = useSiteSettings();
    const adContainerRef = useRef<HTMLDivElement>(null);

    const currentUserRanking = useMemo(() => {
        if (!user || allUsers.length === 0) {
            return { rank: 'N/A', points: 0 };
        }
        const sortedUsers = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
        const userIndex = sortedUsers.findIndex(p => p.uid === user.uid);
        if (userIndex !== -1) {
            return { rank: userIndex + 1, points: sortedUsers[userIndex].points || 0 };
        }
        return { rank: 'N/A', points: user?.points || 0 };
    }, [user, allUsers]);

    const stats = useMemo(() => {
        const userRankStat: StatItem = { 
            title: "Your Rank (Overall)", 
            value: currentUserRanking.rank === 'N/A' ? 'N/A' : `#${currentUserRanking.rank}`, 
            icon: "BarChart3", 
            change: `${currentUserRanking.points} points` 
        };
        return [...initialStats, userRankStat];
    }, [initialStats, currentUserRanking]);
    
    useEffect(() => {
        if (loadingSettings || !settings || !adContainerRef.current) return;
        
        if (settings.promotionDisplayMode === 'ad' && settings.promotionBoardAdKey) {
            adContainerRef.current.innerHTML = '';

            const adKey = settings.promotionBoardAdKey;
            const containerId = `container-${adKey}-${Math.random().toString(36).substring(7)}`;

            const adContainerDiv = document.createElement('div');
            adContainerDiv.id = containerId;
            
            const adInvocationScript = document.createElement('script');
            adInvocationScript.type = 'text/javascript';
            adInvocationScript.innerHTML = `
                atOptions = {
                    'key' : '${adKey}',
                    'format' : 'iframe',
                    'height' : 90,
                    'width' : 728,
                    'params' : {}
                };
            `;

            const adsterraScript = document.createElement('script');
            adsterraScript.async = true;
            adsterraScript.src = `//pl23429392.highcpmgate.com/${adKey}/invoke.js`;
            
            adContainerRef.current.appendChild(adContainerDiv);
            adContainerRef.current.appendChild(adInvocationScript);
            adContainerRef.current.appendChild(adsterraScript);
        }
    }, [settings, loadingSettings]);
    
    const recommendedTournaments: Tournament[] = [];
    const showPromotion = settings && settings.promotionDisplayMode && (settings.promotionImageUrl || settings.promotionVideoUrl || settings.promotionBoardAdKey);

    return (
        <div className="space-y-8">
            <PageTitle title="Dashboard" subtitle="Welcome back to Apna Esport!" />
            
            {showPromotion && (
                <Card className="overflow-hidden shadow-lg border-primary/20">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="flex items-center gap-2">
                            <Megaphone className="h-6 w-6 text-primary" />
                            Promotion Board
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className={cn(
                            "w-full bg-muted rounded-md flex items-center justify-center overflow-hidden",
                            settings?.promotionDisplayMode === 'ad' ? "min-h-[90px]" : "aspect-video"
                        )}>
                            {settings?.promotionDisplayMode === 'ad' && settings.promotionBoardAdKey ? (
                                <div ref={adContainerRef} className="w-full flex justify-center items-center">
                                    {/* Adsterra ad will be injected here */}
                                </div>
                            ) : settings?.promotionDisplayMode === 'video' && settings.promotionVideoUrl ? (
                                <iframe
                                    className="w-full h-full aspect-video"
                                    src={settings.promotionVideoUrl}
                                    title="Promotional Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : settings?.promotionImageUrl ? (
                                <div className="w-full h-full relative aspect-video">
                                    <ImageWithFallback
                                        src={settings.promotionImageUrl}
                                        fallbackSrc='https://placehold.co/1280x720.png'
                                        alt="Promotion"
                                        layout="fill"
                                        objectFit="cover"
                                    />
                                </div>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>
            )}

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

            {settings?.dashboardAdKey && (
                <section>
                    <AdPlacement adKey={settings.dashboardAdKey} type="leaderboard" />
                </section>
            )}

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
