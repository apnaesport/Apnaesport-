
"use client";

import { useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface AdSenseBlockProps {
  adSlot: string;
  adFormat?: 'auto' | 'display' | 'in-article';
  className?: string;
  style?: React.CSSProperties;
}

const AD_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-3791001029407994';

export function AdSenseBlock({
  adSlot,
  adFormat = 'auto',
  className,
  style,
}: AdSenseBlockProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const adContainerRef = useRef<HTMLDivElement>(null);


  const adKey = useMemo(() => {
    // Re-render the ad when the path or theme changes
    return `${pathname}-${resolvedTheme}`;
  }, [pathname, resolvedTheme]);

  useEffect(() => {
    // Only push the ad if the container has rendered and has a width.
    // This prevents the "availableWidth=0" error.
    if (adContainerRef.current && adContainerRef.current.offsetWidth > 0) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, [adKey, adContainerRef]); // Re-run when the key or ref changes.

  return (
    <div
      key={adKey}
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
