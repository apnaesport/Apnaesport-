
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from 'next/navigation';
import { getCommunityByIdFromFirestore, getCommunityMembers } from "@/lib/tournamentStore";
import CommunityPageClient from "./CommunityPageClient";
import type { Community } from "@/lib/types";

interface CommunityPageProps {
    params: { communityId: string };
}

// Helper to serialize Firestore Timestamps
const serializeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(serializeObject);
    
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value && typeof value.toDate === 'function') {
                newObj[key] = value.toDate().toISOString();
            } else {
                newObj[key] = serializeObject(value);
            }
        }
    }
    return newObj;
};

export async function generateMetadata({ params }: CommunityPageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const { communityId } = params;
  const community = await getCommunityByIdFromFirestore(communityId);
  const previousImages = (await parent).openGraph?.images || [];

  if (!community) {
    return {
      title: "Community Not Found",
      description: "The community you are looking for does not exist on Apna Esport.",
    };
  }
  
  const title = `${community.name} | Community | Apna Esport`;
  const description = community.tagline || `Join the ${community.name} community on Apna Esport. Connect with other players, join tournaments, and grow together.`;

  return {
    title,
    description,
    openGraph: {
      title: title,
      description: description,
      images: [community.bannerUrl || `https://placehold.co/1200x630.png`, ...previousImages],
    },
  };
}

export default async function CommunityDetailPage({ params }: CommunityPageProps) {
  const { communityId } = params;

  // We fetch initial data on the server
  const community = await getCommunityByIdFromFirestore(communityId);

  if (!community) {
    notFound();
  }

  const initialMembers = await getCommunityMembers(communityId);
  
  // Serialize the data before passing it to the client component
  const serializableCommunity = serializeObject(community) as Community;
  const serializableMembers = initialMembers.map(serializeObject);
  
  return (
    <CommunityPageClient
      initialCommunity={serializableCommunity}
      initialMembers={serializableMembers}
    />
  );
}
