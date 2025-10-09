
"use client";

import { useState, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useTournaments, useUsers } from '@/lib/hooks';
import type { Tournament, Participant } from '@/lib/types';
import { createManualAchievement } from '@/lib/tournamentStore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Award } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const achievementSchema = z.object({
  tournamentId: z.string().min(1, "Please select a tournament."),
  userId: z.string().min(1, "Please select a participant."),
  rank: z.coerce.number().min(1).max(3),
  prize: z.coerce.number().min(0, "Prize must be 0 or more.").max(1000, "Prize cannot exceed 1000."),
});

type AchievementFormData = z.infer<typeof achievementSchema>;

export default function AdminAchievementsClient() {
    const { toast } = useToast();
    const { data: allTournaments = [], isLoading: isLoadingTournaments } = useTournaments({ status: 'Completed' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AchievementFormData>({
        resolver: zodResolver(achievementSchema),
        defaultValues: { tournamentId: "", userId: "", rank: 1, prize: 0 }
    });

    const selectedTournamentId = form.watch('tournamentId');
    const selectedTournament = useMemo(() => {
        return allTournaments.find(t => t.id === selectedTournamentId);
    }, [allTournaments, selectedTournamentId]);

    const onSubmit: SubmitHandler<AchievementFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            await createManualAchievement(data.tournamentId, data.userId, data.rank as 1 | 2 | 3, data.prize);
            toast({
                title: "Achievement Awarded!",
                description: "The user has been granted their achievement card and any associated prizes/points."
            });
            form.reset();
        } catch (error: any) {
            toast({
                title: "Error Awarding Achievement",
                description: error.message || "An unknown error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoadingTournaments) {
        return <Skeleton className="w-full h-96" />
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Manual Achievement Award</CardTitle>
                <CardDescription>
                    Select a completed tournament and a participant to grant them a winning achievement. This will also award them Pro Points and any prize you specify.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Use With Caution</AlertTitle>
                    <AlertDescription>
                       This action does not check if the user already has an achievement for this tournament. Awarding duplicates can cause issues.
                    </AlertDescription>
                </Alert>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                     <div>
                        <Label htmlFor="tournamentId">Select Completed Tournament</Label>
                        <Controller
                            name="tournamentId"
                            control={form.control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                    <SelectTrigger><SelectValue placeholder="Choose a tournament..." /></SelectTrigger>
                                    <SelectContent>
                                        {allTournaments.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.tournamentId && <p className="text-destructive text-xs mt-1">{form.formState.errors.tournamentId.message}</p>}
                    </div>

                    {selectedTournament && (
                         <div>
                            <Label htmlFor="userId">Select Participant</Label>
                            <Controller
                                name="userId"
                                control={form.control}
                                render={({ field }) => (
                                     <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                        <SelectTrigger><SelectValue placeholder="Choose a participant..." /></SelectTrigger>
                                        <SelectContent>
                                            {selectedTournament.participants.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name} ({p.gameUsername})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {form.formState.errors.userId && <p className="text-destructive text-xs mt-1">{form.formState.errors.userId.message}</p>}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="rank">Rank</Label>
                            <Controller
                                name="rank"
                                control={form.control}
                                render={({ field }) => (
                                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)} disabled={isSubmitting}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1st Place</SelectItem>
                                            <SelectItem value="2">2nd Place</SelectItem>
                                            <SelectItem value="3">3rd Place</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div>
                            <Label htmlFor="prize">Prize (AE Points)</Label>
                            <Input id="prize" type="number" {...form.register("prize")} disabled={isSubmitting}/>
                             {form.formState.errors.prize && <p className="text-destructive text-xs mt-1">{form.formState.errors.prize.message}</p>}
                        </div>
                    </div>

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Award className="mr-2 h-4 w-4" />}
                        Grant Achievement
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
