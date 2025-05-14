
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
import { useState, useEffect, useCallback } from "react";
import type { Game, Tournament, TournamentStatus, TournamentFormDataUI } from "@/lib/types";
import { CalendarIcon, PlusCircle, Loader2, LogIn } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { addTournamentToFirestore, getGamesFromFirestore } from "@/lib/tournamentStore"; 
import Image from "next/image";


const tournamentSchema = z.object({
  name: z.string().min(5, "Tournament name must be at least 5 characters."),
  gameId: z.string().min(1, "Please select a game."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(500, "Description must be 500 characters or less."),
  startDate: z.date({ required_error: "Start date is required."}).min(new Date(new Date().setHours(0,0,0,0)), "Start date cannot be in the past."), // Prevent past dates
  maxParticipants: z.coerce.number().min(2, "Max participants must be at least 2.").max(256, "Max participants cannot exceed 256."),
  prizePool: z.string().optional(),
  bracketType: z.enum(["Single Elimination", "Double Elimination", "Round Robin"], { required_error: "Bracket type is required."}),
  rules: z.string().optional(),
  registrationInstructions: z.string().optional(),
  bannerImageFile: z.custom<FileList>().optional(), 
  bannerImageDataUri: z.string().optional(), 
});


export default function CreateTournamentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const form = useForm<TournamentFormDataUI>({
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
      registrationInstructions: "",
      bannerImageDataUri: "",
    },
  });

  const fetchGames = useCallback(async () => {
    setIsLoadingGames(true);
    try {
      const gamesFromDb = await getGamesFromFirestore();
      setAvailableGames(gamesFromDb);
      const preselectedGameId = searchParams.get("gameId");
      if (preselectedGameId && gamesFromDb.some(g => g.id === preselectedGameId)) {
        form.setValue("gameId", preselectedGameId);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      toast({ title: "Error", description: "Could not load games.", variant: "destructive" });
    }
    setIsLoadingGames(false);
  }, [searchParams, form, toast]);

  useEffect(() => {
    if (user) { // Fetch games only if user is logged in
        fetchGames();
    }
  }, [user, fetchGames]);


  const handleBannerImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        form.setValue("bannerImageDataUri", dataUri);
        setBannerPreview(dataUri);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue("bannerImageDataUri", "");
      setBannerPreview(null);
    }
  };

  const onSubmit: SubmitHandler<TournamentFormDataUI> = async (data) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a tournament.", variant: "destructive" });
      return;
    }
    setIsSubmittingForm(true);

    const selectedGame = availableGames.find(g => g.id === data.gameId);
    if (!selectedGame) {
      toast({ title: "Game Error", description: "Selected game is not valid.", variant: "destructive" });
      setIsSubmittingForm(false);
      return;
    }

    // Ensure startDate has time component if not set by time input explicitly
    let finalStartDate = data.startDate;
    if (finalStartDate && finalStartDate.getHours() === 0 && finalStartDate.getMinutes() === 0 && finalStartDate.getSeconds() === 0) {
        const now = new Date();
        finalStartDate.setHours(now.getHours(), now.getMinutes());
        if (finalStartDate < new Date()) { // If setting time makes it past for today, adjust
            finalStartDate = new Date(data.startDate); // reset to original date part
            finalStartDate.setHours(23, 59); // default to end of day
        }
    }


    const newTournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'startDate'> & { startDate: Date } = {
      name: data.name,
      gameId: data.gameId,
      gameName: selectedGame.name,
      gameIconUrl: selectedGame.iconUrl,
      description: data.description,
      startDate: finalStartDate, // Already a Date object from the form
      maxParticipants: data.maxParticipants,
      prizePool: data.prizePool,
      bracketType: data.bracketType,
      rules: data.rules,
      registrationInstructions: data.registrationInstructions,
      bannerImageUrl: data.bannerImageDataUri || `https://placehold.co/1200x400.png?text=${encodeURIComponent(data.name)}`,
      organizerId: user.uid,
      organizer: user.displayName || user.email || "Unknown Organizer",
      participants: [], 
      status: "Upcoming" as TournamentStatus,
      matches: [], 
    };
    
    console.log("Submitting new tournament to Firestore:", newTournamentData);

    try {
      const createdTournament = await addTournamentToFirestore(newTournamentData); 
      toast({
        title: "Tournament Created!",
        description: `"${data.name}" has been successfully created.`,
      });
      router.push(`/tournaments/${createdTournament.id}`); 
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({ title: "Creation Failed", description: "Could not create tournament. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (authLoading || (user && isLoadingGames)) { // Show loader if auth is loading OR user is logged in and games are loading
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading creation tools...</p>
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
              <Input id="name" {...form.register("name")} disabled={isSubmittingForm} />
              {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="gameId">Game</Label>
              <Controller
                name="gameId"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isSubmittingForm || isLoadingGames}>
                    <SelectTrigger id="gameId">
                      <SelectValue placeholder="Select a game..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGames.length === 0 && isLoadingGames && <SelectItem value="loading" disabled>Loading games...</SelectItem>}
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
              <Label htmlFor="bannerImageFile">Tournament Banner Image</Label>
              <Input 
                id="bannerImageFile" 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                onChange={handleBannerImageChange} 
                disabled={isSubmittingForm}
              />
              {bannerPreview && (
                <div className="mt-4 relative w-full aspect-[16/9] rounded-md overflow-hidden border">
                  <Image src={bannerPreview} alt="Banner preview" layout="fill" objectFit="cover" data-ai-hint="tournament banner preview" unoptimized />
                </div>
              )}
               <p className="text-xs text-muted-foreground mt-1">Optional. Recommended aspect ratio 16:9. Max file size 2MB.</p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register("description")} rows={4} disabled={isSubmittingForm} />
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
                            disabled={isSubmittingForm}
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
                                    const currentTime = field.value ? { hours: field.value.getHours(), minutes: field.value.getMinutes() } : { hours: 12, minutes: 0 };
                                    date.setHours(currentTime.hours);
                                    date.setMinutes(currentTime.minutes);
                                }
                                field.onChange(date);
                            }}
                            initialFocus
                            disabled={isSubmittingForm || ((date) => date < new Date(new Date().setDate(new Date().getDate() -1)))} 
                        />
                        <div className="p-3 border-t border-border">
                            <Label>Time (HH:MM)</Label>
                            <Input 
                                type="time" 
                                defaultValue={field.value ? format(field.value, "HH:mm") : "12:00"}
                                disabled={isSubmittingForm}
                                onChange={(e) => {
                                    const [hours, minutes] = e.target.value.split(':').map(Number);
                                    const newDate = field.value ? new Date(field.value) : new Date(); // Ensure date part is today if field.value is null
                                    if (!field.value) { // if no date was picked yet, set newDate to today
                                        const today = new Date();
                                        newDate.setDate(today.getDate());
                                        newDate.setMonth(today.getMonth());
                                        newDate.setFullYear(today.getFullYear());
                                    }
                                    newDate.setHours(hours);
                                    newDate.setMinutes(minutes);
                                    
                                    if (newDate < new Date() && !(newDate.toDateString() === new Date().toDateString() && newDate.getTime() >= new Date().getTime())) {
                                        toast({ title: "Invalid Time", description: "Cannot select a past time.", variant: "destructive" });
                                        // Optionally reset time input or prevent change
                                        return;
                                    }
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
                <Input id="maxParticipants" type="number" {...form.register("maxParticipants")} disabled={isSubmittingForm} />
                {form.formState.errors.maxParticipants && <p className="text-destructive text-xs mt-1">{form.formState.errors.maxParticipants.message}</p>}
              </div>
              <div>
                <Label htmlFor="bracketType">Bracket Type</Label>
                 <Controller
                    name="bracketType"
                    control={form.control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmittingForm}>
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
              <Input id="prizePool" {...form.register("prizePool")} placeholder="e.g., $1000, In-game items" disabled={isSubmittingForm} />
            </div>

            <div>
              <Label htmlFor="rules">Rules (Optional)</Label>
              <Textarea id="rules" {...form.register("rules")} rows={3} placeholder="Specify any custom rules for your tournament." disabled={isSubmittingForm}/>
            </div>

            <div>
              <Label htmlFor="registrationInstructions">Registration Instructions (Optional)</Label>
              <Textarea id="registrationInstructions" {...form.register("registrationInstructions")} rows={3} placeholder="e.g., How to join, in-game ID requirements, Discord server link..." disabled={isSubmittingForm}/>
              {form.formState.errors.registrationInstructions && <p className="text-destructive text-xs mt-1">{form.formState.errors.registrationInstructions.message}</p>}
            </div>

            <Button type="submit" size="lg" disabled={isSubmittingForm || isLoadingGames || authLoading} className="w-full md:w-auto">
              {isSubmittingForm ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              {isSubmittingForm ? "Creating..." : "Create Tournament"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
