
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Globe, Palette, Shield, UsersRound, Save, Loader2, Sun, Moon, Laptop } from "lucide-react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import type { SiteSettings } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { getSiteSettingsFromFirestore, saveSiteSettingsToFirestore } from "@/lib/tournamentStore";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const settingsSchema = z.object({
  siteName: z.string().min(3, "Site name must be at least 3 characters."),
  siteDescription: z.string().min(10, "Site description must be at least 10 characters."),
  maintenanceMode: z.boolean(),
  allowRegistrations: z.boolean(),
  logoUrl: z.string().url("Must be a valid URL for logo.").or(z.literal('')).optional(),
  faviconUrl: z.string().url("Must be a valid URL for favicon.").or(z.literal('')).optional(),
  defaultTheme: z.string().optional(), 
});

const defaultSettingsValues: Omit<SiteSettings, 'id' | 'updatedAt'> = {
  siteName: "Apna Esport",
  siteDescription: "Your Ultimate Gaming Tournament Platform",
  maintenanceMode: false,
  allowRegistrations: true,
  logoUrl: "", 
  faviconUrl: "",
  defaultTheme: "system", 
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false); 
  const [isFetchingSettings, setIsFetchingSettings] = useState(true);
  const { theme, setTheme } = useTheme(); // Use theme from context
  
  const form = useForm<SiteSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettingsValues,
  });

  const fetchSettings = useCallback(async () => {
    setIsFetchingSettings(true);
    try {
      const loadedSettings = await getSiteSettingsFromFirestore();
      if (loadedSettings) {
        form.reset(loadedSettings);
        if (loadedSettings.defaultTheme && ["light", "dark", "system"].includes(loadedSettings.defaultTheme)) {
          setTheme(loadedSettings.defaultTheme as "light" | "dark" | "system");
        }
      } else {
        form.reset(defaultSettingsValues); 
      }
    } catch (error) {
      console.error("Error fetching site settings:", error);
      toast({ title: "Error", description: "Could not load site settings. Using defaults.", variant: "destructive" });
      form.reset(defaultSettingsValues);
    }
    setIsFetchingSettings(false);
  }, [form, toast, setTheme]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);


  const onSubmit: SubmitHandler<SiteSettings> = async (data) => {
    setIsSaving(true);
    try {
      const { id, updatedAt, ...settingsToSave } = data; 
      // Ensure defaultTheme is explicitly set to the current theme context value
      settingsToSave.defaultTheme = theme; 
      await saveSiteSettingsToFirestore(settingsToSave);
      toast({
        title: "Settings Saved",
        description: "Site settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Save Failed", description: "Could not save settings.", variant: "destructive" });
    }
    setIsSaving(false);
  };

  if (isFetchingSettings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading settings...</p>
      </div>
    );
  }


  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <PageTitle title="Site Settings" subtitle="Configure global settings for Apna Esport." />

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
            <Input id="siteName" {...form.register("siteName")} disabled={isSaving}/>
            {form.formState.errors.siteName && <p className="text-destructive text-xs mt-1">{form.formState.errors.siteName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description / Motto</Label>
            <Textarea id="siteDescription" {...form.register("siteDescription")} disabled={isSaving}/>
            {form.formState.errors.siteDescription && <p className="text-destructive text-xs mt-1">{form.formState.errors.siteDescription.message}</p>}
          </div>
          <Separator />
          <Controller
            name="maintenanceMode"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <Label htmlFor="maintenanceModeSwitch" className="font-medium">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable access to the site for users.</p>
                </div>
                <Switch id="maintenanceModeSwitch" checked={field.value} onCheckedChange={field.onChange} disabled={isSaving}/>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UsersRound className="mr-2 h-5 w-5 text-primary" /> User &amp; Registration Settings
          </CardTitle>
          <CardDescription>Manage user registration and default roles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Controller
            name="allowRegistrations"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <Label htmlFor="allowRegistrationsSwitch" className="font-medium">Allow New Registrations</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable new users from signing up.</p>
                </div>
                <Switch id="allowRegistrationsSwitch" checked={field.value} onCheckedChange={field.onChange} disabled={isSaving}/>
              </div>
            )}
          />
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
            <Input id="logoUrl" {...form.register("logoUrl")} placeholder="https://example.com/logo.png" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">If empty, the default site logo component will be used.</p>
            {form.formState.errors.logoUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.logoUrl.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="faviconUrl">Favicon URL</Label>
            <Input id="faviconUrl" {...form.register("faviconUrl")} placeholder="https://example.com/favicon.ico" disabled={isSaving}/>
            {form.formState.errors.faviconUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.faviconUrl.message}</p>}
          </div>
           <div>
              <Label className="font-medium">Default Site Theme</Label>
              <p className="text-sm text-muted-foreground mb-2">Set the default theme for all users. Individual users can override this in their settings.</p>
              <div className="flex space-x-2 rounded-md bg-muted p-1">
                <Button
                  type="button"
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  onClick={() => { form.setValue("defaultTheme", "light"); setTheme('light');}}
                  className={cn("flex-1", theme === 'light' && "bg-background text-foreground shadow-sm")}
                  disabled={isSaving}
                >
                  <Sun className="mr-2 h-4 w-4" /> Light
                </Button>
                <Button
                  type="button"
                  variant={theme === 'dark' ? 'default' : 'ghost'}
                  onClick={() => { form.setValue("defaultTheme", "dark"); setTheme('dark');}}
                  className={cn("flex-1", theme === 'dark' && "bg-background text-foreground shadow-sm")}
                  disabled={isSaving}
                >
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </Button>
                <Button
                  type="button"
                  variant={theme === 'system' ? 'default' : 'ghost'}
                  onClick={() => { form.setValue("defaultTheme", "system"); setTheme('system');}}
                  className={cn("flex-1", theme === 'system' && "bg-background text-foreground shadow-sm")}
                  disabled={isSaving}
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
            <Shield className="mr-2 h-5 w-5 text-primary" /> Security &amp; API Settings 
          </CardTitle>
          <CardDescription>Manage API keys and security configurations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">API key management and advanced security settings will appear here. (Placeholder)</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSaving || isFetchingSettings}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </form>
  );
}
