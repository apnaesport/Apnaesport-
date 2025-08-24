
"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Skeleton } from '../ui/skeleton';

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

  const adKey = useMemo(() => {
    switch (format) {
      case 'leaderboard': return settings?.adKeyLeaderboard;
      case 'square': return settings?.adKeySquare;
      case 'social_bar': return settings?.adKeySocialBar;
      default: return '';
    }
  }, [format, settings]);

  const adsEnabled = settings?.adsEnabled ?? false;
  const componentKey = `${pathname}-${format}-${adKey}`;

  const adDimensions = {
    leaderboard: { width: 728, height: 90 },
    square: { width: 300, height: 250 },
    social_bar: { width: 0, height: 0 },
  };
  
  const { width, height } = adDimensions[format];


  useEffect(() => {
    if (loadingSettings || !adsEnabled || !adKey || format === 'social_bar') {
      if (adContainerRef.current) adContainerRef.current.innerHTML = '';
      return;
    }

    const container = adContainerRef.current;
    if (container) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      
      const adOptions = `
        atOptions = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;
      script.innerHTML = adOptions;

      const invokeScript = document.createElement('script');
      invokeScript.async = true;
      invokeScript.type = 'text/javascript';
      invokeScript.src = `//www.profitabledisplaynetwork.com/${adKey}/invoke.js`;
      
      container.innerHTML = '';
      container.appendChild(script);
      container.appendChild(invokeScript);
    }
  }, [componentKey, adsEnabled, adKey, loadingSettings, format, width, height]);


  useEffect(() => {
    if (format === 'social_bar' && adsEnabled && adKey) {
        const existingScript = document.getElementById(`adsterra-social-bar-${adKey}`);
        if(existingScript) return;

        const script = document.createElement('script');
        script.id = `adsterra-social-bar-${adKey}`;
        script.type = 'text/javascript';
        script.src = `//www.profitabledisplaynetwork.com/e5/1e/21/e51e21b9c452796479159d3a54b383de.js`;
        script.async = true;
        document.body.appendChild(script);

        return () => {
            const scriptToRemove = document.getElementById(`adsterra-social-bar-${adKey}`);
            if (scriptToRemove) {
                document.body.removeChild(scriptToRemove);
            }
        };
    }
  }, [format, adsEnabled, adKey]);


  if (loadingSettings) {
    return <Skeleton className={cn(`w-full max-w-[${width}px] h-[${height}px]`, className)} />;
  }

  if (!adsEnabled || !adKey || format === 'social_bar') {
    return null; 
  }

  return (
    <div
      key={componentKey}
      className={cn(
        "ad-container w-full mx-auto flex items-center justify-center bg-muted/20 min-h-[50px] rounded-lg",
        `max-w-[${width}px]`,
        className
      )}
      style={{...style, minHeight: `${height}px`}}
    >
        <div ref={adContainerRef} className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Advertisement</span>
        </div>
    </div>
  );
}
