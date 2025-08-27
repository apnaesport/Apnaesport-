
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
import { format } from "date-fns";


interface TournamentsPageClientProps {
    allTournaments: Tournament[];
}

function TournamentsPageContent({ allTournaments }: TournamentsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const { settings } = useSiteSettings();
  const adFrequency = settings?.adFrequencyInLists || 0;
  
  // Default to 'upcoming', but allow URL to override the active tab
  const activeTab = searchParams.get('status') || 'upcoming';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') {
        params.delete('status');
    } else {
        params.set('status', value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };
  
  const getFilteredAndSortedTournaments = (status?: Tournament['status']) => {
    let tournaments = allTournaments;
    
    // 1. Filter by search term
    if (searchTerm) {
      tournaments = tournaments.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.gameName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 2. Filter by status if a specific tab is selected
    if (status) {
        const liveStatuses: Tournament['status'][] = ["Live", "Ongoing"];
        if (status === 'live') {
            tournaments = tournaments.filter(tournament => liveStatuses.includes(tournament.status));
        } else {
            tournaments = tournaments.filter(tournament => tournament.status.toLowerCase() === status.toLowerCase());
        }
    }
    
    return tournaments;
  }

  const renderTournamentList = (tournaments: Tournament[]) => {
      const itemsWithAds = useMemo(() => {
        if (!adFrequency || adFrequency <= 0) return tournaments;

        const newItems: (Tournament | { isAd: true })[] = [];
        if (tournaments.length > 0) newItems.push({ isAd: true });
        
        tournaments.forEach((item, index) => {
          newItems.push(item);
          if ((index + 1) % adFrequency === 0 && index < tournaments.length -1) {
            newItems.push({ isAd: true });
          }
        });
        return newItems;
      }, [tournaments, adFrequency]);

      if (itemsWithAds.length === 0 || (itemsWithAds.length === 1 && 'isAd' in itemsWithAds[0])) {
          return (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">No Tournaments Found</h3>
                <p className="text-muted-foreground mt-2">
                    No tournaments match your current filter. Please select another category.
                </p>
            </div>
          );
      }
      
      return (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsWithAds.map((item, index) => {
                if ('isAd' in item) {
                    return (
                      <div key={`ad-${index}`} className="flex items-center justify-center">
                        <AdsterraBlock format="square" className="h-full min-h-[300px] w-full" />
                      </div>
                    );
                }
                const formattedDate = item.startDate ? format(new Date(item.startDate), "MMM dd, yyyy 'at' p") : "Date TBD";
                return <TournamentCard key={item.id} tournament={item} formattedStartDate={formattedDate} />;
              })}
            </div>
      )
  }

  const upcomingTournaments = useMemo(() => getFilteredAndSortedTournaments('Upcoming'), [allTournaments, searchTerm]);
  const liveTournaments = useMemo(() => getFilteredAndSortedTournaments('live'), [allTournaments, searchTerm]);
  const completedTournaments = useMemo(() => getFilteredAndSortedTournaments('Completed'), [allTournaments, searchTerm]);
  const allFilteredTournaments = useMemo(() => getFilteredAndSortedTournaments(), [allTournaments, searchTerm]);


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
          <TabsTrigger value="upcoming">Upcoming ({upcomingTournaments.length})</TabsTrigger>
          <TabsTrigger value="live">Live ({liveTournaments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTournaments.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">{renderTournamentList(allFilteredTournaments)}</TabsContent>
        <TabsContent value="upcoming" className="mt-6">{renderTournamentList(upcomingTournaments)}</TabsContent>
        <TabsContent value="live" className="mt-6">{renderTournamentList(liveTournaments)}</TabsContent>
        <TabsContent value="completed" className="mt-6">{renderTournamentList(completedTournaments)}</TabsContent>
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
