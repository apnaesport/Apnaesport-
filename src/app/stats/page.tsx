
"use client"; 

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { StatsCard } from "@/components/dashboard/StatsCard"; 
import type { StatItem, Tournament } from "@/lib/types";
import { Activity, LogIn, Loader2, Swords, Trophy, Percent, Zap, ListChecks, Lock } from "lucide-react"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts" 
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useCallback } from "react";
import { getTournamentsFromFirestore } from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const placeholderPerformanceData = [
  { month: "Jan", wins: 0, losses: 0 }, { month: "Feb", wins: 0, losses: 0 },
  { month: "Mar", wins: 0, losses: 0 }, { month: "Apr", wins: 0, losses: 0 },
  { month: "May", wins: 0, losses: 0 }, { month: "Jun", wins: 0, losses: 0 },
];

const chartConfig = {
  wins: { label: "Wins", color: "hsl(var(--chart-1))" },
  losses: { label: "Losses", color: "hsl(var(--chart-2))" },
} satisfies import("@/components/ui/chart").ChartConfig


export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userOverallStats, setUserOverallStats] = useState<StatItem[]>([]);
  const [participatedTournaments, setParticipatedTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserStats = useCallback(async () => {
    if (!user) {
      setIsLoading(false); // Ensure loading is false if no user
      return;
    }
    setIsLoading(true);
    try {
      // Simulating no data fetch as feature is locked
      // const allTournaments = await getTournamentsFromFirestore();
      // const joinedTournaments = allTournaments.filter(t => 
      //   t.participants.some(p => p.id === user.uid)
      // );
      // setParticipatedTournaments(joinedTournaments);

      // let totalMatchesPlayed = 0;
      // joinedTournaments.forEach(t => {
      //   totalMatchesPlayed += t.matches?.length || 0;
      //   if (t.bracketType === "Round Robin" && (!t.matches || t.matches.length === 0) && t.participants.length > 1) {
      //       totalMatchesPlayed += (t.participants.length * (t.participants.length - 1) / 2);
      //   }
      // });
      
      // const tournamentsWon = 0; 
      // const winRate = "0%"; 
      // const avgKDRatio = "N/A"; 

      // setUserOverallStats([
      //   { title: "Tournaments Joined", value: joinedTournaments.length, icon: ListChecks },
      //   { title: "Total Matches Played (Est.)", value: totalMatchesPlayed, icon: Swords },
      //   { title: "Tournaments Won", value: tournamentsWon, icon: Trophy },
      // ]);
      setUserOverallStats([]);
      setParticipatedTournaments([]);

    } catch (error) {
      console.error("Error fetching user stats (locked feature):", error);
      // toast({ title: "Error", description: "Could not load your statistics.", variant: "destructive" });
      setUserOverallStats([]);
      setParticipatedTournaments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) { 
      fetchUserStats();
    }
  }, [authLoading, user, fetchUserStats]);


  if (authLoading) { // Only show generic loader if auth is still loading
     return (
      <MainLayout>
        <PageTitle title="My Statistics" />
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading...</p>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <PageTitle title="Access Denied" subtitle="You need to be logged in to view your statistics." />
          <LogIn className="h-16 w-16 text-primary my-6" />
          <Button asChild size="lg">
            <Link href="/auth/login?redirect=/stats">Login to View Stats</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Feature Locked View
  return (
    <MainLayout>
      <PageTitle title="My Statistics" />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] text-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Lock className="mr-2 h-7 w-7 text-primary" />
              Feature Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The Statistics page is temporarily unavailable.
              <br />
              Please check back later!
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
