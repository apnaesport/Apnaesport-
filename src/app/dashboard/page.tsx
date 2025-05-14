
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, LucideIconName } from "@/lib/types";
import { getTournaments, getGames, subscribe } from "@/lib/tournamentStore"; 
import { useEffect, useState } from "react"; 
import { Skeleton } from "@/components/ui/skeleton";


export default function DashboardPage() {
  const [featuredTournament, setFeaturedTournament] = useState<Tournament | undefined>(undefined);
  const [liveTournaments, setLiveTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      const allTournaments = getTournaments();
      const allGames = getGames();

      const ft = allTournaments.find(t => t.featured && t.status === "Upcoming") || 
                   allTournaments.find(t => t.status === "Upcoming") || 
                   allTournaments[0]; 
      setFeaturedTournament(ft);

      setLiveTournaments(allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing"));
      setGames(allGames);
      
      const activeTournamentCount = allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing" || t.status === "Upcoming").length;
      // Note: Other stats are placeholders as they need specific user data or more complex calculations
      const placeholderStats: StatItem[] = [
        { title: "Active Tournaments", value: activeTournamentCount, icon: "Trophy" as LucideIconName, change: "" }, // Dynamic
        { title: "Total Players", value: "1,234", icon: "Users" as LucideIconName, change: "+52" }, // Static placeholder
        { title: "Matches Played Today", value: 87, icon: "Gamepad2" as LucideIconName, change: "+15" }, // Static placeholder
        { title: "Your Rank (Overall)", value: "#42", icon: "BarChart3" as LucideIconName, change: "-2" }, // Static placeholder
      ];
      setStats(placeholderStats);

      setIsLoading(false);
    };

    loadData(); 
    const unsubscribe = subscribe(loadData); 

    return () => unsubscribe(); 
  }, []);


  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageTitle title="Dashboard" subtitle="Welcome back to TournamentHub!" />
        <Skeleton className="h-80 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard" subtitle="Welcome back to TournamentHub!" />

      {featuredTournament && (
        <section>
          <FeaturedTournamentCard tournament={featuredTournament} />
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
