
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Globe, Palette, ShieldCog, UsersRound } from "lucide-react";

export default function AdminSettingsPage() {
  // Placeholder states for settings
  // In a real app, these would be fetched and updated via API/database
  // const [siteName, setSiteName] = useState("TournamentHub");
  // const [maintenanceMode, setMaintenanceMode] = useState(false);
  // const [allowRegistrations, setAllowRegistrations] = useState(true);
  // const [defaultTheme, setDefaultTheme] = useState("dark");

  return (
    <div className="space-y-8">
      <PageTitle title="Site Settings" subtitle="Configure global settings for TournamentHub." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5 text-primary" /> General Settings
          </CardTitle>
          <CardDescription>Basic configuration for your platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input id="siteName" defaultValue="TournamentHub" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description / Motto</Label>
            <Textarea id="siteDescription" defaultValue="Your Ultimate Gaming Tournament Platform" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenanceMode" className="font-medium">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Temporarily disable access to the site for users.</p>
            </div>
            <Switch id="maintenanceMode" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UsersRound className="mr-2 h-5 w-5 text-primary" /> User & Registration Settings
          </CardTitle>
          <CardDescription>Manage user registration and default roles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowRegistrations" className="font-medium">Allow New Registrations</Label>
              <p className="text-sm text-muted-foreground">Enable or disable new users from signing up.</p>
            </div>
            <Switch id="allowRegistrations" checked={true} />
          </div>
          {/* Add settings for default user role, email verification requirements, etc. */}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5 text-primary" /> Appearance Settings
          </CardTitle>
          <CardDescription>Customize the visual theme and branding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" placeholder="https://example.com/logo.png" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faviconUrl">Favicon URL</Label>
            <Input id="faviconUrl" placeholder="https://example.com/favicon.ico" />
          </div>
          {/* This is currently hardcoded to dark. Could be a select for default theme later. */}
          <div className="flex items-center justify-between">
            <Label htmlFor="defaultTheme" className="font-medium">Default Theme</Label>
            <Input id="defaultTheme" value="Dark (Current)" disabled className="w-auto" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCog className="mr-2 h-5 w-5 text-primary" /> Security & API Settings
          </CardTitle>
          <CardDescription>Manage API keys and security configurations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Placeholder for API keys (e.g., for game data providers, email services) */}
          <p className="text-muted-foreground">API key management and advanced security settings will appear here.</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg">Save All Settings</Button>
      </div>
    </div>
  );
}

