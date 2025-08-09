

"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tournament } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Radio, Users, CalendarDays } from "lucide-react";
import { formatDistanceToNowStrict } from 'date-fns';
import { ImageWithFallback } from "../shared/ImageWithFallback";


interface LiveTournamentCardProps {
  tournament: Tournament;
}

export function LiveTournamentCard({ tournament }: LiveTournamentCardProps) {
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-accent/20 transition-all duration-300 group flex flex-col h-full">
      <CardHeader className="relative p-0 h-40">
        <ImageWithFallback
          src={tournament.bannerImageUrl || ""}
          fallbackSrc={`https://placehold.co/400x200.png?text=${encodeURIComponent(tournament.name)}`}
          alt={tournament.name}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint="gaming match"
          unoptimized={tournament.bannerImageUrl?.startsWith('data:image')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <Badge variant="destructive" className="absolute top-3 right-3 uppercase tracking-wider">
          <Radio className="h-3 w-3 mr-1 animate-pulse" /> Live
        </Badge>
        <div className="absolute bottom-0 left-0 p-4">
          <ImageWithFallback 
            src={tournament.gameIconUrl || ""}
            fallbackSrc={`https://placehold.co/40x40.png?text=${tournament.gameName.substring(0,2)}`}
            alt={tournament.gameName} 
            width={32} height={32} 
            className="rounded-md mb-1 border-2 border-background" 
            data-ai-hint="game logo small"
            unoptimized={tournament.gameIconUrl?.startsWith('data:image')}
          />
          <CardTitle className="text-lg font-semibold text-white drop-shadow-md line-clamp-1">
            {tournament.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {tournament.description}
        </CardDescription>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center"><Users className="h-3 w-3 mr-1.5 text-primary" /> Participants</span>
            <span>{tournament.participants.length} / {tournament.maxParticipants}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center"><CalendarDays className="h-3 w-3 mr-1.5 text-primary" /> Started</span>
            <span>{formatDistanceToNowStrict(new Date(tournament.startDate))} ago</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/tournaments/${tournament.id}`}>Watch Now</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
