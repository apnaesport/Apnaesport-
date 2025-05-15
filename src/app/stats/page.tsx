
"use client"; 

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { StatsCard } from "@/components/dashboard/StatsCard"; 
import type { StatItem, Tournament } from "@/lib/types";
import { Activity, LogIn, Loader2, Swords, Trophy, Percent, Zap, ListChecks } from "lucide-react"; 
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
      const allTournaments = await getTournamentsFromFirestore();
      const joinedTournaments = allTournaments.filter(t => 
        t.participants.some(p => p.id === user.uid)
      );
      setParticipatedTournaments(joinedTournaments);

      let totalMatchesPlayed = 0;
      joinedTournaments.forEach(t => {
        totalMatchesPlayed += t.matches?.length || 0;
        if (t.bracketType === "Round Robin" && (!t.matches || t.matches.length === 0) && t.participants.length > 1) {
            totalMatchesPlayed += (t.participants.length * (t.participants.length - 1) / 2);
        }
      });
      
      const tournamentsWon = 0; 
      const winRate = "0%"; 
      const avgKDRatio = "N/A"; 

      setUserOverallStats([
        { title: "Tournaments Joined", value: joinedTournaments.length, icon: ListChecks },
        { title: "Total Matches Played (Est.)", value: totalMatchesPlayed, icon: Swords },
        { title: "Tournaments Won", value: tournamentsWon, icon: Trophy },
      ]);

    } catch (error) {
      console.error("Error fetching user stats:", error);
      toast({ title: "Error", description: "Could not load your statistics.", variant: "destructive" });
      setUserOverallStats([
        { title: "Tournaments Joined", value: 0, icon: ListChecks },
        { title: "Total Matches Played", value: 0, icon: Swords },
        { title: "Tournaments Won", value: 0, icon: Trophy },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) { // Only fetch if auth state is resolved
      fetchUserStats();
    }
  }, [authLoading, user, fetchUserStats]);


  if (authLoading || isLoading) {
     return (
      <MainLayout>
        <PageTitle title="My Statistics" />
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading your stats...</p>
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

  return (
    <MainLayout>
      <PageTitle title="My Statistics" subtitle={`Track your performance, ${user.displayName || 'Player'}!`} />

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Overall Performance</h2>
        {userOverallStats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userOverallStats.map((stat) => (
                <StatsCard key={stat.title} item={stat} />
            ))}
            </div>
        ) : (
            <p className="text-muted-foreground">No performance stats available yet.</p>
        )}
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" /> Monthly Performance Trend
            </CardTitle>
            <CardDescription>Your wins and losses over the past few months. (Illustrative Data)</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full p-0">
             <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={placeholderPerformanceData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="wins" fill="var(--color-wins)" radius={4} />
                <Bar dataKey="losses" fill="var(--color-losses)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Tournament History</CardTitle>
            <CardDescription>A summary of your participation in recent tournaments.</CardDescription>
          </CardHeader>
          <CardContent>
            {participatedTournaments.length > 0 ? (
                <ul className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {participatedTournaments.map(tournament => (
                    <li key={tournament.id} className="p-3 border rounded-md bg-card hover:bg-secondary/50">
                        <div className="flex justify-between items-center">
                            <Link href={`/tournaments/${tournament.id}`} className="font-semibold hover:underline">{tournament.name}</Link>
                            <Badge variant={tournament.status === "Completed" ? "secondary" : "outline"}>{tournament.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {tournament.gameName} - {format(new Date(tournament.startDate), "MMM dd, yyyy")}
                        </p>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-muted-foreground">You haven't participated in any tournaments yet.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </MainLayout>
  );
}
