import { PageTitle } from "@/components/shared/PageTitle";
import { getGamesFromFirestore } from "@/lib/tournamentStore";
import GamesPageClient from "./GamesPageClient";

export default async function GamesPage() {
  const allGames = await getGamesFromFirestore();

  return (
    <div className="space-y-8">
      <PageTitle
        title="Browse Games"
        subtitle="Find your favorite games and discover active tournaments."
      />
      <GamesPageClient allGames={allGames} />
    </div>
  );
}
