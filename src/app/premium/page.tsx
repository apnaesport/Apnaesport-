
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Star, ImagePlus, ShieldCheck, Crown, MessageSquarePlus } from "lucide-react";
import type { Metadata } from 'next';
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Premium Features - Apna Esport",
  description: "Unlock exclusive features with Apna Esport Premium. Get a verified badge, upload custom tournament banners, and more. Learn how to get premium access.",
};

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
  return (
    <div className="space-y-8">
        <div className="text-center py-12 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 rounded-lg shadow-lg">
             <Star className="mx-auto h-16 w-16 text-white mb-4 animate-pulse" />
             <PageTitle 
                title="Apna Esport Premium"
                subtitle="Unlock exclusive features and stand out from the crowd."
                className="!text-white text-shadow-lg"
             />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>What is Premium?</CardTitle>
                <CardDescription>
                   Apna Esport Premium is a special status granted to our most dedicated and trusted community members. It is not available for direct purchase.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                    {premiumFeatures.map(feature => (
                        <div key={feature.title} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
                            <feature.icon className="h-8 w-8 text-primary mt-1 shrink-0"/>
                            <div>
                                <h3 className="font-semibold text-lg text-foreground">{feature.title}</h3>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>How to Get Premium?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                    Premium status is currently invite-only or granted by administrators based on community contribution, fair play, and positive engagement. Here are some ways to get noticed:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li>Consistently host popular and well-managed tournaments.</li>
                    <li>Be an active and positive leader within your community.</li>
                    <li>Contribute to a safe and fair gaming environment for all players.</li>
                    <li>Become a verified content creator and build a strong following.</li>
                </ul>
                 <p className="text-muted-foreground pt-4">
                    Our admin team regularly reviews user activity and will reach out to deserving members with an invitation to join the premium tier.
                </p>
                <div className="flex justify-center pt-4">
                    <Button asChild>
                        <Link href="/tournaments">Start Creating Tournaments</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
