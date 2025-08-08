

import type { Metadata, ResolvingMetadata } from "next";
import { PageTitle } from "@/components/shared/PageTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, ChevronLeft, AlertTriangle } from "lucide-react"; 
import { format } from "date-fns";
import { getTournamentByIdFromFirestore } from "@/lib/tournamentStore"; 
import TournamentPageClient from "./TournamentPageClient";
import type { Tournament } from "@/lib/types";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Skeleton } from "@/components/ui/skeleton";

interface TournamentPageProps {
  params: { tournamentId: string };
}

// This forces the page to be dynamically rendered, ensuring metadata is fresh
export const dynamic = 'force-dynamic';

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

  const startDate = tournament.startDate instanceof Date ? tournament.startDate : (tournament.startDate as any).toDate();
  const title = `${tournament.name} | ${tournament.gameName} Tournament | Apna Esport`;
  const description = `Join the ${tournament.name} ${tournament.gameName} tournament on Apna Esport. Starts on ${format(startDate, "PPP")}. ${tournament.prizePool ? `Prize Pool: ${tournament.prizePool}.` : ''} Sign up now!`;

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

export default function TournamentPage({ params }: TournamentPageProps) {
  const { tournamentId } = params;
  
  return <TournamentPageClient tournamentId={tournamentId} />;
}
