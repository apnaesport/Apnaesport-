
"use client";

import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Swords } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Community, Game, TeamSize } from "@/lib/types";
import { addQuickTournamentToFirestore, getGamesFromFirestore, addAnnouncement } from "@/lib/tournamentStore";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const quickTournamentSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters."),
  gameId: z.string().min(1, "Please select a game."),
  mapName: z.string().optional(),
  teamSize: z.enum(["Solo", "Duo", "Squad"]),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM).")
});

type QuickTournamentFormData = z.infer<typeof quickTournamentSchema>;

interface QuickTournamentFormProps {
    community: Community;
}

export function QuickTournamentForm({ community }: QuickTournamentFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableGames, setAvailableGames] = useState<Game[]>([]);

    const form = useForm<QuickTournamentFormData>({
        resolver: zodResolver(quickTournamentSchema),
        defaultValues: {
            name: "",
            gameId: community.gameId || "",
            mapName: "",
            teamSize: "Solo",
            time: ""
        }
    });
    
    const selectedGameId = form.watch("gameId");
    const selectedGame = availableGames.find(g => g.id === selectedGameId);

    const fetchGames = useCallback(async () => {
        try {
            const games = await getGamesFromFirestore();
            setAvailableGames(games);
        } catch (error) {
            toast({ title: "Error", description: "Could not load games.", variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    const onSubmit: SubmitHandler<QuickTournamentFormData> = async (data) => {
        if (!user || user.uid !== community.ownerId) {
            toast({ title: "Unauthorized", description: "Only the community owner can create tournaments.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const tournamentId = await addQuickTournamentToFirestore(data, community, user);
            
            // Auto-post announcement
            await addAnnouncement(community.id, {
                authorId: user.uid,
                authorName: community.name,
                content: `A new quick tournament "${data.name}" has been created for ${data.time} today! Join now from the main tournament page.`,
                isAuto: true,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });

            toast({ title: "Tournament Created!", description: "Your quick tournament is live." });
            router.push(`/tournaments/${tournamentId}`);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not create tournament.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (user?.uid !== community.ownerId) {
        return null; // Don't show the form if not the owner
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Swords className="h-5 w-5 text-primary"/> Create a Quick Tournament</CardTitle>
                <CardDescription>Quickly set up a tournament for your community for today. Prizes are automatically handled based on entry fees.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Tournament Name</Label>
                            <Input id="name" {...form.register("name")} disabled={isSubmitting}/>
                            {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="time">Time (Today, 24hr format)</Label>
                            <Input id="time" type="time" {...form.register("time")} disabled={isSubmitting}/>
                             {form.formState.errors.time && <p className="text-destructive text-xs mt-1">{form.formState.errors.time.message}</p>}
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="gameId">Game</Label>
                            <Controller
                                name="gameId"
                                control={form.control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isSubmitting}>
                                        <SelectTrigger><SelectValue placeholder="Select game..."/></SelectTrigger>
                                        <SelectContent>
                                            {availableGames.map(game => <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                             {form.formState.errors.gameId && <p className="text-destructive text-xs mt-1">{form.formState.errors.gameId.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="teamSize">Team Size</Label>
                            <Controller
                                name="teamSize"
                                control={form.control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isSubmitting}>
                                        <SelectTrigger><SelectValue placeholder="Select team size..."/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Solo">Solo</SelectItem>
                                            <SelectItem value="Duo">Duo</SelectItem>
                                            <SelectItem value="Squad">Squad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {form.formState.errors.teamSize && <p className="text-destructive text-xs mt-1">{form.formState.errors.teamSize.message}</p>}
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="mapName">Map (Optional)</Label>
                         <Controller
                            name="mapName"
                            control={form.control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isSubmitting || !selectedGame?.mapNames?.length}>
                                    <SelectTrigger><SelectValue placeholder="Select map..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Any</SelectItem>
                                        {selectedGame?.mapNames?.map(map => <SelectItem key={map} value={map}>{map}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Create Tournament
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

