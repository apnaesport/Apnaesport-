
"use client";

import { useState, useMemo, Suspense } from "react";
import type { Tournament } from "@/lib/types";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useRouter } from "next/navigation";


interface TournamentsPageClientProps {
    allTournaments: Tournament[];
}

function TournamentsPageContent({ allTournaments }: TournamentsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const { settings } = useSiteSettings();
  const adFrequency = settings?.adFrequencyInLists || 0;
  
  // Default to 'all', but allow URL to override the active tab
  const activeTab = searchParams.get('status') || 'all';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', value);
    router.push(`?${params.toString()}`, { scroll: false });
  };


  const filteredTournaments = useMemo(() => {
    let tournaments = allTournaments;
    
    // 1. Filter by search term
    if (searchTerm) {
      tournaments = tournaments.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.gameName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 2. Filter by status tab
    if (activeTab !== 'all') {
      const liveStatuses: Tournament['status'][] = ["Live", "Ongoing"];
      if (activeTab === 'live') {
        tournaments = tournaments.filter(tournament => liveStatuses.includes(tournament.status));
      } else {
        tournaments = tournaments.filter(tournament => tournament.status.toLowerCase() === activeTab);
      }
    }

    // Sort by start date, most recent first
    return tournaments.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
  }, [searchTerm, activeTab, allTournaments]);
  
  const itemsWithAds = useMemo(() => {
    if (!adFrequency || adFrequency <= 0) return filteredTournaments;

    const newItems: (Tournament | { isAd: true })[] = [];
    if (filteredTournaments.length > 0) newItems.push({ isAd: true });
    
    filteredTournaments.forEach((item, index) => {
      newItems.push(item);
      if ((index + 1) % adFrequency === 0 && index < filteredTournaments.length -1) {
        newItems.push({ isAd: true });
      }
    });
    return newItems;
  }, [filteredTournaments, adFrequency]);

  const upcomingCount = allTournaments.filter(t => t.status === "Upcoming").length;
  const liveCount = allTournaments.filter(t => t.status === "Live" || t.status === "Ongoing").length;
  const completedCount = allTournaments.filter(t => t.status === "Completed").length;


  return (
    <>
      <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search tournaments by name or game..."
            className="pl-10 max-w-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingCount})</TabsTrigger>
          <TabsTrigger value="live">Live ({liveCount})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
           {itemsWithAds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsWithAds.map((item, index) => {
                if ('isAd' in item) {
                    return (
                      <div key={`ad-${index}`} className="flex items-center justify-center">
                        <AdsterraBlock format="square" className="h-full min-h-[300px] w-full" />
                      </div>
                    );
                }
                return <TournamentCard key={item.id} tournament={item} />;
              })}
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">No Tournaments Found</h3>
                <p className="text-muted-foreground mt-2">
                    No tournaments match your current filter. Please select another category.
                </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}

// Wrap the client component in Suspense to handle searchParams usage
export default function TournamentsPageClient(props: TournamentsPageClientProps) {
    return (
        <Suspense fallback={<div><Skeleton className="h-10 w-full max-w-lg mb-6" /><Skeleton className="h-10 w-96 mb-6" /><Skeleton className="h-80 w-full" /></div>}>
            <TournamentsPageContent {...props} />
        </Suspense>
    );
}

