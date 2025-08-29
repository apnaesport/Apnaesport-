
import { PageTitle } from "@/components/shared/PageTitle";
import type { Metadata } from 'next';
import { getTopPlayersByMonthlyWins } from "@/lib/tournamentStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Hall of Fame - Top Players | Apna Esport",
  description: "Discover the top-performing players on Apna Esport. See who has the most tournament wins this month and check out their stats.",
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

const rankColors = {
    1: "border-yellow-400 bg-yellow-400/10 text-yellow-400 shadow-yellow-500/20",
    2: "border-slate-400 bg-slate-400/10 text-slate-400 shadow-slate-500/20",
    3: "border-orange-500 bg-orange-500/10 text-orange-500 shadow-orange-500/20",
};

export default async function LeaderboardPage() {
    const topPlayers = await getTopPlayersByMonthlyWins(20);
    const podiumPlayers = topPlayers.slice(0, 3);
    const rankedPlayers = topPlayers.slice(3);

    return (
        <div className="space-y-8">
            <div className="text-center py-12 bg-gradient-to-br from-primary via-primary/70 to-accent rounded-lg shadow-lg">
                <Trophy className="mx-auto h-16 w-16 text-white mb-4 animate-pulse" />
                <PageTitle 
                    title="Hall of Fame"
                    subtitle="Recognizing the top tournament champions of the month."
                    className="!text-white text-shadow-lg"
                />
            </div>

            {podiumPlayers.length > 0 ? (
                <section>
                    <h2 className="text-2xl font-bold text-center mb-6">This Month's Podium</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        {/* 2nd Place */}
                        {podiumPlayers[1] && (
                            <Card className={cn("text-center border-2 shadow-lg relative pt-10 mt-6", rankColors[2])}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                                     <Trophy className="h-12 w-12 text-slate-400 fill-slate-400 drop-shadow-lg"/>
                                     <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">2</span>
                                </div>
                                <CardHeader className="p-4">
                                     <Avatar className="h-24 w-24 mx-auto mb-2 border-4 border-slate-400">
                                        <AvatarImage src={podiumPlayers[1].photoURL || ''} />
                                        <AvatarFallback className="text-2xl bg-slate-400/20">{getInitials(podiumPlayers[1].displayName || 'P')}</AvatarFallback>
                                    </Avatar>
                                    <CardTitle className="text-xl line-clamp-1">{podiumPlayers[1].displayName}</CardTitle>
                                    <CardDescription className="font-mono text-xs">Apna ID: {podiumPlayers[1].apnaId}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-2xl font-bold flex items-center justify-center gap-2">
                                        <Trophy className="h-6 w-6"/> {podiumPlayers[1].monthlyWins} Wins
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {/* 1st Place */}
                        {podiumPlayers[0] && (
                             <Card className={cn("text-center border-2 shadow-xl relative pt-10", rankColors[1])}>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                                     <Trophy className="h-16 w-16 text-yellow-400 fill-yellow-400 drop-shadow-lg"/>
                                     <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">1</span>
                                </div>
                                <CardHeader className="p-4">
                                     <Avatar className="h-32 w-32 mx-auto mb-2 border-4 border-yellow-400">
                                        <AvatarImage src={podiumPlayers[0].photoURL || ''} />
                                        <AvatarFallback className="text-3xl bg-yellow-400/20">{getInitials(podiumPlayers[0].displayName || 'P')}</AvatarFallback>
                                    </Avatar>
                                    <CardTitle className="text-2xl line-clamp-1">{podiumPlayers[0].displayName}</CardTitle>
                                    <CardDescription className="font-mono text-sm">Apna ID: {podiumPlayers[0].apnaId}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-3xl font-bold flex items-center justify-center gap-2">
                                        <Trophy className="h-8 w-8"/> {podiumPlayers[0].monthlyWins} Wins
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {/* 3rd Place */}
                        {podiumPlayers[2] && (
                            <Card className={cn("text-center border-2 shadow-md relative pt-10 mt-6", rankColors[3])}>
                                 <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                                     <Trophy className="h-12 w-12 text-orange-500 fill-orange-500 drop-shadow-lg"/>
                                     <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">3</span>
                                </div>
                                <CardHeader className="p-4">
                                     <Avatar className="h-24 w-24 mx-auto mb-2 border-4 border-orange-500">
                                        <AvatarImage src={podiumPlayers[2].photoURL || ''} />
                                        <AvatarFallback className="text-2xl bg-orange-500/20">{getInitials(podiumPlayers[2].displayName || 'P')}</AvatarFallback>
                                    </Avatar>
                                    <CardTitle className="text-xl line-clamp-1">{podiumPlayers[2].displayName}</CardTitle>
                                    <CardDescription className="font-mono text-xs">Apna ID: {podiumPlayers[2].apnaId}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                     <div className="text-2xl font-bold flex items-center justify-center gap-2">
                                        <Trophy className="h-6 w-6"/> {podiumPlayers[2].monthlyWins} Wins
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </section>
            ) : (
                <Card className="text-center py-10">
                    <CardHeader>
                        <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <CardTitle>The Month is Young!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">No tournament winners have been declared yet this month. Compete now to claim your spot!</p>
                        <Button asChild className="mt-4">
                            <Link href="/tournaments">Find a Tournament</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {rankedPlayers.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold text-center mb-6">Elite Players</h2>
                    <Card>
                        <CardContent className="p-0">
                            <div className="space-y-2">
                                {rankedPlayers.map((player, index) => (
                                    <div key={player.uid} className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50">
                                        <div className="font-bold text-lg w-8 text-center text-muted-foreground">{index + 4}</div>
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={player.photoURL || ''} />
                                            <AvatarFallback>{getInitials(player.displayName || 'P')}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-foreground">{player.displayName}</p>
                                            <p className="text-xs text-muted-foreground font-mono">Apna ID: {player.apnaId}</p>
                                        </div>
                                         {player.communityId && (
                                            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                                                <Link href={`/community/${player.communityId}`}>
                                                    <Users className="mr-2 h-4 w-4"/> View Community
                                                </Link>
                                            </Button>
                                         )}
                                        <div className="flex items-center gap-2 font-semibold text-primary">
                                            <Trophy className="h-5 w-5"/>
                                            <span>{player.monthlyWins} Wins</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            )}
        </div>
    );
}
