
import { PageTitle } from "@/components/shared/PageTitle";
import { GameCard } from "@/components/games/GameCard";
import type { Game } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Placeholder data - replace with actual data fetching
const placeholderGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://picsum.photos/seed/lol-icon/200/200", bannerUrl: "https://picsum.photos/seed/lol-banner/400/300" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://picsum.photos/seed/valo-icon/200/200", bannerUrl: "https://picsum.photos/seed/valo-banner/400/300" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://picsum.photos/seed/cs-icon/200/200", bannerUrl: "https://picsum.photos/seed/cs-banner/400/300" },
  { id: "game-dota", name: "Dota 2", iconUrl: "https://picsum.photos/seed/dota-icon/200/200", bannerUrl: "https://picsum.photos/seed/dota-banner/400/300" },
  { id: "game-rl", name: "Rocket League", iconUrl: "https://picsum.photos/seed/rl-icon/200/200", bannerUrl: "https://picsum.photos/seed/rl-banner/400/300" },
  { id: "game-apex", name: "Apex Legends", iconUrl: "https://picsum.photos/seed/apex-icon/200/200", bannerUrl: "https://picsum.photos/seed/apex-banner/400/300" },
  { id: "game-fortnite", name: "Fortnite", iconUrl: "https://picsum.photos/seed/fortnite-icon/200/200", bannerUrl: "https://picsum.photos/seed/fortnite-banner/400/300" },
  { id: "game-cod", name: "Call of Duty", iconUrl: "https://picsum.photos/seed/cod-icon/200/200", bannerUrl: "https://picsum.photos/seed/cod-banner/400/300" },
];


export default function GamesPage() {
  // In a real app, fetch this data
  const games = placeholderGames;

  // TODO: Implement search/filter functionality
  // const [searchTerm, setSearchTerm] = useState("");
  // const filteredGames = games.filter(game => game.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <PageTitle
        title="Browse Games"
        subtitle="Find your favorite games and discover active tournaments."
      />
      
      {/* Search bar - to be implemented */}
      {/* <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search for games..." 
          className="pl-10 w-full md:w-1/2 lg:w-1/3"
          // value={searchTerm}
          // onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div> */}

      {games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-10">
          No games found. Check back later or try refining your search.
        </p>
      )}
    </div>
  );
}

// Note: To make search work properly, this page would need to be a client component or use server actions.
// For now, search is commented out for simplicity as a server component.
