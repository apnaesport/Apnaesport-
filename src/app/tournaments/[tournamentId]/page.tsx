
import type { Metadata, ResolvingMetadata } from "next";
import { PageTitle } from "@/components/shared/PageTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DollarSign, ChevronLeft, AlertTriangle } from "lucide-react"; 
import { getTournamentByIdFromFirestore } from "@/lib/tournamentStore"; 
import TournamentPageClient from "./TournamentPageClient";
import type { Tournament, Timestamp } from "@/lib/types";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { Skeleton } from "@/components/ui/skeleton";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";

interface TournamentPageProps {
  params: { tournamentId: string };
}

// This forces the page to be dynamically rendered, ensuring metadata is fresh
export const dynamic = 'force-dynamic';

const toDate = (timestamp: Timestamp | Date | undefined): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (typeof (timestamp as Timestamp).toDate === 'function') return (timestamp as Timestamp).toDate();
    const parsedDate = new Date(timestamp as any);
    return !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
};


export async function generateMetadata({ params }: TournamentPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { tournamentId } = params;
  const tournament = await getTournamentByIdFromFirestore(tournamentId);
  const previousImages = (await parent).openGraph?.images || [];
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://apnaesport.vercel.app';

  if (!tournament) {
    return {
      title: "Tournament Not Found",
      description: "The tournament you are looking for does not exist on Apna Esport.",
    };
  }

  const startDate = toDate(tournament.startDate);
  const prizePool = (tournament.entryFee || 0) * (tournament.maxParticipants || 0);
  const title = `${tournament.name} | ${tournament.gameName} Tournament | Apna Esport`;
  
  // Correctly format the date first, then construct the description string.
  const formattedDate = new Date(startDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  const prizeText = prizePool > 0 ? `Compete for a prize pool of ${prizePool} AE Points.` : 'Compete for glory.';
  const description = `Join the ${tournament.name} ${tournament.gameName} tournament on Apna Esport. Event starts on ${formattedDate} ${prizeText} Register now and prove your skills!`;


  return {
    title,
    description,
    keywords: ["Apna Esport", "apnasport", tournament.name, `${tournament.gameName} tournament`, "online tournament", "gaming competition", "register tournament"],
    openGraph: {
      title: title,
      description: description,
      images: [
          {
            url: tournament.bannerImageUrl,
            width: 1200,
            height: 630,
            alt: tournament.name,
          },
          ...previousImages
      ],
      type: 'website',
      url: `${BASE_URL}/tournaments/${tournamentId}`,
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
  
  return (
    <div className="space-y-8">
      <TournamentPageClient tournamentId={tournamentId} />
    </div>
  );
}
