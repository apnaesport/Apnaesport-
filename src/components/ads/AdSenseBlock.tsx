
"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AdSenseBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

const AD_CLIENT_ID = "ca-pub-3791001029407994";
const AD_SLOT_ID = "5628628328"; // Updated with your official Ad Slot ID

export function AdSenseBlock({
  className,
  style,
}: AdSenseBlockProps) {
  const pathname = usePathname();
  const adContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Only try to load an ad if the ref is available and has a width
    if (adContainerRef.current && adContainerRef.current.offsetWidth > 0) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, [pathname]); // Re-run when the path changes.

  return (
    <div
      key={pathname} // Force re-mount on path change
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
        data-ad-slot={AD_SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
