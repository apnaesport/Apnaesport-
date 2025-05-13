
import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem } from "@/lib/types";
// Removed direct icon imports as they will be handled in StatsCard
// import { BarChart3, Users, Trophy, Gamepad2 } from "lucide-react"; 

// Placeholder data - replace with actual data fetching
const placeholderFeaturedTournament: Tournament = {
  id: "featured-1",
  name: "TournamentHub Global Championship",
  gameId: "game-lol",
  gameName: "League of Legends",
  gameIconUrl: "https://picsum.photos/seed/lol-icon/40/40",
  bannerImageUrl: "https://picsum.photos/seed/featured-banner/1200/600",
  description: "The ultimate battle for glory! Top teams from around the world compete for the grand prize. Don't miss the epic clashes and unforgettable moments.",
  status: "Upcoming",
  startDate: new Date(new Date().setDate(new Date().getDate() + 7)),
  participants: [],
  maxParticipants: 128,
  prizePool: "$100,000",
  bracketType: "Single Elimination",
  featured: true,
};

const placeholderLiveTournaments: Tournament[] = [
  {
    id: "live-1",
    name: "Valorant Weekly Clash #12",
    gameId: "game-valo",
    gameName: "Valorant",
    gameIconUrl: "https://picsum.photos/seed/valo-icon/40/40",
    bannerImageUrl: "https://picsum.photos/seed/live-banner-1/400/200",
    description: "Fast-paced tactical shooter action. Who will come out on top this week?",
    status: "Live",
    startDate: new Date(new Date().setHours(new Date().getHours() - 2)),
    participants: Array(10).fill({ id: '', name: ''}), // Dummy participants
    maxParticipants: 16,
    prizePool: "$500",
    bracketType: "Single Elimination",
  },
  {
    id: "live-2",
    name: "Rocket League Skirmish",
    gameId: "game-rl",
    gameName: "Rocket League",
    gameIconUrl: "https://picsum.photos/seed/rl-icon/40/40",
    bannerImageUrl: "https://picsum.photos/seed/live-banner-2/400/200",
    description: "High-flying car soccer madness! Tune in for incredible goals and saves.",
    status: "Live",
    startDate: new Date(new Date().setHours(new Date().getHours() - 1)),
    participants: Array(6).fill({ id: '', name: ''}), // Dummy participants
    maxParticipants: 8,
    prizePool: "In-game Items",
    bracketType: "Single Elimination",
  },
];

const placeholderStats: StatItem[] = [
  { title: "Active Tournaments", value: 2, icon: "Trophy", change: "+1" },
  { title: "Total Players", value: "1,234", icon: "Users", change: "+52" },
  { title: "Matches Played Today", value: 87, icon: "Gamepad2", change: "+15" },
  { title: "Your Rank (Overall)", value: "#42", icon: "BarChart3", change: "-2" },
];

const placeholderGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://picsum.photos/seed/lol-game/200/300", bannerUrl: "https://picsum.photos/seed/lol-banner/1000/400" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://picsum.photos/seed/valo-game/200/300", bannerUrl: "https://picsum.photos/seed/valo-banner/1000/400" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://picsum.photos/seed/cs-game/200/300", bannerUrl: "https://picsum.photos/seed/cs-banner/1000/400" },
  { id: "game-dota", name: "Dota 2", iconUrl: "https://picsum.photos/seed/dota-game/200/300", bannerUrl: "https://picsum.photos/seed/dota-banner/1000/400" },
  { id: "game-rl", name: "Rocket League", iconUrl: "https://picsum.photos/seed/rl-game/200/300", bannerUrl: "https://picsum.photos/seed/rl-banner/1000/400" },
  { id: "game-apex", name: "Apex Legends", iconUrl: "https://picsum.photos/seed/apex-game/200/300", bannerUrl: "https://picsum.photos/seed/apex-banner/1000/400" },
];


export default function DashboardPage() {
  // In a real app, fetch data using React Query or server components
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
