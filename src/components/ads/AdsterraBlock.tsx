
"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Skeleton } from '../ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile'; // Import the hook to detect mobile screens

export type AdFormat = 'leaderboard' | 'square' | 'social_bar';

interface AdsterraBlockProps {
  className?: string;
  style?: React.CSSProperties;
  format: AdFormat;
}

export function AdsterraBlock({ className, style, format }: AdsterraBlockProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { settings, loadingSettings } = useSiteSettings();
  const isMobile = useIsMobile(); // Check if the device is mobile
  const uniqueId = useMemo(() => Math.random().toString(36).substring(7), []); // Generate a unique ID for each instance

  // Use a different, more mobile-friendly ad key for leaderboards on small screens if available
  const adKey = useMemo(() => {
    switch (format) {
      case 'leaderboard':
        // On mobile, use the square ad key for a better fit if leaderboard is requested.
        // This assumes the square ad unit is more responsive.
        return isMobile ? (settings?.adKeySquare || settings?.adKeyLeaderboard) : settings?.adKeyLeaderboard;
      case 'square': 
        return settings?.adKeySquare;
      default: 
        return '';
    }
  }, [format, settings, isMobile]);

  const adsEnabled = settings?.adsEnabled ?? false;
  const componentKey = `${pathname}-${format}-${adKey}-${isMobile}-${uniqueId}`; // Add uniqueId to the key

  // Ad dimensions are now for placeholder/skeleton purposes. The script will handle responsiveness.
  const adDimensions = {
    leaderboard: { width: 728, height: 90 },
    square: { width: 300, height: 250 },
    social_bar: { width: 0, height: 0 },
  };
  
  // Choose dimensions based on the original format, not the potentially swapped one for mobile
  const { width, height } = adDimensions[format];

  useEffect(() => {
    if (loadingSettings || !adsEnabled || !adKey) {
      if (adContainerRef.current) adContainerRef.current.innerHTML = '';
      return;
    }

    const container = adContainerRef.current;
    if (container) {
      // Clear previous ad scripts to prevent conflicts
      container.innerHTML = '';
      
      const script = document.createElement('script');
      script.type = 'text/javascript';
      
      // Using a responsive format. Adsterra will fill the container.
      const adOptions = `
        atOptions = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : ${isMobile && format === 'leaderboard' ? 250 : height},
          'width' : ${isMobile && format === 'leaderboard' ? 300 : width},
          'params' : {}
        };
      `;
      script.innerHTML = adOptions;

      const invokeScript = document.createElement('script');
      invokeScript.async = true;
      invokeScript.type = 'text/javascript';
      invokeScript.src = `//www.profitabledisplaynetwork.com/${adKey}/invoke.js`;
      
      container.appendChild(script);
      container.appendChild(invokeScript);
    }
  // We use componentKey which now includes uniqueId to ensure this effect re-runs for each ad block instance.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentKey, adsEnabled, adKey, loadingSettings, format, width, height, isMobile]);

  if (loadingSettings) {
    // Show a skeleton that best represents the ad space on the current device
    const skelHeight = isMobile && format === 'leaderboard' ? 'h-[250px]' : `h-[${height}px]`;
    const skelWidth = isMobile && format === 'leaderboard' ? 'w-[300px]' : `w-full max-w-[${width}px]`;
    return <Skeleton className={cn(skelWidth, skelHeight, className)} />;
  }

  if (!adsEnabled || !adKey) {
    return null; 
  }

  // The outer container is now fully responsive.
  return (
    <div
      key={componentKey}
      className={cn(
        "ad-container w-full mx-auto flex items-center justify-center bg-muted/20 min-h-[50px] rounded-lg overflow-hidden",
        className
      )}
      style={style}
    >
        <div ref={adContainerRef} className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Advertisement</span>
        </div>
    </div>
  );
}
