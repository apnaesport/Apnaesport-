
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Globe, Palette, Shield, UsersRound, Save, Loader2, Sun, Moon, Laptop, Megaphone, Receipt } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const settingsSchema = z.object({
  siteName: z.string().min(3, "Site name must be at least 3 characters."),
  siteDescription: z.string().min(10, "Site description must be at least 10 characters."),
  maintenanceMode: z.boolean(),
  allowRegistrations: z.boolean(),
  faviconUrl: z.string().url("Must be a valid URL for favicon.").or(z.literal('')).optional(),
  defaultTheme: z.string().optional(),
  basePlayerCount: z.coerce.number().min(0, "Base player count cannot be negative.").optional(),
  promotionImageUrl: z.string().url("Must be a valid URL for the image.").or(z.literal('')).optional(),
  promotionVideoUrl: z.string().url("Must be a valid YouTube/Vimeo embed URL.").or(z.literal('')).optional(),
  promotionDisplayMode: z.enum(['image', 'video', 'ad']).optional(),
  adsterraAdKey: z.string().optional(),
});


const defaultSettingsValues: Omit<SiteSettings, 'id' | 'updatedAt' | 'logoUrl'> = {
  siteName: "Apna Esport",
  siteDescription: "Your Ultimate Gaming Tournament Platform",
  maintenanceMode: false,
  allowRegistrations: true,
  faviconUrl: "",
  defaultTheme: "system",
  basePlayerCount: 0,
  promotionImageUrl: "",
  promotionVideoUrl: "",
  promotionDisplayMode: "image",
  adsterraAdKey: "",
};

function AdminSettingsPageContent() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingSettings, setIsFetchingSettings] = useState(true);
  const { theme, setTheme } = useTheme();
  const { settings: globalSettings, refreshSiteSettings } = useGlobalSiteSettings();

  const form = useForm<Omit<SiteSettings, 'logoUrl'>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettingsValues,
  });

  const fetchSettings = useCallback(async () => {
    setIsFetchingSettings(true);
    if (globalSettings) {
      const { logoUrl, ...relevantGlobalSettings } = globalSettings;
      form.reset({
        ...defaultSettingsValues, // Ensure all defaults are present
        ...relevantGlobalSettings,
        basePlayerCount: relevantGlobalSettings.basePlayerCount || 0,
      });
      if (globalSettings.defaultTheme && ["light", "dark", "system"].includes(globalSettings.defaultTheme)) {
        setTheme(globalSettings.defaultTheme as "light" | "dark" | "system");
      }
    } else {
      const loadedSettings = await getSiteSettingsFromFirestore();
      if (loadedSettings) {
        const { logoUrl, ...relevantLoadedSettings } = loadedSettings;
        form.reset({
            ...defaultSettingsValues, // Ensure all defaults are present
            ...relevantLoadedSettings,
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

  const onSubmit: SubmitHandler<Omit<SiteSettings, 'logoUrl'>> = async (data) => {
    setIsSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, updatedAt, ...settingsToSave } = data as any;
      const currentLogoUrl = globalSettings?.logoUrl;
      const completeSettingsToSave = {
        ...settingsToSave,
        basePlayerCount: Number(settingsToSave.basePlayerCount) || 0,
        logoUrl: currentLogoUrl,
        defaultTheme: theme,
        promotionImageUrl: settingsToSave.promotionImageUrl || "",
        promotionVideoUrl: settingsToSave.promotionVideoUrl || "",
        promotionDisplayMode: settingsToSave.promotionDisplayMode || "image",
        adsterraAdKey: settingsToSave.adsterraAdKey || "",
      };

      await saveSiteSettingsToFirestore(completeSettingsToSave as Omit<SiteSettings, 'id' | 'updatedAt'>);
      await refreshSiteSettings();
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
            <Megaphone className="mr-2 h-5 w-5 text-primary" /> Promotion Board Settings
          </CardTitle>
          <CardDescription>Configure the promotion board on the homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="promotionImageUrl">Promotion Image URL</Label>
            <Input id="promotionImageUrl" {...form.register("promotionImageUrl")} placeholder="https://example.com/promo.png" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">URL for the promotional image. Recommended aspect ratio 16:9.</p>
            {form.formState.errors.promotionImageUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.promotionImageUrl.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="promotionVideoUrl">Promotion Video URL</Label>
            <Input id="promotionVideoUrl" {...form.register("promotionVideoUrl")} placeholder="https://www.youtube.com/embed/your-video-id" disabled={isSaving}/>
             <p className="text-xs text-muted-foreground">Full embed URL for a YouTube or Vimeo video.</p>
            {form.formState.errors.promotionVideoUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.promotionVideoUrl.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Display Mode</Label>
            <Controller
              name="promotionDisplayMode"
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value || 'image'}
                  className="flex space-x-4"
                  disabled={isSaving}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="image" id="mode-image" />
                    <Label htmlFor="mode-image">Image</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="video" id="mode-video" />
                    <Label htmlFor="mode-video">Video</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ad" id="mode-ad" />
                    <Label htmlFor="mode-ad">Ad</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center">
                <Receipt className="mr-2 h-5 w-5 text-primary" /> Ad Monetization
            </CardTitle>
            <CardDescription>Configure ad settings, like Adsterra.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
                <Label htmlFor="adsterraAdKey">Adsterra Ad Key</Label>
                <Input 
                    id="adsterraAdKey" 
                    {...form.register("adsterraAdKey")} 
                    placeholder='e.g., ab2e77969b2315321528a2a7516e8321'
                    disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                    Paste your unique Adsterra Ad Key here. This is the alphanumeric string found in your ad code from Adsterra.
                </p>
                {form.formState.errors.adsterraAdKey && <p className="text-destructive text-xs mt-1">{form.formState.errors.adsterraAdKey.message}</p>}
            </div>
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
            {form.formState.errors.basePlayerCount && <p className="text-destructive text-xs mt-1">{form.formState.errors.basePlayerCount.message}</p>}
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


export default function AdminSettingsPage() {
  return (
    <SiteSettingsProvider>
      <AdminSettingsPageContent />
    </SiteSettingsProvider>
  )
}
