
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star, ImagePlus, ShieldCheck, Crown, MessageSquarePlus, Handshake, Coins, LogIn, UserCheck, Swords, Send, Loader2, Trophy } from "lucide-react";
import type { PremiumFeatures, PremiumRequest } from '@/lib/types';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addPremiumRequestToFirestore } from "@/lib/tournamentStore";

const allPremiumFeatures: { id: keyof PremiumFeatures, icon: React.ElementType, title: string, description: string }[] = [
    {
        id: "verifiedBadge",
        icon: Crown,
        title: "Verified Premium Badge",
        description: "Show off your premium status with an exclusive badge next to your name across the platform."
    },
    {
        id: "customBanners",
        icon: ImagePlus,
        title: "Custom Tournament Banners",
        description: "As a tournament creator, upload your own custom banner images to make your event stand out."
    },
    {
        id: "addSponsors",
        icon: Handshake,
        title: "Add Tournament Sponsors",
        description: "Feature your own sponsors in the tournaments you create, including their name and logo."
    },
     {
        id: "customPrizes",
        icon: Trophy,
        title: "Custom Entry Fees & Prizes",
        description: "Set your own entry fees and define the exact prize pool distribution for 1st, 2nd, and 3rd place."
    },
    {
        id: "prioritySupport",
        icon: ShieldCheck,
        title: "Priority Support",
        description: "Get faster response times and priority assistance from our support team for any issues."
    },
];


function PremiumRequestDialog() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleSubmit = async () => {
        if (!user || !message.trim()) return;
        setIsSubmitting(true);
        try {
            await addPremiumRequestToFirestore({
                userId: user.uid,
                userName: user.displayName || 'N/A',
                userApnaId: user.apnaId || 'N/A',
                message: message
            });
            toast({
                title: "Request Sent!",
                description: "Your request for premium has been submitted for review."
            });
            setIsDialogOpen(false);
            setMessage('');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Could not submit your request.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if(!user) return null;

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button size="lg">
                    <MessageSquarePlus className="mr-2 h-5 w-5" />
                    Request Premium
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Premium Status</DialogTitle>
                    <DialogDescription>
                        Tell us why you would be a great premium member. Our team will review your request.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div>
                        <Label htmlFor="message">Your Message</Label>
                        <Textarea 
                            id="message" 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)} 
                            placeholder="I believe I should be a premium member because..."
                            rows={5}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !message.trim()}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

}

export default function PremiumPage() {
  const { user, loading, isPremium, premiumFeatures } = useAuth();
  
  if (loading) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }

  if (!user) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
        <PageTitle title="Access Denied" subtitle="You need to be logged in to view premium information." />
         <LogIn className="h-16 w-16 text-primary my-6" />
        <Button asChild size="lg">
          <Link href="/auth/login?redirect=/premium">Login to View</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
        <div className="text-center py-12 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 rounded-lg shadow-lg relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full filter blur-xl" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-white/10 rounded-full filter blur-xl" />
            <div className="relative">
                <Crown className="mx-auto h-16 w-16 text-white mb-4 animate-pulse drop-shadow-lg" />
                <PageTitle 
                    title="Apna Esport Premium"
                    subtitle="Unlock exclusive features and stand out from the crowd."
                    className="!text-white text-shadow-lg"
                />
            </div>
        </div>

        {isPremium ? (
             <Card className="border-green-500/50 bg-green-500/10">
                <CardHeader className="text-center">
                    <UserCheck className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <CardTitle className="text-2xl text-green-500">You are a Premium Member!</CardTitle>
                    <CardDescription>You have access to exclusive benefits. Thank you for being a valued part of our community.</CardDescription>
                </CardHeader>
            </Card>
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle>How to Get Premium?</CardTitle>
                    <CardDescription>
                        Premium status is granted by our admin team. Actively contribute to our community to get noticed, or send a request.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Our administrators are continuously looking for users who contribute positively to the platform. Here’s what we look for:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        <li>Consistently hosting popular and well-managed tournaments.</li>
                        <li>Being an active and positive leader within your community.</li>
                        <li>Actively participating in tournaments and demonstrating fair play.</li>
                        <li>Becoming a verified content creator and building a positive following.</li>
                    </ul>
                    <p className="text-muted-foreground pt-2">
                      Think you're a good fit? Send us a request!
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                        <PremiumRequestDialog />
                    </div>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Premium Benefits</CardTitle>
                <CardDescription>
                   Here are the perks available to Apna Esport Premium members.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allPremiumFeatures.map(feature => {
                        const hasFeature = isPremium && premiumFeatures?.[feature.id];
                        return (
                            <div key={feature.id} className={cn(
                                "flex items-start gap-4 p-4 rounded-lg border",
                                hasFeature ? "bg-secondary border-primary/50" : "bg-secondary/30 border-border"
                            )}>
                                <feature.icon className={cn(
                                    "h-8 w-8 mt-1 shrink-0",
                                    hasFeature ? "text-amber-400" : "text-muted-foreground"
                                )}/>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg text-foreground">{feature.title}</h3>
                                        {hasFeature && <CheckCircle className="h-5 w-5 text-green-500" />}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>
                            </div>
                        )
                    })}
                     <div className={cn("flex items-start gap-4 p-4 rounded-lg border", "bg-secondary/30 border-border")}>
                        <Coins className="h-8 w-8 mt-1 shrink-0 text-muted-foreground"/>
                        <div>
                            <h3 className="font-semibold text-lg text-foreground">200 AE Points Bonus</h3>
                            <p className="text-sm text-muted-foreground">Receive a one-time bonus of 200 AE Points instantly when you're first granted Premium status.</p>
                        </div>
                    </div>
                     <div className={cn("flex items-start gap-4 p-4 rounded-lg border", "bg-secondary/30 border-border")}>
                        <MessageSquarePlus className="h-8 w-8 mt-1 shrink-0 text-muted-foreground"/>
                        <div>
                            <h3 className="font-semibold text-lg text-foreground">More Features Coming Soon</h3>
                            <p className="text-sm text-muted-foreground">We are constantly working on new and exciting features exclusively for our premium members.</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

    