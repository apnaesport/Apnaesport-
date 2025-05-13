
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tournament } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Gamepad2, Eye } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const getStatusBadgeVariant = (status: Tournament["status"]) => {
    switch (status) {
      case "Live":
      case "Ongoing":
        return "destructive";
      case "Upcoming":
        return "default";
      case "Completed":
        return "secondary";
      default:
        return "outline";
    }
  };
  
  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-accent/20 transition-all duration-300 group flex flex-col h-full">
      <CardHeader className="relative p-0 h-48">
        <Image
          src={tournament.bannerImageUrl || `https://picsum.photos/seed/${tournament.id}/400/200`}
          alt={tournament.name}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint="tournament banner small"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <Badge 
          variant={getStatusBadgeVariant(tournament.status)} 
          className="absolute top-3 right-3 uppercase tracking-wider"
        >
          {tournament.status}
        </Badge>
        <div className="absolute bottom-0 left-0 p-4">
          <CardTitle className="text-xl font-semibold text-white drop-shadow-md line-clamp-2">
            {tournament.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {tournament.description}
        </CardDescription>
        <div className="space-y-2 text-xs">
          <div className="flex items-center text-muted-foreground">
            <Gamepad2 className="h-4 w-4 mr-2 text-primary" />
            <span>{tournament.gameName}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <CalendarDays className="h-4 w-4 mr-2 text-primary" />
            <span>{format(new Date(tournament.startDate), "MMM dd, yyyy 'at' p")}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-2 text-primary" />
            <span>{tournament.participants.length} / {tournament.maxParticipants} Participants</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/tournaments/${tournament.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
