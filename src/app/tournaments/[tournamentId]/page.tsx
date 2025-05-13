
import { PageTitle } from "@/components/shared/PageTitle";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import type { Tournament, Game } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Users, Trophy, Gamepad2, Info, ListChecks, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


// Placeholder data - replace with actual data fetching based on tournamentId
const getTournamentDetails = (tournamentId: string): Tournament | undefined => {
  const sampleTournaments: Tournament[] = [
    {
      id: "t1-lol", name: "LoL Summer Skirmish", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://picsum.photos/seed/lol-icon/80/80",
      bannerImageUrl: "https://picsum.photos/seed/t1-banner-large/1200/400", 
      description: "The LoL Summer Skirmish is a weekly online tournament designed for amateur and semi-pro teams looking to test their skills and climb the ranks. Featuring a prize pool and broadcasted final matches.",
      status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 5)), 
      participants: Array.from({ length: 12 }, (_, i) => ({ id: `p${i}`, name: `Team Player ${i + 1}` })), 
      maxParticipants: 16, prizePool: "$200 + Merchandise", bracketType: "Single Elimination",
      rules: "Standard 5v5 Summoner's Rift tournament rules. All matches Best of 1, Finals Best of 3. Check-in 30 minutes before start time. Full rules on Discord.",
      matches: [ // Sample matches for bracket
        { id: 'm1', round: 1, participants: [{id: 'p1', name: 'Team Alpha'}, {id: 'p2', name: 'Team Beta'}], status: 'Pending' },
        { id: 'm2', round: 1, participants: [{id: 'p3', name: 'Team Gamma'}, {id: 'p4', name: 'Team Delta'}], status: 'Pending' },
      ]
    },
     {
      id: "t2-valo", name: "Valorant Champions Tour", gameId: "game-valo", gameName: "Valorant", gameIconUrl: "https://picsum.photos/seed/valo-icon/80/80",
      bannerImageUrl: "https://picsum.photos/seed/t2-banner-large/1200/400", 
      description: "The official Valorant regional qualifier where teams battle for a spot in the global championship. High stakes, intense action, and top-tier talent.",
      status: "Live", startDate: new Date(new Date().setDate(new Date().getDate() - 2)), 
      participants: Array.from({ length: 28 }, (_, i) => ({ id: `vp${i}`, name: `ValoPro ${i + 1}` })), 
      maxParticipants: 32, prizePool: "$5,000 + VCT Points", bracketType: "Double Elimination",
      rules: "Official VCT rulebook applies. All server settings and map vetos as per VCT guidelines. Strict anti-cheat measures in place.",
      matches: [
        { id: 'vm1', round: 1, participants: [{id: 'vp1', name: 'Sentinels'}, {id: 'vp2', name: 'Cloud9'}], status: 'Live', score: '1-0' },
        { id: 'vm2', round: 1, participants: [{id: 'vp3', name: 'NRG'}, {id: 'vp4', name: '100 Thieves'}], status: 'Pending' },
      ]
    },
  ];
  return sampleTournaments.find(t => t.id === tournamentId);
};

interface TournamentPageProps {
  params: { tournamentId: string };
}

export default function TournamentPage({ params }: TournamentPageProps) {
  const { tournamentId } = params;
  const tournament = getTournamentDetails(tournamentId);

  if (!tournament) {
    return (
      <div className="text-center py-10">
        <PageTitle title="Tournament Not Found" />
        <p className="text-muted-foreground">The tournament you are looking for does not exist or may have been removed.</p>
        <Button asChild className="mt-4">
          <Link href="/tournaments">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Tournaments
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative h-64 md:h-80 rounded-lg overflow-hidden group shadow-xl">
        <Image 
          src={tournament.bannerImageUrl} 
          alt={`${tournament.name} banner`} 
          layout="fill" 
          objectFit="cover"
          className="transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="esports event stage"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <Badge variant={tournament.status === "Live" ? "destructive" : "default"} className="mb-2 text-sm px-3 py-1">{tournament.status}</Badge>
          <PageTitle title={tournament.name} className="mb-0 text-shadow" />
          <div className="flex items-center mt-2 text-sm text-slate-200 drop-shadow-sm">
            <Image src={tournament.gameIconUrl} alt={tournament.gameName} width={24} height={24} className="rounded-sm mr-2" data-ai-hint="game icon mini" />
            <span>{tournament.gameName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="bracket" className="w-full">
            <TabsList>
              <TabsTrigger value="bracket">Bracket</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="participants">Participants ({tournament.participants.length})</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="bracket" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Bracket</CardTitle>
                  <CardDescription>{tournament.bracketType}</CardDescription>
                </CardHeader>
                <CardContent>
                  <TournamentBracket tournament={tournament} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card>
                <CardHeader><CardTitle>About this Tournament</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground leading-relaxed">{tournament.description}</p></CardContent>
              </Card>
               <Card>
                <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                        <CalendarDays className="h-6 w-6 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-medium">Date & Time</p>
                            <p className="text-muted-foreground">{format(new Date(tournament.startDate), "PPPPp")}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Gamepad2 className="h-6 w-6 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-medium">Game</p>
                            <p className="text-muted-foreground">{tournament.gameName}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Trophy className="h-6 w-6 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-medium">Prize Pool</p>
                            <p className="text-muted-foreground">{tournament.prizePool || "Not specified"}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <ListChecks className="h-6 w-6 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-medium">Format</p>
                            <p className="text-muted-foreground">{tournament.bracketType}</p>
                        </div>
                    </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="participants" className="mt-6">
              <Card>
                <CardHeader>
                    <CardTitle>Participants ({tournament.participants.length} / {tournament.maxParticipants})</CardTitle>
                </CardHeader>
                <CardContent>
                {tournament.participants.length > 0 ? (
                    <ul className="space-y-2">
                        {tournament.participants.map(p => (
                            <li key={p.id} className="flex items-center space-x-3 p-2 border rounded-md bg-secondary/30">
                                <Image src={p.avatarUrl || `https://picsum.photos/seed/${p.id}/40/40`} alt={p.name} width={32} height={32} className="rounded-full" data-ai-hint="player avatar"/>
                                <span>{p.name}</span>
                            </li>
                        ))}
                    </ul>
                ): (
                    <p className="text-muted-foreground">No participants registered yet, or participant list is private.</p>
                )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="mt-6">
               <Card>
                <CardHeader><CardTitle>Tournament Rules</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground whitespace-pre-line">{tournament.rules || "No specific rules provided for this tournament."}</p></CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Join?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {tournament.status === "Upcoming" 
                  ? "Registrations are open! Secure your spot now."
                  : tournament.status === "Live" 
                  ? "Tournament is live! You might still be able to join late if allowed."
                  : "This tournament has ended."
                }
              </p>
              {tournament.status === "Upcoming" || tournament.status === "Live" ? (
                 <Button size="lg" className="w-full bg-background text-foreground hover:bg-background/90">
                   {tournament.status === "Upcoming" ? "Register Now" : "Check In / Join Late"}
                 </Button>
              ) : (
                <Button size="lg" className="w-full" disabled>Registration Closed</Button>
              )}
            </CardContent>
          </Card>

          {/* Organizer/Sponsor Card - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Image src={`https://picsum.photos/seed/organizer-logo/50/50`} alt="Organizer" width={40} height={40} className="rounded-full" data-ai-hint="company logo"/>
                <p className="font-medium">{tournament.organizer || "TournamentHub Community"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
