
"use client"; // This page will likely have forms and interactive elements

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Palette, ShieldLock } from "lucide-react";

export default function SettingsPage() {
  // Placeholder states for settings - in a real app, these would come from user preferences
  // const [emailNotifications, setEmailNotifications] = useState(true);
  // const [pushNotifications, setPushNotifications] = useState(false);
  // const [darkMode, setDarkMode] = useState(true); // Assuming dark mode is default

  return (
    <MainLayout>
      <PageTitle title="Settings" subtitle="Manage your account preferences and settings." />

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5 text-primary" /> Notification Settings
            </CardTitle>
            <CardDescription>Control how you receive notifications from TournamentHub.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates about tournaments, matches, and platform news via email.</p>
              </div>
              <Switch id="email-notifications" checked={true} />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get real-time alerts on your device. (Requires browser permission)</p>
              </div>
              <Switch id="push-notifications" checked={false} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="mr-2 h-5 w-5 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of TournamentHub.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-md">
              <div>
                <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Toggle between light and dark themes.</p>
              </div>
              {/* The theme is globally dark right now. This switch is a UI placeholder. */}
              <Switch id="dark-mode" checked={true} disabled />
            </div>
            {/* Add other appearance settings here, e.g., language */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldLock className="mr-2 h-5 w-5 text-primary" /> Account & Security
            </CardTitle>
            <CardDescription>Manage your account security and data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Change Password</Button>
            <Button variant="outline">Two-Factor Authentication</Button>
            <Separator />
            <Button variant="destructive">Delete Account</Button>
            <p className="text-xs text-muted-foreground">
              Deleting your account is permanent and cannot be undone. All your data, including tournament history and stats, will be removed.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
