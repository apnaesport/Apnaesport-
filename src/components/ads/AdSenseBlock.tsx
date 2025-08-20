
"use client";

import { useEffect, useMemo } from 'react';
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

  const adKey = useMemo(() => {
    // Re-render the ad when the path or theme changes
    return `${pathname}-${resolvedTheme}`;
  }, [pathname, resolvedTheme]);

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [adKey]); // Dependency on the key ensures the ad reloads on navigation

  return (
    <div
      key={adKey}
      className={cn(
        "ad-container flex items-center justify-center bg-muted/50 text-muted-foreground",
        "min-h-[90px] w-full",
        className
      )}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={AD_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
