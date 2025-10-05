
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star, ImagePlus, ShieldCheck, Crown, MessageSquarePlus, Handshake, Coins, LogIn, UserCheck, Swords } from "lucide-react";
import type { Metadata } from 'next';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const premiumFeatures = [
    {
        icon: Crown,
        title: "Verified Premium Badge",
        description: "Show off your premium status with an exclusive badge next to your name across the platform."
    },
    {
        icon: ImagePlus,
        title: "Custom Tournament Banners",
        description: "As a tournament creator, upload your own custom banner images to make your event stand out."
    },
    {
        icon: Handshake,
        title: "Add Tournament Sponsors",
        description: "Feature your own sponsors in the tournaments you create, including their name and logo."
    },
    {
        icon: Coins,
        title: "200 AE Points Bonus",
        description: "Receive a one-time bonus of 200 AE Points instantly when you're granted Premium status."
    },
    {
        icon: ShieldCheck,
        title: "Priority Support",
        description: "Get faster response times and priority assistance from our support team for any issues."
    },
    {
        icon: MessageSquarePlus,
        title: "More Features Coming Soon",
        description: "We are constantly working on new and exciting features exclusively for our premium members."
    }
]

export default function PremiumPage() {
  const { user, loading, isPremium } = useAuth();
  
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
                    <CardDescription>You have full access to all exclusive benefits. Thank you for being a valued part of our community.</CardDescription>
                </CardHeader>
            </Card>
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle>How to Get Premium?</CardTitle>
                    <CardDescription>
                        Premium status is currently granted by our team to engaged and positive members of the Apna Esport community.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Our administrators are continuously looking for users who contribute to the platform. Here’s what we look for:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                        <li>Consistently hosting popular and well-managed tournaments for the community.</li>
                        <li>Being an active and positive leader within your own community or on the platform.</li>
                        <li>Actively participating in tournaments and demonstrating fair play.</li>
                        <li>Becoming a verified content creator and building a strong, positive following.</li>
                    </ul>
                    <p className="text-muted-foreground pt-2">
                       The best way to get noticed is to be an active part of Apna Esport. Get started today!
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                        <Button asChild size="lg">
                            <Link href="/tournaments/new">
                                <Swords className="mr-2 h-5 w-5" />
                                Create a Tournament
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                             <Link href="/tournaments">Join a Tournament</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Premium Benefits</CardTitle>
                <CardDescription>
                   Here's what you get as an Apna Esport Premium member.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {premiumFeatures.map(feature => (
                        <div key={feature.title} className={cn(
                            "flex items-start gap-4 p-4 rounded-lg",
                            isPremium ? "bg-secondary" : "bg-secondary/30"
                        )}>
                            <feature.icon className={cn(
                                "h-8 w-8 mt-1 shrink-0",
                                isPremium ? "text-amber-400" : "text-primary"
                            )}/>
                            <div>
                                <h3 className="font-semibold text-lg text-foreground">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
