
"use client"; 

import type { Tournament, Participant, Winner, TeamSize } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Users, Trophy, Gamepad2, ListChecks, Info, Loader2, Coins, ShieldCheck, Building, Lock, KeyRound, Copy, Eye, EyeOff, Mail, AlertTriangle, CheckCircle, Map, Swords, User as UserIcon, Users2 } from "lucide-react"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useCallback, useMemo } from "react"; 
import { useAuth } from "@/contexts/AuthContext"; 
import { useRouter } from "next/navigation"; 
import { listenToTournamentById, updateTournamentInFirestore, deleteTournamentFromFirestore as deleteTournamentAction, addParticipantToTournamentFirestore, awardTournamentWinners } from "@/lib/tournamentStore"; 
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { differenceInMinutes, format, formatDistanceToNow } from "date-fns";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageTitle } from "@/components/shared/PageTitle";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AdSenseBlock } from "@/components/ads/AdSenseBlock";

const registrationSchema = z.object({
  gameUsername: z.string().min(2, "In-game username is required."),
  inGameId: z.string().min(2, "In-game ID is required."),
  contactEmail: z.string().email("Please enter a valid email.").optional().or(z.literal('')),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

const winnerSchema = z.object({
    first: z.string().min(1, "1st place winner is required."),
    second: z.string().min(1, "2nd place winner is required."),
    third: z.string().min(1, "3rd place winner is required."),
}).refine(data => new Set([data.first, data.second, data.third]).size === 3, {
    message: "Each winner must be a unique participant.",
    path: ["first"], 
});

type WinnerFormData = z.infer<typeof winnerSchema>;

interface TournamentPageClientProps {
  tournamentId: string;
}

const teamSizeIcons: Record<TeamSize, React.ElementType> = {
    Solo: UserIcon,
    Duo: Users2,
    Squad: Users,
};

export default function TournamentPageClient({ tournamentId }: TournamentPageClientProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, isAdmin, loading: authLoading, refreshUser } = useAuth(); 
  const router = useRouter(); 
  const { toast } = useToast();
  
  const [isJoining, setIsJoining] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  
  const [timeUntilStart, setTimeUntilStart] = useState<number | null>(null);

  useEffect(() => {
    if (!tournamentId) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    const unsubscribe = listenToTournamentById(tournamentId, (liveTournament) => {
        if (liveTournament) {
            setTournament(liveTournament);
            if (user) {
                setIsRegistered(liveTournament.participants.some(p => p.id === user.uid));
            }
        } else {
            setTournament(null);
            toast({ title: "Not Found", description: "Tournament not found or has been removed.", variant: "destructive" });
        }
        setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [tournamentId, user, toast]);

  const isTournamentCreator = useMemo(() => user && tournament && tournament.organizerId === user.uid, [user, tournament]);
  
  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { gameUsername: "", inGameId: "", contactEmail: user?.email || "" }
  });

  const winnerForm = useForm<WinnerFormData>({
    resolver: zodResolver(winnerSchema),
    defaultValues: { first: "", second: "", third: "" },
  });


  useEffect(() => {
    if (tournament?.startDate) {
        const startDate = tournament.startDate instanceof Date ? tournament.startDate : (tournament.startDate as any).toDate();
        const calculateTime = () => {
            setTimeUntilStart(differenceInMinutes(startDate, new Date()));
        };
        calculateTime();
        const interval = setInterval(calculateTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }
  }, [tournament?.startDate]);


  useEffect(() => {
    if(user && tournament) {
        setIsRegistered(tournament.participants.some(p => p.id === user.uid));
        registrationForm.reset({ gameUsername: "", inGameId: "", contactEmail: user.email || "" });
    } else {
        setIsRegistered(false);
    }
  }, [user, tournament, registrationForm]); 

  const handleJoinTournament: SubmitHandler<RegistrationFormData> = async (data) => {
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
    
    const entryFee = tournament.entryFee || 0;
    if ((user.points || 0) < entryFee) {
        toast({ title: "Insufficient Points", description: `You need ${entryFee} AE Points to join this tournament.`, variant: "destructive"});
        return;
    }

    setIsJoining(true);
    try {
      const newParticipant: Participant = { 
        id: user.uid, 
        name: user.displayName || "Anonymous Player", 
        avatarUrl: user.photoURL || `https://placehold.co/40x40.png?text=${(user.displayName || "P").substring(0,2)}`,
        gameUsername: data.gameUsername,
        inGameId: data.inGameId,
        contactEmail: data.contactEmail || undefined,
      };
      
      await addParticipantToTournamentFirestore(tournament.id, newParticipant, entryFee);
      await refreshUser();
      
      toast({
        title: "Successfully Registered!",
        description: `You have joined ${tournament.name}. ${entryFee > 0 ? `${entryFee} AE points deducted.` : ''}`,
      });
      setIsRegistrationOpen(false); // Close dialog on success
      registrationForm.reset();
    } catch (error: any) {
      console.error("Error joining tournament:", error);
      toast({ title: "Join Failed", description: error.message || "Could not join tournament.", variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!tournament || !user) return;
    setIsDeleting(true);
    try {
      await deleteTournamentAction(tournament, user.uid);
      await refreshUser(); // Refresh organizer's points after penalty
      toast({
        title: "Tournament Deleted",
        description: `"${tournament.name}" has been removed. Player entry fees refunded.`,
        variant: "destructive",
      });
      router.push("/tournaments");
    } catch (error: any) {
      console.error("Error deleting tournament:", error);
      toast({ title: "Delete Failed", description: error.message || "Could not delete tournament.", variant: "destructive"});
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateRoomDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTournamentCreator) return;
    setIsUpdatingRoom(true);
    try {
        if (tournament) {
            await updateTournamentInFirestore(tournament.id, { roomCode, roomPassword });
            toast({ title: "Room Details Updated", description: "Participants can now see the room information." });
        }
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

  const handleEndTournament: SubmitHandler<WinnerFormData> = async (data) => {
      if (!tournament || !isTournamentCreator || tournament.participants.length < 3) return;
      setIsEnding(true);

      const firstWinner = tournament.participants.find(p => p.id === data.first);
      const secondWinner = tournament.participants.find(p => p.id === data.second);
      const thirdWinner = tournament.participants.find(p => p.id === data.third);
      
      if (!firstWinner || !secondWinner || !thirdWinner) {
          toast({ title: "Error", description: "Could not find all selected winners.", variant: "destructive"});
          setIsEnding(false);
          return;
      }

      try {
          await awardTournamentWinners(tournament.id, {
              first: firstWinner,
              second: secondWinner,
              third: thirdWinner
          });
          await refreshUser(); // Refresh organizer points
          toast({ title: "Tournament Ended!", description: "Winners have been declared and prizes distributed." });
          winnerForm.reset();
      } catch (error: any) {
          toast({ title: "Error", description: error.message || "Failed to end tournament.", variant: "destructive" });
      } finally {
          setIsEnding(false);
      }
  };


  const getStartDate = (): Date => {
    if (!tournament?.startDate) return new Date();
    return tournament.startDate instanceof Date ? tournament.startDate : (tournament.startDate as any).toDate();
  };
  
  const formattedStartDate = useMemo(() => {
    if (!tournament?.startDate) return "Loading date...";
    return format(getStartDate(), "PPPPp");
  }, [tournament?.startDate]);


  if (isLoading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-80 w-full rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-64 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-48 w-full rounded-lg" />
                     <Skeleton className="h-32 w-full rounded-lg" />
                </div>
            </div>
        </div>
    )
  }

  if (!tournament) {
    return (
      <main className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <PageTitle title="Tournament Not Found" />
        <p className="text-muted-foreground">The tournament you are looking for does not exist or may have been removed.</p>
        <Button asChild className="mt-4">
          <Link href="/tournaments">Back to Tournaments</Link>
        </Button>
      </main>
    );
  }

  const isFreeEntry = tournament.entryFee <= 0;

  const canManageRoom = isTournamentCreator && (tournament.status === 'Live' || tournament.status === 'Upcoming');
  const canEndTournament = isTournamentCreator && (tournament.status === 'Live' || tournament.status === 'Ongoing');


  const canShowParticipantDetails = isAdmin || isTournamentCreator;

  const TeamIcon = tournament.teamSize ? teamSizeIcons[tournament.teamSize] : Users;

  return (
    <div className="space-y-8">
      <div className="relative h-48 sm:h-64 md:h-80 rounded-lg overflow-hidden group shadow-xl">
        <ImageWithFallback 
          src={tournament.bannerImageUrl} 
          fallbackSrc={`https://placehold.co/1200x400.png?text=${encodeURIComponent(tournament.name)}`}
          alt={`${tournament.name} banner`} 
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint="esports event stage"
          unoptimized={tournament.bannerImageUrl?.startsWith('data:image')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={tournament.status === "Live" ? "destructive" : "default"} className="text-xs sm:text-sm px-2 sm:px-3 py-1">{tournament.status}</Badge>
             {!isFreeEntry && (
                <Badge variant="outline" className="bg-primary/90 text-primary-foreground border-primary-foreground/50 text-xs sm:text-sm px-2 sm:px-3 py-1">
                    <Coins className="h-3 w-3 mr-1" /> {tournament.entryFee} AE Entry
                </Badge>
            )}
          </div>
          <PageTitle title={tournament.name} className="mb-0 text-shadow !text-xl sm:!text-2xl md:!text-3xl text-white" /> 
          <div className="flex items-center mt-1 sm:mt-2 text-xs sm:text-sm text-slate-200 drop-shadow-sm">
             <ImageWithFallback 
              src={tournament.gameIconUrl}
              fallbackSrc={`https://placehold.co/24x24.png?text=${tournament.gameName.substring(0,2)}`}
              alt={tournament.gameName} 
              width={24} height={24} 
              className="rounded-sm mr-2 object-cover" 
              data-ai-hint="game icon mini"
              unoptimized={tournament.gameIconUrl?.startsWith('data:image')}
            />
            <span>{tournament.gameName}</span>
          </div>
        </div>
      </div>
       {/* AdSense Block */}
        <section className="flex justify-center">
            <AdSenseBlock className="w-full max-w-5xl" />
        </section>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
            <ScrollArea className="w-full whitespace-nowrap pb-2">
                <TabsList className="inline-flex w-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {tournament.winners && tournament.winners.length > 0 && <TabsTrigger value="winners">Winners</TabsTrigger>}
                <TabsTrigger value="bracket">Bracket</TabsTrigger>
                <TabsTrigger value="participants">Participants ({tournament.participants.length})</TabsTrigger>
                <TabsTrigger value="rules">Rules</TabsTrigger>
                {tournament.registrationInstructions && <TabsTrigger value="howToJoin">How to Join</TabsTrigger>}
                {isTournamentCreator && <TabsTrigger value="manage">Manage</TabsTrigger>}
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
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start space-x-3">
                        <CalendarDays className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-semibold">Date & Time</p>
                            <p className="text-muted-foreground">{formattedStartDate}</p>
                        </div>
                    </div>
                     <div className="flex items-start space-x-3">
                        <Gamepad2 className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-semibold">Game</p>
                            <p className="text-muted-foreground">{tournament.gameName}</p>
                        </div>
                    </div>
                     <div className="flex items-start space-x-3">
                        <TeamIcon className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-semibold">Team Size</p>
                            <p className="text-muted-foreground">{tournament.teamSize}</p>
                        </div>
                    </div>
                     <div className="flex items-start space-x-3">
                        <Swords className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-semibold">Match Type</p>
                            <p className="text-muted-foreground">{tournament.matchType}</p>
                        </div>
                    </div>
                     <div className="flex items-start space-x-3">
                        <Map className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-semibold">Map</p>
                            <p className="text-muted-foreground">{tournament.mapName || 'Not specified'}</p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Trophy className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-semibold">Prize Pool</p>
                            <p className="text-muted-foreground flex items-center gap-1">{tournament.prizePool} <Coins className="h-4 w-4 text-yellow-500" /></p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Coins className="h-5 w-5 text-primary mt-1 shrink-0" />
                        <div>
                            <p className="font-semibold">Entry Fee</p>
                            <p className="text-muted-foreground">{isFreeEntry ? 'Free' : `${tournament.entryFee} AE Points`}</p>
                        </div>
                    </div>
                </CardContent>
                </Card>
            </TabsContent>
            
             {tournament.winners && tournament.winners.length > 0 && (
                <TabsContent value="winners" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tournament Winners</CardTitle>
                            <CardDescription>Congratulations to the top performers!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {tournament.winners.sort((a,b) => a.rank - b.rank).map((winner, index) => (
                                     <div key={winner.participant.id} className={cn("flex items-center gap-4 p-4 rounded-lg border", 
                                        winner.rank === 1 && "border-yellow-400 bg-yellow-400/10",
                                        winner.rank === 2 && "border-slate-400 bg-slate-400/10",
                                        winner.rank === 3 && "border-orange-500 bg-orange-500/10"
                                     )}>
                                        <Trophy className={cn("h-8 w-8", 
                                            winner.rank === 1 && "text-yellow-400",
                                            winner.rank === 2 && "text-slate-400",
                                            winner.rank === 3 && "text-orange-500"
                                        )} />
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={winner.participant.avatarUrl} alt={winner.participant.name} />
                                            <AvatarFallback>{winner.participant.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <p className="font-bold text-lg">{winner.rank}{winner.rank === 1 ? 'st' : winner.rank === 2 ? 'nd' : 'rd'} Place</p>
                                            <p className="text-muted-foreground">{winner.participant.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg flex items-center gap-1.5">{winner.prize} <Coins className="h-5 w-5 text-yellow-500" /></p>
                                            <p className="text-muted-foreground text-sm">Prize</p>
                                        </div>
                                     </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            )}

            <TabsContent value="bracket" className="mt-6">
                <Card>
                <CardHeader>
                    <CardTitle>Tournament Bracket</CardTitle>
                    <CardDescription>{tournament.matchType}</CardDescription>
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
                    canShowParticipantDetails ? (
                    <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>In-Game Name</TableHead>
                            <TableHead>In-Game ID</TableHead>
                            <TableHead>Contact Email</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tournament.participants.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                    <AvatarImage src={p.avatarUrl || ''} />
                                    <AvatarFallback>{p.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <span>{p.name}</span>
                                </div>
                                </TableCell>
                                <TableCell>{p.gameUsername}</TableCell>
                                <TableCell>{p.inGameId}</TableCell>
                                <TableCell>{p.contactEmail || 'Not provided'}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                        </Table>
                    </div>
                    ) : (
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {tournament.participants.map(p => (
                            <li key={p.id} className="flex items-center space-x-3 p-2 border rounded-md bg-secondary/30">
                                <ImageWithFallback 
                                    src={p.avatarUrl || `https://placehold.co/40x40.png`} 
                                    fallbackSrc={`https://placehold.co/32x32.png?text=${p.name.substring(0,2)}`}
                                    alt={p.name} 
                                    width={32} height={32} 
                                    className="rounded-full object-cover" 
                                    data-ai-hint="player avatar"
                                    unoptimized={p.avatarUrl?.startsWith('data:image')}
                                />
                                <span>{p.name}</span>
                            </li>
                        ))}
                    </ul>
                    )
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
                <TabsContent value="manage" className="mt-6 space-y-6">
                
                {canManageRoom && (
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Manage Room Details</CardTitle>
                    <CardDescription>Add the room ID and password here. This will only be visible to registered participants.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateRoomDetails} className="space-y-4">
                            <div>
                            <Label htmlFor="roomCode">Room Code / ID</Label>
                            <Input id="roomCode" defaultValue={tournament.roomCode} onChange={e => setRoomCode(e.target.value)} disabled={isUpdatingRoom} />
                            </div>
                            <div>
                            <Label htmlFor="roomPassword">Room Password</Label>
                            <Input id="roomPassword" defaultValue={tournament.roomPassword} onChange={e => setRoomPassword(e.target.value)} disabled={isUpdatingRoom} />
                            </div>
                            <Button type="submit" disabled={isUpdatingRoom}>
                            {isUpdatingRoom ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isUpdatingRoom ? "Saving..." : "Save Room Details"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                )}

                {canEndTournament && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Declare Winners</CardTitle>
                            <CardDescription>End the tournament and distribute the AE Points prize pool to the winners.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tournament.participants.length >= 3 ? (
                                <form onSubmit={winnerForm.handleSubmit(handleEndTournament)} className="space-y-4">
                                     <div>
                                        <Label>1st Place Winner</Label>
                                        <Controller
                                            name="first"
                                            control={winnerForm.control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue placeholder="Select 1st place..." /></SelectTrigger>
                                                    <SelectContent>{tournament.participants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {winnerForm.formState.errors.first && <p className="text-destructive text-xs mt-1">{winnerForm.formState.errors.first.message}</p>}
                                    </div>
                                    <div>
                                        <Label>2nd Place Winner</Label>
                                        <Controller
                                            name="second"
                                            control={winnerForm.control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue placeholder="Select 2nd place..." /></SelectTrigger>
                                                    <SelectContent>{tournament.participants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {winnerForm.formState.errors.second && <p className="text-destructive text-xs mt-1">{winnerForm.formState.errors.second.message}</p>}
                                    </div>
                                    <div>
                                        <Label>3rd Place Winner</Label>
                                        <Controller
                                            name="third"
                                            control={winnerForm.control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue placeholder="Select 3rd place..." /></SelectTrigger>
                                                    <SelectContent>{tournament.participants.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {winnerForm.formState.errors.third && <p className="text-destructive text-xs mt-1">{winnerForm.formState.errors.third.message}</p>}
                                    </div>
                                    <Button type="submit" disabled={isEnding}>
                                        {isEnding && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        End Tournament & Distribute Prizes
                                    </Button>
                                </form>
                            ) : (
                                <p className="text-muted-foreground">You need at least 3 participants to declare winners.</p>
                            )}
                        </CardContent>
                    </Card>
                )}

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
                                  "{tournament.name}" and all of its associated data. Player entry fees will be refunded, and you will be charged a 5 AE Point penalty.
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
            <Dialog open={isRegistrationOpen} onOpenChange={setIsRegistrationOpen}>
            <Card className="bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">
                {tournament.status === "Upcoming" && "Ready to Join?"}
                {tournament.status === "Live" && "Tournament is Live!"}
                {tournament.status === "Completed" && "Tournament Ended"}
                {tournament.status === "Cancelled" && "Tournament Cancelled"}
                </CardTitle>
                {!isFreeEntry && (
                <CardDescription className="text-primary-foreground/90 flex items-center gap-1">
                    Entry Fee: {tournament.entryFee} <Coins className="h-4 w-4" />
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
                    <DialogTrigger asChild>
                        <Button 
                        size="lg" 
                        className="w-full bg-background text-foreground hover:bg-background/90"
                        disabled={authLoading || !user || isRegistered || (tournament.participants.length >= tournament.maxParticipants && tournament.status === "Upcoming") || (tournament.status !== "Upcoming" && tournament.status !== "Live")}
                        >
                        {isRegistered ? "You are Registered" : 
                        (tournament.participants.length >= tournament.maxParticipants && tournament.status === "Upcoming") ? "Registrations Full" :
                        tournament.status === "Upcoming" ? "Register Now" : "Join / Check In"}
                        </Button>
                    </DialogTrigger>
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
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Register for {tournament.name}</DialogTitle>
                <DialogDescription>Enter your in-game details to complete your registration. An entry fee of {tournament.entryFee} AE points will be deducted.</DialogDescription>
                </DialogHeader>
                <form onSubmit={registrationForm.handleSubmit(handleJoinTournament)} className="space-y-4">
                <div>
                    <Label htmlFor="gameUsername">In-Game Username *</Label>
                    <Input id="gameUsername" {...registrationForm.register("gameUsername")} disabled={isJoining}/>
                    {registrationForm.formState.errors.gameUsername && <p className="text-destructive text-xs mt-1">{registrationForm.formState.errors.gameUsername.message}</p>}
                </div>
                <div>
                    <Label htmlFor="inGameId">In-Game ID *</Label>
                    <Input id="inGameId" {...registrationForm.register("inGameId")} disabled={isJoining}/>
                    {registrationForm.formState.errors.inGameId && <p className="text-destructive text-xs mt-1">{registrationForm.formState.errors.inGameId.message}</p>}
                </div>
                <div>
                    <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
                    <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="contactEmail" type="email" {...registrationForm.register("contactEmail")} className="pl-10" disabled={isJoining}/>
                    </div>
                    {registrationForm.formState.errors.contactEmail && <p className="text-destructive text-xs mt-1">{registrationForm.formState.errors.contactEmail.message}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isJoining}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isJoining}>
                        {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isJoining ? "Submitting..." : "Confirm Registration"}
                    </Button>
                </DialogFooter>
                </form>
            </DialogContent>
            </Dialog>

            <Card>
            <CardHeader>
                <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-3">
                <ImageWithFallback 
                    src={``} 
                    fallbackSrc={`https://placehold.co/50x50.png?text=OG`}
                    alt={tournament.organizer || "Organizer"} 
                    width={40} height={40} 
                    className="rounded-full object-cover" 
                    data-ai-hint="company logo"
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

        </div>
        </div>
    </div>
  );
}
