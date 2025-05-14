
import { PageTitle } from "@/components/shared/PageTitle";
import { GameCard } from "@/components/games/GameCard";
import type { Game } from "@/lib/types";
// import { Input } from "@/components/ui/input";
// import { Search } from "lucide-react";

// Placeholder data - replace with actual data fetching
const placeholderGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://placehold.co/200x200.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://placehold.co/200x200.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://placehold.co/200x200.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-dota", name: "Dota 2", iconUrl: "https://placehold.co/200x200.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-rl", name: "Rocket League", iconUrl: "https://placehold.co/200x200.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-apex", name: "Apex Legends", iconUrl: "https://placehold.co/200x200.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-fortnite", name: "Fortnite", iconUrl: "https://placehold.co/200x200.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-cod", name: "Call of Duty", iconUrl: "https://placehold.co/200x200.png", bannerUrl: "https://placehold.co/400x300.png" },
];


export default function GamesPage() {
  const games = placeholderGames;

  return (
    <div className="space-y-8">
      <PageTitle
        title="Browse Games"
        subtitle="Find your favorite games and discover active tournaments."
      />
      
      {games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-10">
          No games found. Check back later.
        </p>
      )}
    </div>
  );
}
