
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Filter, Users, Loader2, LogIn } from "lucide-react";
import type { Community, Game, SiteSettings } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createCommunityInFirestore, getCommunitiesFromFirestore, getGamesFromFirestore } from '@/lib/tournamentStore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const communitySchema = z.object({
    name: z.string().min(3, "Community name must be at least 3 characters.").max(50, "Name cannot exceed 50 characters."),
    tagline: z.string().min(10, "Tagline must be at least 10 characters.").max(100, "Tagline cannot exceed 100 characters."),
    description: z.string().min(20, "Description must be at least 20 characters.").max(1000, "Description cannot exceed 1000 characters."),
    gameId: z.string().optional(),
});

type CommunityFormData = z.infer<typeof communitySchema>;

interface CommunityCardProps {
    community: Community;
    settings: SiteSettings | null;
    isMember: boolean;
}

const CommunityCard = ({ community, settings, isMember }: CommunityCardProps) => {
    const bannerSrc = community.bannerUrl || settings?.defaultCommunityBannerUrl || '';
    const logoSrc = community.logoUrl || settings?.defaultCommunityLogoUrl || '';

    return (
        <Card className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-all duration-300 group flex flex-col h-full">
            <CardHeader className="relative p-0 h-36 sm:h-40">
                <ImageWithFallback
                    src={bannerSrc}
                    fallbackSrc={`https://placehold.co/400x200.png?text=${encodeURIComponent(community.name)}`}
                    alt={`${community.name} banner`}
                    fill
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="esports community banner"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 w-full">
                    <div className="flex items-center gap-3">
                         <ImageWithFallback
                            src={logoSrc}
                            fallbackSrc={`https://placehold.co/40x40.png?text=${community.name.substring(0, 2)}`}
                            alt={`${community.name} logo`}
                            width={40}
                            height={40}
                            className="rounded-full border-2 border-background shadow-lg"
                            data-ai-hint="community logo"
                        />
                        <div>
                             <CardTitle className="text-lg font-bold text-white drop-shadow-md line-clamp-1">{community.name}</CardTitle>
                             <p className="text-xs text-slate-300 line-clamp-1">{community.tagline}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>
             <CardContent className="p-4 flex-grow">
                 <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <Badge variant="outline">{community.gameName || 'Variety'}</Badge>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{community.memberCount || 1}</span>
                    </div>
                </div>
             </CardContent>
             <CardFooter className="p-4 border-t">
                 <Button asChild className="w-full" variant={isMember ? "secondary" : "default"}>
                    <Link href={`/community/${community.id}`}>{isMember ? 'View Your Community' : 'View & Join'}</Link>
                </Button>
             </CardFooter>
        </Card>
    )
}

export default function CommunityHubPage() {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const { settings, loadingSettings } = useSiteSettings();
    const router = useRouter();
    const { toast } = useToast();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const form = useForm<CommunityFormData>({
        resolver: zodResolver(communitySchema),
        defaultValues: { name: "", tagline: "", description: "", gameId: "none" },
    });

    const fetchPageData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedCommunities, fetchedGames] = await Promise.all([
                getCommunitiesFromFirestore(),
                getGamesFromFirestore()
            ]);
            setCommunities(fetchedCommunities);
            setGames(fetchedGames);
        } catch (error) {
            console.error("Error fetching community data:", error);
            toast({ title: "Error", description: "Could not load community data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if(user) { // Only fetch if user is logged in
          fetchPageData();
        } else {
          setIsLoading(false); // Stop loading if no user
        }
    }, [user, fetchPageData]);

    const handleCreateCommunity: SubmitHandler<CommunityFormData> = async (data) => {
        if (!user) {
            toast({ title: "Not Authenticated", description: "You must be logged in to create a community.", variant: "destructive" });
            return;
        }
        if (user.communityId) {
            toast({ title: "Already in a Community", description: "You can only create or be a part of one community at a time.", variant: "destructive"});
            return;
        }

        setIsCreating(true);
        try {
            const finalGameId = data.gameId === 'none' ? undefined : data.gameId;
            const selectedGame = games.find(g => g.id === finalGameId);

            const newCommunityId = await createCommunityInFirestore({
                ...data,
                gameId: finalGameId,
                gameName: selectedGame?.name,
            }, user, settings);
            await refreshUser();
            toast({ title: "Community Created!", description: `Your community "${data.name}" is now live.` });
            router.push(`/community/${newCommunityId}`);
            setIsCreateDialogOpen(false);
            form.reset();
        } catch (error: any) {
            console.error("Error creating community:", error);
            toast({ title: "Creation Failed", description: error.message || "Could not create community.", variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    if (authLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      )
    }

    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <PageTitle title="Access Denied" subtitle="You need to be logged in to view and join communities." />
           <LogIn className="h-16 w-16 text-primary my-6" />
          <Button asChild size="lg">
            <Link href="/auth/login?redirect=/community">Login to View Communities</Link>
          </Button>
        </div>
      )
    }

    return (
        <div className="space-y-8">
            <PageTitle
                title="Community Hub"
                subtitle="Discover, join, and create communities. Compete together and grow your legacy."
                actions={
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}>
                                <DialogTrigger asChild>
                                  <Button disabled={!!user?.communityId}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Your Community
                                  </Button>
                                </DialogTrigger>
                            </span>
                          </TooltipTrigger>
                           {user?.communityId && (
                            <TooltipContent>
                                <p>You must leave your current community to create a new one.</p>
                            </TooltipContent>
                           )}
                        </Tooltip>
                      </TooltipProvider>
                      <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                              <DialogTitle>Create Your Community</DialogTitle>
                              <DialogDescription>
                                  Build your own space for your team, fans, or friends. Fill out the details to get started.
                              </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={form.handleSubmit(handleCreateCommunity)} className="space-y-4 py-4">
                              <div>
                                  <Label htmlFor="name">Community Name *</Label>
                                  <Input id="name" {...form.register("name")} disabled={isCreating} />
                                  {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
                              </div>
                               <div>
                                  <Label htmlFor="tagline">Tagline *</Label>
                                  <Input id="tagline" {...form.register("tagline")} placeholder="e.g., The official hub for top-tier gamers." disabled={isCreating} />
                                  {form.formState.errors.tagline && <p className="text-destructive text-xs mt-1">{form.formState.errors.tagline.message}</p>}
                              </div>
                              <div>
                                  <Label htmlFor="description">Description *</Label>
                                  <Textarea id="description" {...form.register("description")} rows={4} disabled={isCreating} />
                                  {form.formState.errors.description && <p className="text-destructive text-xs mt-1">{form.formState.errors.description.message}</p>}
                              </div>
                              <div>
                                <Label htmlFor="gameId">Primary Game (Optional)</Label>
                                <Controller
                                    name="gameId"
                                    control={form.control}
                                    render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isCreating}>
                                        <SelectTrigger id="gameId">
                                        <SelectValue placeholder="Select a game..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                        <SelectItem value="none">Variety Gaming (No specific game)</SelectItem>
                                        {games.map(game => (
                                            <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    )}
                                />
                                {form.formState.errors.gameId && <p className="text-destructive text-xs mt-1">{form.formState.errors.gameId.message}</p>}
                              </div>
                              <DialogFooter>
                                  <DialogClose asChild>
                                      <Button type="button" variant="outline" disabled={isCreating}>Cancel</Button>
                                  </DialogClose>
                                  <Button type="submit" disabled={isCreating}>
                                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      {isCreating ? "Creating..." : "Confirm & Create"}
                                  </Button>
                              </DialogFooter>
                          </form>
                      </DialogContent>
                  </Dialog>
                }
            />

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search communities by name..."
                        className="pl-10"
                        // Add state and onChange later
                    />
                </div>
                <Button variant="outline" className="w-full md:w-auto">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
            </div>

            {isLoading || loadingSettings ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                       <Card key={i}>
                           <Skeleton className="h-40 w-full"/>
                           <CardContent className="p-4 space-y-2">
                               <Skeleton className="h-5 w-3/4"/>
                               <Skeleton className="h-4 w-1/2"/>
                           </CardContent>
                           <CardFooter className="p-4 border-t">
                               <Skeleton className="h-10 w-full" />
                           </CardFooter>
                       </Card>
                    ))}
                </div>
            ) : communities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {communities.map(community => (
                        <CommunityCard key={community.id} community={community} settings={settings} isMember={user?.communityId === community.id} />
                    ))}
                </div>
            ) : (
                <Card className="text-center py-10">
                    <CardHeader>
                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <CardTitle>No Communities Yet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Be the first to create a community and start building your legacy!</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
