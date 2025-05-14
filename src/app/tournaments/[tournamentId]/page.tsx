
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import type { Tournament, Participant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Users, Trophy, Gamepad2, ListChecks, ChevronLeft, AlertTriangle, Info, Loader2 } from "lucide-react"; 
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useCallback } 
from "react"; 
import { useAuth } from "@/contexts/AuthContext"; 
import { useRouter } from "next/navigation"; 
import { getTournamentByIdFromFirestore, addParticipantToTournament, deleteTournamentFromFirestore as deleteTournamentAction, updateTournamentInFirestore } from "@/lib/tournamentStore"; 
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";


interface TournamentPageProps {
  params: { tournamentId: string };
}

export default function TournamentPage({ params }: TournamentPageProps) {
  const { tournamentId } = params;
  const [tournament, setTournament] = useState<Tournament | undefined>(undefined);
  const { user, isAdmin, loading: authLoading } = useAuth(); 
  const router = useRouter(); 
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [formattedStartDate, setFormattedStartDate] = useState<string | null>(null);

  const fetchTournament = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTournament = await getTournamentByIdFromFirestore(tournamentId);
      setTournament(fetchedTournament);
      if (fetchedTournament) {
        setFormattedStartDate(format(new Date(fetchedTournament.startDate), "PPPPp"));
        if (user) {
          setIsRegistered(fetchedTournament.participants.some(p => p.id === user.uid));
        }
      } else {
        toast({ title: "Not Found", description: "Tournament not found.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching tournament:", error);
      toast({ title: "Error", description: "Could not fetch tournament details.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [tournamentId, user, toast]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]); 

  const handleJoinTournament = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/tournaments/${tournamentId}`);
      return;
    }
    if (!tournament) return;

    if (isRegistered) {
      toast({ title: "Already Registered", description: "You are already registered for this tournament." });
      return;
    }

    if (tournament.participants.length >= tournament.maxParticipants && (tournament.status === "Upcoming" || tournament.status === "Live")) {
      toast({ title: "Registration Full", description: "This tournament has reached its maximum number of participants.", variant: "destructive" });
      return;
    }
    
    if (tournament.status !== "Upcoming" && tournament.status !== "Live") {
        toast({ title: "Registration Closed", description: "This tournament is not currently open for registration.", variant: "destructive" });
        return;
    }

    setIsJoining(true);
    try {
      const newParticipant: Participant = { 
        id: user.uid, 
        name: user.displayName || "Anonymous Player", 
        avatarUrl: user.photoURL || `https://placehold.co/40x40.png?text=${(user.displayName || "P").substring(0,2)}`
      };
      // Instead of addParticipantToTournament, we directly update the tournament
      // to ensure Firestore upsert logic (if defined there) is used.
      const updatedParticipants = [...tournament.participants, newParticipant];
      await updateTournamentInFirestore(tournament.id, { participants: updatedParticipants });
      
      toast({
        title: "Successfully Registered!",
        description: `You have joined ${tournament.name}.`,
      });
      await fetchTournament(); 
    } catch (error: any) {
      console.error("Error joining tournament:", error);
      toast({ title: "Join Failed", description: error.message || "Could not join tournament.", variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!tournament) return;
    setIsDeleting(true);
    try {
      await deleteTournamentAction(tournament.id);
      toast({
        title: "Tournament Deleted",
        description: `"${tournament.name}" has been removed.`,
        variant: "destructive",
      });
      router.push("/tournaments");
    } catch (error) {
      console.error("Error deleting tournament:", error);
      toast({ title: "Delete Failed", description: "Could not delete tournament.", variant: "destructive"});
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || authLoading) {
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
  const isTournamentCreator = user && tournament.organizerId === user.uid;


  return (
    <div className="space-y-8">
      <div className="relative h-48 sm:h-64 md:h-80 rounded-lg overflow-hidden group shadow-xl">
        <Image 
          src={tournament.bannerImageUrl} 
          alt={`${tournament.name} banner`} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="esports event stage"
          unoptimized={tournament.bannerImageUrl.startsWith('data:image')}
          onError={(e) => (e.currentTarget.src = `https://placehold.co/1200x400.png?text=${encodeURIComponent(tournament.name)}`)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 md:p-6 lg:p-8">
          <Badge variant={tournament.status === "Live" ? "destructive" : "default"} className="mb-2 text-xs sm:text-sm px-2 sm:px-3 py-1">{tournament.status}</Badge>
          <PageTitle title={tournament.name} className="mb-0 text-shadow !text-xl sm:!text-2xl md:!text-3xl text-white" /> 
          <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-slate-200 drop-shadow-sm">
            <Image 
              src={tournament.gameIconUrl} 
              alt={tournament.gameName} 
              width={24} height={24} 
              className="rounded-sm mr-2 object-cover" 
              data-ai-hint="game icon mini"
              unoptimized={tournament.gameIconUrl.startsWith('data:image')}
              onError={(e) => (e.currentTarget.src = `https://placehold.co/24x24.png?text=${tournament.gameName.substring(0,2)}`)}
            />
            <span>{tournament.gameName}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="bracket" className="w-full">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex w-auto">
                <TabsTrigger value="bracket">Bracket</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="participants">Participants ({tournament.participants.length})</TabsTrigger>
                <TabsTrigger value="rules">Rules</TabsTrigger>
                {tournament.registrationInstructions && <TabsTrigger value="howToJoin">How to Join</TabsTrigger>}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

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
                            <p className="text-muted-foreground">{formattedStartDate || "Loading date..."}</p>
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
                                  className="rounded-full object-cover" 
                                  data-ai-hint="player avatar"
                                  unoptimized={p.avatarUrl?.startsWith('data:image')}
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

            {tournament.registrationInstructions && (
                <TabsContent value="howToJoin" className="mt-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center"><Info className="mr-2 h-5 w-5 text-primary" /> How to Join / Registration</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground whitespace-pre-line">{tournament.registrationInstructions}</p></CardContent>
                </Card>
                </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">
                {tournament.status === "Upcoming" && "Ready to Join?"}
                {tournament.status === "Live" && "Tournament is Live!"}
                {tournament.status === "Completed" && "Tournament Ended"}
                {tournament.status === "Cancelled" && "Tournament Cancelled"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm sm:text-base">
                {tournament.status === "Upcoming" && "Registrations are open! Secure your spot now."}
                {tournament.status === "Live" && "Tournament is live! Check registration details. You might still be able to join late if allowed by the organizer."}
                {tournament.status === "Completed" && "This tournament has concluded. Check out the results!"}
                {tournament.status === "Cancelled" && "This tournament has been cancelled."}
              </p>
              {(tournament.status === "Upcoming" || tournament.status === "Live") && (
                 <Button 
                   size="lg" 
                   className="w-full bg-background text-foreground hover:bg-background/90"
                   onClick={handleJoinTournament}
                   disabled={!user || isRegistered || (tournament.participants.length >= tournament.maxParticipants && tournament.status === "Upcoming") || (tournament.status !== "Upcoming" && tournament.status !== "Live") || isJoining}
                 >
                   {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                   {isJoining ? "Processing..." :
                    isRegistered ? "You are Registered" : 
                    (tournament.participants.length >= tournament.maxParticipants && tournament.status === "Upcoming") ? "Registrations Full" :
                    tournament.status === "Upcoming" ? "Register Now" : "Join / Check In"}
                 </Button>
              )}
               {tournament.status === "Completed" && (
                 <Button size="lg" className="w-full" disabled>View Results (Coming Soon)</Button>
              )}
               {(!user && (tournament.status === "Upcoming" || tournament.status === "Live")) && (
                  <Button size="lg" className="w-full" asChild>
                    <Link href={`/auth/login?redirect=/tournaments/${tournamentId}`}>Login to Register</Link>
                  </Button>
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
                  className="rounded-full object-cover" 
                  data-ai-hint="company logo"
                  onError={(e) => (e.currentTarget.src = "https://placehold.co/50x50.png?text=OG")}
                />
                <p className="font-medium">{tournament.organizer || "Apna Esport Community"}</p>
              </div>
            </CardContent>
          </Card>

          {(isAdmin || isTournamentCreator) && tournament.status !== "Completed" && (
            <Card>
                <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {/* <Button variant="outline" className="w-full" disabled>Edit Tournament (Coming Soon)</Button> */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full" disabled={isDeleting}>
                              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              {isDeleting ? "Deleting..." : "Delete Tournament"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the tournament
                                "{tournament.name}" and all of its associated data.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTournament} disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
