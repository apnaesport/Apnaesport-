
"use client";

import { PageTitle } from '@/components/shared/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, Star, Users, Loader2, Send, CheckCircle, Clock } from 'lucide-react';
import { CreatorCard } from '@/components/creators/CreatorCard';
import { TopCreatorItem } from '@/components/creators/TopCreatorItem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Creator, CreatorApplication } from '@/lib/types';
import { submitCreatorApplicationInFirestore, listenToCreators, listenToTopCreators, getMyApplicationsFromFirestore } from '@/lib/tournamentStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AdsterraBlock } from '@/components/ads/AdsterraBlock';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import React from 'react';

const applicationSchema = z.object({
    creatorName: z.string().min(3, "Creator name must be at least 3 characters.").max(30, "Creator name is too long."),
    logoUrl: z.string().url("Please enter a valid URL for the logo.").optional().or(z.literal('')),
    channelUrl: z.string().url("Please enter a valid URL (e.g., https://youtube.com/yourchannel)."),
    tags: z.string().min(2, "Please add at least one tag (e.g., FPS, MOBA).").max(50, "Tags are too long."),
    message: z.string().max(500, "Message cannot exceed 500 characters.").optional(),
});
type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function CreatorHubPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [isCreator, setIsCreator] = useState(false);
  const adFrequency = settings?.adFrequencyInLists || 0;


  useEffect(() => {
    const unsubscribeCreators = listenToCreators((data) => {
        setCreators(data);
        if (user) {
            const userIsCreator = data.some(c => c.userId === user.uid);
            setIsCreator(userIsCreator);
            if(userIsCreator) setApplicationStatus('approved');
        }
        if (isLoading) setIsLoading(false);
    });
    
    const unsubscribeTopCreators = listenToTopCreators(3, (data) => {
        setTopCreators(data);
    });

    return () => {
        unsubscribeCreators();
        unsubscribeTopCreators();
    };
  }, [isLoading, user]);

  useEffect(() => {
    if (user && !isCreator) {
      getMyApplicationsFromFirestore(user.uid).then(apps => {
        if (apps.length > 0) {
          const latestApp = apps[0];
          if (latestApp.status === 'Pending') {
            setApplicationStatus('pending');
          } else if (latestApp.status === 'Rejected') {
            setApplicationStatus('rejected');
          }
        } else {
            setApplicationStatus('none');
        }
      });
    } else if (!user) {
      setApplicationStatus('none');
    }
  }, [user, isCreator]);

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { creatorName: user?.displayName || "", logoUrl: user?.photoURL || "", channelUrl: "", tags: "", message: "" },
  });

  const onSubmitApplication: SubmitHandler<ApplicationFormData> = async (data) => {
    if (!user) {
        toast({ title: "Not Logged In", description: "You must be logged in to apply.", variant: "destructive" });
        return;
    }
     if (!user.communityId) {
        toast({ title: "Community Required", description: "You must be a member of a community to apply.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
        const appData: Omit<CreatorApplication, 'id' | 'createdAt'> = {
            userId: user.uid,
            name: user.displayName || 'Unknown',
            email: user.email || 'Unknown',
            photoURL: user.photoURL || '',
            communityId: user.communityId,
            ...data
        };
        await submitCreatorApplicationInFirestore(appData);
        toast({ title: "Application Submitted!", description: "We'll review your application and get back to you soon." });
        setApplicationStatus('pending');
        setIsDialogOpen(false);
        form.reset();
    } catch (error: any) {
        toast({ title: "Submission Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  const itemsWithAds = useMemo(() => {
    if (!adFrequency || adFrequency <= 0) return creators;

    const newItems: (Creator | { isAd: true })[] = [];
    creators.forEach((item, index) => {
      newItems.push(item);
      if ((index + 1) % adFrequency === 0) {
        newItems.push({ isAd: true });
      }
    });
    return newItems;
  }, [creators, adFrequency]);

  const renderJoinButton = () => {
    if (authLoading) {
      return <Skeleton className="h-10 w-full" />;
    }
    if (applicationStatus === 'approved') {
      return <Button className="w-full" disabled variant="outline"><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Verified Creator</Button>;
    }
    if (applicationStatus === 'pending') {
      return <Button className="w-full" disabled variant="outline"><Clock className="mr-2 h-4 w-4 text-yellow-500" /> Application In Progress</Button>;
    }
    
    const needsCommunity = !user?.communityId;
    
    return (
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <DialogTrigger asChild>
                    <Button className="w-full" disabled={needsCommunity}>Join as Creator</Button>
                  </DialogTrigger>
                </div>
              </TooltipTrigger>
              {needsCommunity && (
                <TooltipContent>
                  <p>You must join a community to become a creator.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Become a Creator</DialogTitle>
                  <DialogDescription>Fill out the form below to apply. We'll review your application and get back to you soon.</DialogDescription>
              </DialogHeader>
              {user ? (
              <form onSubmit={form.handleSubmit(onSubmitApplication)} className="space-y-4">
                  <div>
                      <Label htmlFor="creatorName">Creator Name *</Label>
                      <Input id="creatorName" {...form.register("creatorName")} placeholder="Your official creator name" />
                      {form.formState.errors.creatorName && <p className="text-destructive text-xs mt-1">{form.formState.errors.creatorName.message}</p>}
                  </div>
                   <div>
                      <Label htmlFor="logoUrl">Creator Logo URL</Label>
                      <Input id="logoUrl" {...form.register("logoUrl")} placeholder="https://example.com/your-logo.png" />
                      {form.formState.errors.logoUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.logoUrl.message}</p>}
                  </div>
                  <div>
                      <Label htmlFor="channelUrl">YouTube/Twitch Channel URL *</Label>
                      <Input id="channelUrl" {...form.register("channelUrl")} placeholder="https://youtube.com/c/YourChannel" />
                      {form.formState.errors.channelUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.channelUrl.message}</p>}
                  </div>
                  <div>
                      <Label htmlFor="tags">Primary Game / Tags *</Label>
                      <Input id="tags" {...form.register("tags")} placeholder="e.g., BGMI, FPS, Variety Streamer" />
                      {form.formState.errors.tags && <p className="text-destructive text-xs mt-1">{form.formState.errors.tags.message}</p>}
                  </div>
                  <div>
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea id="message" {...form.register("message")} placeholder="Tell us a bit about yourself and your content." />
                      {form.formState.errors.message && <p className="text-destructive text-xs mt-1">{form.formState.errors.message.message}</p>}
                  </div>
                  <div className="flex justify-end gap-2">
                      <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                      <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit Application
                      </Button>
                  </div>
              </form>
              ) : (
                  <p className="text-center text-muted-foreground py-4">Please log in to apply.</p>
              )}
          </DialogContent>
        </Dialog>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="bg-card/50 border border-primary/20 shadow-lg overflow-hidden">
           <CardContent className="p-8 relative">
              <div className="absolute top-0 right-0 h-48 w-48 bg-gradient-to-l from-primary/20 to-transparent rounded-bl-full opacity-50"/>
              <div className="relative z-10">
                <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent rounded-full mb-4 shadow-[0_0_15px_hsl(var(--primary))]"/>
                <PageTitle
                  title="Where Rising Creators Get Noticed"
                  subtitle="Apna Esport Creator helps small and mid-level gaming creators grow with community voting, featured showcases, and verified creator badges."
                  className="mb-0"
                />
                <div className="mt-6">
                  {renderJoinButton()}
                </div>
              </div>
           </CardContent>
        </Card>
        
        <div className="flex gap-2">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search creators by name, game, or tag..." className="pl-9"/>
            </div>
            <Button variant="outline"><Filter className="mr-2 h-4 w-4"/> Filter</Button>
        </div>
        
         <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">All Creators</h2>
             {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-[88px] w-full" />)}
                </div>
            ) : itemsWithAds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {itemsWithAds.map((creator, index) => {
                     if ('isAd' in creator) {
                        return <AdsterraBlock key={`ad-${index}`} format="square" className="h-full min-h-[88px]" />;
                     }
                     return <CreatorCard key={creator.id} creator={creator} />;
                  })}
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Creators Yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Be the first to join the Creator Hub!</p>
                </div>
            )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-20">
        <Card>
          <CardHeader>
            <CardTitle>Top Creators</CardTitle>
            <CardDescription>Most voted creators this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
             {isLoading ? (
                Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-[68px] w-full" />)
             ) : topCreators.length > 0 ? (
                topCreators.map((creator, index) => (
                    <TopCreatorItem 
                        key={creator.id} 
                        creator={creator}
                        rank={index + 1}
                        tier={index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}
                    />
                ))
             ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No votes have been cast yet.</p>
             )}
          </CardContent>
        </Card>
        <AdsterraBlock format="square" />
      </div>
    </div>
  );
}
