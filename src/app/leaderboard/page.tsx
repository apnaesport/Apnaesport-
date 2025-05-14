
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/lib/types";
import { getAllUsersFromFirestore } from "@/lib/tournamentStore";
import { useEffect, useState, useCallback } from "react";
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

const getInitials = (name: string | null | undefined) => {
  if (!name) return "??";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />; // Silver
  if (rank === 3) return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />; // Bronze-ish
  return <span className="font-semibold text-sm sm:text-base">{rank}</span>;
};

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [fullLeaderboard, setFullLeaderboard] = useState<UserProfile[]>([]);
  const [top10Players, setTop10Players] = useState<UserProfile[]>([]);
  const [currentUserRanking, setCurrentUserRanking] = useState<{ rank: number; points: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsersFromFirestore();
      // Filter out users with 0 or undefined points before sorting, unless you want to show everyone
      const playersWithPoints = allUsers.filter(u => (u.points || 0) > 0);
      const sortedUsers = playersWithPoints.sort((a, b) => (b.points || 0) - (a.points || 0));
      
      setFullLeaderboard(sortedUsers);
      setTop10Players(sortedUsers.slice(0, 10));

      if (user) {
        const userIndex = sortedUsers.findIndex(p => p.uid === user.uid);
        if (userIndex !== -1) {
          setCurrentUserRanking({ rank: userIndex + 1, points: sortedUsers[userIndex].points || 0 });
        } else {
          setCurrentUserRanking(null); // User has 0 points or not found in sorted list
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
      <>
        <PageTitle title="Leaderboard" subtitle="See who's on top in Apna Esport!" />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground mt-4 text-lg">Loading leaderboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Leaderboard" subtitle="Top players on Apna Esport. Points are illustrative for now." />
      
      <Card className="shadow-xl border-border hover:shadow-primary/10 transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center text-xl sm:text-2xl">
            <Trophy className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Player Rankings
          </CardTitle>
          <CardDescription>
            See who's dominating the charts! Rankings are based on total points earned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {top10Players.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] sm:w-[80px] text-center text-base">Rank</TableHead>
                    <TableHead className="text-base">Player</TableHead>
                    <TableHead className="text-right text-base">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top10Players.map((player, index) => (
                    <TableRow 
                      key={player.uid}
                      className={cn(
                        "transition-colors hover:bg-muted/50",
                        user && player.uid === user.uid && "bg-primary/10 hover:bg-primary/20 border-l-2 border-r-2 border-primary",
                        index === 0 && "bg-yellow-400/10 hover:bg-yellow-400/20", // Gold accent for 1st
                        index === 1 && "bg-slate-400/10 hover:bg-slate-400/20", // Silver accent for 2nd
                        index === 2 && "bg-amber-600/10 hover:bg-amber-600/20"  // Bronze accent for 3rd
                      )}
                    >
                      <TableCell className="text-center">
                        <RankIcon rank={index + 1} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-muted">
                            <AvatarImage src={player.photoURL || ""} alt={player.displayName || "Player"} data-ai-hint="user avatar" />
                            <AvatarFallback className={cn(
                              "text-xs sm:text-sm", 
                              index === 0 && "bg-yellow-400 text-background",
                              index === 1 && "bg-slate-400 text-background",
                              index === 2 && "bg-amber-700 text-background"
                              )}>{getInitials(player.displayName)}</AvatarFallback>
                          </Avatar>
                          <span className={cn("truncate text-sm sm:text-base", index < 3 && "font-semibold")}>{player.displayName || "Anonymous Player"}</span>
                        </div>
                      </TableCell>
                      <TableCell className={cn("text-right font-mono text-sm sm:text-base", index < 3 && "font-bold")}>{player.points || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 px-4 space-y-4">
              <BarChartHorizontal className="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground">The Leaderboard is Shaping Up!</h3>
              <p className="text-muted-foreground">
                It looks like the competition is just getting started. Participate in tournaments, showcase your skills, and climb the ranks to be featured here!
              </p>
              <Button asChild>
                <Link href="/tournaments">Browse Tournaments</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {currentUserRanking && currentUserRanking.rank > 10 && (
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
       {currentUserRanking === null && user && ( // User is logged in but has 0 points or not on leaderboard
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

    