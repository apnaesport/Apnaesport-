import { PageTitle } from "@/components/shared/PageTitle";
import { GameCard } from "@/components/games/GameCard";
import type { Game } from "@/lib/types";
import { getGamesFromFirestore } from "@/lib/tournamentStore";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// This component will handle client-side filtering
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
