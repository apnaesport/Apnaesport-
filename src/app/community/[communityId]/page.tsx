
"use client";

import { notFound, useRouter } from 'next/navigation';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Badge } from '@/components/ui/badge';
import { Users, Home, Camera, PlusCircle, Loader2, Medal, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Community, CommunityMember } from '@/lib/types';
import { listenToCommunityById, getCommunityMembers, joinCommunity, leaveCommunity } from '@/lib/tournamentStore';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CommunityPageProps {
    params: { communityId: string };
}

// Helper to get initials from a name
const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

const MemberList = ({ members }: { members: CommunityMember[] }) => {
    if (!members || members.length === 0) {
        return <p className="text-muted-foreground text-center py-4">No members found.</p>;
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => (
                <Card key={member.uid} className="flex items-center p-4 gap-4">
                    <Avatar>
                        <AvatarImage src={member.avatarUrl} alt={member.displayName} />
                        <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{member.displayName}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
};

const AnnouncementCard = ({ icon: Icon, title, text }: { icon: React.ElementType, title: string, text: string }) => (
    <Card className="border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
            <Icon className="h-6 w-6 text-primary" />
            <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-sm">{text}</CardDescription>
            </div>
        </CardHeader>
    </Card>
)


export default function CommunityDetailPage({ params: { communityId } }: CommunityPageProps) {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [community, setCommunity] = useState<Community | null>(null);
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const unsubscribe = listenToCommunityById(communityId, async (liveCommunity) => {
            if (liveCommunity) {
                setCommunity(liveCommunity);
                const fetchedMembers = await getCommunityMembers(communityId);
                setMembers(fetchedMembers);
                setIsLoading(false);
            } else {
                notFound();
            }
        });

        return () => unsubscribe();
    }, [communityId]);

    const isMember = useMemo(() => {
        if (!user || !community) return false;
        return user.communityId === community.id;
    }, [user, community]);

    const handleJoinCommunity = async () => {
        if (!user) {
            toast({ title: "Not Logged In", description: "You must be logged in to join.", variant: "destructive" });
            router.push(`/auth/login?redirect=/community/${communityId}`);
            return;
        }
        if (user.communityId) {
            toast({ title: "Already in a Community", description: "You can only be in one community at a time.", variant: "destructive" });
            return;
        }
        setIsProcessing(true);
        try {
            await joinCommunity(communityId, user);
            await refreshUser();
            toast({ title: "Welcome!", description: `You have joined ${community?.name}.` });
        } catch (error: any) {
            toast({ title: "Error Joining", description: error.message || "Could not join the community.", variant: "destructive"});
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLeaveCommunity = async () => {
        if (!user || !community) return;
        if (user.uid === community.ownerId) {
            toast({ title: "Action Not Allowed", description: "The community owner cannot leave.", variant: "destructive" });
            return;
        }
        setIsProcessing(true);
        try {
            await leaveCommunity(communityId, user);
            await refreshUser();
            toast({ title: "Community Left", description: `You have left ${community.name}.` });
        } catch (error: any) {
             toast({ title: "Error Leaving", description: error.message || "Could not leave the community.", variant: "destructive"});
        } finally {
            setIsProcessing(false);
        }
    }

    if (isLoading || authLoading) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!community) {
        notFound();
    }
    
    const xpPercentage = community.level > 0 ? (community.points / (community.level * 500)) * 100 : 0;

    return (
        <div className="space-y-6">
            <header className="rounded-lg overflow-hidden shadow-lg bg-card border">
                <div className="h-32 sm:h-40 bg-gradient-to-r from-orange-400 to-rose-500 relative">
                     <ImageWithFallback
                        src={community.bannerUrl || ''}
                        fallbackSrc={`https://placehold.co/1200x300.png?text=${encodeURIComponent(community.name)}`}
                        alt={`${community.name} banner`}
                        fill
                        className="object-cover"
                        data-ai-hint="community banner gradient"
                     />
                </div>
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 -mt-16 sm:-mt-20 shrink-0">
                             <ImageWithFallback
                                src={community.logoUrl}
                                fallbackSrc={`https://placehold.co/128x128.png?text=${community.name.substring(0, 2)}`}
                                alt={`${community.name} logo`}
                                fill
                                className="rounded-full border-4 border-background shadow-md object-cover"
                                data-ai-hint="gaming community logo"
                            />
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                                        <Users className="h-7 w-7 text-primary" /> {community.name}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">Joined: {new Date(community.createdAt.seconds * 1000).toLocaleDateString()} | Members: {community.memberCount}</p>
                                </div>
                                <div className="shrink-0">
                                    {isMember ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" disabled={isProcessing}>
                                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                    Leave
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Are you sure you want to leave {community.name}? Your community-specific progress may be lost.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleLeaveCommunity}>Confirm</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    ) : (
                                        <Button onClick={handleJoinCommunity} disabled={isProcessing || !!user?.communityId}>
                                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                                            {user?.communityId ? 'Already in a community' : 'Join Community'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-sm font-semibold">Level {community.level} <span className="text-muted-foreground font-normal">({community.points} / {community.level * 500} XP)</span></p>
                                <Progress value={xpPercentage} className="h-2 mt-1"/>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            
            <Tabs defaultValue="home" className="w-full">
                <TabsList>
                    <TabsTrigger value="home"><Home className="mr-2 h-4 w-4"/>Announcements</TabsTrigger>
                    <TabsTrigger value="tournaments" disabled>Tournaments</TabsTrigger>
                    <TabsTrigger value="members"><Users className="mr-2 h-4 w-4"/>Members ({members.length})</TabsTrigger>
                    <TabsTrigger value="media" disabled><Camera className="mr-2 h-4 w-4"/>Media</TabsTrigger>
                    <TabsTrigger value="leaderboard" disabled>Leaderboard</TabsTrigger>
                </TabsList>
                <TabsContent value="home" className="mt-4 space-y-4">
                    <AnnouncementCard 
                        icon={Medal}
                        title={`Welcome to ${community.name}!`}
                        text="We have new tournaments every weekend. Stay tuned for rewards and events!"
                    />
                     <AnnouncementCard 
                        icon={BarChart3}
                        title="Update"
                        text="New community point system introduced! Earn XP by joining tournaments."
                    />
                </TabsContent>
                 <TabsContent value="members" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Community Members</CardTitle></CardHeader>
                        <CardContent>
                            <MemberList members={members} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
}
