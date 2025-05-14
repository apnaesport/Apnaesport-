
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
import type { Game, Tournament, TournamentStatus, TournamentFormDataUI } from "@/lib/types";
import { CalendarIcon, PlusCircle, Loader2, LogIn, Upload } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { addTournament, getGames as fetchGamesFromStore } from "@/lib/tournamentStore"; // Updated import
import Image from "next/image";


const tournamentSchema = z.object({
  name: z.string().min(5, "Tournament name must be at least 5 characters."),
  gameId: z.string().min(1, "Please select a game."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(500, "Description must be 500 characters or less."),
  startDate: z.date({ required_error: "Start date is required."}),
  maxParticipants: z.coerce.number().min(2, "Max participants must be at least 2.").max(256, "Max participants cannot exceed 256."),
  prizePool: z.string().optional(),
  bracketType: z.enum(["Single Elimination", "Double Elimination", "Round Robin"], { required_error: "Bracket type is required."}),
  rules: z.string().optional(),
  bannerImageFile: z.custom<FileList>().optional(), // For the file input
  bannerImageDataUri: z.string().optional(), // To store the Data URL
});


export default function CreateTournamentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
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
      bannerImageDataUri: "",
    },
  });

  useEffect(() => {
    setIsLoadingGames(true);
    const gamesFromStore = fetchGamesFromStore();
    setAvailableGames(gamesFromStore);
    setIsLoadingGames(false);
    
    const preselectedGameId = searchParams.get("gameId");
    if (preselectedGameId && gamesFromStore.some(g => g.id === preselectedGameId)) {
      form.setValue("gameId", preselectedGameId);
    }
  }, [searchParams, form]);


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

    const selectedGame = availableGames.find(g => g.id === data.gameId);
    if (!selectedGame) {
      toast({ title: "Game Error", description: "Selected game is not valid.", variant: "destructive" });
      return;
    }

    const newTournament: Tournament = {
      id: `tourney-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: data.name,
      gameId: data.gameId,
      gameName: selectedGame.name,
      gameIconUrl: selectedGame.iconUrl,
      description: data.description,
      startDate: data.startDate,
      maxParticipants: data.maxParticipants,
      prizePool: data.prizePool,
      bracketType: data.bracketType,
      rules: data.rules,
      bannerImageUrl: data.bannerImageDataUri || `https://placehold.co/1200x400.png?text=${encodeURIComponent(data.name)}`,
      organizerId: user.uid,
      organizer: user.displayName || user.email || "Unknown Organizer",
      participants: [], // Initially no participants
      status: "Upcoming" as TournamentStatus,
      matches: [], // Initially no matches
    };
    
    console.log("Submitting new tournament:", newTournament);
    form.control.formState.isSubmitting; // to ensure isSubmitting is tracked

    try {
      addTournament(newTournament); // Add to the client-side store
      toast({
        title: "Tournament Created!",
        description: `"${data.name}" has been successfully created.`,
      });
      router.push(`/tournaments/${newTournament.id}`); 
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
              <Label htmlFor="bannerImageFile">Tournament Banner Image</Label>
              <Input 
                id="bannerImageFile" 
                type="file" 
                accept="image/png, image/jpeg, image/webp" 
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                onChange={handleBannerImageChange} 
              />
              {bannerPreview && (
                <div className="mt-4 relative w-full aspect-[16/9] rounded-md overflow-hidden border">
                  <Image src={bannerPreview} alt="Banner preview" layout="fill" objectFit="cover" data-ai-hint="tournament banner preview"/>
                </div>
              )}
               <p className="text-xs text-muted-foreground mt-1">Optional. Recommended aspect ratio 16:9. Max file size 2MB.</p>
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
                                    const currentTime = field.value ? { hours: field.value.getHours(), minutes: field.value.getMinutes() } : { hours: 12, minutes: 0 };
                                    date.setHours(currentTime.hours);
                                    date.setMinutes(currentTime.minutes);
                                }
                                field.onChange(date);
                            }}
                            initialFocus
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
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
                                    if (newDate < new Date()) { // Basic past time check for today
                                      if (new Date(newDate).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) && (hours < new Date().getHours() || (hours === new Date().getHours() && minutes < new Date().getMinutes()))) {
                                        toast({ title: "Invalid Time", description: "Cannot select a past time for today.", variant: "destructive" });
                                        return;
                                      }
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
