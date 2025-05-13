
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { StatsCard } from "@/components/dashboard/StatsCard";
import type { StatItem } from "@/lib/types";
import { Users, Swords, Gamepad2, Activity, DollarSign, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Tooltip as RechartsTooltip } from "recharts";

// Placeholder admin stats
const platformAnalytics: StatItem[] = [
  { title: "Total Registered Users", value: "1,250", icon: Users },
  { title: "Total Tournaments Hosted", value: 85, icon: Swords },
  { title: "Total Matches Played", value: "3,420", icon: Gamepad2 },
  { title: "Daily Active Users (Avg)", value: 230, icon: Eye },
  // { title: "Total Revenue (Placeholder)", value: "$5,670", icon: DollarSign },
];

// Placeholder data for charts
const userGrowthData = [
  { date: "2024-01-01", users: 100 }, { date: "2024-02-01", users: 150 },
  { date: "2024-03-01", users: 220 }, { date: "2024-04-01", users: 310 },
  { date: "2024-05-01", users: 450 }, { date: "2024-06-01", users: 600 },
  { date: "2024-07-01", users: 800 }, { date: "2024-08-01", users: 1250 },
];

const tournamentActivityData = [
  { month: "Jan", created: 5, completed: 3 }, { month: "Feb", created: 7, completed: 5 },
  { month: "Mar", created: 10, completed: 8 }, { month: "Apr", created: 12, completed: 9 },
  { month: "May", created: 15, completed: 11 }, { month: "Jun", created: 18, completed: 14 },
];

const chartConfigUserGrowth = {
  users: { label: "Users", color: "hsl(var(--chart-1))" },
} satisfies import("@/components/ui/chart").ChartConfig;

const chartConfigTournamentActivity = {
  created: { label: "Created", color: "hsl(var(--chart-1))" },
  completed: { label: "Completed", color: "hsl(var(--chart-2))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Platform Analytics" subtitle="Key metrics and insights for TournamentHub." />

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"> {/* Adjusted to 3 for better spacing */}
          {platformAnalytics.map((stat) => (
            <StatsCard key={stat.title} item={stat} className="bg-card border-border"/>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Total registered users over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full p-0">
            <ChartContainer config={chartConfigUserGrowth} className="min-h-[300px] w-full">
              <LineChart accessibilityLayer data={userGrowthData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3"/>
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10}/>
                <ChartTooltip cursor={true} content={<ChartTooltipContent indicator="line" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} dot={true} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tournament Activity</CardTitle>
            <CardDescription>Number of tournaments created vs. completed per month.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] w-full p-0">
            <ChartContainer config={chartConfigTournamentActivity} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={tournamentActivityData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10}/>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="created" fill="var(--color-created)" radius={4} />
                <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for more detailed reports or tables */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Games</CardTitle>
          <CardDescription>Most frequently featured games in tournaments.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: Replace with a table or list of popular games */}
          <p className="text-muted-foreground">Data on popular games will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
