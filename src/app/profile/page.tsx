
"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Shield, Edit3, LogIn, Save, Loader2, Gamepad2, FileText, BadgeInfo, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import type { UserProfile, Game, CreatorApplication } from "@/lib/types";
import { updateUserProfileInFirestore, getUserProfileFromFirestore, getGamesFromFirestore, getMyApplicationsFromFirestore } from "@/lib/tournamentStore";
import { updateProfile as updateFirebaseProfile } from "firebase/auth"; 
import { auth } from "@/lib/firebase";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";


const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  bio: z.string().max(500, "Bio can be max 500 characters.").optional().nullable(),
  favoriteGameIds: z.array(z.string()).optional(),
  streamingChannelUrl: z.string().url("Must be a valid URL.").or(z.literal('')).optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const statusColors: Record<CreatorApplication['status'], string> = {
    Pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    Approved: "bg-green-500/20 text-green-500 border-green-500/30",
    Rejected: "bg-red-500/20 text-red-500 border-red-500/30",
};

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      favoriteGameIds: [],
      streamingChannelUrl: "",
    },
  });

  const fetchPageData = useCallback(async (uid: string) => {
    setPageLoading(true);
    setIsLoadingApps(true);
    try {
      const [userProfile, games, userApps] = await Promise.all([
        getUserProfileFromFirestore(uid),
        getGamesFromFirestore(),
        getMyApplicationsFromFirestore(uid)
      ]);
      
      setAvailableGames(games);
      setApplications(userApps);

      if (userProfile) {
        form.reset({
          displayName: userProfile.displayName || "",
          bio: userProfile.bio || "",
          favoriteGameIds: userProfile.favoriteGameIds || [],
          streamingChannelUrl: userProfile.streamingChannelUrl || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast({ title: "Error", description: "Could not load your profile data.", variant: "destructive" });
    } finally {
      setPageLoading(false);
      setIsLoadingApps(false);
    }
  }, [form, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchPageData(user.uid);
    } else if (!authLoading && !user) {
      setPageLoading(false); 
    }
  }, [user, authLoading, fetchPageData]);


  const getInitials = (name: string | null | undefined) => {
    if (!name) return "AE"; 
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      
      await updateUserProfileInFirestore(user.uid, {
        displayName: data.displayName,
        bio: data.bio || "", 
        favoriteGameIds: data.favoriteGameIds || [],
        streamingChannelUrl: data.streamingChannelUrl || "", 
      });

      if (auth.currentUser && auth.currentUser.displayName !== data.displayName) {
        await updateFirebaseProfile(auth.currentUser, { displayName: data.displayName });
      }
      
      await refreshUser();

      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: "Could not update your profile.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <MainLayout>
        <PageTitle title="My Profile" />
        <Card>
          <CardHeader className="items-center md:items-start">
            <Skeleton className="h-32 w-32 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-6 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <PageTitle title="Access Denied" subtitle="You need to be logged in to view your profile." />
          <LogIn className="h-16 w-16 text-primary my-6" />
          <Button asChild size="lg">
            <Link href="/auth/login?redirect=/profile">Login to View Profile</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageTitle title="My Profile" subtitle="View and manage your account details." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="text-center">
            <CardHeader>
              <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-primary shadow-lg">
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} data-ai-hint="user avatar" />
                <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.displayName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <BadgeInfo className="h-4 w-4 mr-1 text-primary"/>
                  Apna ID: <span className="font-semibold text-foreground ml-1">{user.apnaId || 'N/A'}</span>
                </div>
                 <div className="flex items-center text-muted-foreground">
                  <Coins className="h-4 w-4 mr-1 text-yellow-500"/>
                  AE Points: <span className="font-semibold text-foreground ml-1">{user.points || 0}</span>
                </div>
              </div>

              {user.isAdmin && (
                <div className="mt-2 flex items-center justify-center text-destructive">
                  <Shield className="h-4 w-4 mr-1" /> Admin Account
                </div>
              )}
            </CardHeader>
            <CardContent>
              {/* <Button variant="outline" disabled> 
                <Edit3 className="mr-2 h-4 w-4" /> Change Profile Picture
              </Button> */}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="account">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account">Account Details</TabsTrigger>
                <TabsTrigger value="applications">My Applications</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input id="displayName" {...form.register("displayName")} disabled={isSubmitting} />
                      {form.formState.errors.displayName && <p className="text-destructive text-xs mt-1">{form.formState.errors.displayName.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue={user.email || ""} disabled />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" {...form.register("bio")} placeholder="Tell us a bit about yourself..." disabled={isSubmitting} rows={3}/>
                      {form.formState.errors.bio && <p className="text-destructive text-xs mt-1">{form.formState.errors.bio.message}</p>}
                    </div>
                    
                    <div>
                      <Label>Favorite Games</Label>
                      <Controller
                        name="favoriteGameIds"
                        control={form.control}
                        render={({ field }) => (
                          <ScrollArea className="h-40 w-full rounded-md border p-4 mt-1">
                            {availableGames.length > 0 ? availableGames.map((game) => (
                              <div key={game.id} className="flex items-center space-x-2 mb-2">
                                <Checkbox
                                  id={`fav-game-${game.id}`}
                                  checked={field.value?.includes(game.id)}
                                  onCheckedChange={(checked) => {
                                    const currentFavs = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentFavs, game.id]);
                                    } else {
                                      field.onChange(currentFavs.filter((id) => id !== game.id));
                                    }
                                  }}
                                  disabled={isSubmitting}
                                />
                                <Label htmlFor={`fav-game-${game.id}`} className="font-normal cursor-pointer">
                                  {game.name}
                                </Label>
                              </div>
                            )) : <p className="text-sm text-muted-foreground">No games available to select.</p>}
                          </ScrollArea>
                        )}
                      />
                      {form.formState.errors.favoriteGameIds && <p className="text-destructive text-xs mt-1">{form.formState.errors.favoriteGameIds.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="streamingChannelUrl">Streaming Channel URL</Label>
                      <Input id="streamingChannelUrl" {...form.register("streamingChannelUrl")} placeholder="https://twitch.tv/yourchannel" disabled={isSubmitting}/>
                      {form.formState.errors.streamingChannelUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.streamingChannelUrl.message}</p>}
                    </div>
                    <Separator />
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSubmitting ? "Saving..." : "Update Profile"}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </TabsContent>
            <TabsContent value="applications">
                <Card>
                    <CardHeader>
                        <CardTitle>Application History</CardTitle>
                        <CardDescription>Track the status of your submitted applications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingApps ? (
                             Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full mb-2" />)
                        ) : applications.length > 0 ? (
                           <div className="space-y-4">
                            {applications.map(app => (
                                <div key={app.id} className="border p-4 rounded-md flex justify-between items-center">
                                    <div>
                                        <h4 className="font-semibold">Creator Application</h4>
                                        <p className="text-sm text-muted-foreground">Submitted {formatDistanceToNow(app.createdAt.toDate(), { addSuffix: true })}</p>
                                    </div>
                                    <Badge variant="outline" className={cn("text-sm", statusColors[app.status])}>{app.status}</Badge>
                                </div>
                            ))}
                           </div>
                        ) : (
                           <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="font-semibold">No Applications Found</h3>
                                <p className="text-sm text-muted-foreground mt-1">You haven't submitted any applications yet.</p>
                                <Button asChild variant="secondary" className="mt-4">
                                    <Link href="/creators">Become a Creator</Link>
                                </Button>
                           </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
