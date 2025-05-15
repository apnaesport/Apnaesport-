
"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Palette, Shield, LogIn, Sun, Moon, Laptop } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();

  if (loading) {
    return (
      <MainLayout>
        <PageTitle title="Settings" />
        <div className="space-y-8">
          <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
           <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-12 w-full" />
               <Skeleton className="h-10 w-1/3" />
            </CardContent>
          </Card>
           <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-32" />
               <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-36" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <PageTitle title="Access Denied" subtitle="You need to be logged in to manage your settings." />
           <LogIn className="h-16 w-16 text-primary my-6" />
          <Button asChild size="lg">
            <Link href="/auth/login?redirect=/settings">Login to Manage Settings</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageTitle title="Settings" subtitle="Manage your account preferences and settings." />

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5 text-primary" /> Notification Settings
            </CardTitle>
            <CardDescription>Control how you receive notifications from Apna Esport.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates about tournaments, matches, and platform news via email.</p>
              </div>
              <Switch id="email-notifications" defaultChecked={true} />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get real-time alerts on your device. (Requires browser permission)</p>
              </div>
              <Switch id="push-notifications" defaultChecked={false} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="mr-2 h-5 w-5 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of Apna Esport.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="font-medium">Theme</Label>
              <p className="text-sm text-muted-foreground mb-2">Select your preferred color scheme.</p>
              <div className="flex space-x-2 rounded-md bg-muted p-1">
                <Button
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  onClick={() => setTheme('light')}
                  className={cn("flex-1", theme === 'light' && "bg-background text-foreground shadow-sm")}
                >
                  <Sun className="mr-2 h-4 w-4" /> Light
                </Button>
                <Button
                   variant={theme === 'dark' ? 'default' : 'ghost'}
                  onClick={() => setTheme('dark')}
                  className={cn("flex-1", theme === 'dark' && "bg-background text-foreground shadow-sm")}
                >
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'ghost'}
                  onClick={() => setTheme('system')}
                  className={cn("flex-1", theme === 'system' && "bg-background text-foreground shadow-sm")}
                >
                  <Laptop className="mr-2 h-4 w-4" /> System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-primary" /> Account & Security
            </CardTitle>
            <CardDescription>Manage your account security and data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" disabled>Change Password</Button>
            <Button variant="outline" disabled>Two-Factor Authentication</Button>
            <Separator />
            <Button variant="destructive" disabled>Delete Account</Button>
            <p className="text-xs text-muted-foreground">
              Deleting your account is permanent and cannot be undone. All your data, including tournament history and stats, will be removed.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
