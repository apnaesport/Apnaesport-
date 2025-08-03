
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tournament } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Gamepad2, Eye, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "../shared/ImageWithFallback";

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const [formattedStartDate, setFormattedStartDate] = useState<string | null>(null);

  useEffect(() => {
    if (tournament.startDate) {
      try {
        // Ensure tournament.startDate is a Date object or can be converted
        const dateToFormat = tournament.startDate instanceof Date 
          ? tournament.startDate 
          : (tournament.startDate as any)?.toDate 
            ? (tournament.startDate as any).toDate() 
            : new Date(tournament.startDate as any);
        setFormattedStartDate(format(dateToFormat, "MMM dd, yyyy 'at' p"));
      } catch (error) {
        console.error("Error formatting date in TournamentCard:", error);
        setFormattedStartDate("Invalid date");
      }
    }
  }, [tournament.startDate]);

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
  
  const isPremium = tournament.entryFee && tournament.entryFee > 0;

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-accent/20 transition-all duration-300 group flex flex-col h-full">
      <CardHeader className="relative p-0 h-48">
        <ImageWithFallback
          src={tournament.bannerImageUrl || ''}
          fallbackSrc={`https://placehold.co/400x200.png?text=${encodeURIComponent(tournament.name)}`}
          alt={tournament.name}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
          data-ai-hint="tournament banner small"
          unoptimized={tournament.bannerImageUrl?.startsWith('data:image')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
            <Badge 
            variant={getStatusBadgeVariant(tournament.status)} 
            className="uppercase tracking-wider"
            >
            {tournament.status}
            </Badge>
            {isPremium && (
                <Badge variant="outline" className="bg-primary/80 text-primary-foreground border-primary-foreground/50">
                    <DollarSign className="h-3 w-3 mr-1" /> Premium
                </Badge>
            )}
        </div>
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
            <span>{formattedStartDate || "Loading date..."}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-2 text-primary" />
            <span>{tournament.participants.length} / {tournament.maxParticipants} Participants</span>
          </div>
           <div className="flex items-center text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-2 text-primary" />
            <span>
                {isPremium ? `${tournament.entryFee} ${tournament.currency || 'USD'} Entry` : "Free Entry"}
            </span>
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
