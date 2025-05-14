
"use client"; // Add "use client"

import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, LucideIconName } from "@/lib/types";
import { getTournaments, getGames, subscribe } from "@/lib/tournamentStore"; // Import from store
import { useEffect, useState } from "react"; // Import useEffect and useState

// Placeholder data - replace with actual data fetching
const placeholderStats: StatItem[] = [
  { title: "Active Tournaments", value: 0, icon: "Trophy" as LucideIconName, change: "+0" }, // Value updated dynamically
  { title: "Total Players", value: "1,234", icon: "Users" as LucideIconName, change: "+52" }, // Static for now
  { title: "Matches Played Today", value: 87, icon: "Gamepad2" as LucideIconName, change: "+15" }, // Static for now
  { title: "Your Rank (Overall)", value: "#42", icon: "BarChart3" as LucideIconName, change: "-2" }, // Static for now
];


export default function DashboardPage() {
  const [featuredTournament, setFeaturedTournament] = useState<Tournament | undefined>(undefined);
  const [liveTournaments, setLiveTournaments] = useState<Tournament[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<StatItem[]>(placeholderStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      const allTournaments = getTournaments();
      const allGames = getGames();

      // Find featured tournament (e.g., first upcoming with 'featured: true' or just first upcoming)
      const ft = allTournaments.find(t => t.featured && t.status === "Upcoming") || 
                   allTournaments.find(t => t.status === "Upcoming") || 
                   allTournaments[0]; // Fallback
      setFeaturedTournament(ft);

      setLiveTournaments(allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing"));
      setGames(allGames);
      
      // Update stats based on current data
      setStats(prevStats => prevStats.map(stat => {
        if (stat.title === "Active Tournaments") {
          const activeCount = allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing" || t.status === "Upcoming").length;
          // Basic change detection simulation
          const prevActiveCount = parseInt(stat.value as string) || 0;
          const change = activeCount - prevActiveCount;
          return { ...stat, value: activeCount.toString(), change: change >= 0 ? `+${change}` : `${change}` };
        }
        return stat;
      }));

      setIsLoading(false);
    };

    loadData(); // Initial load
    const unsubscribe = subscribe(loadData); // Subscribe to changes in the store

    return () => unsubscribe(); // Cleanup subscription
  }, []);


  if (isLoading) {
    // You can return a skeleton loader here
    return (
      <div className="space-y-8">
        <PageTitle title="Dashboard" subtitle="Welcome back to TournamentHub!" />
         {/* Add skeleton loaders for sections */}
        <div className="h-80 w-full bg-muted animate-pulse rounded-lg"></div>
        <div className="h-40 w-full bg-muted animate-pulse rounded-lg"></div>
        <div className="h-20 w-full bg-muted animate-pulse rounded-lg"></div>
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
