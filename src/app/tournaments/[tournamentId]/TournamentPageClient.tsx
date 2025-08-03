
"use client"; 

import type { Tournament, Participant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Users, Trophy, Gamepad2, ListChecks, Info, Loader2, DollarSign, ShieldCheck, Building, Lock, KeyRound, Copy, Eye, EyeOff } from "lucide-react"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useCallback, useMemo } from "react"; 
import { useAuth } from "@/contexts/AuthContext"; 
import { useRouter } from "next/navigation"; 
import { getTournamentByIdFromFirestore, updateTournamentInFirestore, deleteTournamentFromFirestore as deleteTournamentAction } from "@/lib/tournamentStore"; 
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
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { differenceInMinutes, format, formatDistanceToNow } from "date-fns";


interface TournamentPageClientProps {
  tournamentId: string;
  initialTournament: any; // Using `any` because it's serialized.
  initialFormattedDate: string;
}

const deserializeTournament = (serializedTournament: any): Tournament => {
  const newTournament = { ...serializedTournament };
  for (const key of Object.keys(newTournament)) {
    const value = newTournament[key];
    if (typeof value === 'string') {
      // Very basic ISO date string check
      if (/\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z/.test(value)) {
        newTournament[key] = new Date(value);
      }
    }
  }
   if (newTournament.matches) {
    newTournament.matches = newTournament.matches.map((match: any) => {
      const newMatch = {...match};
      if (newMatch.startTime && typeof newMatch.startTime === 'string') {
        newMatch.startTime = new Date(newMatch.startTime);
      }
      return newMatch;
    });
  }
  return newTournament as Tournament;
}

export default function TournamentPageClient({ tournamentId, initialTournament, initialFormattedDate }: TournamentPageClientProps) {
  const [tournament, setTournament] = useState<Tournament>(deserializeTournament(initialTournament));
  const [formattedStartDate, setFormattedStartDate] = useState<string>(initialFormattedDate);
  
  const { user, isAdmin, loading: authLoading } = useAuth(); 
  const router = useRouter(); 
  const { toast } = useToast();
  
  const [isJoining, setIsJoining] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [roomCode, setRoomCode] = useState(initialTournament.roomCode || "");
  const [roomPassword, setRoomPassword] = useState(initialTournament.roomPassword || "");
  const [showPassword, setShowPassword] = useState(false);
  
  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);

  const isTournamentCreator = useMemo(() => user && tournament.organizerId === user.uid, [user, tournament.organizerId]);
  
  const canManageRoom = useMemo(() => {
    if (!tournament.startDate) return false;
    const startDate = tournament.startDate instanceof Date ? tournament.startDate : new Date(tournament.startDate as any);
    return differenceInMinutes(startDate, new Date()) <= 15;
  }, [tournament.startDate]);


  useEffect(() => {
    const startDate = tournament.startDate instanceof Date ? tournament.startDate : new Date(tournament.startDate as any);
    const calculateTime = () => {
        setTimeUntilStart(differenceInMinutes(startDate, new Date()));
    };
    calculateTime();
    const interval = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [tournament.startDate]);


  const fetchTournament = useCallback(async () => {
    try {
      const fetchedTournament = await getTournamentByIdFromFirestore(tournamentId);
      if (fetchedTournament) {
        setTournament(fetchedTournament);
         setRoomCode(fetchedTournament.roomCode || "");
         setRoomPassword(fetchedTournament.roomPassword || "");
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
  }, [tournamentId, user, toast]);

  useEffect(() => {
    if(user) {
        setIsRegistered(tournament.participants.some(p => p.id === user.uid));
    } else {
        setIsRegistered(false);
    }
  }, [user, tournament.participants]); 

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

    if (tournament.entryFee && tournament.entryFee > 0) {
        toast({
            title: "Premium Tournament",
            description: `Entry Fee: ${tournament.entryFee} ${tournament.currency || 'USD'}. Payment system not implemented in prototype. Joining for free for now.`,
            duration: 5000,
        });
    }

    setIsJoining(true);
    try {
      const newParticipant: Participant = { 
        id: user.uid, 
        name: user.displayName || "Anonymous Player", 
        avatarUrl: user.photoURL || `https://placehold.co/40x40.png?text=${(user.displayName || "P").substring(0,2)}`
      };
      
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

  const handleUpdateRoomDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTournamentCreator) return;
    setIsUpdatingRoom(true);
    try {
      await updateTournamentInFirestore(tournament.id, { roomCode, roomPassword });
      toast({ title: "Room Details Updated", description: "Participants can now see the room information." });
      await fetchTournament();
    } catch (error) {
      console.error("Error updating room details:", error);
      toast({ title: "Update Failed", description: "Could not update room details.", variant: "destructive"});
    } finally {
      setIsUpdatingRoom(false);
    }
  };
  
  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Password copied to clipboard." });
  }

  const isPremium = tournament.entryFee && tournament.entryFee > 0;

  const getStartDate = () => {
    return tournament.startDate instanceof Date ? tournament.startDate : new Date(tournament.startDate as any);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Tabs defaultValue="overview" className="w-full">
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <TabsList className="inline-flex w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bracket">Bracket</TabsTrigger>
              <TabsTrigger value="participants">Participants ({tournament.participants.length})</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              {tournament.registrationInstructions && <TabsTrigger value="howToJoin">How to Join</TabsTrigger>}
              {isTournamentCreator && <TabsTrigger value="manageRoom">Manage Room</TabsTrigger>}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card>
              <CardHeader><CardTitle>About this Tournament</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground leading-relaxed">{tournament.description}</p></CardContent>
            </Card>
            
            {isRegistered && (tournament.roomCode || tournament.roomPassword) && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> Room Details</CardTitle>
                  <CardDescription>Use this information to join the custom room in-game.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tournament.roomCode && (
                    <div className="space-y-1">
                      <Label>Room Code / ID</Label>
                      <p className="font-mono text-lg p-2 bg-muted rounded-md">{tournament.roomCode}</p>
                    </div>
                  )}
                  {tournament.roomPassword && (
                    <div className="space-y-1">
                      <Label>Password</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-lg p-2 bg-muted rounded-md flex-grow">
                          {showPassword ? tournament.roomPassword : "••••••••••"}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(tournament.roomPassword!)}>
                          <Copy className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                  {isPremium && (
                      <div className="flex items-start space-x-3">
                          <DollarSign className="h-6 w-6 text-primary mt-1 shrink-0" />
                          <div>
                              <p className="font-medium">Entry Fee</p>
                              <p className="text-muted-foreground">{tournament.entryFee} {tournament.currency}</p>
                          </div>
                      </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

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
          
           {isTournamentCreator && (
            <TabsContent value="manageRoom" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Manage Room Details</CardTitle>
                  <CardDescription>Add the room ID and password here. This will only be visible to registered participants.</CardDescription>
                </CardHeader>
                <CardContent>
                  {canManageRoom ? (
                     <form onSubmit={handleUpdateRoomDetails} className="space-y-4">
                        <div>
                          <Label htmlFor="roomCode">Room Code / ID</Label>
                          <Input id="roomCode" value={roomCode} onChange={e => setRoomCode(e.target.value)} disabled={isUpdatingRoom} />
                        </div>
                        <div>
                          <Label htmlFor="roomPassword">Room Password</Label>
                          <Input id="roomPassword" value={roomPassword} onChange={e => setRoomPassword(e.target.value)} disabled={isUpdatingRoom} />
                        </div>
                        <Button type="submit" disabled={isUpdatingRoom}>
                          {isUpdatingRoom ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                          {isUpdatingRoom ? "Saving..." : "Save Room Details"}
                        </Button>
                     </form>
                  ) : (
                    <div className="flex flex-col items-center text-center p-6 border-2 border-dashed rounded-lg bg-muted/50">
                        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg">Room Management Locked</h3>
                        {timeUntilStart !== null && timeUntilStart > 0 ? (
                            <p className="text-muted-foreground">
                                You can add room details {formatDistanceToNow(getStartDate(), { includeSeconds: false, addSuffix: true})}.
                            </p>
                        ) : (
                             <p className="text-muted-foreground">The start time has passed, but management is still available.</p>
                        )}
                        
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
           )}

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
            {isPremium && (
              <CardDescription className="text-primary-foreground/90">
                  Entry: {tournament.entryFee} {tournament.currency}
              </CardDescription>
            )}
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
                  disabled={authLoading || !user || isRegistered || (tournament.participants.length >= tournament.maxParticipants && tournament.status === "Upcoming") || (tournament.status !== "Upcoming" && tournament.status !== "Live") || isJoining}
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
              {(!user && !authLoading && (tournament.status === "Upcoming" || tournament.status === "Live")) && (
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

        {(tournament.sponsorName || tournament.sponsorLogoUrl) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-primary"/>Sponsored By</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              {tournament.sponsorLogoUrl && (
                <Image 
                  src={tournament.sponsorLogoUrl}
                  alt={tournament.sponsorName || "Sponsor"}
                  width={80}
                  height={80}
                  className="rounded-md object-contain mb-2"
                  data-ai-hint="sponsor logo"
                  unoptimized={tournament.sponsorLogoUrl.startsWith('data:image')}
                  onError={(e) => e.currentTarget.style.display = 'none'} 
                />
              )}
              {tournament.sponsorName && (
                <p className="font-medium text-foreground">{tournament.sponsorName}</p>
              )}
            </CardContent>
          </Card>
        )}


        {(isAdmin || isTournamentCreator) && tournament.status !== "Completed" && (
          <Card>
              <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
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
  );
}
