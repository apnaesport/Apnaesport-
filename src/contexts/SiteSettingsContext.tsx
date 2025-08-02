
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { SiteSettings } from '@/lib/types';
import { getSiteSettingsFromFirestore } from '@/lib/tournamentStore';
import { useToast } from '@/hooks/use-toast';

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loadingSettings: boolean;
  refreshSiteSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const loadedSettings = await getSiteSettingsFromFirestore();
      if (loadedSettings) {
        setSettings(loadedSettings);
      } else {
        // Set default settings if none are found in Firestore
        setSettings({
          siteName: "Apna Esport",
          siteDescription: "Your Ultimate Gaming Tournament Platform",
          maintenanceMode: false,
          allowRegistrations: true,
          logoUrl: "",
          faviconUrl: "",
          defaultTheme: "system",
          basePlayerCount: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching site settings:", error);
      toast({ title: "Error", description: "Could not load site settings.", variant: "destructive" });
       setSettings({ // Fallback default settings on error
          siteName: "Apna Esport",
          siteDescription: "Your Ultimate Gaming Tournament Platform",
          maintenanceMode: false,
          allowRegistrations: true,
          logoUrl: "",
          faviconUrl: "",
          defaultTheme: "system",
          basePlayerCount: 0,
        });
    } finally {
      setLoadingSettings(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refreshSiteSettings = async () => {
    await fetchSettings();
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loadingSettings, refreshSiteSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = (): SiteSettingsContextType => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
};
