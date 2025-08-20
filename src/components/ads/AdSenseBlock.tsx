
"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface AdSenseBlockProps {
  adSlot: string;
  adFormat?: 'auto' | 'display' | 'in-article';
  className?: string;
  style?: React.CSSProperties;
}

const AD_CLIENT_ID = "ca-pub-3791001029407994";

export function AdSenseBlock({
  adSlot,
  adFormat = 'auto',
  className,
  style,
}: AdSenseBlockProps) {
  const pathname = usePathname();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // Only try to load an ad if the ref is available and an ad hasn't been loaded in it yet.
    if (adContainerRef.current && !isAdLoaded.current) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isAdLoaded.current = true; // Mark as loaded to prevent re-pushes
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, [pathname, adSlot]); // Re-run when the path or slot changes.

  return (
    <div
      key={pathname + adSlot} // Force re-mount on path change
      ref={adContainerRef}
      className={cn(
        "ad-container flex items-center justify-center bg-muted/50 text-muted-foreground",
        "min-h-[90px] w-full",
        className
      )}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', ...style }}
        data-ad-client={AD_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
