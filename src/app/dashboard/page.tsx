
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, LucideIconName } from "@/lib/types";
import { getTournamentsFromFirestore, getGamesFromFirestore } from "@/lib/tournamentStore"; 
import { useEffect, useState, useCallback } from "react"; 
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function DashboardPage() {
  const [featuredTournament, setFeaturedTournament] = useState<Tournament | undefined>(undefined);
  const [liveTournaments, setLiveTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allTournaments, allGames] = await Promise.all([
        getTournamentsFromFirestore(),
        getGamesFromFirestore()
      ]);

      const upcomingTournaments = allTournaments.filter(t => t.status === "Upcoming");
      const ft = allTournaments.find(t => t.featured && upcomingTournaments.includes(t)) || 
                   upcomingTournaments[0] || 
                   allTournaments.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]; 
      setFeaturedTournament(ft);

      setLiveTournaments(allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing"));
      setGames(allGames);
      
      const activeTournamentCount = allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing" || t.status === "Upcoming").length;
      
      const placeholderStats: StatItem[] = [
        { title: "Active Tournaments", value: activeTournamentCount, icon: "Trophy" as LucideIconName, change: "" },
        { title: "Total Players", value: "1,234", icon: "Users" as LucideIconName, change: "+52" }, // Static placeholder
        { title: "Matches Played Today", value: 87, icon: "Gamepad2" as LucideIconName, change: "+15" }, // Static placeholder
        { title: "Your Rank (Overall)", value: "#42", icon: "BarChart3" as LucideIconName, change: "-2" }, // Static placeholder
      ];
      setStats(placeholderStats);

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive"});
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData(); 
  }, [loadData]);


  if (isLoading) {
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

      {featuredTournament ? (
        <section>
          <FeaturedTournamentCard tournament={featuredTournament} />
        </section>
      ) : (
        !isLoading && ( // Only show "No featured" if not loading
          <div className="bg-card p-8 rounded-lg shadow-md text-center">
            <p className="text-muted-foreground">No featured tournaments right now. Check back soon!</p>
          </div>
        )
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
           !isLoading && <p className="text-muted-foreground">No tournaments are live right now. Check back soon!</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Stats Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatsCard key={stat.title} item={stat} />
          ))}
        </div>
      </section>
      
      <section>
        <GamesListHorizontal games={games} />
      </section>

    </div>
  );
}
