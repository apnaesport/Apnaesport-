
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/lib/types';
import { listenToTopPlayersByProPoints } from '@/lib/tournamentStore';
import { Trophy, Crown, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';

interface ProBoardClientProps {
    initialPlayers: (UserProfile & { kda: string })[];
}

const getInitials = (name?: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

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
        <div className="container mx-auto max-w-2xl relative" role="region" aria-label="Apna Esport Pro Board">
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
            <div className="pro-board space-y-3 pro-board-bg p-4 rounded-xl border border-border" id="pro-board">
                {loading ? (
                    Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                ) : players.length > 0 ? (
                    players.map((player, index) => {
                        const rank = index + 1;
                        return (
                            <div
                                key={player.uid}
                                className="player-entry flex items-center gap-4 p-3 bg-card/50 backdrop-blur-sm border border-border rounded-2xl cursor-pointer transition-all duration-300"
                                tabIndex={0}
                            >
                                <div className={cn("rank-badge w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0", getRankClass(rank))}>
                                    #${rank}
                                </div>
                                <Avatar className={cn("w-14 h-14 rounded-xl border-2 flex-shrink-0", player.isPremium ? "border-amber-400" : "border-border")}>
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
                                    <div className="player-stats text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                        <span className="stat flex items-center gap-1">🏆 {player.wins || 0} Wins</span>
                                        <span className="stat flex items-center gap-1">⚔️ {player.kda} K/D</span>
                                    </div>
                                </div>
                                <div className="player-score text-right font-bold text-lg text-primary min-w-[60px]">
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
