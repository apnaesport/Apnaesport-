
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
            <Link href={`/games/${game.id}`} key={game.id} legacyBehavior>
              <a className="block">
                <Card className="w-32 h-40 overflow-hidden transition-all duration-300 hover:shadow-primary/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none rounded-lg">
                  <CardContent className="p-0 relative h-full">
                    <Image
                      src={game.iconUrl || `https://picsum.photos/seed/${game.id}/200/300`}
                      alt={game.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
                      data-ai-hint="game poster"
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
