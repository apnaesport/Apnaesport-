
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Game } from "@/lib/types";
import { ArrowRight } from "lucide-react";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-all duration-300 group flex flex-col h-full">
      <CardHeader className="relative p-0 h-60">
        <Image
          src={game.bannerUrl || game.iconUrl || `https://placehold.co/400x300.png`}
          alt={game.name}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint="game wallpaper"
          onError={(e) => e.currentTarget.src = `https://placehold.co/400x300.png`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </CardHeader>
      <CardContent className="p-6 flex-grow flex flex-col">
         <div className="flex items-center mb-2">
          <Image
            src={game.iconUrl || `https://placehold.co/40x40.png`}
            alt={`${game.name} icon`}
            width={40}
            height={40}
            className="rounded-md mr-3 border-2 border-card"
            data-ai-hint="game icon small"
            onError={(e) => e.currentTarget.src = `https://placehold.co/40x40.png`}
          />
          <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
            {game.name}
          </CardTitle>
        </div>
        <CardDescription className="text-muted-foreground mt-1 flex-grow line-clamp-3">
          Discover tournaments and communities for {game.name}. Click below to see all active and upcoming events.
        </CardDescription>
      </CardContent>
      <CardFooter className="p-6 border-t">
        <Button asChild className="w-full">
          <Link href={`/games/${game.id}/tournaments`}>
            View Tournaments <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
