
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { useTournaments } from "@/lib/hooks";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LogIn, PlusCircle, Swords } from "lucide-react";
import { useMemo } from "react";

export default function MyTournamentsPage() {
    const { user, loading: authLoading } = useAuth();

    // Fetch all tournaments, then filter on the client
    const { data: allTournaments = [], isLoading: tournamentsLoading } = useTournaments();

    const myTournaments = useMemo(() => {
        if (!user) return [];
        return allTournaments.filter(t => t.organizerId === user.uid)
            .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
    }, [allTournaments, user]);

    const isLoading = authLoading || tournamentsLoading;

    if (isLoading) {
        return (
            <div className="space-y-8">
                <PageTitle title="My Tournaments" subtitle="Loading your created tournaments..." />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-96 w-full" />
                    ))}
                </div>
            </div>
        );
    }
    
    if (!user) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
                <PageTitle title="Access Denied" subtitle="You need to be logged in to manage your tournaments." />
                <LogIn className="h-16 w-16 text-primary my-6" />
                <Button asChild size="lg">
                    <Link href="/auth/login?redirect=/my-tournaments">Login to View</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageTitle
                title="My Tournaments"
                subtitle="Here are all the tournaments you have created."
                 actions={
                    <Button asChild>
                        <Link href="/tournaments/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New Tournament
                        </Link>
                    </Button>
                }
            />

            {myTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myTournaments.map(tournament => (
                        <TournamentCard key={tournament.id} tournament={tournament} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Swords className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-xl font-semibold">No Tournaments Created</h3>
                    <p className="mt-1 text-muted-foreground">You haven't created any tournaments yet. Let's get started!</p>
                     <Button asChild className="mt-4">
                        <Link href="/tournaments/new">
                            <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Tournament
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
