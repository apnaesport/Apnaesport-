
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, LucideIconName, SiteSettings } from "@/lib/types";
import { getTournamentsFromFirestore, getGamesFromFirestore, getAllUsersFromFirestore, getSiteSettingsFromFirestore } from "@/lib/tournamentStore";
import { Heart, Loader2 } from "lucide-react";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";

export default function DashboardPage() {
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tournaments, games, users, siteSettings] = await Promise.all([
        getTournamentsFromFirestore(), 
        getGamesFromFirestore(),
        getAllUsersFromFirestore(),
        getSiteSettingsFromFirestore(),
      ]);
      setAllTournaments(tournaments);
      setAllGames(games);
      setAllUsers(users);
      setSettings(siteSettings);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageTitle title="Dashboard" subtitle="Welcome back to Apna Esport!" />
        <Skeleton className="h-96 w-full rounded-lg" />
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-64 w-full rounded-lg" />
            </div>
        </div>
      </div>
    );
  }

  const upcomingOrLiveTournaments = allTournaments.filter(t => t.status === "Upcoming" || t.status === "Live" || t.status === "Ongoing");
  
  let featuredTournament: Tournament | undefined = undefined;
  const explicitlyFeaturedAndActive = upcomingOrLiveTournaments.filter(t => t.featured);
  explicitlyFeaturedAndActive.sort((a, b) => new Date(a.startDate as any).getTime() - new Date(b.startDate as any).getTime());

  if (explicitlyFeaturedAndActive.length > 0) {
    featuredTournament = explicitlyFeaturedAndActive[0];
  } else if (upcomingOrLiveTournaments.length > 0) {
    upcomingOrLiveTournaments.sort((a, b) => new Date(a.startDate as any).getTime() - new Date(b.startDate as any).getTime());
    featuredTournament = upcomingOrLiveTournaments[0];
  } else {
    const sortedByCreation = [...allTournaments].sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt as any).toDate ? (a.createdAt as any).toDate().getTime() : 0 : 0;
        const dateB = b.createdAt ? (b.createdAt as any).toDate ? (b.createdAt as any).toDate().getTime() : 0 : 0;
        return dateB - dateA;
    });
    featuredTournament = sortedByCreation[0];
  }

  const liveTournaments = allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing");
  
  const activeTournamentCount = allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing" || t.status === "Upcoming").length;
  const basePlayerCount = settings?.basePlayerCount || 0;
  const totalUsers = allUsers.length + basePlayerCount;
  const totalMatchesPlayed = allTournaments.reduce((acc, t) => acc + (t.matches?.length || 0), 0);

  const stats: StatItem[] = [
    { title: "Active Tournaments", value: activeTournamentCount, icon: "Trophy" as LucideIconName },
    { title: "Total Players", value: totalUsers.toLocaleString(), icon: "Users" as LucideIconName },
    { title: "Matches Played", value: totalMatchesPlayed, icon: "Gamepad2" as LucideIconName },
    { title: "Your Rank (Overall)", value: "#42", icon: "BarChart3" as LucideIconName, change: "-2" },
  ];
  
  const recommendedTournaments: Tournament[] = [];

  const showPromotion = settings && settings.promotionDisplayMode && (settings.promotionImageUrl || settings.promotionVideoUrl);

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard" subtitle="Welcome back to Apna Esport!" />
      
      {showPromotion && (
         <Card className="overflow-hidden shadow-lg border-primary/20">
            <CardHeader>
                <CardTitle>Promotion Board</CardTitle>
            </CardHeader>
            <CardContent>
                {settings?.promotionDisplayMode === 'video' && settings.promotionVideoUrl ? (
                    <div className="aspect-video w-full">
                        <iframe
                            className="w-full h-full rounded-md"
                            src={settings.promotionVideoUrl}
                            title="Promotional Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                ) : settings?.promotionImageUrl ? (
                    <div className="aspect-video w-full relative rounded-md overflow-hidden">
                        <ImageWithFallback
                            src={settings.promotionImageUrl}
                            fallbackSrc='https://placehold.co/1280x720.png'
                            alt="Promotion"
                            layout="fill"
                            objectFit="cover"
                        />
                    </div>
                ) : null}
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
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Stats Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatsCard key={stat.title} item={stat} />
          ))}
        </div>
      </section>

      <section>
        <GamesListHorizontal games={allGames.map(g => ({...g, createdAt: (g.createdAt as any)?.toDate ? (g.createdAt as any).toDate().toISOString() : undefined, updatedAt: (g.updatedAt as any)?.toDate ? (g.updatedAt as any).toDate().toISOString() : undefined }))} />
      </section>

    </div>
  );
}
