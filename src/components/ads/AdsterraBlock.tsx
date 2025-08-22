
"use client";

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

interface AdsterraBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

export function AdsterraBlock({ className, style }: AdsterraBlockProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { settings, loadingSettings } = useSiteSettings();

  const adsEnabled = settings?.adsEnabled ?? false;
  const adKey = settings?.adsterraNativeAdKey ?? "";

  // The key forces the component to re-render on navigation, which helps
  // some ad scripts re-initialize properly.
  const componentKey = `${pathname}-${adKey}`;

  useEffect(() => {
    if (loadingSettings || !adsEnabled || !adKey) {
        if (adContainerRef.current) adContainerRef.current.innerHTML = '';
        return;
    }

    const container = adContainerRef.current;
    if (container) {
      // Create a new script element to re-trigger the ad loading process
      const script = document.createElement('script');
      script.type = 'text/javascript';
      
      const adOptions = `
        atOptions = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      script.innerHTML = adOptions;

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = `//www.profitabledisplaynetwork.com/${adKey}/invoke.js`;
      
      // Clear previous ads and append new scripts
      container.innerHTML = '';
      container.appendChild(script);
      container.appendChild(invokeScript);
    }
  }, [componentKey, adsEnabled, adKey, loadingSettings]);

  if (loadingSettings || !adsEnabled || !adKey) {
    return null; // Don't render anything if ads are disabled or key is missing
  }

  return (
    <div
      key={componentKey}
      className={cn(
        "ad-container w-full max-w-[728px] mx-auto flex items-center justify-center bg-muted/20 min-h-[90px] rounded-lg",
        className
      )}
      style={style}
    >
        {/* The container which the script will populate */}
        <div ref={adContainerRef} className="w-full h-full flex items-center justify-center">
            {/* Placeholder until ad loads */}
            <span className="text-xs text-muted-foreground">Advertisement</span>
        </div>
    </div>
  );
}
