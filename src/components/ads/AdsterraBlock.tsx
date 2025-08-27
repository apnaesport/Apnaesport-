
"use client";

import React, { useEffect, useRef, useMemo, useId } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Skeleton } from '../ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  // useId() generates a unique ID that is stable across server and client, preventing hydration mismatches.
  const uniqueId = useId();

  const adKey = useMemo(() => {
    switch (format) {
      case 'leaderboard':
        return isMobile ? (settings?.adKeySquare || settings?.adKeyLeaderboard) : settings?.adKeyLeaderboard;
      case 'square': 
        return settings?.adKeySquare;
      case 'social_bar':
        return settings?.adKeySocialBar;
      default: 
        return '';
    }
  }, [format, settings, isMobile]);

  const adsEnabled = settings?.adsEnabled ?? false;
  // The key for the useEffect hook must be absolutely unique for each instance to force re-render
  const componentKey = `${pathname}-${format}-${adKey}-${isMobile}-${uniqueId}`;

  const adDimensions = {
    leaderboard: { width: 728, height: 90 },
    square: { width: 300, height: 250 },
    social_bar: { width: 0, height: 0 },
  };
  
  const { width, height } = adDimensions[format];
  const effectiveHeight = isMobile && format === 'leaderboard' ? 250 : height;
  const effectiveWidth = isMobile && format === 'leaderboard' ? 300 : width;

  useEffect(() => {
    if (loadingSettings || !adsEnabled || !adKey) {
      if (adContainerRef.current) adContainerRef.current.innerHTML = '';
      return;
    }

    const container = adContainerRef.current;
    if (container) {
      // Clear previous ad scripts to prevent conflicts during navigation
      container.innerHTML = '';
      
      const script = document.createElement('script');
      script.type = 'text/javascript';
      
      // The ad script itself is what's placed in the container.
      const adOptions = `
        atOptions = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : ${effectiveHeight},
          'width' : ${effectiveWidth},
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentKey, adsEnabled, adKey, loadingSettings, effectiveWidth, effectiveHeight]);


  if (format === 'social_bar') {
     if (!adsEnabled || !settings?.adKeySocialBar) return null;
     // Special handling for social bar which injects its own div
     return <div key={componentKey} ref={adContainerRef} />;
  }

  if (loadingSettings) {
    const skelHeight = `h-[${effectiveHeight}px]`;
    const skelWidth = `w-full max-w-[${effectiveWidth}px]`;
    return <Skeleton className={cn(skelWidth, skelHeight, className)} />;
  }

  if (!adsEnabled || !adKey) {
    return null; 
  }

  // Assign the unique ID to the main container div
  return (
    <div
      id={uniqueId}
      key={componentKey}
      className={cn(
        "ad-container w-full mx-auto flex items-center justify-center bg-muted/20 min-h-[50px] rounded-lg overflow-hidden",
        className
      )}
      style={{
          maxWidth: `${effectiveWidth}px`,
          maxHeight: `${effectiveHeight}px`,
          ...style
      }}
    >
        <div ref={adContainerRef} className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Advertisement</span>
        </div>
    </div>
  );
}
