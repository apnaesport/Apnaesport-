
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tournament } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Trophy } from "lucide-react";
import { format } from "date-fns";

interface FeaturedTournamentCardProps {
  tournament: Tournament;
}

export function FeaturedTournamentCard({ tournament }: FeaturedTournamentCardProps) {
  return (
    <Card className="overflow-hidden shadow-xl hover:shadow-primary/30 transition-shadow duration-300 group bg-card/80 backdrop-blur-sm">
      <CardHeader className="relative p-0 h-64 md:h-80">
        <Image
          src={tournament.bannerImageUrl || `https://placehold.co/800x400.png`}
          alt={tournament.name}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="esports tournament banner"
          onError={(e) => e.currentTarget.src = "https://placehold.co/800x400.png"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6">
          <Badge variant={tournament.status === "Live" ? "destructive" : "secondary"} className="mb-2 uppercase tracking-wider">
            {tournament.status}
          </Badge>
          <CardTitle className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
            {tournament.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-muted-foreground mb-4 line-clamp-2">{tournament.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span>{format(new Date(tournament.startDate), "MMM dd, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>{tournament.participants.length} / {tournament.maxParticipants} Players</span>
          </div>
          <div className="flex items-center gap-2">
            <Image 
              src={tournament.gameIconUrl || `https://placehold.co/40x40.png`} 
              alt={tournament.gameName} 
              width={20} height={20} 
              className="rounded" data-ai-hint="game icon"
              onError={(e) => e.currentTarget.src = "https://placehold.co/40x40.png"}
            />
            <span>{tournament.gameName}</span>
          </div>
          {tournament.prizePool && (
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span>{tournament.prizePool} Prize Pool</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-6 bg-secondary/30">
        <Button asChild size="lg" className="w-full text-lg">
          <Link href={`/tournaments/${tournament.id}`}>
            View Tournament & Join
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
