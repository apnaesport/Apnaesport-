
import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, LucideIconName } from "@/lib/types";

// Placeholder data - replace with actual data fetching
const placeholderFeaturedTournament: Tournament = {
  id: "featured-1",
  name: "TournamentHub Global Championship",
  gameId: "game-lol",
  gameName: "League of Legends",
  gameIconUrl: "https://placehold.co/40x40.png",
  bannerImageUrl: "https://placehold.co/1200x600.png",
  description: "The ultimate battle for glory! Top teams from around the world compete for the grand prize. Don't miss the epic clashes and unforgettable moments.",
  status: "Upcoming",
  startDate: new Date(new Date().setDate(new Date().getDate() + 7)),
  participants: [],
  maxParticipants: 128,
  prizePool: "$100,000",
  bracketType: "Single Elimination",
  featured: true,
  organizerId: "admin-user",
};

const placeholderLiveTournaments: Tournament[] = [
  {
    id: "live-1",
    name: "Valorant Weekly Clash #12",
    gameId: "game-valo",
    gameName: "Valorant",
    gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/400x200.png",
    description: "Fast-paced tactical shooter action. Who will come out on top this week?",
    status: "Live",
    startDate: new Date(new Date().setHours(new Date().getHours() - 2)),
    participants: Array(10).fill({ id: '', name: ''}), 
    maxParticipants: 16,
    prizePool: "$500",
    bracketType: "Single Elimination",
    organizerId: "user-123",
  },
  {
    id: "live-2",
    name: "Rocket League Skirmish",
    gameId: "game-rl", // Assume game-rl exists
    gameName: "Rocket League",
    gameIconUrl: "https://placehold.co/40x40.png", // Placeholder for Rocket League
    bannerImageUrl: "https://placehold.co/400x200.png",
    description: "High-flying car soccer madness! Tune in for incredible goals and saves.",
    status: "Live",
    startDate: new Date(new Date().setHours(new Date().getHours() - 1)),
    participants: Array(6).fill({ id: '', name: ''}), 
    maxParticipants: 8,
    prizePool: "In-game Items",
    bracketType: "Single Elimination",
    organizerId: "user-456",
  },
];

const placeholderStats: StatItem[] = [
  { title: "Active Tournaments", value: 2, icon: "Trophy" as LucideIconName, change: "+1" },
  { title: "Total Players", value: "1,234", icon: "Users" as LucideIconName, change: "+52" },
  { title: "Matches Played Today", value: 87, icon: "Gamepad2" as LucideIconName, change: "+15" },
  { title: "Your Rank (Overall)", value: "#42", icon: "BarChart3" as LucideIconName, change: "-2" },
];

const placeholderGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://placehold.co/200x300.png", bannerUrl: "https://placehold.co/1000x400.png" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://placehold.co/200x300.png", bannerUrl: "https://placehold.co/1000x400.png" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://placehold.co/200x300.png", bannerUrl: "https://placehold.co/1000x400.png" },
  { id: "game-dota", name: "Dota 2", iconUrl: "https://placehold.co/200x300.png", bannerUrl: "https://placehold.co/1000x400.png" },
  { id: "game-rl", name: "Rocket League", iconUrl: "https://placehold.co/200x300.png", bannerUrl: "https://placehold.co/1000x400.png" },
  { id: "game-apex", name: "Apex Legends", iconUrl: "https://placehold.co/200x300.png", bannerUrl: "https://placehold.co/1000x400.png" },
];


export default function DashboardPage() {
  const featuredTournament = placeholderFeaturedTournament;
  const liveTournaments = placeholderLiveTournaments;
  const stats = placeholderStats;
  const games = placeholderGames;

  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard" subtitle="Welcome back to TournamentHub!" />

      <section>
        <FeaturedTournamentCard tournament={featuredTournament} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Live Now</h2>
        {liveTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveTournaments.map((tournament) => (
              <LiveTournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No tournaments are live right now. Check back soon!</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Stats Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatsCard key={stat.title} item={stat} />
          ))}
        </div>
      </section>
      
      <section>
        <GamesListHorizontal games={games} />
      </section>

    </div>
  );
}
