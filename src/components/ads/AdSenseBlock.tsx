
"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Megaphone } from 'lucide-react';

interface AdSenseBlockProps {
  className?: string;
  style?: React.CSSProperties;
}

const AD_CLIENT_ID = "ca-pub-3791001029407994";
const AD_SLOT_ID = "5628628328";

export function AdSenseBlock({
  className,
  style,
}: AdSenseBlockProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Check if the container is mounted and has a width
    if (adContainerRef.current && adContainerRef.current.offsetWidth > 0) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        // This error is common in development and can be ignored.
        // It happens when an ad slot is re-rendered.
      }
    }
  }, [pathname]);

  return (
    <div
      key={pathname} // Force re-render on each navigation to get a fresh ad slot
      ref={adContainerRef}
      className={cn(
        "ad-container bg-muted/20 border-border rounded-lg",
        "min-h-[90px] w-full",
        className
      )}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: 'auto', ...style }}
        data-ad-client={AD_CLIENT_ID}
        data-ad-slot={AD_SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}
