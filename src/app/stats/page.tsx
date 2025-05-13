
"use client"; // This page might involve fetching user-specific data and displaying charts

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { StatsCard } from "@/components/dashboard/StatsCard"; // Reusing StatsCard
import type { StatItem } from "@/lib/types";
import { BarChart3, Trophy, Percent, Zap, Activity, Swords } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Charting libraries would be imported here if used
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"


// Placeholder user stats - replace with actual data
const userOverallStats: StatItem[] = [
  { title: "Total Matches Played", value: 152, icon: Swords },
  { title: "Tournaments Won", value: 7, icon: Trophy },
  { title: "Win Rate", value: "63%", icon: Percent },
  { title: "Average K/D Ratio", value: "1.85", icon: Zap },
];

// Placeholder data for a chart
const performanceData = [
  { month: "Jan", wins: 4, losses: 2 },
  { month: "Feb", wins: 6, losses: 3 },
  { month: "Mar", wins: 5, losses: 1 },
  { month: "Apr", wins: 8, losses: 4 },
  { month: "May", wins: 7, losses: 2 },
  { month: "Jun", wins: 9, losses: 3 },
];

const chartConfig = {
  wins: {
    label: "Wins",
    color: "hsl(var(--chart-1))",
  },
  losses: {
    label: "Losses",
    color: "hsl(var(--chart-2))",
  },
} satisfies import("@/components/ui/chart").ChartConfig


export default function StatsPage() {
  return (
    <MainLayout>
      <PageTitle title="My Statistics" subtitle="Track your performance and achievements on TournamentHub." />

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
            {/* Placeholder for tournament history list or table */}
            <p className="text-muted-foreground">Your tournament history will be displayed here.</p>
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
