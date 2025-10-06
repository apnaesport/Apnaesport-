
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/lib/types';
import { listenToTopPlayersByMonthlyWins } from '@/lib/tournamentStore';
import { Trophy, Users, ShieldCheck, Gamepad2, Star, Megaphone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';

interface LeaderboardClientProps {
    initialPlayers: (UserProfile & { kda: string })[];
}

const getInitials = (name?: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};


export function LeaderboardClient({ initialPlayers }: LeaderboardClientProps) {
    const [players, setPlayers] = useState(initialPlayers);
    const [loading, setLoading] = useState(initialPlayers.length === 0);
    const [selectedPlayer, setSelectedPlayer] = useState<(UserProfile & { kda: string }) | null>(null);

    const fetchPlayers = useCallback(() => {
        setLoading(true);
        const unsubscribe = listenToTopPlayersByMonthlyWins(20, (updatedPlayers) => {
            setPlayers(updatedPlayers);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribe = fetchPlayers();
        return () => unsubscribe();
    }, [fetchPlayers]);

    const openProfile = (player: UserProfile & { kda: string }) => {
        setSelectedPlayer(player);
    };

    const closeProfile = () => {
        setSelectedPlayer(null);
    };
    
    const getRankClass = (rank: number) => {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return 'default';
    };


    return (
        <div className="container mx-auto max-w-2xl relative" role="region" aria-label="Apna Esports leaderboard">
            <div className="leaderboard space-y-3" id="leaderboard">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                ) : players.length > 0 ? (
                    players.map((player, index) => {
                        const rank = index + 1;
                        return (
                            <div
                                key={player.uid}
                                className="player-entry flex items-center gap-4 p-3 bg-card/50 backdrop-blur-sm border border-border rounded-2xl cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-primary/20 hover:-translate-y-1"
                                onClick={() => openProfile(player)}
                                tabIndex={0}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openProfile(player)}
                            >
                                <div className={cn("rank-badge w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0", getRankClass(rank))}>
                                    #{rank}
                                </div>
                                <Avatar className="w-14 h-14 rounded-xl border-2 border-border flex-shrink-0">
                                     <ImageWithFallback 
                                        as={AvatarImage}
                                        src={player.photoURL || ""} 
                                        fallbackSrc={`https://placehold.co/56x56.png?text=${getInitials(player.displayName)}`}
                                        alt={player.displayName || 'Player'} 
                                        data-ai-hint="player avatar"
                                    />
                                    <AvatarFallback className="rounded-lg">{getInitials(player.displayName)}</AvatarFallback>
                                </Avatar>
                                <div className="player-info flex-grow min-w-0">
                                    <div className="player-name flex items-center gap-2">
                                        <h3 className="text-base font-semibold text-foreground truncate">{player.displayName}</h3>
                                    </div>
                                    <div className="player-stats text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                        <span className="stat flex items-center gap-1">🏆 {player.monthlyWins}</span>
                                        <span className="stat flex items-center gap-1">⚔️ {player.kda} K/D</span>
                                    </div>
                                </div>
                                <div className="player-score text-right font-bold text-lg text-primary min-w-[60px]">
                                    {(player.points || 0).toLocaleString()}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">The leaderboard is currently empty. Check back soon!</p>
                    </div>
                )}
            </div>
            
            {/* Profile Drawer */}
             <div 
                className={cn("profile-drawer fixed top-0 right-0 h-full w-[420px] max-w-full bg-background/80 backdrop-blur-xl border-l border-border shadow-2xl z-50 p-6 transition-transform duration-300 ease-in-out", selectedPlayer ? "translate-x-0" : "translate-x-full")}
                aria-hidden={!selectedPlayer}
             >
                {selectedPlayer && (
                    <>
                        <div className="profile-header flex gap-4 items-center mb-6">
                             <Avatar className="w-20 h-20 rounded-2xl border-2 border-primary">
                                <ImageWithFallback 
                                    as={AvatarImage}
                                    src={selectedPlayer.photoURL || ""}
                                    fallbackSrc={`https://placehold.co/80x80.png?text=${getInitials(selectedPlayer.displayName)}`}
                                    alt={selectedPlayer.displayName || 'Player'}
                                    data-ai-hint="player avatar large"
                                />
                                <AvatarFallback className="rounded-xl text-3xl">{getInitials(selectedPlayer.displayName)}</AvatarFallback>
                            </Avatar>
                            <div className="profile-info flex-1">
                                <h3 className="text-xl font-bold truncate">{selectedPlayer.displayName}</h3>
                                <p className="text-sm text-muted-foreground">{selectedPlayer.apnaId}</p>
                                <div className="text-lg font-bold text-primary mt-1">#{players.findIndex(p => p.uid === selectedPlayer.uid) + 1}</div>
                            </div>
                        </div>

                        <div className="profile-stats grid grid-cols-3 gap-4 mb-6">
                            <div className="stat-card text-center bg-card p-3 rounded-lg">
                                <div className="stat-label text-xs text-muted-foreground uppercase">Wins</div>
                                <div className="stat-value text-xl font-bold">{selectedPlayer.monthlyWins}</div>
                            </div>
                             <div className="stat-card text-center bg-card p-3 rounded-lg">
                                <div className="stat-label text-xs text-muted-foreground uppercase">K/D Ratio</div>
                                <div className="stat-value text-xl font-bold">{selectedPlayer.kda}</div>
                            </div>
                             <div className="stat-card text-center bg-card p-3 rounded-lg">
                                <div className="stat-label text-xs text-muted-foreground uppercase">Points</div>
                                <div className="stat-value text-xl font-bold">{(selectedPlayer.points || 0).toLocaleString()}</div>
                            </div>
                        </div>
                        
                        <div className="profile-actions flex gap-4">
                             <button className="action-btn flex-1 bg-primary text-primary-foreground rounded-lg py-3 font-semibold" onClick={() => alert('Challenge feature coming soon!')}>🎯 Challenge</button>
                             <button className="action-btn secondary flex-1 bg-secondary text-secondary-foreground rounded-lg py-3 font-semibold" onClick={closeProfile}>Close</button>
                        </div>
                    </>
                )}
            </div>

             {/* Overlay for closing drawer */}
            {selectedPlayer && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={closeProfile}
                ></div>
            )}

            <style jsx>{`
                .rank-badge.gold { background: linear-gradient(135deg, #ffd700, #ffed4e, #ffc107); color: #1a1a1a; box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3); }
                .rank-badge.silver { background: linear-gradient(135deg, #e5e7eb, #f3f4f6, #d1d5db); color: #1a1a1a; box-shadow: 0 4px 15px rgba(229, 231, 235, 0.3); }
                .rank-badge.bronze { background: linear-gradient(135deg, #d97706, #f59e0b, #fbbf24); color: #1a1a1a; box-shadow: 0 4px 15px rgba(217, 119, 6, 0.3); }
                .rank-badge.default { background-color: hsl(var(--card)); color: hsl(var(--muted-foreground)); }
            `}</style>
        </div>
    );
}
