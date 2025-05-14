
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import type { Tournament, Participant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Users, Trophy, Gamepad2, ListChecks, ChevronLeft, AlertTriangle } from "lucide-react"; 
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react"; 
import { useAuth } from "@/contexts/AuthContext"; 
import { useRouter } from "next/navigation"; 
import { getTournamentDetails as fetchTournamentDetails, subscribe, addTournament as upsertTournamentInStore } from "@/lib/tournamentStore"; 
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";


interface TournamentPageProps {
  params: { tournamentId: string };
}

export default function TournamentPage({ params }: TournamentPageProps) {
  const { tournamentId } = params;
  const [tournament, setTournament] = useState<Tournament | undefined>(undefined);
  const { user } = useAuth(); 
  const router = useRouter(); 
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const loadTournament = () => {
      setIsLoading(true);
      const fetchedTournament = fetchTournamentDetails(tournamentId);
      setTournament(fetchedTournament);
      if (fetchedTournament && user) {
        setIsRegistered(fetchedTournament.participants.some(p => p.id === user.uid));
      }
      setIsLoading(false);
    };

    loadTournament();
    const unsubscribe = subscribe(loadTournament); 
    return () => unsubscribe();
  }, [tournamentId, user]); 

  const handleJoinTournament = () => {
    if (!user) {
      router.push(`/auth/login?redirect=/tournaments/${tournamentId}`);
      return;
    }
    if (tournament && !isRegistered && tournament.participants.length < tournament.maxParticipants) {
      const newParticipant: Participant = { 
        id: user.uid, 
        name: user.displayName || "Anonymous Player", 
        avatarUrl: user.photoURL || `https://placehold.co/40x40.png?text=${(user.displayName || "P").substring(0,2)}`
      };
      const updatedParticipants = [...tournament.participants, newParticipant];
      const updatedTournament: Tournament = { ...tournament, participants: updatedParticipants };
      
      upsertTournamentInStore(updatedTournament); // This will update the tournament in the store

      // Optimistic UI updates are handled by the subscription useEffect
      // setTournament(updatedTournament); 
      // setIsRegistered(true);

      toast({
        title: "Successfully Registered!",
        description: `You have joined ${tournament.name}.`,
      });
    } else if (tournament && tournament.participants.length >= tournament.maxParticipants) {
       toast({
        title: "Registration Full",
        description: "This tournament has reached its maximum number of participants.",
        variant: "destructive",
      });
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-64 md:h-80 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
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

  const canJoinOrRegister = user && (tournament.status === "Upcoming" || tournament.status === "Live");


  return (
    <div className="space-y-8">
      <div className="relative h-64 md:h-80 rounded-lg overflow-hidden group shadow-xl">
        <Image 
          src={tournament.bannerImageUrl} 
          alt={`${tournament.name} banner`} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          objectFit="cover"
          className="transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="esports event stage"
          onError={(e) => (e.currentTarget.src = `https://placehold.co/1200x400.png?text=${encodeURIComponent(tournament.name)}`)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <Badge variant={tournament.status === "Live" ? "destructive" : "default"} className="mb-2 text-sm px-3 py-1">{tournament.status}</Badge>
          <PageTitle title={tournament.name} className="mb-0 text-shadow text-white" /> {/* Ensure text is visible on banner */}
          <div className="flex items-center mt-2 text-sm text-slate-200 drop-shadow-sm">
            <Image 
              src={tournament.gameIconUrl} 
              alt={tournament.gameName} 
              width={24} height={24} 
              className="rounded-sm mr-2" 
              data-ai-hint="game icon mini"
              onError={(e) => (e.currentTarget.src = `https://placehold.co/24x24.png?text=${tournament.gameName.substring(0,2)}`)}
            />
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
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {tournament.participants.map(p => (
                            <li key={p.id} className="flex items-center space-x-3 p-2 border rounded-md bg-secondary/30">
                                <Image 
                                  src={p.avatarUrl || `https://placehold.co/40x40.png`} 
                                  alt={p.name} 
                                  width={32} height={32} 
                                  className="rounded-full" 
                                  data-ai-hint="player avatar"
                                  onError={(e) => (e.currentTarget.src = `https://placehold.co/32x32.png?text=${p.name.substring(0,2)}`)}
                                />
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
              <CardTitle className="text-2xl">
                {tournament.status === "Upcoming" && "Ready to Join?"}
                {tournament.status === "Live" && "Tournament is Live!"}
                {tournament.status === "Completed" && "Tournament Ended"}
                {tournament.status === "Cancelled" && "Tournament Cancelled"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                {tournament.status === "Upcoming" && "Registrations are open! Secure your spot now."}
                {tournament.status === "Live" && "Tournament is live! You might still be able to join late if allowed, or watch the matches."}
                {tournament.status === "Completed" && "This tournament has concluded. Check out the results!"}
                {tournament.status === "Cancelled" && "This tournament has been cancelled."}
              </p>
              {(tournament.status === "Upcoming" || (tournament.status === "Live" /* && allowLateJoins */)) && (
                 <Button 
                   size="lg" 
                   className="w-full bg-background text-foreground hover:bg-background/90"
                   onClick={handleJoinTournament}
                   disabled={!canJoinOrRegister || isRegistered || (tournament.participants.length >= tournament.maxParticipants && tournament.status === "Upcoming")}
                 >
                   {isRegistered ? "You are Registered" : 
                    (tournament.participants.length >= tournament.maxParticipants && tournament.status === "Upcoming") ? "Registrations Full" :
                    tournament.status === "Upcoming" ? "Register Now" : "Check In / Join Late"}
                 </Button>
              )}
               {tournament.status === "Completed" && (
                 <Button size="lg" className="w-full" disabled>View Results (Coming Soon)</Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Image 
                  src={`https://placehold.co/50x50.png`} 
                  alt={tournament.organizer || "Organizer"} 
                  width={40} height={40} 
                  className="rounded-full" 
                  data-ai-hint="company logo"
                  onError={(e) => (e.currentTarget.src = "https://placehold.co/50x50.png?text=OG")}
                />
                <p className="font-medium">{tournament.organizer || "TournamentHub Community"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
