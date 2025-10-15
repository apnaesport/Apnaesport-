
import type { Metadata, ResolvingMetadata } from "next";
import { PageTitle } from "@/components/shared/PageTitle";
import type { Game, Tournament } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getGameDetails, getTournamentsForGame } from "@/lib/tournamentStore";
import GameTournamentsClient from "./GameTournamentsClient";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";

interface GameTournamentsPageProps {
  params: { gameId: string };
}

// This forces the page to be dynamically rendered, ensuring metadata is fresh
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: GameTournamentsPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { gameId } = params;
  const game = await getGameDetails(gameId);
  const previousImages = (await parent).openGraph?.images || [];
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apnaesport.vercel.app';

  if (!game) {
    return {
      title: "Game Not Found",
      description: "The game you are looking for does not exist on Apna Esport.",
    };
  }

  const title = `${game.name} Tournaments | Apna Esport`;
  const description = `Find, join, and compete in the latest ${game.name} tournaments on Apna Esport (apnasport). See upcoming, live, and completed events, and register to play against India's best gamers.`;

  return {
    title,
    description,
    keywords: ["Apna Esport", "apnasport", "esports tournaments India", "online gaming platform", `${game.name} tournaments`, "gaming competition site", game.name, `${game.name} tournament registration`],
    openGraph: {
      title: `All ${game.name} Tournaments on Apna Esport`,
      description: `Browse all available tournaments for ${game.name}, check prize pools, and register to compete.`,
      images: [game.bannerUrl || game.iconUrl, ...previousImages],
      url: `${BASE_URL}/games/${gameId}/tournaments`,
    },
  };
}

// Helper to convert Firestore Timestamps to a serializable format for Client Components
const serializeTournament = (tournament: Tournament): any => {
    const toDateSafe = (timestamp: any): string | null => {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate().toISOString();
        if (typeof timestamp === 'string') return timestamp;
        if (timestamp instanceof Date) return timestamp.toISOString();
        return new Date().toISOString();
    };

    return {
        ...tournament,
        id: tournament.id,
        startDate: toDateSafe(tournament.startDate),
        endDate: toDateSafe(tournament.endDate),
        createdAt: toDateSafe(tournament.createdAt),
        updatedAt: toDateSafe(tournament.updatedAt),
    };
};



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
  const serializableTournaments = allTournaments.map(serializeTournament);

  // Serialize the game object to make it a plain object
  const serializableGame = {
    ...game,
    createdAt: game.createdAt?.toDate ? game.createdAt.toDate().toISOString() : null,
    updatedAt: game.updatedAt?.toDate ? game.updatedAt.toDate().toISOString() : null,
  };


  return (
    <div className="space-y-8">
      <div className="relative h-48 md:h-64 rounded-lg overflow-hidden group mb-8 shadow-xl border border-border">
        <ImageWithFallback 
          src={game.bannerUrl || `https://placehold.co/1200x300.png`}
          fallbackSrc={`https://placehold.co/1200x300.png?text=${encodeURIComponent(game.name)}`}
          alt={`${game.name} banner`} 
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint={game.dataAiHint || "game background art"}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 md:p-6 lg:p-8">
          <div className="flex items-center">
            <div className="relative w-16 h-16 md:w-20 md:h-20 mr-4 shrink-0">
               <ImageWithFallback 
                src={game.iconUrl}
                fallbackSrc={`https://placehold.co/80x80.png?text=${game.name.substring(0,2)}`}
                alt={game.name} 
                fill
                className="rounded-lg border-2 border-background shadow-md object-cover" 
                data-ai-hint={game.dataAiHint || "game logo large"}
              />
            </div>
            <PageTitle title={`${game.name} Tournaments`} className="mb-0 text-white text-shadow !text-2xl md:!text-3xl" />
          </div>
        </div>
      </div>
      
      <div className="flex justify-center">
          <AdsterraBlock format="leaderboard" />
      </div>

      <GameTournamentsClient game={serializableGame as Game} initialTournaments={serializableTournaments} />
      
      <div className="flex justify-center mt-8">
          <AdsterraBlock format="leaderboard" />
      </div>
    </div>
  );
}
