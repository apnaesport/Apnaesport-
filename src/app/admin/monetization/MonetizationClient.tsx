
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Loader2, Megaphone, ReceiptText, Gamepad, Trophy } from "lucide-react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import type { SiteSettings } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { getSiteSettingsFromFirestore, saveSiteSettingsToFirestore } from "@/lib/tournamentStore";
import { useSiteSettings as useGlobalSiteSettings } from "@/contexts/SiteSettingsContext";

const monetizationSchema = z.object({
  promotionImageUrl: z.string().url("Must be a valid URL for the image.").or(z.literal('')).optional(),
  promotionVideoUrl: z.string().url("Must be a valid YouTube/Vimeo embed URL.").or(z.literal('')).optional(),
  promotionDisplayMode: z.enum(['image', 'video', 'ad']).optional(),
  promotionBoardAdKey: z.string().optional(),
  leaderboardAdKey: z.string().optional(),
  tournamentsPageAdKey: z.string().optional(),
  gamesPageAdKey: z.string().optional(),
});


const defaultValues: Partial<SiteSettings> = {
    promotionImageUrl: "",
    promotionVideoUrl: "",
    promotionDisplayMode: "image",
    promotionBoardAdKey: "",
    leaderboardAdKey: "",
    tournamentsPageAdKey: "",
    gamesPageAdKey: "",
};


export default function MonetizationClient() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { settings: globalSettings, refreshSiteSettings } = useGlobalSiteSettings();

  const form = useForm<Partial<SiteSettings>>({
    resolver: zodResolver(monetizationSchema),
    defaultValues,
  });

  const fetchSettings = useCallback(async () => {
    setIsFetching(true);
    if (globalSettings) {
      form.reset({ ...defaultValues, ...globalSettings });
    } else {
      const loadedSettings = await getSiteSettingsFromFirestore();
      if (loadedSettings) {
        form.reset({ ...defaultValues, ...loadedSettings });
      } else {
        form.reset(defaultValues);
      }
    }
    setIsFetching(false);
  }, [form, globalSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit: SubmitHandler<Partial<SiteSettings>> = async (data) => {
    setIsSaving(true);
    try {
      const settingsToSave = {
        promotionImageUrl: data.promotionImageUrl || "",
        promotionVideoUrl: data.promotionVideoUrl || "",
        promotionDisplayMode: data.promotionDisplayMode || "image",
        promotionBoardAdKey: data.promotionBoardAdKey || "",
        leaderboardAdKey: data.leaderboardAdKey || "",
        tournamentsPageAdKey: data.tournamentsPageAdKey || "",
        gamesPageAdKey: data.gamesPageAdKey || "",
      };

      await saveSiteSettingsToFirestore(settingsToSave);
      await refreshSiteSettings();
      toast({
        title: "Settings Saved",
        description: "Monetization and promotion settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Save Failed", description: "Could not save monetization settings.", variant: "destructive" });
    }
    setIsSaving(false);
  };
  
    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-lg text-muted-foreground">Loading monetization settings...</p>
            </div>
        );
    }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Megaphone className="mr-2 h-5 w-5 text-primary" /> Promotion Board Settings
          </CardTitle>
          <CardDescription>Configure the promotion board on the homepage. Recommended size: 728x90 (Leaderboard).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="promotionImageUrl">Promotion Image URL</Label>
            <Input id="promotionImageUrl" {...form.register("promotionImageUrl")} placeholder="https://example.com/promo.png" disabled={isSaving}/>
            <p className="text-xs text-muted-foreground">URL for the promotional image. Recommended aspect ratio 16:9.</p>
            {form.formState.errors.promotionImageUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.promotionImageUrl.message as string}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="promotionVideoUrl">Promotion Video URL</Label>
            <Input id="promotionVideoUrl" {...form.register("promotionVideoUrl")} placeholder="https://www.youtube.com/embed/your-video-id" disabled={isSaving}/>
             <p className="text-xs text-muted-foreground">Full embed URL for a YouTube or Vimeo video.</p>
            {form.formState.errors.promotionVideoUrl && <p className="text-destructive text-xs mt-1">{form.formState.errors.promotionVideoUrl.message as string}</p>}
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
           <div className="space-y-2">
                <Label htmlFor="promotionBoardAdKey">Adsterra Ad Key for Promotion Board</Label>
                <Input 
                    id="promotionBoardAdKey" 
                    {...form.register("promotionBoardAdKey")} 
                    placeholder='e.g., ab2e77969b2315321528a2a7516e8321'
                    disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">
                    The unique key for your Adsterra 728x90 ad unit. This is only used if Display Mode is set to 'Ad'.
                </p>
                {form.formState.errors.promotionBoardAdKey && <p className="text-destructive text-xs mt-1">{form.formState.errors.promotionBoardAdKey.message as string}</p>}
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center">
                <ReceiptText className="mr-2 h-5 w-5 text-primary" /> Ad Placement Keys
            </CardTitle>
            <CardDescription>Enter the Adsterra ad unit keys for different sections of the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="leaderboardAdKey" className="flex items-center gap-2"><Trophy className="h-4 w-4"/> Leaderboard Page Ad</Label>
                <Input 
                    id="leaderboardAdKey" 
                    {...form.register("leaderboardAdKey")} 
                    placeholder='Enter 728x90 Leaderboard ad key'
                    disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">Recommended size: 728x90 (Leaderboard). Displayed at the top of the leaderboard page.</p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="tournamentsPageAdKey" className="flex items-center gap-2"><Gamepad className="h-4 w-4"/> Tournaments Page Ad</Label>
                <Input 
                    id="tournamentsPageAdKey" 
                    {...form.register("tournamentsPageAdKey")} 
                    placeholder='Enter 300x250 Medium Rectangle ad key'
                    disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">Recommended size: 300x250 (Medium Rectangle). Displayed between tournament cards.</p>
            </div>
             <div className="space-y-2">
                <Label htmlFor="gamesPageAdKey" className="flex items-center gap-2"><Gamepad className="h-4 w-4"/> Games Page Ad</Label>
                <Input 
                    id="gamesPageAdKey" 
                    {...form.register("gamesPageAdKey")} 
                    placeholder='Enter video format ad key'
                    disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground">Recommended format: Video (In-Page Banner). Displayed alongside game cards.</p>
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSaving || isFetching}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Monetization Settings"}
        </Button>
      </div>
    </form>
  );
}
