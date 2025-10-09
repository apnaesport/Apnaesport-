
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback }from "react";
import { getUserAchievements } from "@/lib/tournamentStore";
import type { Achievement } from "@/lib/types";
import { Loader2, LogIn, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageTitle } from "@/components/shared/PageTitle";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AchievementsClient() {
    const { user, loading: authLoading } = useAuth();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

    const fetchAchievements = useCallback(async (uid: string) => {
        setIsLoading(true);
        try {
            const userAchievements = await getUserAchievements(uid);
            setAchievements(userAchievements);
        } catch (error) {
            console.error("Failed to fetch achievements", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if(user && !authLoading) {
            fetchAchievements(user.uid);
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchAchievements]);


    if(isLoading || authLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="aspect-[1.5/1] bg-muted rounded-2xl animate-pulse" />
                ))}
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
                <PageTitle title="Access Denied" subtitle="You must be logged in to view your achievements." />
                <LogIn className="h-16 w-16 text-primary my-6" />
                <Button asChild size="lg">
                    <Link href="/auth/login?redirect=/achievements">Login to View</Link>
                </Button>
            </div>
        );
    }
    
    if (achievements.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center p-4 border-2 border-dashed rounded-lg">
                <Award className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Your Trophy Case is Empty</h3>
                <p className="text-muted-foreground mt-2 max-w-md">Compete in tournaments and win to earn exclusive achievement cards and showcase your skill.</p>
                <Button asChild className="mt-6">
                    <Link href="/tournaments">Find a Tournament</Link>
                </Button>
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {achievements.map((ach) => (
                     <div key={ach.id} className="cursor-pointer" onClick={() => setSelectedAchievement(ach)}>
                        <AchievementCard 
                            player={{ name: ach.playerName, tag: ach.playerTag, avatar: ach.playerAvatar }}
                            team={{ name: ach.teamName, logo: ach.teamLogo }}
                            tournament={{ name: ach.tournamentName, date: new Date(ach.tournamentDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric'}) }}
                            rank={ach.rank}
                            rarity={ach.rarity}
                            isStatic
                        />
                    </div>
                ))}
            </div>

            <Dialog open={!!selectedAchievement} onOpenChange={(open) => !open && setSelectedAchievement(null)}>
                <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none">
                     {selectedAchievement && (
                        <AchievementCard 
                            player={{ name: selectedAchievement.playerName, tag: selectedAchievement.playerTag, avatar: selectedAchievement.playerAvatar }}
                            team={{ name: selectedAchievement.teamName, logo: selectedAchievement.teamLogo }}
                            tournament={{ name: selectedAchievement.tournamentName, date: new Date(selectedAchievement.tournamentDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric'}) }}
                            rank={selectedAchievement.rank}
                            rarity={selectedAchievement.rarity}
                        />
                     )}
                </DialogContent>
            </Dialog>
        </>
    )
}
