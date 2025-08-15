
"use client";

import { notFound, useRouter } from 'next/navigation';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Badge } from '@/components/ui/badge';
import { Users, Home, Camera, PlusCircle, Loader2, Medal, BarChart3, Users2, Shield, Upload, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Community, CommunityMember, SiteSettings } from '@/lib/types';
import { listenToCommunityById, getCommunityMembers, joinCommunity, leaveCommunity, updateCommunityDetailsInFirestore, deleteCommunityFromFirestore } from '@/lib/tournamentStore';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface CommunityPageClientProps {
    initialCommunity: Community;
    initialMembers: CommunityMember[];
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

const ManageCommunityDialog = ({ community }: { community: Community }) => {
    const { toast } = useToast();
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(community.logoUrl || null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(community.bannerUrl || null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (type === 'logo') {
                    setLogoPreview(result);
                    setLogoFile(file);
                } else {
                    setBannerPreview(result);
                    setBannerFile(file);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            const updates: Partial<Community> = {};
            if (logoPreview && logoPreview.startsWith('data:')) {
                updates.logoUrl = logoPreview;
            }
            if (bannerPreview && bannerPreview.startsWith('data:')) {
                updates.bannerUrl = bannerPreview;
            }

            if (Object.keys(updates).length > 0) {
                await updateCommunityDetailsInFirestore(community.id, updates);
                toast({ title: "Success", description: "Community branding updated." });
            } else {
                toast({ title: "No Changes", description: "No new images were selected to upload." });
            }
        } catch (error) {
            console.error("Error updating community:", error);
            toast({ title: "Error", description: "Could not update community details.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteCommunityFromFirestore(community.id);
            toast({ title: "Community Deleted", description: `"${community.name}" has been permanently removed.`});
            router.push('/community');
        } catch (error) {
            console.error("Error deleting community", error);
            toast({ title: "Error", description: "Could not delete community.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline"><Shield className="mr-2 h-4 w-4" /> Manage Community</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Community</DialogTitle>
                    <DialogDescription>Update your community's branding or manage settings.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="logoFile">Community Logo (1:1 Ratio)</Label>
                        <Input id="logoFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} disabled={isUpdating}/>
                        {logoPreview && <ImageWithFallback src={logoPreview} alt="Logo Preview" width={80} height={80} className="rounded-full mt-2 border" fallbackSrc="" data-ai-hint="logo preview" unoptimized={logoPreview.startsWith('data:')} />}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bannerFile">Community Banner (16:9 Ratio)</Label>
                        <Input id="bannerFile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} disabled={isUpdating}/>
                        {bannerPreview && <ImageWithFallback src={bannerPreview} alt="Banner Preview" width={400} height={225} className="rounded-md mt-2 border aspect-video object-cover" fallbackSrc="" data-ai-hint="banner preview" unoptimized={bannerPreview.startsWith('data:')}/>}
                    </div>
                     <Separator />
                    <div className="space-y-2">
                        <Label className="text-destructive">Danger Zone</Label>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full" disabled={isDeleting}>
                                    <Trash2 className="mr-2 h-4 w-4"/> Delete Community
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the community and remove all members.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        Confirm Deletion
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                         <p className="text-xs text-muted-foreground">Deleting your community is permanent.</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" disabled={isUpdating}>Cancel</Button></DialogClose>
                    <Button onClick={handleUpdate} disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function CommunityPageClient({ initialCommunity, initialMembers }: CommunityPageClientProps) {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const { settings, loadingSettings } = useSiteSettings();
    const { toast } = useToast();
    const router = useRouter();
    const [community, setCommunity] = useState<Community>(initialCommunity);
    const [members, setMembers] = useState<CommunityMember[]>(initialMembers);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const communityId = community.id;

    useEffect(() => {
        setIsLoading(false);
        const unsubscribe = listenToCommunityById(communityId, async (liveCommunity) => {
            if (liveCommunity) {
                const serializableLiveCommunity = {
                    ...liveCommunity,
                    createdAt: liveCommunity.createdAt ? (liveCommunity.createdAt as any).toDate().toISOString() : new Date().toISOString(),
                    updatedAt: liveCommunity.updatedAt ? (liveCommunity.updatedAt as any).toDate().toISOString() : new Date().toISOString(),
                }
                setCommunity(serializableLiveCommunity as Community);
                if (liveCommunity.memberCount !== community.memberCount) {
                    const fetchedMembers = await getCommunityMembers(communityId);
                    setMembers(fetchedMembers);
                }
            } else {
                notFound();
            }
        });
        return () => unsubscribe();
    }, [communityId, community.memberCount]);

    const isMember = useMemo(() => user?.communityId === community.id, [user, community]);
    const isOwner = useMemo(() => user?.uid === community.ownerId, [user, community]);

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
            toast({ title: "Action Not Allowed", description: "The community owner cannot leave. You must delete the community instead.", variant: "destructive" });
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

    if (isLoading || authLoading || loadingSettings) {
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
    const createdAtDate = community.createdAt ? new Date(community.createdAt as any) : new Date();

    const bannerSrc = community.bannerUrl || settings?.defaultCommunityBannerUrl || '';
    const logoSrc = community.logoUrl || settings?.defaultCommunityLogoUrl || '';

    return (
        <div className="space-y-6">
            <header className="rounded-lg overflow-hidden shadow-lg bg-card border">
                <div className="h-32 sm:h-40 bg-gradient-to-r from-orange-400 to-rose-500 relative">
                     <ImageWithFallback
                        src={bannerSrc}
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
                                src={logoSrc}
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
                                        <Users2 className="h-7 w-7 text-primary" /> {community.name}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">Joined: {format(createdAtDate, "MMM dd, yyyy")} | Members: {community.memberCount}</p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                     {isOwner && <ManageCommunityDialog community={community} />}
                                    {isMember ? (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" disabled={isProcessing || isOwner}>
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
