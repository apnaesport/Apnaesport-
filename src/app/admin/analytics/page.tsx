
import { PageTitle } from "@/components/shared/PageTitle";
import type { StatItem } from "@/lib/types";
import { getTournamentsFromFirestore, getSiteSettingsFromFirestore, getAllUsersFromFirestore } from "@/lib/tournamentStore";
import AdminAnalyticsClient from "./AdminAnalyticsClient";

export default async function AdminAnalyticsPage() {
  const [currentTournaments, allUsers, settings] = await Promise.all([
    getTournamentsFromFirestore(),
    getAllUsersFromFirestore(),
    getSiteSettingsFromFirestore(),
  ]);

  const totalMatchesPlayed = currentTournaments.reduce((acc, t) => {
      const matchesCount = t.matches?.length || 0;
      if (t.bracketType === "Round Robin" && t.participants.length > 1 && matchesCount === 0) {
          return acc + (t.participants.length * (t.participants.length - 1) / 2);
      }
      return acc + matchesCount;
  }, 0);
  
  const basePlayerCount = settings?.basePlayerCount || 0;
  const totalUsers = allUsers.length + basePlayerCount;
  const placeholderDailyActive = Math.floor(totalUsers / 5) > 0 ? Math.floor(totalUsers / 5) : 25; // Placeholder logic

  const platformAnalytics: StatItem[] = [
    { title: "Total Registered Users", value: totalUsers.toLocaleString(), icon: "Users" }, 
    { title: "Total Tournaments Hosted", value: currentTournaments.length, icon: "Swords" }, 
    { title: "Total Matches Played (Est.)", value: totalMatchesPlayed, icon: "Gamepad2" }, 
    { title: "Daily Active Users (Est.)", value: placeholderDailyActive, icon: "Eye" }, 
  ];

  return (
    <div className="space-y-8">
      <PageTitle title="Platform Analytics" subtitle="Key metrics and insights for Apna Esport." />
      <AdminAnalyticsClient initialStats={platformAnalytics} />
    </div>
  );
}
