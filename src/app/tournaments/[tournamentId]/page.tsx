
import type { Metadata, ResolvingMetadata } from "next";
import { PageTitle } from "@/components/shared/PageTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Users, Trophy, Gamepad2, ListChecks, ChevronLeft, AlertTriangle, DollarSign, Building } from "lucide-react"; 
import { format } from "date-fns";
import { getTournamentByIdFromFirestore } from "@/lib/tournamentStore"; 
import TournamentPageClient from "./TournamentPageClient";
import type { Tournament } from "@/lib/types";

interface TournamentPageProps {
  params: { tournamentId: string };
}

export async function generateMetadata({ params }: TournamentPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { tournamentId } = params;
  const tournament = await getTournamentByIdFromFirestore(tournamentId);
  const previousImages = (await parent).openGraph?.images || [];

  if (!tournament) {
    return {
      title: "Tournament Not Found",
      description: "The tournament you are looking for does not exist on Apna Esport.",
    };
  }

  const title = `${tournament.name} | ${tournament.gameName} Tournament | Apna Esport`;
  const description = `Join the ${tournament.name} ${tournament.gameName} tournament on Apna Esport. Starts on ${format(tournament.startDate as Date, "PPP")}. ${tournament.prizePool ? `Prize Pool: ${tournament.prizePool}.` : ''} Sign up now!`;

  return {
    title,
    description,
    openGraph: {
      title: title,
      description: tournament.description,
      images: [tournament.bannerImageUrl, ...previousImages],
      type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [tournament.bannerImageUrl],
    }
  };
}

// Helper to convert Firestore Timestamps to ISO strings for serialization
const serializeTournament = (tournament: Tournament): any => {
  const newTournament = { ...tournament };
  for (const key of Object.keys(newTournament)) {
    const value = (newTournament as any)[key];
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      (newTournament as any)[key] = value.toDate().toISOString();
    }
  }
   if (newTournament.matches) {
    newTournament.matches = newTournament.matches.map(match => {
      const newMatch = {...match};
      if (newMatch.startTime && typeof newMatch.startTime === 'object' && 'toDate' in newMatch.startTime) {
        (newMatch.startTime as any) = newMatch.startTime.toDate().toISOString();
      }
      return newMatch;
    });
  }
  return newTournament;
}

export default async function TournamentPage({ params }: TournamentPageProps) {
  const { tournamentId } = params;
  const tournament = await getTournamentByIdFromFirestore(tournamentId);

  if (!tournament) {
    return (
      <main className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <PageTitle title="Tournament Not Found" />
        <p className="text-muted-foreground">The tournament you are looking for does not exist or may have been removed.</p>
        <Button asChild className="mt-4">
          <Link href="/tournaments">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Tournaments
          </Link>
        </Button>
      </main>
    );
  }
  
  const isPremium = tournament.entryFee && tournament.entryFee > 0;
  const formattedStartDate = format((tournament.startDate as Date), "PPPPp");

  const serializableTournament = serializeTournament(tournament);

  return (
    <div className="space-y-8">
      <div className="relative h-48 sm:h-64 md:h-80 rounded-lg overflow-hidden group shadow-xl">
        <Image 
          src={tournament.bannerImageUrl} 
          alt={`${tournament.name} banner`} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="esports event stage"
          unoptimized={tournament.bannerImageUrl.startsWith('data:image')}
          onError={(e) => (e.currentTarget.src = `https://placehold.co/1200x400.png?text=${encodeURIComponent(tournament.name)}`)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={tournament.status === "Live" ? "destructive" : "default"} className="text-xs sm:text-sm px-2 sm:px-3 py-1">{tournament.status}</Badge>
             {isPremium && (
                <Badge variant="outline" className="bg-primary/90 text-primary-foreground border-primary-foreground/50 text-xs sm:text-sm px-2 sm:px-3 py-1">
                    <DollarSign className="h-3 w-3 mr-1" /> Premium
                </Badge>
            )}
          </div>
          <PageTitle title={tournament.name} className="mb-0 text-shadow !text-xl sm:!text-2xl md:!text-3xl text-white" /> 
          <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-slate-200 drop-shadow-sm">
            <Image 
              src={tournament.gameIconUrl} 
              alt={tournament.gameName} 
              width={24} height={24} 
              className="rounded-sm mr-2 object-cover" 
              data-ai-hint="game icon mini"
              unoptimized={tournament.gameIconUrl.startsWith('data:image')}
              onError={(e) => (e.currentTarget.src = `https://placehold.co/24x24.png?text=${tournament.gameName.substring(0,2)}`)}
            />
            <span>{tournament.gameName}</span>
          </div>
        </div>
      </div>

      <TournamentPageClient 
        tournamentId={tournamentId} 
        initialTournament={serializableTournament} 
        initialFormattedDate={formattedStartDate}
      />
    </div>
  );
}
