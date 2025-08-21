

import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, LucideIconName, SiteSettings, UserProfile } from "@/lib/types";
import { getTournamentsFromFirestore, getGamesFromFirestore, getAllUsersFromFirestore, getSiteSettingsFromFirestore, getUserProfileFromFirestore } from "@/lib/tournamentStore";
import { Heart, Megaphone } from "lucide-react";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardPageClient from "./DashboardPageClient";
import { auth } from "@/lib/firebase";
import { get } from "http";


// Helper to convert Firestore Timestamps to a serializable format for Client Components
const serializeObjectWithTimestamps = (obj: any): any => {
    if (!obj) return obj;
    // Create a new object to avoid mutating the original
    const newObj = { ...obj };
    for (const key in newObj) {
        if (newObj[key] && typeof newObj[key] === 'object' && typeof newObj[key].toDate === 'function') {
            newObj[key] = newObj[key].toDate().toISOString();
        }
    }
    return newObj;
};


export default async function DashboardPage() {
  const [tournaments, games, users, settings] = await Promise.all([
    getTournamentsFromFirestore(),
    getGamesFromFirestore(),
    getAllUsersFromFirestore(), // This is still needed for Total Players stat
    getSiteSettingsFromFirestore(),
  ]);

  const upcomingOrLiveTournaments = tournaments.filter(t => t.status === "Upcoming" || t.status === "Live" || t.status === "Ongoing");

  let featuredTournament: Tournament | undefined = undefined;
  const explicitlyFeaturedAndActive = upcomingOrLiveTournaments.filter(t => t.featured);
  explicitlyFeaturedAndActive.sort((a, b) => new Date(a.startDate as any).getTime() - new Date(b.startDate as any).getTime());

  if (explicitlyFeaturedAndActive.length > 0) {
    featuredTournament = explicitlyFeaturedAndActive[0];
  } else if (upcomingOrLiveTournaments.length > 0) {
    upcomingOrLiveTournaments.sort((a, b) => new Date(a.startDate as any).getTime() - new Date(b.startDate as any).getTime());
    featuredTournament = upcomingOrLiveTournaments[0];
  } else {
    const sortedByCreation = [...tournaments].sort((a, b) => {
        const dateA = a.createdAt ? (a.createdAt as any).toDate ? (a.createdAt as any).toDate().getTime() : 0 : 0;
        const dateB = b.createdAt ? (b.createdAt as any).toDate ? (b.createdAt as any).toDate().getTime() : 0 : 0;
        return dateB - dateA;
    });
    featuredTournament = sortedByCreation[0];
  }

  const liveTournaments = tournaments.filter(t => t.status === "Live" || t.status === "Ongoing");

  const activeTournamentCount = tournaments.filter(t => t.status === "Live" || t.status === "Ongoing" || t.status === "Upcoming").length;
  const basePlayerCount = settings?.basePlayerCount || 0;
  const totalUsers = users.length + basePlayerCount;
  const totalMatchesPlayed = tournaments.reduce((acc, t) => acc + (t.matches?.length || 0), 0);

  const stats: StatItem[] = [
    { title: "Active Tournaments", value: activeTournamentCount, icon: "Trophy" as LucideIconName },
    { title: "Total Players", value: totalUsers.toLocaleString(), icon: "Users" as LucideIconName },
    { title: "Matches Played", value: totalMatchesPlayed, icon: "Gamepad2" as LucideIconName },
  ];
  
  const serializableGames = games.map(serializeObjectWithTimestamps);
  // We no longer pass all users to the client, as it's inefficient.
  const serializableFeaturedTournament = featuredTournament ? serializeObjectWithTimestamps(featuredTournament) : undefined;
  const serializableLiveTournaments = liveTournaments.map(serializeObjectWithTimestamps);


  return (
     <DashboardPageClient 
        stats={stats}
        featuredTournament={serializableFeaturedTournament}
        liveTournaments={serializableLiveTournaments}
        allGames={serializableGames}
     />
  );
}
