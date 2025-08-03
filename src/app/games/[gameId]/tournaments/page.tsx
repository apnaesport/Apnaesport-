
import type { Metadata, ResolvingMetadata } from "next";
import { PageTitle } from "@/components/shared/PageTitle";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import type { Game, Tournament } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlusCircle, AlertTriangle, Loader2 } from "lucide-react";
import { getGameDetails, getTournamentsForGame } from "@/lib/tournamentStore";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import GameTournamentsClient from "./GameTournamentsClient";

interface GameTournamentsPageProps {
  params: { gameId: string };
}

export async function generateMetadata({ params }: GameTournamentsPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { gameId } = params;
  const game = await getGameDetails(gameId);
  const previousImages = (await parent).openGraph?.images || [];

  if (!game) {
    return {
      title: "Game Not Found",
      description: "The game you are looking for does not exist on Apna Esport.",
    };
  }

  return {
    title: `${game.name} Tournaments | Apna Esport`,
    description: `Find, join, and compete in ${game.name} tournaments on Apna Esport. See upcoming, live, and completed events.`,
    openGraph: {
      title: `${game.name} Tournaments on Apna Esport`,
      description: `Browse all available tournaments for ${game.name}.`,
      images: [game.bannerUrl || game.iconUrl, ...previousImages],
    },
  };
}

export default async function GameTournamentsPage({ params }: GameTournamentsPageProps) {
  const { gameId } = params;
  const game = await getGameDetails(gameId);
  
  if (!game) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <PageTitle title="Game Not Found" />
        <p className="text-muted-foreground">The game you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/games">Back to Games</Link>
        </Button>
      </div>
    );
  }

  const allTournaments = await getTournamentsForGame(gameId);

  return (
    <div className="space-y-8">
      <div className="relative h-48 md:h-64 rounded-lg overflow-hidden group mb-8 shadow-xl border border-border">
        <Image 
          src={game.bannerUrl || `https://placehold.co/1200x300.png`} 
          alt={`${game.name} banner`} 
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint={game.dataAiHint || "game background art"}
          unoptimized={game.bannerUrl?.startsWith('data:image')}
          onError={(e) => (e.currentTarget.src = `https://placehold.co/1200x300.png?text=${encodeURIComponent(game.name)}`)}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 md:p-6 lg:p-8">
          <div className="flex items-center">
            <div className="relative w-16 h-16 md:w-20 md:h-20 mr-4 shrink-0">
              <Image 
                src={game.iconUrl} 
                alt={game.name} 
                fill
                className="rounded-lg border-2 border-background shadow-md object-cover" 
                data-ai-hint={game.dataAiHint || "game logo large"}
                unoptimized={game.iconUrl?.startsWith('data:image')}
                onError={(e) => (e.currentTarget.src = `https://placehold.co/80x80.png?text=${game.name.substring(0,2)}`)}
              />
            </div>
            <PageTitle title={`${game.name} Tournaments`} className="mb-0 text-white text-shadow !text-2xl md:!text-3xl" />
          </div>
        </div>
      </div>
      
      <GameTournamentsClient game={game} initialTournaments={allTournaments} />
      
    </div>
  );
}

// Create a new client component to handle client-side logic
const GameTournamentsClientPage = ({ game, initialTournaments }: { game: Game, initialTournaments: Tournament[] }) => {
    return null; // This is a placeholder. The actual client component logic is in GameTournamentsClient.tsx
}

