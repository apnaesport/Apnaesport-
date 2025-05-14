
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
import { Shield, Edit3, LogIn, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import type { UserProfile } from "@/lib/types";
import { updateUserProfileInFirestore, getUserProfileFromFirestore } from "@/lib/tournamentStore";
import { updateProfile as updateFirebaseProfile } from "firebase/auth"; // For Firebase Auth display name
import { auth } from "@/lib/firebase";


const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  bio: z.string().max(500, "Bio can be max 500 characters.").optional(),
  favoriteGames: z.string().max(200, "Favorite games list too long.").optional(),
  streamingChannelUrl: z.string().url("Must be a valid URL.").or(z.literal('')).optional(),
  // photoURL is handled separately for now
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading, setUser: setAuthContextUser } = useAuth(); // Get setUser to update context
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      favoriteGames: "",
      streamingChannelUrl: "",
    },
  });

  const fetchUserProfile = useCallback(async (uid: string) => {
    setPageLoading(true);
    try {
      const userProfile = await getUserProfileFromFirestore(uid);
      if (userProfile) {
        form.reset({
          displayName: userProfile.displayName || "",
          bio: userProfile.bio || "",
          favoriteGames: userProfile.favoriteGames || "",
          streamingChannelUrl: userProfile.streamingChannelUrl || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({ title: "Error", description: "Could not load your profile data.", variant: "destructive" });
    }
    setPageLoading(false);
  }, [form, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserProfile(user.uid);
    } else if (!authLoading && !user) {
      setPageLoading(false); // Not logged in, stop loading
    }
  }, [user, authLoading, fetchUserProfile]);


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
      // Update Firestore document
      await updateUserProfileInFirestore(user.uid, {
        displayName: data.displayName,
        bio: data.bio,
        favoriteGames: data.favoriteGames,
        streamingChannelUrl: data.streamingChannelUrl,
      });

      // Update Firebase Auth display name if it changed
      if (auth.currentUser && auth.currentUser.displayName !== data.displayName) {
        await updateFirebaseProfile(auth.currentUser, { displayName: data.displayName });
      }
      
      // Update AuthContext state
      const updatedUserProfile = await getUserProfileFromFirestore(user.uid);
      if (updatedUserProfile) {
        setAuthContextUser(updatedUserProfile); // This updates the user object in AuthContext
      }


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
                <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
                <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                  {getInitials(user.displayName)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.displayName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              {user.isAdmin && (
                <div className="mt-2 flex items-center justify-center text-destructive">
                  <Shield className="h-4 w-4 mr-1" /> Admin Account
                </div>
              )}
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled> {/* Photo upload not implemented in this iteration */}
                <Edit3 className="mr-2 h-4 w-4" /> Change Profile Picture
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
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
                  <Label htmlFor="favoriteGames">Favorite Games</Label>
                  <Input id="favoriteGames" {...form.register("favoriteGames")} placeholder="e.g., Valorant, CS:GO, LoL" disabled={isSubmitting}/>
                  {form.formState.errors.favoriteGames && <p className="text-destructive text-xs mt-1">{form.formState.errors.favoriteGames.message}</p>}
                </div>
                 <div>
                  <Label htmlFor="streamingChannelUrl">Streaming Channel URL</Label>
                  <Input id="streamingChannelUrl" {...form.register("streamingChannelUrl")} placeholder="https://twitch.tv/yourchannel" disabled={isSubmitting}/>
                  {form.formState.errors.streamingChannelUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.streamingChannelUrl.message}</p>}
                </div>
                <Separator />
                <h3 className="text-lg font-medium">Change Password (Not Implemented)</h3>
                <p className="text-sm text-muted-foreground">Password change functionality is not available in this prototype.</p>
                
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSubmitting ? "Saving..." : "Update Profile"}
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
