
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
import type { Game, Tournament, TournamentFormDataUI, TeamSize } from "@/lib/types";
import { CalendarIcon, PlusCircle, Loader2, LogIn, Coins, ShieldCheck, Lock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { addTournamentToFirestore, getGamesFromFirestore } from "@/lib/tournamentStore"; 
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const tournamentSchema = z.object({
  name: z.string().min(5, "Tournament name must be at least 5 characters."),
  gameId: z.string().min(1, "Please select a game."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(500, "Description must be 500 characters or less."),
  startDate: z.date({ required_error: "Start date is required."}).min(new Date(new Date().setHours(0,0,0,0)), "Start date cannot be in the past."), 
  maxParticipants: z.coerce.number().min(2, "Max participants must be at least 2.").max(256, "Max participants cannot exceed 256."),
  prizePool: z.coerce.number().min(0, "Prize pool must be 0 or more."),
  entryFee: z.coerce.number().min(0, "Entry fee must be 0 or more."),
  matchType: z.string({ required_error: "Match type is required."}),
  mapName: z.string().optional(),
  teamSize: z.enum(["Solo", "Duo", "Squad"], { required_error: "Team size is required." }),
  rules: z.string().optional(),
  registrationInstructions: z.string().optional(),
  featured: z.boolean().optional(),
  bannerImageUrl: z.string().url("Must be a valid URL.").or(z.literal("")).optional(),
  sponsorName: z.string().optional(),
  sponsorLogoUrl: z.string().url("Must be a valid URL for sponsor logo.").or(z.literal('')).optional(),
});


export default function CreateTournamentPage() {
  const { user, isAdmin, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const TOURNAMENT_CREATION_FEE = 40;

  const form = useForm<TournamentFormDataUI>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      gameId: searchParams.get("gameId") || "",
      description: "",
      startDate: undefined,
      maxParticipants: 16,
      prizePool: 0,
      entryFee: 0,
      matchType: "",
      mapName: "",
      teamSize: "Solo",
      rules: "",
      registrationInstructions: "",
      featured: false,
      bannerImageUrl: "",
      sponsorName: "",
      sponsorLogoUrl: "",
    },
  });
  
  const selectedGameId = form.watch("gameId");
  const selectedGame = availableGames.find(g => g.id === selectedGameId);

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
    if (user) { 
        fetchGames();
    }
  }, [user, fetchGames]);


  const onSubmit: SubmitHandler<TournamentFormDataUI> = async (data) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a tournament.", variant: "destructive" });
      return;
    }
     if ((user.points || 0) < TOURNAMENT_CREATION_FEE) {
        toast({ title: "Insufficient Points", description: `You need ${TOURNAMENT_CREATION_FEE} AE Points to create a tournament.`, variant: "destructive" });
        return;
    }

    setIsSubmittingForm(true);

    const selectedGame = availableGames.find(g => g.id === data.gameId);
    if (!selectedGame) {
      toast({ title: "Game Error", description: "Selected game is not valid.", variant: "destructive" });
      setIsSubmittingForm(false);
      return;
    }
    
    let finalStartDate = data.startDate;
    if (finalStartDate && finalStartDate.getHours() === 0 && finalStartDate.getMinutes() === 0 && finalStartDate.getSeconds() === 0) {
        const now = new Date();
        finalStartDate.setHours(now.getHours(), now.getMinutes());
        if (finalStartDate < new Date()) { 
            finalStartDate = new Date(data.startDate); 
            finalStartDate.setHours(23, 59); 
        }
    }

    const newTournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'status' | 'currency' | 'bracketType'> & { startDate: Date } = {
      name: data.name,
      gameId: data.gameId,
      gameName: selectedGame.name,
      gameIconUrl: selectedGame.iconUrl,
      bannerImageUrl: selectedGame.bannerUrl || `https://placehold.co/1200x400.png?text=${encodeURIComponent(data.name)}`,
      description: data.description,
      startDate: finalStartDate, 
      maxParticipants: data.maxParticipants,
      prizePool: data.prizePool || 0,
      matchType: data.matchType,
      mapName: data.mapName,
      teamSize: data.teamSize,
      rules: data.rules,
      registrationInstructions: data.registrationInstructions,
      organizerId: user.uid,
      organizer: user.displayName || user.email || "Unknown Organizer",
      participants: [], 
      matches: [], 
      featured: data.featured || false,
      entryFee: data.entryFee || 0,
      sponsorName: data.sponsorName || undefined,
      sponsorLogoUrl: data.sponsorLogoUrl || undefined,
    };
    
    try {
      const createdTournamentId = await addTournamentToFirestore(newTournamentData, user.uid); 
      await refreshUser();
      toast({
        title: "Tournament Created!",
        description: `"${data.name}" is live. ${TOURNAMENT_CREATION_FEE} AE Points were deducted.`,
      });
      router.push(`/tournaments/${createdTournamentId}`); 
    } catch (error: any) {
      console.error("Error creating tournament:", error);
      toast({ title: "Creation Failed", description: error.message || "Could not create tournament.", variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (authLoading || (user && isLoadingGames)) { 
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
            <Alert>
                <Coins className="h-4 w-4" />
                <AlertTitle>Creation Fee: {TOURNAMENT_CREATION_FEE} AE Points</AlertTitle>
                <AlertDescription>
                    This amount will be deducted from your balance of {user.points} AE Points upon creation.
                </AlertDescription>
            </Alert>
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
            
            {selectedGame && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="matchType">Match Type</Label>
                        <Controller name="matchType" control={form.control} render={({field}) => (
                             <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGame.matchTypes || selectedGame.matchTypes.length === 0}>
                                <SelectTrigger id="matchType"><SelectValue placeholder="Select match type..."/></SelectTrigger>
                                <SelectContent>
                                    {selectedGame.matchTypes?.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )} />
                         {form.formState.errors.matchType && <p className="text-destructive text-xs mt-1">{form.formState.errors.matchType.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="mapName">Map Name (Optional)</Label>
                        <Controller name="mapName" control={form.control} render={({field}) => (
                             <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGame.mapNames || selectedGame.mapNames.length === 0}>
                                <SelectTrigger id="mapName"><SelectValue placeholder="Select a map..."/></SelectTrigger>
                                <SelectContent>
                                     <SelectItem value="">Any / Not Specified</SelectItem>
                                    {selectedGame.mapNames?.map(map => <SelectItem key={map} value={map}>{map}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )} />
                         {form.formState.errors.mapName && <p className="text-destructive text-xs mt-1">{form.formState.errors.mapName.message}</p>}
                    </div>
                </div>
            )}

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
                                    const newDate = field.value ? new Date(field.value) : new Date(); 
                                    if (!field.value) { 
                                        const today = new Date();
                                        newDate.setDate(today.getDate());
                                        newDate.setMonth(today.getMonth());
                                        newDate.setFullYear(today.getFullYear());
                                    }
                                    newDate.setHours(hours);
                                    newDate.setMinutes(minutes);
                                    
                                    if (newDate < new Date() && !(newDate.toDateString() === new Date().toDateString() && newDate.getTime() >= new Date().getTime())) {
                                        toast({ title: "Invalid Time", description: "Cannot select a past time.", variant: "destructive" });
                                        
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
                <Label htmlFor="teamSize">Team Size</Label>
                 <Controller
                    name="teamSize"
                    control={form.control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isSubmittingForm}>
                        <SelectTrigger id="teamSize">
                        <SelectValue placeholder="Select team size..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Solo">Solo (1 Player)</SelectItem>
                          <SelectItem value="Duo">Duo (2 Players)</SelectItem>
                          <SelectItem value="Squad">Squad (4 Players)</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                {form.formState.errors.teamSize && <p className="text-destructive text-xs mt-1">{form.formState.errors.teamSize.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <Label htmlFor="entryFee">Entry Fee (in AE Points)</Label>
                <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500" />
                    <Input id="entryFee" type="number" step="1" {...form.register("entryFee")} className="pl-9" disabled={isSubmittingForm}/>
                </div>
                {form.formState.errors.entryFee && <p className="text-destructive text-xs mt-1">{form.formState.errors.entryFee.message}</p>}
              </div>
              <div>
                <Label htmlFor="prizePool">Total Prize Pool (AE Points)</Label>
                 <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500" />
                    <Input id="prizePool" type="number" step="1" {...form.register("prizePool")} className="pl-9" placeholder="e.g., 1000" disabled={isSubmittingForm} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">This amount will be increased by entry fees collected.</p>
                {form.formState.errors.prizePool && <p className="text-destructive text-xs mt-1">{form.formState.errors.prizePool.message}</p>}
              </div>
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
            
            <Card className="mt-6 border-dashed border-primary/50 relative bg-muted/30">
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                  <Lock className="h-8 w-8 text-primary mb-2"/>
                  <h3 className="font-bold text-lg text-foreground">Premium Feature</h3>
                  <p className="text-sm text-muted-foreground">This feature is available for premium users only.</p>
              </div>
              <div className="blur-sm select-none pointer-events-none">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" /> Sponsorship (Optional)
                    </CardTitle>
                    <CardDescription>Add sponsor details if this tournament is sponsored.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="sponsorName">Sponsor Name</Label>
                        <Input id="sponsorName" {...form.register("sponsorName")} placeholder="e.g., Awesome Corp" disabled={true} />
                    </div>
                    <div>
                        <Label htmlFor="sponsorLogoUrl">Sponsor Logo URL</Label>
                        <Input id="sponsorLogoUrl" {...form.register("sponsorLogoUrl")} placeholder="https://example.com/sponsor-logo.png" disabled={true} />
                    </div>
                </CardContent>
              </div>
            </Card>


            <Button type="submit" size="lg" disabled={isSubmittingForm || isLoadingGames || authLoading || (user.points || 0) < TOURNAMENT_CREATION_FEE} className="w-full md:w-auto">
              {isSubmittingForm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" /> }
              {isSubmittingForm ? "Creating..." : "Create Tournament"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    