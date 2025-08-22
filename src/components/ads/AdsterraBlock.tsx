
"use client";

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Script from 'next/script';

interface AdsterraBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

// NOTE: Replace this with your actual Adsterra Native Banner key
const ADSTERRA_KEY = "d4a961623b0286b24578b978e80651da";

export function AdsterraBlock({ className, style }: AdsterraBlockProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // The key forces the component to re-render on navigation, which helps
  // some ad scripts re-initialize properly.
  const componentKey = `${pathname}-${ADSTERRA_KEY}`;

  useEffect(() => {
    // This effect ensures the ad script is re-evaluated if it exists on the window object.
    // Some ad networks need this to properly load ads on client-side navigation.
    const container = adContainerRef.current;
    if (container) {
      // Create a new script element to re-trigger the ad loading process
      const script = document.createElement('script');
      script.type = 'text/javascript';
      
      const adOptions = `
        atOptions = {
          'key' : '${ADSTERRA_KEY}',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      script.innerHTML = adOptions;

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = `//www.profitabledisplaynetwork.com/${ADSTERRA_KEY}/invoke.js`;
      
      // Clear previous ads and append new scripts
      container.innerHTML = '';
      container.appendChild(script);
      container.appendChild(invokeScript);
    }
  }, [componentKey]); // Re-run when the key changes

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
