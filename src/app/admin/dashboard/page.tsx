
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { StatsCard } from "@/components/dashboard/StatsCard";
import type { StatItem, Game, Tournament, UserProfile } from "@/lib/types";
import { Users, Swords, Gamepad2, Bell, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getGamesFromFirestore, getTournamentsFromFirestore, getAllUsersFromFirestore, getSiteSettingsFromFirestore } from "@/lib/tournamentStore";
import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const quickActions = [
    {label: "Create Tournament", href: "/tournaments/new", icon: PlusCircle},
    {label: "Manage Users", href: "/admin/users", icon: Users},
    {label: "Add New Game", href: "/admin/games", icon: Gamepad2},
    {label: "Send Notification", href: "/admin/notifications", icon: Bell},
];

export default function AdminDashboardPage() {
  const [currentGames, setCurrentGames] = useState<Game[]>([]);
  const [currentTournaments, setCurrentTournaments] = useState<Tournament[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [games, tournaments, users, siteSettings] = await Promise.all([
        getGamesFromFirestore(),
        getTournamentsFromFirestore(),
        getAllUsersFromFirestore(),
        getSiteSettingsFromFirestore()
      ]);
      setCurrentGames(games);
      setCurrentTournaments(tournaments);
      setAllUsers(users);
      setSettings(siteSettings);
    } catch (error) {
        console.error("Failed to fetch admin dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageTitle title="Admin Dashboard" subtitle="Oversee and manage Apna Esport." />
        <section>
          <Skeleton className="h-8 w-1/4 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </section>
      </div>
    );
  }

  const activeTournaments = currentTournaments.filter(t => t.status === "Live" || t.status === "Ongoing" || t.status === "Upcoming").length;
  
  const basePlayerCount = settings?.basePlayerCount || 0;
  const totalUsers = allUsers.length + basePlayerCount;
  const placeholderPendingApprovals = 3;

  const adminStats: StatItem[] = [
    { title: "Total Users", value: totalUsers.toLocaleString(), icon: "Users" }, 
    { title: "Active Tournaments", value: activeTournaments, icon: "Swords", change: `${currentTournaments.filter(t => t.status === "Live").length} live` }, 
    { title: "Supported Games", value: currentGames.length, icon: "Gamepad2" }, 
    { title: "Pending Approvals", value: placeholderPendingApprovals, icon: "Bell", change: "Action needed" }, 
  ];

  return (
    <div className="space-y-8">
      <PageTitle title="Admin Dashboard" subtitle="Oversee and manage Apna Esport." />

      <section>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Platform Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminStats.map((stat) => (
            <StatsCard key={stat.title} item={stat} className="bg-card border-border"/>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map(action => (
                 <Card key={action.href} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <action.icon className="h-10 w-10 text-primary mb-3"/>
                        <h3 className="font-semibold mb-2">{action.label}</h3>
                        <Button asChild variant="outline" size="sm">
                            <Link href={action.href}>Go</Link>
                        </Button>
                    </CardContent>
                 </Card>
            ))}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent user registrations, tournament creations, etc. (Placeholder)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Recent activity feed will be displayed here. (Placeholder)</p>
            <ul className="mt-4 space-y-2">
                <li className="text-sm p-2 border-b">New user 'PlayerX' registered.</li>
                <li className="text-sm p-2 border-b">Tournament 'Summer Showdown' created.</li>
                <li className="text-sm p-2">Match result updated for 'Weekly Clash #12'.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
