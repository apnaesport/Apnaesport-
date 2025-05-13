
import { PageTitle } from "@/components/shared/PageTitle";
import { StatsCard } from "@/components/dashboard/StatsCard"; // Reusing StatsCard
import type { StatItem } from "@/lib/types";
import { Users, Swords, Gamepad2, Bell, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Placeholder admin stats - replace with actual data
const adminStats: StatItem[] = [
  { title: "Total Users", value: "1,250", icon: Users, change: "+20 this week" },
  { title: "Active Tournaments", value: 15, icon: Swords, change: "+3" },
  { title: "Supported Games", value: 8, icon: Gamepad2 },
  { title: "Pending Approvals", value: 3, icon: Bell, change: "Action needed" },
];

const quickActions = [
    {label: "Create Tournament", href: "/admin/tournaments/new", icon: PlusCircle},
    {label: "Manage Users", href: "/admin/users", icon: Users},
    {label: "Add New Game", href: "/admin/games", icon: Gamepad2},
    {label: "Send Notification", href: "/admin/notifications", icon: Bell},
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Admin Dashboard" subtitle="Oversee and manage TournamentHub." />

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
            <CardDescription>Overview of recent user registrations, tournament creations, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent activity feed */}
            <p className="text-muted-foreground">Recent activity feed will be displayed here.</p>
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
