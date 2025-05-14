
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Globe, Palette, Shield, UsersRound, Save } from "lucide-react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import type { SiteSettings } from "@/lib/types";
import { useEffect, useState } from "react";

const settingsSchema = z.object({
  siteName: z.string().min(3, "Site name must be at least 3 characters."),
  siteDescription: z.string().min(10, "Site description must be at least 10 characters."),
  maintenanceMode: z.boolean(),
  allowRegistrations: z.boolean(),
  logoUrl: z.string().url("Must be a valid URL for logo.").or(z.literal('')).optional(),
  faviconUrl: z.string().url("Must be a valid URL for favicon.").or(z.literal('')).optional(),
  defaultTheme: z.string().optional(), 
});

const defaultSettings: SiteSettings = {
  siteName: "Apna Esport",
  siteDescription: "Your Ultimate Gaming Tournament Platform",
  maintenanceMode: false,
  allowRegistrations: true,
  logoUrl: "https://placehold.co/150x50.png", // Will be updated via Logo component, this is for form
  faviconUrl: "https://placehold.co/32x32.png",
  defaultTheme: "dark",
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); 
  
  const form = useForm<SiteSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettings,
  });

  const onSubmit: SubmitHandler<SiteSettings> = async (data) => {
    setIsLoading(true);
    console.log("Saving settings:", data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      // Example: Save settings (e.g., to localStorage or a backend)
      // localStorage.setItem("siteSettings", JSON.stringify(data));
      toast({
        title: "Settings Saved",
        description: "Site settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Save Failed", description: "Could not save settings.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  // Example: Load settings from localStorage (if previously saved)
  // useEffect(() => {
  //   const savedSettings = localStorage.getItem("siteSettings");
  //   if (savedSettings) {
  //     form.reset(JSON.parse(savedSettings));
  //   }
  // }, [form]);

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
            <Input id="siteName" {...form.register("siteName")} />
            {form.formState.errors.siteName && <p className="text-destructive text-xs mt-1">{form.formState.errors.siteName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description / Motto</Label>
            <Textarea id="siteDescription" {...form.register("siteDescription")} />
            {form.formState.errors.siteDescription && <p className="text-destructive text-xs mt-1">{form.formState.errors.siteDescription.message}</p>}
          </div>
          <Separator />
          <Controller
            name="maintenanceMode"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode" className="font-medium">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable access to the site for users.</p>
                </div>
                <Switch id="maintenanceMode" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
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
          <Controller
            name="allowRegistrations"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowRegistrations" className="font-medium">Allow New Registrations</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable new users from signing up.</p>
                </div>
                <Switch id="allowRegistrations" checked={field.value} onCheckedChange={field.onChange} />
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
            <Label htmlFor="logoUrl">Logo URL (Currently managed by Logo component)</Label>
            <Input id="logoUrl" {...form.register("logoUrl")} placeholder="https://placehold.co/150x50.png" disabled />
            {form.formState.errors.logoUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.logoUrl.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="faviconUrl">Favicon URL</Label>
            <Input id="faviconUrl" {...form.register("faviconUrl")} placeholder="https://placehold.co/32x32.png" />
            {form.formState.errors.faviconUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.faviconUrl.message}</p>}
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="defaultTheme" className="font-medium">Default Theme</Label>
            <Input id="defaultTheme" {...form.register("defaultTheme")} disabled className="w-auto" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" /> Security & API Settings 
          </CardTitle>
          <CardDescription>Manage API keys and security configurations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">API key management and advanced security settings will appear here. (Placeholder)</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isLoading || form.formState.isSubmitting}>
          <Save className="mr-2 h-4 w-4" /> {isLoading || form.formState.isSubmitting ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </form>
  );
}
