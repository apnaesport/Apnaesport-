
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Globe, Palette, Shield, UsersRound, Save, Loader2, Sun, Moon, Laptop, Megaphone, Receipt, DollarSign, Download, Image as ImageIcon, Coins } from "lucide-react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import type { SiteSettings } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { getSiteSettingsFromFirestore, saveSiteSettingsToFirestore } from "@/lib/tournamentStore";
import { useTheme } from "@/contexts/ThemeContext";
import { useSiteSettings as useGlobalSiteSettings, SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { cn } from "@/lib/utils";
import Link from "next/link";


const settingsSchema = z.object({
  siteName: z.string().min(3, "Site name must be at least 3 characters."),
  siteDescription: z.string().min(10, "Site description must be at least 10 characters."),
  maintenanceMode: z.boolean(),
  allowRegistrations: z.boolean(),
  faviconUrl: z.string().url("Must be a valid URL for favicon.").or(z.literal('')).optional(),
  downloadAppLink: z.string().url("Must be a valid URL for the app download.").or(z.literal('')).optional(),
  defaultTheme: z.string().optional(),
  basePlayerCount: z.coerce.number().min(0, "Base player count cannot be negative.").optional(),
  defaultCommunityLogoUrl: z.string().url("Must be a valid URL.").or(z.literal('')).optional(),
  defaultCommunityBannerUrl: z.string().url("Must be a valid URL.").or(z.literal('')).optional(),
  adsEnabled: z.boolean().optional(),
  adsterraNativeAdKey: z.string().optional(),
  aeCoinLogoUrl: z.string().url("Must be a valid URL for the coin logo.").or(z.literal('')).optional(),
});


const defaultSettingsValues: Partial<SiteSettings> = {
  siteName: "Apna Esport",
  siteDescription: "Your Ultimate Gaming Tournament Platform",
  maintenanceMode: false,
  allowRegistrations: true,
  faviconUrl: "",
  downloadAppLink: "",
  defaultTheme: "system",
  basePlayerCount: 0,
  defaultCommunityLogoUrl: "",
  defaultCommunityBannerUrl: "",
  adsEnabled: false,
  adsterraNativeAdKey: "",
  aeCoinLogoUrl: "",
};

function AdminSettingsPageContent() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingSettings, setIsFetchingSettings] = useState(true);
  const { theme, setTheme } = useTheme();
  const { settings: globalSettings, refreshSiteSettings } = useGlobalSiteSettings();

  const form = useForm<Partial<SiteSettings>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettingsValues,
  });

  const fetchSettings = useCallback(async () => {
    setIsFetchingSettings(true);
    if (globalSettings) {
      form.reset({
        ...defaultSettingsValues, 
        ...globalSettings,
        basePlayerCount: globalSettings.basePlayerCount || 0,
      });
      if (globalSettings.defaultTheme && ["light", "dark", "system"].includes(globalSettings.defaultTheme)) {
        setTheme(globalSettings.defaultTheme as "light" | "dark" | "system");
      }
    } else {
      const loadedSettings = await getSiteSettingsFromFirestore();
      if (loadedSettings) {
        form.reset({
            ...defaultSettingsValues,
            ...loadedSettings,
            basePlayerCount: loadedSettings.basePlayerCount || 0,
        });
        if (loadedSettings.defaultTheme) setTheme(loadedSettings.defaultTheme as "light" | "dark" | "system");
      } else {
         form.reset(defaultSettingsValues);
      }
    }
    setIsFetchingSettings(false);
  }, [form, globalSettings, setTheme]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit: SubmitHandler<Partial<SiteSettings>> = async (data) => {
    setIsSaving(true);
    try {
      const settingsToSave = {
        ...data,
        defaultTheme: theme,
        basePlayerCount: Number(data.basePlayerCount) || 0,
      };

      await saveSiteSettingsToFirestore(settingsToSave);
      await refreshSiteSettings();
      toast({
        title: "Settings Saved",
        description: "General site settings have been updated successfully.",
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
            {form.formState.errors.siteName && <p className="text-destructive text-xs mt-1">{form.formState.errors.siteName.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteDescription">Site Description / Motto</Label>
            <Textarea id="siteDescription" {...form.register("siteDescription")} disabled={isSaving}/>
            {form.formState.errors.siteDescription && <p className="text-destructive text-xs mt-1">{form.formState.errors.siteDescription.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="downloadAppLink">App Download Link</Label>
            <Input id="downloadAppLink" {...form.register("downloadAppLink")} placeholder="https://play.google.com/store/apps/..." disabled={isSaving}/>
            {form.formState.errors.downloadAppLink && <p className="text-destructive text-xs mt-1">{form.formState.errors.downloadAppLink.message as string}</p>}
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
           <div className="space-y-2">
            <Label htmlFor="basePlayerCount">Base Player Count (Fake Users)</Label>
            <Input id="basePlayerCount" type="number" {...form.register("basePlayerCount")} placeholder="e.g., 1000" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">This number will be added to your real user count for display purposes.</p>
            {form.formState.errors.basePlayerCount && <p className="text-destructive text-xs mt-1">{form.formState.errors.basePlayerCount.message as string}</p>}
          </div>
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
            <Label htmlFor="faviconUrl">Favicon URL</Label>
            <Input id="faviconUrl" {...form.register("faviconUrl")} placeholder="https://example.com/favicon.ico" disabled={isSaving}/>
            {form.formState.errors.faviconUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.faviconUrl.message as string}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="aeCoinLogoUrl" className="flex items-center gap-2"><Coins className="h-4 w-4"/>AE Coin Logo URL</Label>
            <Input id="aeCoinLogoUrl" {...form.register("aeCoinLogoUrl")} placeholder="https://example.com/coin.png" disabled={isSaving}/>
            {form.formState.errors.aeCoinLogoUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.aeCoinLogoUrl.message as string}</p>}
          </div>
          <Separator />
           <div className="space-y-2">
            <Label htmlFor="defaultCommunityLogoUrl" className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Default Community Logo URL</Label>
            <Input id="defaultCommunityLogoUrl" {...form.register("defaultCommunityLogoUrl")} placeholder="https://example.com/default-logo.png" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">This logo will be used for new communities that don't upload their own.</p>
            {form.formState.errors.defaultCommunityLogoUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.defaultCommunityLogoUrl.message as string}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="defaultCommunityBannerUrl" className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/>Default Community Banner URL</Label>
            <Input id="defaultCommunityBannerUrl" {...form.register("defaultCommunityBannerUrl")} placeholder="https://example.com/default-banner.png" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">This banner will be used for new communities that don't upload their own.</p>
            {form.formState.errors.defaultCommunityBannerUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.defaultCommunityBannerUrl.message as string}</p>}
          </div>
          <Separator />
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
            <DollarSign className="mr-2 h-5 w-5 text-primary" /> Monetization Settings
          </CardTitle>
          <CardDescription>Manage ads and other monetization features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <Controller
            name="adsEnabled"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <Label htmlFor="adsEnabledSwitch" className="font-medium">Enable Ads</Label>
                  <p className="text-sm text-muted-foreground">Globally enable or disable all Adsterra ad blocks.</p>
                </div>
                <Switch id="adsEnabledSwitch" checked={field.value} onCheckedChange={field.onChange} disabled={isSaving}/>
              </div>
            )}
          />
           <div className="space-y-2">
            <Label htmlFor="adsterraNativeAdKey">Adsterra Native Ad Key</Label>
            <Input id="adsterraNativeAdKey" {...form.register("adsterraNativeAdKey")} placeholder="Enter your Adsterra ad key..." disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">This key will be used for all native banner ad blocks on the site.</p>
            {form.formState.errors.adsterraNativeAdKey && <p className="text-destructive text-xs mt-1">{form.formState.errors.adsterraNativeAdKey.message as string}</p>}
          </div>
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


export default function AdminSettingsPage() {
  return (
    <SiteSettingsProvider>
      <AdminSettingsPageContent />
    </SiteSettingsProvider>
  )
}
