
"use client";

import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile, SiteSettings } from "@/lib/types";
import { getAllUsersFromFirestore } from "@/lib/tournamentStore";
import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, Trophy, Crown, Medal, BarChartHorizontal, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { AdPlacement } from "@/components/shared/AdPlacement";


const getInitials = (name: string | null | undefined) => {
  if (!name) return "??";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

const PodiumCard = ({ player, rank }: { player: UserProfile; rank: 1 | 2 | 3 }) => {
    const rankStyles = {
        1: {
            card: "border-yellow-400/50 bg-yellow-900/20 order-first md:order-2 md:-translate-y-8 shadow-2xl z-10",
            icon: "text-yellow-400",
            iconBg: "bg-yellow-400/10",
            avatar: "border-yellow-400",
            rankText: "text-yellow-400",
            glow: "shadow-[0_0_15px_theme(colors.yellow.400),0_0_5px_theme(colors.yellow.300)]",
        },
        2: {
            card: "border-slate-400/50 bg-slate-800/20 order-2 md:order-1",
            icon: "text-slate-400",
            iconBg: "bg-slate-400/10",
            avatar: "border-slate-400",
            rankText: "text-slate-400",
            glow: "shadow-[0_0_10px_theme(colors.slate.400)]",
        },
        3: {
            card: "border-amber-600/50 bg-amber-900/20 order-3 md:order-3",
            icon: "text-amber-600",
            iconBg: "bg-amber-600/10",
            avatar: "border-amber-600",
            rankText: "text-amber-600",
            glow: "shadow-[0_0_10px_theme(colors.amber.600)]",
        },
    };

    const RankIcon = rank === 1 ? Crown : Medal;

    return (
        <div className={cn("flex-1 transition-all duration-300 hover:scale-105 hover:z-20", rankStyles[rank].card)}>
            <Card className={cn(
                "h-full w-full bg-transparent border-0 shadow-none flex flex-col items-center p-4 sm:p-6 text-center group",
                 rankStyles[rank].glow
            )}>
                <div className={cn("p-2 rounded-full mb-3 transition-transform duration-300 group-hover:scale-110", rankStyles[rank].iconBg)}>
                   <RankIcon className={cn("h-8 w-8", rankStyles[rank].icon)} />
                </div>
                <Avatar className={cn("h-20 w-20 sm:h-24 sm:h-24 border-4 transition-transform duration-300 group-hover:scale-110", rankStyles[rank].avatar)}>
                    <AvatarImage src={player.photoURL || ""} alt={player.displayName || "Player"} data-ai-hint="user avatar" />
                    <AvatarFallback className="text-2xl">{getInitials(player.displayName)}</AvatarFallback>
                </Avatar>
                <CardTitle className="mt-4 text-base sm:text-lg font-bold truncate w-full group-hover:text-primary transition-colors">
                    {player.displayName}
                </CardTitle>
                <CardDescription className={cn("text-xl sm:text-2xl font-bold transition-all", rankStyles[rank].rankText)} style={{ textShadow: `0 0 8px hsl(var(--primary) / 0.5)`}}>
                    {player.points || 0} pts
                </CardDescription>
            </Card>
        </div>
    );
};


export function LeaderboardClientPage() {
  const { user, loading: authLoading } = useAuth();
  const [fullLeaderboard, setFullLeaderboard] = useState<UserProfile[]>([]);
  const [top3Players, setTop3Players] = useState<UserProfile[]>([]);
  const [otherPlayers, setOtherPlayers] = useState<UserProfile[]>([]);
  const [currentUserRanking, setCurrentUserRanking] = useState<{ rank: number; points: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { settings } = useSiteSettings();


  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsersFromFirestore();
      const sortedUsers = allUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
      
      setFullLeaderboard(sortedUsers);
      setTop3Players(sortedUsers.slice(0, 3));
      setOtherPlayers(sortedUsers.slice(3));

      if (user) {
        const userIndex = sortedUsers.findIndex(p => p.uid === user.uid);
        if (userIndex !== -1) {
          setCurrentUserRanking({ rank: userIndex + 1, points: sortedUsers[userIndex].points || 0 });
        } else {
          setCurrentUserRanking(null); 
        }
      }

    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      toast({
        title: "Error Loading Leaderboard",
        description: "Could not load player rankings. Please try again later.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (authLoading || isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground mt-4 text-lg">Loading leaderboard...</p>
        </div>
    );
  }

  return (
    <>
      {settings?.leaderboardAdKey && (
          <AdPlacement adKey={settings.leaderboardAdKey} type="leaderboard" className="mb-6"/>
      )}
      
      {top3Players.length > 0 && (
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-center mb-6 text-shadow" style={{ textShadow: `0 0 10px hsl(var(--primary) / 0.7)`}}>Top Champions</h2>
            <div className="flex flex-col md:flex-row gap-4 justify-center items-end max-w-4xl mx-auto">
                {top3Players[1] && <PodiumCard player={top3Players[1]} rank={2} />}
                {top3Players[0] && <PodiumCard player={top3Players[0]} rank={1} />}
                {top3Players[2] && <PodiumCard player={top3Players[2]} rank={3} />}
            </div>
        </div>
      )}

      <Card className="shadow-xl border-border/50 hover:shadow-primary/10 transition-shadow duration-300 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl sm:text-2xl">
            <Trophy className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Player Rankings
          </CardTitle>
          <CardDescription>
             {otherPlayers.length > 0 ? "See who's climbing the charts in the top player rankings." : "The competition is just getting started!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {otherPlayers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-border/50">
                    <TableHead className="w-[60px] sm:w-[80px] text-center text-base">Rank</TableHead>
                    <TableHead className="text-base">Player</TableHead>
                    <TableHead className="text-right text-base">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherPlayers.map((player, index) => (
                    <TableRow 
                      key={player.uid}
                      className={cn(
                        "transition-colors hover:bg-muted/50 border-b-border/20 last:border-b-0",
                        user && player.uid === user.uid && "bg-primary/10 hover:bg-primary/20 border-l-2 border-r-2 border-primary animate-pulse",
                      )}
                    >
                      <TableCell className="text-center font-bold text-lg sm:text-xl text-primary">
                        {index + 4}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-muted">
                            <AvatarImage src={player.photoURL || ""} alt={player.displayName || "Player"} data-ai-hint="user avatar" />
                            <AvatarFallback className="text-xs sm:text-sm">{getInitials(player.displayName)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm sm:text-base font-medium">{player.displayName || "Anonymous Player"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm sm:text-base font-bold text-foreground">{player.points || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <div className="text-center py-10 px-4 space-y-4">
              <BarChartHorizontal className="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground">The Leaderboard is Wide Open!</h3>
              <p className="text-muted-foreground">
                Compete in tournaments to earn your spot among the champions.
              </p>
              <Button asChild>
                <Link href="/tournaments">Browse Tournaments</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {currentUserRanking && currentUserRanking.rank > top3Players.length + otherPlayers.length && (
        <Card className="mt-6 bg-card/80 backdrop-blur-sm shadow-lg border-primary/50">
          <CardContent className="p-4 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <Star className="h-5 w-5 text-primary hidden sm:inline-block" />
                <p className="text-foreground text-sm sm:text-base">
                Your current rank: <span className="font-bold text-primary text-base sm:text-lg">{currentUserRanking.rank}</span> with <span className="font-bold text-base sm:text-lg">{currentUserRanking.points}</span> points. Keep fighting!
                </p>
                 <Star className="h-5 w-5 text-primary hidden sm:inline-block" />
            </div>
          </CardContent>
        </Card>
      )}
       {currentUserRanking === null && user && ( 
        <Card className="mt-6">
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">
              You are not yet on the leaderboard. Join some tournaments to start earning points!
            </p>
             <Button asChild variant="link" className="mt-1">
                <Link href="/tournaments">Find a Tournament</Link>
              </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}

    

    