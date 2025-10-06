
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { FeaturedTournamentCard } from "@/components/dashboard/FeaturedTournamentCard";
import { LiveTournamentCard } from "@/components/dashboard/LiveTournamentCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GamesListHorizontal } from "@/components/games/GamesListHorizontal";
import type { Tournament, Game, StatItem, UserProfile, UnseenWin } from "@/lib/types";
import { Heart, Megaphone, Coins, Gift, Trophy, Crown, Swords } from "lucide-react";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { AdsterraBlock } from '@/components/ads/AdsterraBlock';
import { isDailyBonusAvailable, getUnseenWinsFromFirestore, clearUnseenWinsFromFirestore, updateUserProfileInFirestore } from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";


interface DashboardPageClientProps {
    stats: StatItem[];
    featuredTournament?: Tournament;
    liveTournaments: Tournament[];
    allGames: Game[];
    allTournaments: Tournament[];
    recentWinners?: Tournament | null;
}

const DailyBonusCard = ({ bonusAvailable }: { bonusAvailable: boolean }) => {
    if (!bonusAvailable) {
        return null;
    }

    return (
        <Card className="bg-gradient-to-tr from-green-500 to-emerald-600 text-white shadow-lg overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Gift className="h-6 w-6"/>
                    Daily Bonus Ready!
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm opacity-90 mb-4">You have a daily bonus waiting for you.</p>
                <Button asChild className="w-full bg-white text-emerald-700 hover:bg-white/90">
                    <Link href="/rewards">Claim Now</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

const WelcomePremiumDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { width, height } = useWindowSize();
    
    return (
        <>
            <Confetti width={width} height={height} recycle={false} numberOfPieces={open ? 400 : 0} />
            <AlertDialog open={open} onOpenChange={onOpenChange}>
                <AlertDialogContent className="text-center">
                    <AlertDialogHeader>
                        <Crown className="h-16 w-16 mx-auto text-amber-400" />
                        <AlertDialogTitle className="text-3xl font-bold">Welcome to Premium!</AlertDialogTitle>
                        <AlertDialogDescription className="text-lg">
                           You've unlocked exclusive benefits, including a <strong className="text-primary">200 AE Point bonus!</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                     <div className="py-4">
                        <p className="text-muted-foreground">Thank you for being a valued member of our community.</p>
                    </div>
                    <AlertDialogFooter className="sm:justify-center">
                        <AlertDialogAction onClick={() => onOpenChange(false)}>Awesome!</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};


const WinnerShowcaseDialog = ({ win, open, onOpenChange }: { win: UnseenWin; open: boolean; onOpenChange: (open: boolean) => void; }) => {
    const { width, height } = useWindowSize();
    
    if (!win) return null;

    const rankText = win.rank === 1 ? '1st' : win.rank === 2 ? '2nd' : '3rd';

    return (
        <>
            <Confetti width={width} height={height} recycle={false} numberOfPieces={open ? 400 : 0} />
            <AlertDialog open={open} onOpenChange={onOpenChange}>
                <AlertDialogContent className="text-center">
                    <AlertDialogHeader>
                        <Trophy className="h-16 w-16 mx-auto text-yellow-400" />
                        <AlertDialogTitle className="text-3xl font-bold">Congratulations!</AlertDialogTitle>
                        <AlertDialogDescription className="text-lg">
                            You placed <strong className="text-primary">{rankText}</strong> in the <strong className="text-foreground">{win.tournamentName}</strong> tournament!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {win.prize > 0 && (
                        <div className="py-4">
                            <p className="text-muted-foreground">You have been awarded:</p>
                            <p className="text-4xl font-bold text-yellow-500 flex items-center justify-center gap-2">
                                {win.prize} <Coins className="h-8 w-8" />
                            </p>
                        </div>
                    )}
                    <AlertDialogFooter className="sm:justify-center">
                        <AlertDialogAction onClick={() => onOpenChange(false)}>Awesome!</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default function DashboardPageClient({ stats: initialStats, featuredTournament, liveTournaments, allGames, allTournaments, recentWinners }: DashboardPageClientProps) {
    const { user, refreshUser } = useAuth();
    const { settings, loadingSettings } = useSiteSettings();
    const [bonusAvailable, setBonusAvailable] = useState(false);
    const [unseenWin, setUnseenWin] = useState<UnseenWin | null>(null);
    const [showWinnerShowcase, setShowWinnerShowcase] = useState(false);
    const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);


    const adFrequency = settings?.adFrequencyInLists || 0;

    useEffect(() => {
        const checkFeatures = async () => {
            if (user) {
                const available = await isDailyBonusAvailable(user.uid);
                setBonusAvailable(available);

                const wins = await getUnseenWinsFromFirestore(user.uid);
                if (wins.length > 0) {
                    setUnseenWin(wins[0]); // Show the first one
                    setShowWinnerShowcase(true);
                }

                if(user.isPremium && user.hasSeenPremiumPopup === false) {
                    setShowPremiumWelcome(true);
                }
            }
        };
        checkFeatures();
    }, [user]);
    
    const handleWinnerShowcaseClose = async (open: boolean) => {
        if (!open && user && unseenWin) {
            await clearUnseenWinsFromFirestore(user.uid, unseenWin.id);
        }
        setShowWinnerShowcase(open);
    }
    
    const handlePremiumWelcomeClose = async (open: boolean) => {
        if (!open && user) {
            await updateUserProfileInFirestore(user.uid, { hasSeenPremiumPopup: true });
        }
        setShowPremiumWelcome(open);
    }

    const stats = useMemo(() => {
        const userRankStat: StatItem = { 
            title: "Your AE Points", 
            value: user?.points ?? 0,
            icon: "Coins", 
            change: `Your Rank: N/A`
        };
        return [...initialStats, userRankStat];
    }, [initialStats, user]);
    
    const joinedTournaments = useMemo(() => {
        if (!user) return [];
        return allTournaments.filter(t => t.participants.some(p => p.id === user.uid) && (t.status === 'Upcoming' || t.status === 'Live' || t.status === 'Ongoing'));
    }, [allTournaments, user]);
    
    const recommendedTournaments: Tournament[] = [];

    const liveTournamentsWithAds = useMemo(() => {
        if (!adFrequency || adFrequency <= 0) return liveTournaments;

        const newItems: (Tournament | { isAd: true })[] = [];
        liveTournaments.forEach((item, index) => {
            newItems.push(item);
            if ((index + 1) % adFrequency === 0) {
                newItems.push({ isAd: true });
            }
        });
        return newItems;
    }, [liveTournaments, adFrequency]);

    return (
        <div className="space-y-8">
            {unseenWin && <WinnerShowcaseDialog win={unseenWin} open={showWinnerShowcase} onOpenChange={handleWinnerShowcaseClose} />}
            {showPremiumWelcome && <WelcomePremiumDialog open={showPremiumWelcome} onOpenChange={handlePremiumWelcomeClose} />}


            <PageTitle title="Dashboard" subtitle="Welcome back to Apna Esport!" />
            
            <section className="flex justify-center">
                <AdsterraBlock format="leaderboard" key="dashboard-leaderboard-top" />
            </section>
            
            {featuredTournament && (
                <section>
                    <FeaturedTournamentCard tournament={featuredTournament} />
                </section>
            )}

            {recentWinners && (
                 <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center">
                        <Trophy className="mr-2 h-6 w-6 text-yellow-400 fill-yellow-400" />
                        Latest Results
                    </h2>
                     <Card className="overflow-hidden shadow-lg border-yellow-400/30">
                        <CardHeader>
                            <CardTitle>Winners of: {recentWinners.name}</CardTitle>
                            <CardDescription>Congratulations to the champions!</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {recentWinners.winners?.map((winner) => (
                                <div key={winner.rank} className={cn("p-4 rounded-lg flex items-center gap-4 border", 
                                    winner.rank === 1 && "bg-yellow-400/10 border-yellow-400/50",
                                    winner.rank === 2 && "bg-slate-400/10 border-slate-400/50",
                                    winner.rank === 3 && "bg-orange-500/10 border-orange-500/50",
                                )}>
                                    <h3 className="text-4xl font-bold text-muted-foreground">#{winner.rank}</h3>
                                    <Avatar>
                                        <AvatarImage src={winner.participant.avatarUrl} alt={winner.participant.name} />
                                        <AvatarFallback>{winner.participant.name.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold truncate">{winner.participant.name}</p>
                                        <p className="text-sm text-yellow-500 font-medium flex items-center gap-1">{winner.prize} <Coins className="h-4 w-4" /></p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>
            )}
            
            {joinedTournaments.length > 0 && (
                <section>
                    <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center gap-2">
                        <Swords className="h-6 w-6 text-primary"/>
                        My Active Tournaments
                    </h2>
                    <ScrollArea>
                        <div className="flex space-x-4 pb-4">
                            {joinedTournaments.map(t => (
                                <div key={t.id} className="w-80 shrink-0">
                                    <TournamentCard tournament={t} />
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </section>
            )}

            <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">Stats Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <DailyBonusCard bonusAvailable={bonusAvailable} />
                {stats.map((stat) => (
                    <StatsCard key={stat.title} item={stat} />
                ))}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">Live Now</h2>
                {liveTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {liveTournamentsWithAds.map((item, index) => {
                        if ('isAd' in item) {
                             return <AdsterraBlock key={`live-ad-${index}`} format="square" className="h-full min-h-[300px]" />;
                        }
                        return <LiveTournamentCard key={item.id} tournament={item} />;
                    })}
                </div>
                ) : (
                <p className="text-muted-foreground">No tournaments are live right now. Check back soon!</p>
                )}
            </section>

            <section>
                <GamesListHorizontal games={allGames} />
            </section>
        </div>
    );
}
