
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ImageWithFallback } from "../shared/ImageWithFallback";

interface GamesListHorizontalProps {
  games: Game[];
  title?: string;
}

export function GamesListHorizontal({ games, title = "Browse Games" }: GamesListHorizontalProps) {
  if (!games || games.length === 0) {
    return (
      <div>
        {title && <h2 className="text-2xl font-semibold mb-4 text-foreground">{title}</h2>}
        <p className="text-muted-foreground">No games available at the moment.</p>
      </div>
    );
  }
  return (
    <div>
      {title && <h2 className="text-2xl font-semibold mb-4 text-foreground">{title}</h2>}
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex space-x-4 pb-4">
          {games.map((game) => (
            <Link href={`/games/${game.id}/tournaments`} key={game.id} legacyBehavior>
              <a className="block group"> {/* Added group class */}
                <Card className="w-32 h-40 overflow-hidden transition-all duration-300 hover:shadow-primary/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none rounded-lg">
                  <CardContent className="p-0 relative h-full">
                    <ImageWithFallback
                      src={game.iconUrl || `https://placehold.co/200x300.png`}
                      fallbackSrc={`https://placehold.co/200x300.png?text=${game.name.substring(0,2)}`}
                      alt={game.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
                      data-ai-hint="game poster"
                      unoptimized={game.iconUrl?.startsWith('data:image')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-lg" />
                    <div className="absolute bottom-0 left-0 p-2 w-full">
                      <h3 className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                        {game.name}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
