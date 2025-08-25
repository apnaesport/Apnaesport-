
import { PageTitle } from "@/components/shared/PageTitle";
import { getGamesFromFirestore } from "@/lib/tournamentStore";
import GamesPageClient from "./GamesPageClient";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";

export default async function GamesPage() {
  const allGames = await getGamesFromFirestore();

  return (
    <div className="space-y-8">
      <PageTitle
        title="Browse Games"
        subtitle="Find your favorite games and discover active tournaments."
      />
       <div className="flex justify-center">
          <AdsterraBlock format="leaderboard" />
      </div>
      <GamesPageClient allGames={allGames} />
       <div className="flex justify-center mt-8">
          <AdsterraBlock format="leaderboard" />
      </div>
    </div>
  );
}
