
"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { useAuth } from "@/contexts/AuthContext";
import type { UserProfile } from "@/lib/types";
import { getAllUsersFromFirestore } from "@/lib/tournamentStore";
import { useEffect, useState, useCallback } from "react";
import { Loader2, Trophy, Crown, Medal } from "lucide-react";
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

const getInitials = (name: string | null | undefined) => {
  if (!name) return "??";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-yellow-600" />; // Bronze-ish color
  return <span className="font-semibold">{rank}</span>;
};

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsersFromFirestore();
      const sortedUsers = allUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
      setLeaderboardData(sortedUsers);
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      toast({
        title: "Error",
        description: "Could not load leaderboard data.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (authLoading || isLoading) {
    return (
      <MainLayout>
        <PageTitle title="Leaderboard" subtitle="See who's on top!" />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground mt-4">Loading leaderboard...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageTitle title="Leaderboard" subtitle="Top players on Apna Esport. Points are illustrative." />
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-3 h-6 w-6 text-primary" />
            Player Rankings
          </CardTitle>
          <CardDescription>
            Players are ranked based on their total points. (Points system is currently for demonstration)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboardData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((player, index) => (
                    <TableRow 
                      key={player.uid}
                      className={cn(
                        user && player.uid === user.uid && "bg-primary/10 hover:bg-primary/20",
                        index < 3 && "font-semibold"
                      )}
                    >
                      <TableCell className="text-center">
                        <RankIcon rank={index + 1} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-muted">
                            <AvatarImage src={player.photoURL || ""} alt={player.displayName || "Player"} data-ai-hint="user avatar" />
                            <AvatarFallback className={cn(index < 3 && "bg-accent text-accent-foreground")}>{getInitials(player.displayName)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{player.displayName || "Anonymous Player"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{player.points || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No players found or leaderboard data is unavailable.
            </p>
          )}
        </CardContent>
      </Card>
      
      {user && leaderboardData.some(p => p.uid === user.uid && (leaderboardData.findIndex(up => up.uid === user.uid) + 1 > 10)) && (
        <Card className="mt-6">
          <CardContent className="p-4 text-center">
            <p className="text-foreground">
              Your Rank: <span className="font-bold text-primary">{leaderboardData.findIndex(up => up.uid === user.uid) + 1}</span> with <span className="font-bold">{user.points || 0}</span> points.
            </p>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
