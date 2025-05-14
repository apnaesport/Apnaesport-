
"use client"; 

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { StatsCard } from "@/components/dashboard/StatsCard"; 
import type { StatItem } from "@/lib/types";
import { Activity, LogIn } from "lucide-react"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts" 
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const placeholderUserOverallStats: StatItem[] = [
  { title: "Total Matches Played", value: 0, icon: "Swords" },
  { title: "Tournaments Won", value: 0, icon: "Trophy" },
  { title: "Win Rate", value: "0%", icon: "Percent" },
  { title: "Average K/D Ratio", value: "0.0", icon: "Zap" },
];

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
  const { user, loading } = useAuth();

  // Actual data fetching would happen here if user is logged in
  const userOverallStats = placeholderUserOverallStats; // Use placeholder or fetched data
  const performanceData = placeholderPerformanceData; // Use placeholder or fetched data


  if (loading) {
     return (
      <MainLayout>
        <PageTitle title="My Statistics" />
        <section className="mb-8">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-5 w-24"/></CardHeader><CardContent><Skeleton className="h-8 w-16"/></CardContent></Card>)}
          </div>
        </section>
        <section className="mb-8">
          <Card>
            <CardHeader><Skeleton className="h-6 w-56" /></CardHeader>
            <CardContent className="h-[350px] w-full p-0"><Skeleton className="h-full w-full"/></CardContent>
          </Card>
        </section>
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
      <PageTitle title="My Statistics" subtitle="Track your performance and achievements on Apna Esport." />

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Overall Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {userOverallStats.map((stat) => (
            <StatsCard key={stat.title} item={stat} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" /> Monthly Performance Trend
            </CardTitle>
            <CardDescription>Your wins and losses over the past few months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full p-0">
             <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={performanceData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
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
            <p className="text-muted-foreground">Your tournament history will be displayed here. (Example data)</p>
            <ul className="mt-4 space-y-3">
              <li className="p-3 border rounded-md bg-card hover:bg-secondary/50">
                <h4 className="font-semibold">LoL Summer Skirmish - <span className="text-green-400">1st Place</span></h4>
                <p className="text-xs text-muted-foreground">June 15, 2024 - League of Legends</p>
              </li>
               <li className="p-3 border rounded-md bg-card hover:bg-secondary/50">
                <h4 className="font-semibold">Valorant Weekly Clash #10 - Top 8</h4>
                <p className="text-xs text-muted-foreground">June 10, 2024 - Valorant</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </MainLayout>
  );
}
