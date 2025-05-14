
"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Edit3, LogIn } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "TH";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  if (loading) {
    return (
      <MainLayout>
        <PageTitle title="My Profile" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-32 mb-2 mx-auto md:mx-0" />
            <Skeleton className="h-32 w-32 rounded-full mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto md:mx-0 mt-2" />
            <Skeleton className="h-4 w-56 mx-auto md:mx-0 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Button variant="outline">
                <Edit3 className="mr-2 h-4 w-4" /> Change Profile Picture
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" defaultValue={user.displayName || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user.email || ""} disabled />
              </div>
              <Separator />
              <h3 className="text-lg font-medium">Change Password</h3>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button>Update Profile</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
