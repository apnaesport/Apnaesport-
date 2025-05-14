
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { Game, Tournament, TournamentStatus } from "@/lib/types";
import { CalendarIcon, PlusCircle, Loader2, LogIn } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
// For a real backend:
// import { collection, addDoc, serverTimestamp, getDocs, query } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// Placeholder games - in a real app, fetch these from your 'games' collection in Firestore
const placeholderGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://placehold.co/40x40.png" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://placehold.co/40x40.png" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://placehold.co/40x40.png" },
];

const tournamentSchema = z.object({
  name: z.string().min(5, "Tournament name must be at least 5 characters."),
  gameId: z.string().min(1, "Please select a game."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(500, "Description must be 500 characters or less."),
  startDate: z.date({ required_error: "Start date is required."}),
  maxParticipants: z.coerce.number().min(2, "Max participants must be at least 2.").max(256, "Max participants cannot exceed 256."),
  prizePool: z.string().optional(),
  bracketType: z.enum(["Single Elimination", "Double Elimination", "Round Robin"], { required_error: "Bracket type is required."}),
  rules: z.string().optional(),
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

export default function CreateTournamentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [availableGames, setAvailableGames] = useState<Game[]>(placeholderGames);
  const [isLoadingGames, setIsLoadingGames] = useState(false); // Set to true if fetching games

  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      gameId: searchParams.get("gameId") || "",
      description: "",
      startDate: undefined,
      maxParticipants: 16,
      prizePool: "",
      bracketType: "Single Elimination",
      rules: "",
    },
  });

  // Example: Fetch games from Firestore
  // useEffect(() => {
  //   const fetchGames = async () => {
  //     setIsLoadingGames(true);
  //     try {
  //       const gamesCollectionRef = collection(db, "games");
  //       const gamesSnapshot = await getDocs(query(gamesCollectionRef));
  //       const gamesList = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
  //       setAvailableGames(gamesList.length > 0 ? gamesList : placeholderGames);
  //       if(gamesList.length === 0) console.warn("No games found in Firestore, using placeholders.");
  //     } catch (error) {
  //       console.error("Error fetching games:", error);
  //       toast({ title: "Error", description: "Could not fetch games list.", variant: "destructive" });
  //       setAvailableGames(placeholderGames); // Fallback to placeholders
  //     }
  //     setIsLoadingGames(false);
  //   };
  //   fetchGames();
  // }, [toast]);
  
  useEffect(() => {
    const preselectedGameId = searchParams.get("gameId");
    if (preselectedGameId) {
      form.setValue("gameId", preselectedGameId);
    }
  }, [searchParams, form]);


  const onSubmit: SubmitHandler<TournamentFormData> = async (data) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a tournament.", variant: "destructive" });
      return;
    }

    const selectedGame = availableGames.find(g => g.id === data.gameId);
    if (!selectedGame) {
      toast({ title: "Game Error", description: "Selected game is not valid.", variant: "destructive" });
      return;
    }

    const newTournamentData: Omit<Tournament, 'id' | 'participants' | 'status' | 'bannerImageUrl' | 'gameIconUrl' | 'matches'> = {
      ...data,
      gameName: selectedGame.name,
      gameIconUrl: selectedGame.iconUrl, // Will be replaced by actual game icon from DB
      organizerId: user.uid,
      organizer: user.displayName || user.email || "Unknown Organizer",
      participants: [],
      status: "Upcoming" as TournamentStatus, // Default status
      bannerImageUrl: `https://placehold.co/1200x400.png`, // Default banner
      // startDate: Timestamp.fromDate(data.startDate), // For Firestore
    };
    
    console.log("Submitting new tournament:", newTournamentData);

    try {
      // Example: Add tournament to Firestore
      // const docRef = await addDoc(collection(db, "tournaments"), {
      //   ...newTournamentData,
      //   createdAt: serverTimestamp(), // Optional: for ordering or tracking
      // });
      toast({
        title: "Tournament Created (Simulated)",
        description: `"${data.name}" has been successfully created.`,
      });
      // router.push(`/tournaments/${docRef.id}`); // Redirect to the new tournament page
      router.push(`/tournaments`); // Redirect to all tournaments page for now
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({ title: "Creation Failed", description: "Could not create tournament. Please try again.", variant: "destructive" });
    }
  };

  if (authLoading || isLoadingGames) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <PageTitle title="Access Denied" subtitle="You need to be logged in to create a tournament." />
        <LogIn className="h-16 w-16 text-primary my-6" />
        <Button asChild size="lg">
          <Link href={`/auth/login?redirect=/tournaments/new${searchParams.get("gameId") ? `?gameId=${searchParams.get("gameId")}` : '' }`}>
            Login to Create Tournament
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <PageTitle title="Create New Tournament" subtitle="Fill in the details to launch your own event!" />
      <Card>
        <CardHeader>
          <CardTitle>Tournament Details</CardTitle>
          <CardDescription>Provide all necessary information for your tournament.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Tournament Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="gameId">Game</Label>
              <Controller
                name="gameId"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <SelectTrigger id="gameId">
                      <SelectValue placeholder="Select a game..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGames.map(game => (
                        <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.gameId && <p className="text-destructive text-xs mt-1">{form.formState.errors.gameId.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register("description")} rows={4} />
              {form.formState.errors.description && <p className="text-destructive text-xs mt-1">{form.formState.errors.description.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date & Time</Label>
              <Controller
                name="startDate"
                control={form.control}
                render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP HH:mm") : <span>Pick a date and time</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                                if (date) {
                                    // Preserve time if already set, otherwise default to noon
                                    const currentTime = field.value ? { hours: field.value.getHours(), minutes: field.value.getMinutes() } : { hours: 12, minutes: 0 };
                                    date.setHours(currentTime.hours);
                                    date.setMinutes(currentTime.minutes);
                                }
                                field.onChange(date);
                            }}
                            initialFocus
                        />
                        <div className="p-3 border-t border-border">
                            <Label>Time (HH:MM)</Label>
                            <Input 
                                type="time" 
                                defaultValue={field.value ? format(field.value, "HH:mm") : "12:00"}
                                onChange={(e) => {
                                    const [hours, minutes] = e.target.value.split(':').map(Number);
                                    const newDate = field.value ? new Date(field.value) : new Date();
                                    newDate.setHours(hours);
                                    newDate.setMinutes(minutes);
                                    field.onChange(newDate);
                                }}
                            />
                        </div>
                        </PopoverContent>
                    </Popover>
                )}
                />
              {form.formState.errors.startDate && <p className="text-destructive text-xs mt-1">{form.formState.errors.startDate.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input id="maxParticipants" type="number" {...form.register("maxParticipants")} />
                {form.formState.errors.maxParticipants && <p className="text-destructive text-xs mt-1">{form.formState.errors.maxParticipants.message}</p>}
              </div>
              <div>
                <Label htmlFor="bracketType">Bracket Type</Label>
                 <Controller
                    name="bracketType"
                    control={form.control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="bracketType">
                        <SelectValue placeholder="Select bracket type..." />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Single Elimination">Single Elimination</SelectItem>
                        <SelectItem value="Double Elimination">Double Elimination</SelectItem>
                        <SelectItem value="Round Robin">Round Robin</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                {form.formState.errors.bracketType && <p className="text-destructive text-xs mt-1">{form.formState.errors.bracketType.message}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="prizePool">Prize Pool (Optional)</Label>
              <Input id="prizePool" {...form.register("prizePool")} placeholder="e.g., $1000, In-game items" />
            </div>

            <div>
              <Label htmlFor="rules">Rules (Optional)</Label>
              <Textarea id="rules" {...form.register("rules")} rows={3} placeholder="Specify any custom rules for your tournament." />
            </div>

            <Button type="submit" size="lg" disabled={form.formState.isSubmitting || isLoadingGames} className="w-full md:w-auto">
              {form.formState.isSubmitting || isLoadingGames ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {form.formState.isSubmitting || isLoadingGames ? "Processing..." : "Create Tournament"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
