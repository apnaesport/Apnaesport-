

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile, ProTier } from '@/lib/types';
import { listenToTopPlayersByProPoints, getAllUsersFromFirestore } from '@/lib/tournamentStore';
import { Trophy, Crown, Loader2, Info, UserCheck, BarChart2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ProBoardClientProps {
    initialPlayers: (UserProfile & { kda: string })[];
}

const getInitials = (name?: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

const tierConfig: Record<ProTier, { name: string, points: number, color: string, nextTierPoints?: number }> = {
    "Bronze": { name: "Bronze Player", points: 0, color: "text-orange-400", nextTierPoints: 100 },
    "Silver": { name: "Silver Striker", points: 100, color: "text-slate-400", nextTierPoints: 300 },
    "Gold": { name: "Gold Warrior", points: 300, color: "text-yellow-400", nextTierPoints: 600 },
    "Diamond": { name: "Diamond Slayer", points: 600, color: "text-cyan-400", nextTierPoints: 1000 },
    "Legend": { name: "The Untouchable", points: 1000, color: "text-purple-400" },
};

const tierOrder: ProTier[] = ["Bronze", "Silver", "Gold", "Diamond", "Legend"];

// Helper function to determine Pro Tier based on points
const getProTier = (points: number): ProTier => {
    if (points >= 1000) return "Legend";
    if (points >= 600) return "Diamond";
    if (points >= 300) return "Gold";
    if (points >= 100) return "Silver";
    return "Bronze";
};


const MyRankCard = () => {
    const { user, loading } = useAuth();
    const [allPlayers, setAllPlayers] = useState<UserProfile[]>([]);
    const [isLoadingRank, setIsLoadingRank] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setIsLoadingRank(true);
            const players = await getAllUsersFromFirestore();
            players.sort((a, b) => (b.proPoints || 0) - (a.proPoints || 0));
            setAllPlayers(players);
            setIsLoadingRank(false);
        }
        fetchAll();
    }, []);

    if (loading || isLoadingRank || !user) {
        return <Skeleton className="h-40 w-full mb-8" />;
    }

    const myRank = allPlayers.findIndex(p => p.uid === user.uid) + 1;
    const myProPoints = user.proPoints || 0;
    const myProTier = getProTier(myProPoints);
    const tierInfo = tierConfig[myProTier];
    const nextTier = tierOrder[tierOrder.indexOf(myProTier) + 1];
    const nextTierInfo = nextTier ? tierConfig[nextTier] : null;

    const progress = nextTierInfo
        ? ((myProPoints - tierInfo.points) / (nextTierInfo.points - tierInfo.points)) * 100
        : 100;
        
    const isTierComplete = nextTierInfo && myProPoints >= nextTierInfo.points;
    const isMaxLevel = myProTier === 'Legend';

    return (
        <Card className="mb-8 border-2 border-primary/30 shadow-lg shadow-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-6 w-6 text-primary" /> My Pro Status
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="flex flex-col items-center text-center">
                    <p className="text-sm text-muted-foreground">Your Rank</p>
                    <p className="text-5xl font-bold text-primary">{myRank > 0 ? `#${myRank}` : 'Unranked'}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <p className="text-sm text-muted-foreground">Your Points</p>
                    <p className="text-5xl font-bold">{myProPoints}</p>
                    <p className="text-sm text-muted-foreground">Pro Points</p>
                </div>
                <div className="space-y-2">
                     <div className="flex justify-between items-baseline">
                        <p className={cn("font-bold text-lg", tierInfo.color)}>{tierInfo.name}</p>
                        {!isMaxLevel && nextTierInfo && <p className="text-xs text-muted-foreground">Next: {nextTierInfo.name}</p>}
                    </div>
                    {isMaxLevel ? (
                        <div className="flex items-center justify-center gap-2 h-3 text-center bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold text-xs shadow-lg">
                           MAX LEVEL <Trophy className="h-3 w-3"/>
                        </div>
                    ) : isTierComplete ? (
                        <div className="flex items-center justify-center gap-2 h-3 text-center bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white font-bold text-xs shadow-lg">
                           TIER UNLOCKED! <CheckCircle className="h-3 w-3"/>
                        </div>
                    ) : (
                        <Progress value={progress} className="h-3" />
                    )}
                    {!isMaxLevel && !isTierComplete && nextTierInfo && (
                        <p className="text-xs text-muted-foreground text-right">
                            {nextTierInfo.points - myProPoints} points to next tier
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function ProBoardClient({ initialPlayers }: ProBoardClientProps) {
    const [players, setPlayers] = useState(initialPlayers);
    const [loading, setLoading] = useState(initialPlayers.length === 0);

    const fetchPlayers = useCallback(() => {
        setLoading(true);
        const unsubscribe = listenToTopPlayersByProPoints(50, (updatedPlayers) => {
            setPlayers(updatedPlayers);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = fetchPlayers();
        return () => unsubscribe();
    }, [fetchPlayers]);
    
    const getRankClass = (rank: number) => {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return 'default';
    };

    return (
        <div className="container mx-auto max-w-4xl relative" role="region" aria-label="Apna Esport Pro Board">
            <style jsx>{`
                .pro-board-bg {
                    background: 
                        radial-gradient(ellipse 800px 600px at -100% 0%, rgba(124, 58, 237, 0.1), transparent),
                        radial-gradient(ellipse 600px 400px at 120% 100%, rgba(0, 212, 255, 0.08), transparent),
                        radial-gradient(ellipse 1200px 800px at 50% 50%, rgba(15, 21, 40, 0.6), transparent),
                        var(--bg-secondary);
                }
                .rank-badge.gold { background: linear-gradient(135deg, #ffd700, #ffed4e, #ffc107); color: #1a1a1a; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3); text-shadow: 0 1px 1px rgba(0,0,0,0.1); }
                .rank-badge.silver { background: linear-gradient(135deg, #e5e7eb, #f3f4f6, #d1d5db); color: #1a1a1a; box-shadow: 0 4px 15px rgba(229, 231, 235, 0.3); text-shadow: 0 1px 1px rgba(255,255,255,0.2); }
                .rank-badge.bronze { background: linear-gradient(135deg, #d97706, #f59e0b, #fbbf24); color: #1a1a1a; box-shadow: 0 4px 15px rgba(217, 119, 6, 0.3); text-shadow: 0 1px 1px rgba(0,0,0,0.1); }
                .rank-badge.default { background-color: hsl(var(--card)); color: hsl(var(--muted-foreground)); }
                .player-entry:hover {
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 0 20px hsla(var(--primary) / 0.3), 0 0 40px hsla(var(--primary) / 0.2);
                    border-color: hsl(var(--primary));
                }
            `}</style>
            
            <MyRankCard />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                {tierOrder.map(tier => (
                    <Card key={tier} className="text-center bg-card/30">
                        <CardContent className="p-3">
                            <p className={cn("font-bold", tierConfig[tier].color)}>{tierConfig[tier].name}</p>
                            <p className="text-xs text-muted-foreground">{tierConfig[tier].points}+ Points</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="pro-board space-y-3 pro-board-bg p-4 rounded-xl border border-border" id="pro-board">
                {loading ? (
                    Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                ) : players.length > 0 ? (
                    players.map((player, index) => {
                        const rank = index + 1;
                        const tier = player.proTier || 'Bronze';
                        return (
                            <div
                                key={player.uid}
                                className="player-entry flex items-center gap-4 p-3 bg-card/50 backdrop-blur-sm border border-border rounded-2xl cursor-pointer transition-all duration-300"
                                tabIndex={0}
                            >
                                <div className={cn("rank-badge w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0", getRankClass(rank))}>
                                    #${rank}
                                </div>
                                <Avatar className={cn("w-14 h-14 rounded-xl border-2 flex-shrink-0", player.isPremium ? "border-amber-400" : tierConfig[tier].color.replace('text-', 'border-'))}>
                                     <ImageWithFallback 
                                        as={AvatarImage}
                                        user={player}
                                        src={player.photoURL || ''} 
                                        fallbackSrc={`https://placehold.co/56x56.png?text=${getInitials(player.displayName)}`}
                                        alt={player.displayName || 'Player'} 
                                        data-ai-hint="player avatar"
                                    />
                                    <AvatarFallback className="rounded-lg">{getInitials(player.displayName)}</AvatarFallback>
                                </Avatar>
                                <div className="player-info flex-grow min-w-0">
                                    <div className="player-name flex items-center gap-2">
                                        <h3 className="text-base font-semibold text-foreground truncate">{player.displayName}</h3>
                                        {player.isPremium && <Crown className="h-4 w-4 text-amber-400" />}
                                    </div>
                                    <div className={cn("player-stats text-xs font-bold flex items-center gap-3 mt-1", tierConfig[tier].color)}>
                                        {tierConfig[tier].name}
                                    </div>
                                </div>
                                <div className="player-score text-right font-bold text-lg text-primary min-w-[80px]">
                                    {(player.proPoints || 0).toLocaleString()}
                                    <p className="text-xs font-normal text-muted-foreground">Pro Points</p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 flex flex-col items-center gap-4">
                        <Trophy className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-xl font-bold">The Pro Board is Forming</h3>
                        <p className="text-muted-foreground max-w-sm">No players have earned enough Pro Points to be ranked yet. Play in tournaments to start your journey to the top!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
