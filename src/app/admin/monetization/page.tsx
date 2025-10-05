
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, DollarSign, Text, Square, GripHorizontal, KeyRound } from "lucide-react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import type { SiteSettings } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { getSiteSettingsFromFirestore, saveSiteSettingsToFirestore } from "@/lib/tournamentStore";
import { useSiteSettings as useGlobalSiteSettings, SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { Skeleton } from "@/components/ui/skeleton";

const monetizationSchema = z.object({
  adsEnabled: z.boolean().optional(),
  adKeyLeaderboard: z.string().optional(),
  adKeySquare: z.string().optional(),
  adKeySocialBar: z.string().optional(),
  adFrequencyInLists: z.coerce.number().min(0, "Frequency must be 0 or more.").optional(),
  geminiApiKey: z.string().optional(),
});


const defaultValues: Partial<SiteSettings> = {
    adsEnabled: false,
    adKeyLeaderboard: "",
    adKeySquare: "",
    adKeySocialBar: "",
    adFrequencyInLists: 4,
    geminiApiKey: "",
};

function MonetizationPageContent() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingSettings, setIsFetchingSettings] = useState(true);
  const { settings: globalSettings, refreshSiteSettings } = useGlobalSiteSettings();

  const form = useForm<Partial<SiteSettings>>({
    resolver: zodResolver(monetizationSchema),
    defaultValues: defaultValues,
  });

  const fetchSettings = useCallback(async () => {
    setIsFetchingSettings(true);
    const loadedSettings = globalSettings || await getSiteSettingsFromFirestore();

    if (loadedSettings) {
      form.reset({
        ...defaultValues, 
        ...loadedSettings
      });
    } else {
       form.reset(defaultValues);
    }
    setIsFetchingSettings(false);
  }, [form, globalSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit: SubmitHandler<Partial<SiteSettings>> = async (data) => {
    setIsSaving(true);
    try {
      await saveSiteSettingsToFirestore(data);
      await refreshSiteSettings();
      toast({
        title: "Settings Saved",
        description: "Monetization settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving monetization settings:", error);
      toast({ title: "Save Failed", description: "Could not save settings.", variant: "destructive" });
    }
    setIsSaving(false);
  };
  
  if (isFetchingSettings) {
      return <Skeleton className="h-96 w-full" />
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <PageTitle title="Monetization" subtitle="Manage ads, API keys, and other monetization features." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <KeyRound className="mr-2 h-5 w-5 text-primary" /> API Keys
          </CardTitle>
          <CardDescription>Manage third-party API keys for platform features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="geminiApiKey">Google Gemini API Key</Label>
            <Input id="geminiApiKey" type="password" {...form.register("geminiApiKey")} placeholder="Enter your Gemini API key..." disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">Used for AI features like analyzing tournament results from screenshots.</p>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-primary" /> Ad Settings
          </CardTitle>
          <CardDescription>Manage Adsterra ad placements across the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <Controller
            name="adsEnabled"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center justify-between p-4 border rounded-md bg-secondary/20">
                <div>
                  <Label htmlFor="adsEnabledSwitch" className="font-medium text-lg">Enable All Ads</Label>
                  <p className="text-sm text-muted-foreground">Globally enable or disable all Adsterra ad blocks on the site.</p>
                </div>
                <Switch id="adsEnabledSwitch" checked={field.value} onCheckedChange={field.onChange} disabled={isSaving}/>
              </div>
            )}
          />
           <div className="space-y-2">
            <Label htmlFor="adKeyLeaderboard" className="flex items-center gap-2"><GripHorizontal className="h-4 w-4"/>Adsterra Leaderboard Banner Key</Label>
            <Input id="adKeyLeaderboard" {...form.register("adKeyLeaderboard")} placeholder="Enter your Adsterra 728x90 ad key..." disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">Used for wide, top-of-page banners.</p>
          </div>
           <div className="space-y-2">
            <Label htmlFor="adKeySquare" className="flex items-center gap-2"><Square className="h-4 w-4"/>Adsterra Square/Rectangle Key</Label>
            <Input id="adKeySquare" {...form.register("adKeySquare")} placeholder="Enter your Adsterra 300x250 ad key..." disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">Used for ads injected into content lists.</p>
          </div>
            <div className="space-y-2">
            <Label htmlFor="adKeySocialBar" className="flex items-center gap-2"><Text className="h-4 w-4"/>Adsterra Social Bar Key</Label>
            <Input id="adKeySocialBar" {...form.register("adKeySocialBar")} placeholder="Enter your Adsterra Social Bar key..." disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">Floating ad bar for mobile/desktop.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adFrequencyInLists">Ad Frequency in Lists</Label>
            <Input id="adFrequencyInLists" type="number" {...form.register("adFrequencyInLists")} placeholder="e.g., 4" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">Show an ad after every 'X' cards in lists (tournaments, games, etc.). Set to 0 to disable.</p>
             {form.formState.errors.adFrequencyInLists && <p className="text-destructive text-xs mt-1">{form.formState.errors.adFrequencyInLists.message as string}</p>}
          </div>
        </CardContent>
      </Card>
      
       <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSaving || isFetchingSettings}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Monetization Settings"}
        </Button>
      </div>

    </form>
  )
}


export default function AdminMonetizationPage() {
    return (
        <SiteSettingsProvider>
            <MonetizationPageContent />
        </SiteSettingsProvider>
    )
}
