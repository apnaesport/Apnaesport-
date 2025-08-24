
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Coins, LogIn, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import type { PointTransaction } from "@/lib/types";
import { getPointTransactions } from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";

export default function RewardsPage() {
    const { user, loading: authLoading } = useAuth();
    const { settings, loadingSettings } = useSiteSettings();
    const { toast } = useToast();
    const [transactions, setTransactions] = useState<PointTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTransactions = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const userTransactions = await getPointTransactions(userId);
            setTransactions(userTransactions);
        } catch (error) {
            console.error("Error loading transaction history:", error);
            toast({ title: "Error", description: "Could not load transaction history.", variant: "destructive"});
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchTransactions(user.uid);
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchTransactions]);

    if (authLoading || loadingSettings) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
                <PageTitle title="Access Denied" subtitle="You need to be logged in to view your rewards and history." />
                <LogIn className="h-16 w-16 text-primary my-6" />
                <Button asChild size="lg">
                    <Link href="/auth/login?redirect=/rewards">Login to View Rewards</Link>
                </Button>
            </div>
        );
    }
    
    const aeCoinLogo = settings?.aeCoinLogoUrl;

    return (
        <div className="space-y-8">
            <PageTitle title="My Rewards" subtitle="Track your AE Points and see your transaction history." />

            <Card className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 text-white shadow-lg overflow-hidden">
                <CardContent className="p-6 flex items-center gap-6 relative">
                    <div className="absolute -right-10 -top-10 w-48 h-48 opacity-20">
                         <ImageWithFallback
                            src={aeCoinLogo || ''}
                            fallbackSrc="/coin-fallback.svg"
                            alt="AE Coin"
                            width={192}
                            height={192}
                            className="drop-shadow-lg"
                        />
                    </div>
                    <div className="relative">
                         <ImageWithFallback
                            src={aeCoinLogo || ''}
                            fallbackSrc="/coin-fallback.svg"
                            alt="AE Coin"
                            width={80}
                            height={80}
                            className="drop-shadow-lg"
                        />
                    </div>
                    <div className="relative">
                        <CardDescription className="text-yellow-200 text-sm">Your Balance</CardDescription>
                        <CardTitle className="text-4xl sm:text-5xl font-bold tracking-tight">{user.points || 0}</CardTitle>
                        <p className="font-semibold opacity-90">Apna Coins</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>A record of your recent AE Point transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : transactions.length > 0 ? (
                        <ScrollArea className="h-96">
                            <div className="space-y-4 pr-4">
                                {transactions.map(tx => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "grid place-items-center h-10 w-10 rounded-full",
                                                tx.type === 'credit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                            )}>
                                                {tx.type === 'credit' ? <ArrowUp className="h-5 w-5"/> : <ArrowDown className="h-5 w-5"/>}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">{tx.reason}</p>
                                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(tx.createdAt.toDate(), { addSuffix: true })}</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "font-bold text-lg",
                                            tx.type === 'credit' ? 'text-green-500' : 'text-red-500'
                                        )}>
                                            {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
                             <Coins className="h-12 w-12 text-muted-foreground mb-4"/>
                            <p className="text-muted-foreground">No transactions yet.</p>
                            <p className="text-xs text-muted-foreground mt-1">Start playing tournaments to earn points!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
