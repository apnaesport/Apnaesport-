
import { PageTitle } from "@/components/shared/PageTitle";
import { getGamesFromFirestore } from "@/lib/tournamentStore";
import GamesPageClient from "./GamesPageClient";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";
import type { Game, Timestamp } from "@/lib/types";

// Helper to convert Firestore Timestamps to a serializable format for Client Components
const serializeObjectWithTimestamps = (obj: any): any => {
    if (!obj) return obj;

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value && typeof value.toDate === 'function') {
                newObj[key] = value.toDate().toISOString();
            } else if (value instanceof Date) {
                newObj[key] = value.toISOString();
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                newObj[key] = serializeObjectWithTimestamps(value);
            }
             else if (Array.isArray(value)) {
                newObj[key] = value.map(serializeObjectWithTimestamps);
            }
            else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
};


export default async function GamesPage() {
  const allGames = await getGamesFromFirestore();
  const serializableGames = allGames.map(serializeObjectWithTimestamps);

  return (
    <div className="space-y-8">
      <PageTitle
        title="Browse Games"
        subtitle="Find your favorite games and discover active tournaments."
      />
       <div className="flex justify-center">
          <AdsterraBlock format="leaderboard" />
      </div>
      <GamesPageClient allGames={serializableGames} />
       <div className="flex justify-center mt-8">
          <AdsterraBlock format="leaderboard" />
      </div>
    </div>
  );
}
