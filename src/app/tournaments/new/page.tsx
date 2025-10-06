

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
import { CalendarIcon, PlusCircle, Loader2, LogIn, Coins, ShieldCheck, Lock, Image as ImageIcon, Handshake, Trophy, TestTube2 } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { addTournamentToFirestore, getGamesFromFirestore } from "@/lib/tournamentStore"; 
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";


const tournamentSchema = z.object({
  name: z.string().min(5, "Tournament name must be at least 5 characters."),
  gameId: z.string().min(1, "Please select a game."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(500, "Description must be 500 characters or less."),
  startDate: z.date({ required_error: "Start date is required."}).min(new Date(new Date().setHours(0,0,0,0)), "Start date cannot be in the past."), 
  status: z.enum(["Upcoming", "Live", "Ongoing", "Completed", "Cancelled"]),
  maxParticipants: z.coerce.number().min(2, "Max participants must be at least 2.").max(256, "Max participants cannot exceed 256."),
  entryFee: z.coerce.number().min(0, "Entry fee must be 0 or more.").max(40, "Entry fee cannot exceed 40."),
  matchType: z.string({ required_error: "Match type is required."}).min(1, "Match type is required."),
  mapName: z.string().optional(),
  teamSize: z.enum(["Solo", "Duo", "Squad"], { required_error: "Team size is required." }),
  rules: z.string().optional(),
  registrationInstructions: z.string().optional(),
  featured: z.boolean().optional(),
  bannerImageUrl: z.string().url("Must be a valid URL.").or(z.literal("")).optional(),
  bannerImageFile: z.custom<FileList>().optional(),
  sponsorName: z.string().optional(),
  sponsorLogoUrl: z.string().url("Must be a valid URL for sponsor logo.").or(z.literal('')).optional(),
  isMock: z.boolean().optional(),
  mockParticipantCount: z.coerce.number().min(2).max(256).optional(),
});


export default function CreateTournamentPage() {
  const { user, isAdmin, isPremium, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const TOURNAMENT_CREATION_FEE = 40;

  const form = useForm<TournamentFormDataUI>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      gameId: searchParams.get("gameId") || "",
      description: "",
      startDate: undefined,
      status: "Upcoming",
      maxParticipants: 16,
      entryFee: 0,
      matchType: "",
      mapName: "any",
      teamSize: "Solo",
      rules: "",
      registrationInstructions: "",
      featured: false,
      bannerImageUrl: "",
      sponsorName: "",
      sponsorLogoUrl: "",
      isMock: false,
      mockParticipantCount: 16,
    },
  });
  
  const selectedGameId = form.watch("gameId");
  const isMock = form.watch("isMock");
  const selectedGame = availableGames.find(g => g.id === selectedGameId);
  const entryFee = form.watch("entryFee");
  const maxParticipants = form.watch("maxParticipants");

  const totalPrizePool = entryFee * maxParticipants;
  const firstPrize = Math.floor(totalPrizePool * 0.5);
  const secondPrize = Math.floor(totalPrizePool * 0.3);
  const thirdPrize = Math.floor(totalPrizePool * 0.2);


  const fetchGames = useCallback(async () => {
    setIsLoadingGames(true);
    try {
      const gamesFromDb = await getGamesFromFirestore();
      setAvailableGames(gamesFromDb);
      const preselectedGameId = searchParams.get("gameId");
      if (preselectedGameId) {
          const game = gamesFromDb.find(g => g.id === preselectedGameId);
          if (game) {
              form.setValue("gameId", preselectedGameId);
              form.setValue("matchType", game.matchTypes?.[0] || "");
              form.setValue("mapName", "any");
          }
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
     if (!data.isMock && (user.points || 0) < TOURNAMENT_CREATION_FEE) {
        toast({ title: "Insufficient Points", description: `You need ${TOURNAMENT_CREATION_FEE} AE Points to create a real tournament.`, variant: "destructive" });
        return;
    }

    setIsSubmittingForm(true);

    const selectedGame = availableGames.find(g => g.id === data.gameId);
    if (!selectedGame) {
      toast({ title: "Game Error", description: "Selected game is not valid.", variant: "destructive" });
      setIsSubmittingForm(false);
      return;
    }
    
    let finalBannerUrl = data.bannerImageUrl || selectedGame.bannerUrl || `https://placehold.co/1200x400.png?text=${encodeURIComponent(data.name)}`;
    if (isPremium && bannerPreview && bannerPreview.startsWith('data:')) {
        finalBannerUrl = bannerPreview;
    }

    const newTournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'prizePool'> & { status: TournamentStatus } = {
      name: data.name,
      gameId: data.gameId,
      gameName: selectedGame.name,
      gameIconUrl: selectedGame.iconUrl,
      bannerImageUrl: finalBannerUrl,
      description: data.description,
      startDate: data.startDate, 
      status: data.isMock ? data.status : "Upcoming",
      maxParticipants: data.maxParticipants,
      entryFee: data.isMock ? 0 : (data.entryFee || 0),
      matchType: data.matchType,
      mapName: data.mapName === "any" ? "" : data.mapName,
      teamSize: data.teamSize,
      rules: data.rules,
      registrationInstructions: data.registrationInstructions,
      organizerId: user.uid,
      organizer: user.displayName || user.email || "Unknown Organizer",
      participants: [], 
      matches: [], 
      featured: data.featured || false,
      sponsorName: isPremium ? data.sponsorName || undefined : undefined,
      sponsorLogoUrl: isPremium ? data.sponsorLogoUrl || undefined : undefined,
      isMock: data.isMock,
    };
    
    try {
      const createdTournamentId = await addTournamentToFirestore(newTournamentData, user, data.mockParticipantCount);
      if (!data.isMock) {
        await refreshUser();
      }
      toast({
        title: "Tournament Created!",
        description: `"${data.name}" is live. ${!data.isMock ? `${TOURNAMENT_CREATION_FEE} AE Points were deducted.` : ''}`,
      });
      router.push(`/tournaments/${createdTournamentId}`); 
    } catch (error: any) {
      console.error("Error creating tournament:", error);
      toast({ title: "Creation Failed", description: error.message || "Could not create tournament.", variant: "destructive" });
    } finally {
      setIsSubmittingForm(false);
    }
  };
  
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setBannerPreview(null);
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
            {!isMock && (
              <Alert>
                  <Coins className="h-4 w-4" />
                  <AlertTitle>Creation Fee: {TOURNAMENT_CREATION_FEE} AE Points</AlertTitle>
                  <AlertDescription>
                      This amount will be deducted from your balance of {user.points} AE Points upon creation.
                  </AlertDescription>
              </Alert>
            )}

            {isAdmin && (
                 <Controller
                    name="isMock"
                    control={form.control}
                    render={({ field }) => (
                      <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
                        <TestTube2 className="h-4 w-4 text-amber-500" />
                        <AlertTitle className="flex items-center justify-between">
                            <Label htmlFor="isMockSwitch" className="font-semibold text-amber-500">
                                Create as Mock Tournament (Admin Only)
                            </Label>
                            <Switch
                                id="isMockSwitch"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isSubmittingForm}
                            />
                        </AlertTitle>
                        <AlertDescription>
                            Mock tournaments are for visual purposes only. They will be auto-filled with fake participants and cannot be joined.
                        </AlertDescription>
                      </Alert>
                    )}
                 />
            )}

            {isAdmin && isMock && (
              <div className="space-y-2">
                <Label htmlFor="mockParticipantCount">Fake Participant Count</Label>
                <Controller
                  name="mockParticipantCount"
                  control={form.control}
                  render={({ field }) => (
                    <Slider
                      id="mockParticipantCount"
                      min={8} max={100} step={1}
                      value={[field.value || 16]}
                      onValueChange={(value) => field.onChange(value[0])}
                      disabled={isSubmittingForm}
                    />
                  )}
                />
                <p className="text-sm text-muted-foreground text-center">{form.watch('mockParticipantCount') || 16} mock participants will be generated.</p>
              </div>
            )}

            <div>
              <Label htmlFor="name">Tournament Name</Label>
              <Input id="name" {...form.register("name")} disabled={isSubmittingForm} />
              {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gameId">Game</Label>
                <Controller
                  name="gameId"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        const game = availableGames.find(g => g.id === value);
                        form.setValue('matchType', game?.matchTypes?.[0] || "");
                        form.setValue('mapName', 'any');
                    }} value={field.value} defaultValue={field.value} disabled={isSubmittingForm || isLoadingGames}>
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
              {isAdmin && isMock && (
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Controller name="status" control={form.control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Upcoming">Upcoming</SelectItem>
                                <SelectItem value="Live">Live</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    )} />
                </div>
              )}
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
                                     <SelectItem value="any">Any / Not Specified</SelectItem>
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
            
            <div className="space-y-2">
                <Label>Tournament Banner</Label>
                <div className="relative p-4 border-2 border-dashed rounded-lg">
                    {!isPremium && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                            <Lock className="h-8 w-8 text-primary mb-2"/>
                            <h3 className="font-bold text-lg text-foreground">Premium Feature</h3>
                            <p className="text-sm text-muted-foreground">Unlock custom banner uploads with Premium status.</p>
                             <Button variant="link" asChild><Link href="/premium">Learn More</Link></Button>
                        </div>
                    )}
                    <div className={!isPremium ? 'blur-sm select-none pointer-events-none' : ''}>
                        <p className="text-sm text-muted-foreground mb-2">Upload a custom banner (1200x400 recommended). If none is provided, the game's default banner will be used.</p>
                        <Input id="bannerImageFile" type="file" {...form.register("bannerImageFile")} className="file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" accept="image/*" onChange={handleFileChange} disabled={!isPremium || isSubmittingForm}/>
                        {bannerPreview && <Image src={bannerPreview} alt="Banner preview" width={400} height={200} className="rounded-md border object-cover aspect-video mt-2" data-ai-hint='custom banner preview' unoptimized />}
                        <Input {...form.register("bannerImageUrl")} placeholder="Or enter Banner URL" className="mt-2" disabled={!isPremium || isSubmittingForm}/>
                        {form.formState.errors.bannerImageUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.bannerImageUrl.message}</p>}
                    </div>
                </div>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date & Time (IST)</Label>
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
                            onSelect={field.onChange}
                            initialFocus
                            disabled={isSubmittingForm || ((date) => date < new Date(new Date().setDate(new Date().getDate() -1)))} 
                        />
                        <div className="p-3 border-t border-border">
                            <Label>Time (IST)</Label>
                            <Input 
                                type="time" 
                                defaultValue={field.value ? format(field.value, "HH:mm") : "12:00"}
                                disabled={isSubmittingForm}
                                onChange={(e) => {
                                    const [hours, minutes] = e.target.value.split(':').map(Number);
                                    const newDate = field.value ? new Date(field.value) : new Date();
                                    newDate.setHours(hours, minutes);
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
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Entry Fee & Prize Pool</CardTitle>
                    <CardDescription>Set the entry fee. The prize pool is calculated automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label htmlFor="entryFee">Entry Fee</Label>
                         <Controller
                            name="entryFee"
                            control={form.control}
                            render={({ field }) => (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">{field.value === 0 ? "Free Entry" : `${field.value} AE Coins`}</span>
                                        <Button type="button" variant="outline" size="sm" onClick={() => field.onChange(0)}>Set as Free</Button>
                                    </div>
                                    <Slider
                                        id="entryFee"
                                        min={0}
                                        max={40}
                                        step={5}
                                        value={[field.value]}
                                        onValueChange={(value) => field.onChange(value[0])}
                                        disabled={isSubmittingForm || isMock}
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Free</span>
                                        <span>5</span>
                                        <span>10</span>
                                        <span>15</span>
                                        <span>20</span>
                                        <span>25</span>
                                        <span>30</span>
                                        <span>35</span>
                                        <span>40</span>
                                    </div>
                                </div>
                            )}
                         />
                        {form.formState.errors.entryFee && <p className="text-destructive text-xs mt-1">{form.formState.errors.entryFee.message}</p>}
                     </div>
                     {entryFee > 0 && !isMock && (
                        <Alert variant="default" className="border-primary/30">
                            <Trophy className="h-4 w-4" />
                            <AlertTitle>Estimated Prize Pool: {totalPrizePool} AE Coins</AlertTitle>
                            <AlertDescription>
                                Based on a full tournament ({maxParticipants} players). Prizes are:
                                <ul className="list-disc pl-5 mt-2">
                                    <li>1st Place: {firstPrize} AE Coins</li>
                                    <li>2nd Place: {secondPrize} AE Coins</li>
                                    <li>3rd Place: {thirdPrize} AE Coins</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                     )}
                </CardContent>
            </Card>


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
              {!isPremium && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center">
                      <Lock className="h-8 w-8 text-primary mb-2"/>
                      <h3 className="font-bold text-lg text-foreground">Premium Feature</h3>
                      <p className="text-sm text-muted-foreground">Add a sponsor to your tournament with Premium status.</p>
                      <Button variant="link" asChild><Link href="/premium">Learn More</Link></Button>
                  </div>
              )}
              <div className={!isPremium ? 'blur-sm select-none pointer-events-none' : ''}>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-primary" /> Sponsorship (Optional)
                    </CardTitle>
                    <CardDescription>Add sponsor details if this tournament is sponsored.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="sponsorName">Sponsor Name</Label>
                        <Input id="sponsorName" {...form.register("sponsorName")} placeholder="e.g., Awesome Corp" disabled={!isPremium || isSubmittingForm} />
                    </div>
                    <div>
                        <Label htmlFor="sponsorLogoUrl">Sponsor Logo URL</Label>
                        <Input id="sponsorLogoUrl" {...form.register("sponsorLogoUrl")} placeholder="https://example.com/sponsor-logo.png" disabled={!isPremium || isSubmittingForm} />
                    </div>
                </CardContent>
              </div>
            </Card>


            <Button type="submit" size="lg" disabled={isSubmittingForm || isLoadingGames || authLoading || (!isMock && (user.points || 0) < TOURNAMENT_CREATION_FEE)} className="w-full md:w-auto">
              {isSubmittingForm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" /> }
              {isSubmittingForm ? "Creating..." : "Create Tournament"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
