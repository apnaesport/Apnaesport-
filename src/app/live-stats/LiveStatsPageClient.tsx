
"use client";

import { useState, useMemo, useEffect } from "react";
import type { Game, UserProfile, StatItem } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Trophy, User, Crosshair, BarChart, Crown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { StatsCard } from "@/components/dashboard/StatsCard";

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

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [activeGameId]);

  const sortedUsers = useMemo(() => {
    // For now, we sort by points as a proxy for a real game-specific rank.
    // This can be replaced with API data later.
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
    setActiveGameId(gameId);
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
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                        placeholder="Search player..."
                        className="pl-10 max-w-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
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
                                No players found for "{searchTerm}".
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
