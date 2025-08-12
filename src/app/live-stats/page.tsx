
import { PageTitle } from "@/components/shared/PageTitle";
import type { Metadata } from 'next';
import { getGamesFromFirestore, getAllUsersFromFirestore } from "@/lib/tournamentStore";
import LiveStatsPageClient from "./LiveStatsPageClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Live Stats Arena | Apna Esport",
  description: "Explore live, real-time leaderboards, player stats, and match data for top competitive games on Apna Esport. Search players and track rankings instantly.",
  keywords: ["live stats", "esports leaderboard", "player stats", "real-time game stats", "Apna Esport", "apnasport"],
};

// Helper to convert Firestore Timestamps to a serializable format
const serializeObject = (obj: any): any => {
    if (!obj) return obj;
    const newObj: {[key: string]: any} = { ...obj };
    for (const key in newObj) {
        if (newObj[key] && typeof newObj[key] === 'object' && typeof newObj[key].toDate === 'function') {
            newObj[key] = newObj[key].toDate().toISOString();
        }
    }
    return newObj;
};


export default async function LiveStatsPage() {
  const allGames = await getGamesFromFirestore();
  const allUsers = await getAllUsersFromFirestore();
  
  // Filter for only games marked as API-powered
  const apiGames = allGames.filter(game => game.isApiPowered).map(serializeObject);
  const serializableUsers = allUsers.map(serializeObject);

  return (
    <div className="space-y-8">
      <PageTitle
        title="Live Stats Arena"
        subtitle="Real-time leaderboards and player statistics for top competitive games."
      />
      {apiGames.length > 0 ? (
        <LiveStatsPageClient allGames={apiGames} allUsers={serializableUsers} />
      ) : (
        <Alert>
            <Zap className="h-4 w-4" />
            <AlertTitle>No API-Powered Games Found</AlertTitle>
            <AlertDescription>
              There are no games configured for the Live Stats Arena yet. An admin can enable this feature for specific games in the 'Manage Games' section of the admin panel.
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
