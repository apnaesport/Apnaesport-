
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
import { useState, useEffect, useCallback } from 'react';
import type { Creator, CreatorApplication } from '@/lib/types';
import { submitCreatorApplicationInFirestore, listenToCreators, listenToTopCreators, getMyApplicationsFromFirestore } from '@/lib/tournamentStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const applicationSchema = z.object({
    channelUrl: z.string().url("Please enter a valid URL (e.g., https://youtube.com/yourchannel)."),
    tags: z.string().min(2, "Please add at least one tag (e.g., FPS, MOBA).").max(50, "Tags are too long."),
    message: z.string().max(500, "Message cannot exceed 500 characters.").optional(),
});
type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function CreatorHubPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [isCreator, setIsCreator] = useState(false);

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
    defaultValues: { channelUrl: "", tags: "", message: "" },
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-card/50 border border-primary/20 shadow-lg">
           <CardContent className="p-6">
              <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent rounded-full mb-4 shadow-[0_0_15px_hsl(var(--primary))]"/>
              <PageTitle
                title="Where Rising Creators Get Noticed"
                subtitle="Apna Esport Creator helps small and mid-level gaming creators grow with community voting, featured showcases, and verified creator badges."
                className="mb-0"
              />
              <div className="mt-6 flex gap-4 items-center">
                  <Button><Star className="mr-2 h-4 w-4"/> Get Featured</Button>
                  <Button variant="outline">Create Campaign</Button>
              </div>
           </CardContent>
        </Card>
        
        <div className="flex gap-2">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search creators by name, game, or tag..." className="pl-9"/>
            </div>
            <Button variant="ghost"><Filter className="mr-2 h-4 w-4"/> Filter</Button>
        </div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-[80px] w-full" />)}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {creators.map(creator => <CreatorCard key={creator.id} creator={creator} />)}
            </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Join the Hub</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                 {renderJoinButton()}
                 <Button variant="outline" className="w-full">Explore Creators</Button>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Creators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             {isLoading ? (
                Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-[68px] w-full" />)
             ) : (
                topCreators.map((creator, index) => (
                    <TopCreatorItem 
                        key={creator.id} 
                        creator={creator}
                        rank={index + 1}
                        tier={index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}
                    />
                ))
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    