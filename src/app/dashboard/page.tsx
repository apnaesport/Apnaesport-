
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, LucideIconName, SiteSettings } from "@/lib/types";
import { getTournamentsFromFirestore, getGamesFromFirestore, getAllUsersFromFirestore } from "@/lib/tournamentStore";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


export default function DashboardPage() {
  const { user } = useAuth();
  const [featuredTournament, setFeaturedTournament] = useState<Tournament | undefined>(undefined);
  const [liveTournaments, setLiveTournaments] = useState<Tournament[]>([]);
  const [recommendedTournaments, setRecommendedTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { settings } = useSiteSettings();


  const loadData = useCallback(async (siteSettings: SiteSettings | null) => {
    setIsLoading(true);
    try {
      const [allTournaments, allGames, allUsers] = await Promise.all([
        getTournamentsFromFirestore(), 
        getGamesFromFirestore(),
        getAllUsersFromFirestore(),
      ]);

      const upcomingOrLiveTournaments = allTournaments.filter(t => t.status === "Upcoming" || t.status === "Live" || t.status === "Ongoing");
      
      const explicitlyFeaturedAndActive = upcomingOrLiveTournaments.filter(t => t.featured);
      explicitlyFeaturedAndActive.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      if (explicitlyFeaturedAndActive.length > 0) {
        setFeaturedTournament(explicitlyFeaturedAndActive[0]);
      } else if (upcomingOrLiveTournaments.length > 0) {
        upcomingOrLiveTournaments.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setFeaturedTournament(upcomingOrLiveTournaments[0]);
      } else {
        const sortedByCreation = [...allTournaments].sort((a, b) => {
            const dateA = a.createdAt ? (a.createdAt as any).toDate().getTime() : 0;
            const dateB = b.createdAt ? (b.createdAt as any).toDate().getTime() : 0;
            return dateB - dateA;
        });
        setFeaturedTournament(sortedByCreation[0]);
      }

      setLiveTournaments(allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing"));
      setGames(allGames);

      if (user && user.favoriteGameIds && user.favoriteGameIds.length > 0) {
        const userFavGameIds = user.favoriteGameIds;
        const recommendations = allTournaments.filter(t => 
          userFavGameIds.includes(t.gameId) && 
          (t.status === "Upcoming" || t.status === "Live" || t.status === "Ongoing")
        ).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setRecommendedTournaments(recommendations.slice(0, 3));
      } else {
        setRecommendedTournaments([]);
      }

      const activeTournamentCount = allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing" || t.status === "Upcoming").length;
      const basePlayerCount = siteSettings?.basePlayerCount || 0;
      const totalUsers = allUsers.length + basePlayerCount;
      const totalMatchesPlayed = allTournaments.reduce((acc, t) => acc + (t.matches?.length || 0), 0);

      const dashboardStats: StatItem[] = [
        { title: "Active Tournaments", value: activeTournamentCount, icon: "Trophy" as LucideIconName },
        { title: "Total Players", value: totalUsers.toLocaleString(), icon: "Users" as LucideIconName },
        { title: "Matches Played", value: totalMatchesPlayed, icon: "Gamepad2" as LucideIconName },
        { title: "Your Rank (Overall)", value: "#42", icon: "BarChart3" as LucideIconName, change: "-2" },
      ];
      setStats(dashboardStats);

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive"});
    }
    setIsLoading(false);
  }, [toast, user]);

  useEffect(() => {
    if (settings !== undefined) {
      loadData(settings);
    }
  }, [loadData, settings]);


  if (isLoading && !featuredTournament) { // Show full page loader only on initial load
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard" subtitle="Welcome back to Apna Esport!" />

      {isLoading && !featuredTournament ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : featuredTournament ? (
        <section>
          <FeaturedTournamentCard tournament={featuredTournament} />
        </section>
      ) : (
        <div className="bg-card p-8 rounded-lg shadow-md text-center">
          <p className="text-muted-foreground">No featured tournaments right now. Check back soon!</p>
        </div>
      )}

      {user && recommendedTournaments.length > 0 && (
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
      
      {user && recommendedTournaments.length === 0 && user.favoriteGameIds && user.favoriteGameIds.length > 0 && !isLoading && (
         <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
            <Heart className="mr-2 h-6 w-6 text-primary fill-primary" />
            Recommended For You
          </h2>
           <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <p className="text-muted-foreground">No upcoming tournaments match your favorite games right now. Check back later or explore all tournaments!</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/tournaments">Browse All Tournaments</Link>
              </Button>
           </div>
        </section>
      )}

      {user && (!user.favoriteGameIds || user.favoriteGameIds.length === 0) && !isLoading && (
         <section>
          <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
            <Heart className="mr-2 h-6 w-6 text-primary fill-primary" />
            Recommended For You
          </h2>
           <div className="bg-card p-6 rounded-lg shadow-sm text-center">
              <p className="text-muted-foreground">Add some favorite games to your profile to see personalized recommendations here!</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/profile">Update Your Profile</Link>
              </Button>
           </div>
        </section>
      )}


      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Live Now</h2>
        {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
            </div>
        ) : liveTournaments.length > 0 ? (
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
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <Skeleton className="h-5 w-2/3" />
                   <Skeleton className="h-5 w-5 rounded-sm" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : (
            stats.map((stat) => (
              <StatsCard key={stat.title} item={stat} />
            ))
          )}
        </div>
      </section>

      <section>
        <GamesListHorizontal games={games} />
      </section>

    </div>
  );
}
