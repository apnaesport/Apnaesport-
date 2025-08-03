
import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, LucideIconName } from "@/lib/types";
import { getTournamentsFromFirestore, getGamesFromFirestore, getAllUsersFromFirestore, getSiteSettingsFromFirestore } from "@/lib/tournamentStore";
import { Heart } from "lucide-react";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase"; // Assuming a way to get current user on server
import { getUserProfileFromFirestore } from "@/lib/tournamentStore";

// Helper to convert Firestore Timestamps to ISO strings for serialization
const serializeTournament = (tournament: Tournament): any => {
  const newTournament = { ...tournament };
  for (const key of Object.keys(newTournament)) {
    const value = (newTournament as any)[key];
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      (newTournament as any)[key] = value.toDate().toISOString();
    }
  }
   if (newTournament.matches) {
    newTournament.matches = newTournament.matches.map((match: any) => {
      const newMatch = {...match};
      if (newMatch.startTime && typeof newMatch.startTime === 'object' && 'toDate' in newMatch.startTime) {
        (newMatch.startTime as any) = newMatch.startTime.toDate().toISOString();
      }
      return newMatch;
    });
  }
  return newTournament;
}

export default async function DashboardPage() {
  const [allTournaments, allGames, allUsers, settings] = await Promise.all([
    getTournamentsFromFirestore(), 
    getGamesFromFirestore(),
    getAllUsersFromFirestore(),
    getSiteSettingsFromFirestore(),
  ]);

  const upcomingOrLiveTournaments = allTournaments.filter(t => t.status === "Upcoming" || t.status === "Live" || t.status === "Ongoing");
  
  let featuredTournament: Tournament | undefined = undefined;
  const explicitlyFeaturedAndActive = upcomingOrLiveTournaments.filter(t => t.featured);
  explicitlyFeaturedAndActive.sort((a, b) => new Date(a.startDate as Date).getTime() - new Date(b.startDate as Date).getTime());

  if (explicitlyFeaturedAndActive.length > 0) {
    featuredTournament = explicitlyFeaturedAndActive[0];
  } else if (upcomingOrLiveTournaments.length > 0) {
    upcomingOrLiveTournaments.sort((a, b) => new Date(a.startDate as Date).getTime() - new Date(b.startDate as Date).getTime());
    featuredTournament = upcomingOrLiveTournaments[0];
  } else {
    const sortedByCreation = [...allTournaments].sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt as any).toDate().getTime() : 0;
        const dateB = b.createdAt ? (b.createdAt as any).toDate().getTime() : 0;
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
  
  // This part is tricky on the server. For now, let's assume no user or handle it in a client component if needed.
  // const user = auth.currentUser ? await getUserProfileFromFirestore(auth.currentUser.uid) : null;
  const recommendedTournaments: Tournament[] = []; // Placeholder as getting current user's favs on server is complex without a session provider
  

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard" subtitle="Welcome back to Apna Esport!" />

      {featuredTournament ? (
        <section>
          <FeaturedTournamentCard tournament={serializeTournament(featuredTournament)} />
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
              <TournamentCard key={tournament.id} tournament={serializeTournament(tournament)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Live Now</h2>
        {liveTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveTournaments.map((tournament) => (
              <LiveTournamentCard key={tournament.id} tournament={serializeTournament(tournament)} />
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
        <GamesListHorizontal games={allGames} />
      </section>

    </div>
  );
}
