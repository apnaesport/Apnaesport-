
"use client";

import { useState, useMemo, useEffect } from "react";
import type { Game, UserProfile, StatItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Trophy, User, Crosshair, BarChart, Crown, Loader2, Server, Database, Info } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { fetchLivePlayerStats, type PlayerStatsOutput } from "@/ai/flows/player-stats-flow";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface LiveStatsPageClientProps {
  allGames: Game[];
  allUsers: UserProfile[];
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return "??";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

export default function LiveStatsPageClient({ allGames, allUsers }: LiveStatsPageClientProps) {
  const [activeGameId, setActiveGameId] = useState<string | null>(allGames[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiResult, setApiResult] = useState<PlayerStatsOutput | null>(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [activeGameId]);

  const sortedUsers = useMemo(() => {
    return [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [allUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return sortedUsers;
    }
    return sortedUsers.filter(user =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, sortedUsers]);
  
  const topPlayer = sortedUsers[0];
  const mostWinsPlayer = [...sortedUsers].sort((a,b) => (b.wins || 0) - (a.wins || 0))[0];
  const topKdPlayer = [...sortedUsers].sort((a,b) => {
      const kdA = (a.kills || 0) / (a.deaths || 1);
      const kdB = (b.kills || 0) / (b.deaths || 1);
      return kdB - kdA;
  })[0];

  const statsWidgets: StatItem[] = [
      { title: "Top Ranked Player", value: topPlayer?.displayName || 'N/A', icon: "Crown", change: `${topPlayer?.points || 0} pts` },
      { title: "Most Tournament Wins", value: mostWinsPlayer?.displayName || 'N/A', icon: "Trophy", change: `${mostWinsPlayer?.wins || 0} wins` },
      { title: "Top K/D Ratio", value: topKdPlayer?.displayName || 'N/A', icon: "Crosshair", change: `${((topKdPlayer?.kills || 0) / (topKdPlayer?.deaths || 1)).toFixed(2)} K/D` },
  ];

  const handleTabChange = (gameId: string) => {
    setIsLoading(true);
    setApiResult(null); // Clear API result when switching games
    setActiveGameId(gameId);
  }

  const handlePlayerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
        setApiResult(null); // Clear result if search is cleared
        return;
    }
    setIsLoadingApi(true);
    setApiResult(null);
    try {
        const result = await fetchLivePlayerStats({ playerName: searchTerm });
        setApiResult(result);
        if(!result.isApiData) {
          toast({
            title: "Displaying Placeholder Data",
            description: "Live API is disabled. Showing simulated stats instead.",
          });
        }
    } catch(error) {
        console.error("Error fetching live stats:", error);
        toast({
            title: "API Error",
            description: "Could not fetch live player stats. Please try again later.",
            variant: "destructive",
        });
    } finally {
        setIsLoadingApi(false);
    }
  }

  return (
    <Tabs value={activeGameId || ""} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        {allGames.map(game => (
          <TabsTrigger key={game.id} value={game.id} className="flex items-center gap-2">
            <ImageWithFallback 
                src={game.iconUrl} 
                fallbackSrc={`https://placehold.co/40x40.png?text=${game.name.substring(0,2)}`} 
                alt={game.name} 
                width={16} 
                height={16} 
                className="rounded-sm"
                data-ai-hint="game icon"
             />
            {game.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {allGames.map(game => (
        <TabsContent key={game.id} value={game.id} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                 {statsWidgets.map(stat => <StatsCard key={stat.title} item={stat} />)}
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Live Leaderboard: {game.name}</CardTitle>
                    <CardDescription>Search for a player to fetch their live stats directly from the game's API, or browse the current leaderboard from our platform.</CardDescription>
                    <form onSubmit={handlePlayerSearch} className="flex gap-2 pt-2">
                        <Input
                        placeholder="Search player by in-game name..."
                        className="max-w-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button type="submit" disabled={isLoadingApi}>
                            {isLoadingApi ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </form>
                </CardHeader>
                <CardContent>
                    {isLoadingApi ? (
                        <div className="text-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-muted-foreground">Fetching live stats for "{searchTerm}"...</p>
                        </div>
                    ) : apiResult ? (
                         <Card className="bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Server className="h-5 w-5"/> Live Stats for "{apiResult.playerName}"
                                    </span>
                                    <Button variant="outline" size="sm" onClick={() => setApiResult(null)}>Clear Search</Button>
                                </CardTitle>
                                {!apiResult.isApiData && (
                                  <CardDescription className="flex items-center gap-2 text-orange-500">
                                    <Info className="h-4 w-4"/> Displaying placeholder data. Live API is currently disabled.
                                  </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Stat</TableHead>
                                            <TableHead className="text-right">Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow><TableCell>K/D Ratio</TableCell><TableCell className="text-right font-mono">{apiResult.kdRatio}</TableCell></TableRow>
                                        <TableRow><TableCell>Wins</TableCell><TableCell className="text-right font-mono">{apiResult.wins}</TableCell></TableRow>
                                        <TableRow><TableCell>Kills</TableCell><TableCell className="text-right font-mono">{apiResult.kills}</TableCell></TableRow>
                                        <TableRow><TableCell>Deaths</TableCell><TableCell className="text-right font-mono">{apiResult.deaths}</TableCell></TableRow>
                                        <TableRow><TableCell>Matches Played</TableCell><TableCell className="text-right font-mono">{apiResult.matchesPlayed}</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                    <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Rank</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            <TableHead className="text-right hidden sm:table-cell">Wins</TableHead>
                            <TableHead className="text-right hidden md:table-cell">K/D Ratio</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`}>
                                    <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                                    <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
                                    <TableCell className="text-right hidden md:table-cell"><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((player, index) => {
                                const kdRatio = ((player.kills || 0) / (player.deaths || 1)).toFixed(2);
                                const rank = index + 1;
                                return (
                                <TableRow key={player.uid} className={cn(
                                    rank === 1 && "bg-yellow-500/10",
                                    rank === 2 && "bg-slate-500/10",
                                    rank === 3 && "bg-amber-600/10",
                                )}>
                                    <TableCell className="font-bold text-lg">{rank}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                            <AvatarImage src={player.photoURL || ""} alt={player.displayName || "Player"} data-ai-hint="player avatar"/>
                                            <AvatarFallback>{getInitials(player.displayName)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{player.displayName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{player.points || 0}</TableCell>
                                    <TableCell className="text-right font-mono hidden sm:table-cell">{player.wins || 0}</TableCell>
                                    <TableCell className="text-right font-mono hidden md:table-cell">{kdRatio}</TableCell>
                                </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No players found on the leaderboard.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
