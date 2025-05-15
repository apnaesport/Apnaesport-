
"use client"; // Required because we're using a hook

import Link from "next/link";
import Image from "next/image";
import { ApnaEsportLogo } from "./ApnaEsportLogo";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const { settings, loadingSettings } = useSiteSettings();

  // Adjusted sizes for a more compact logo
  const sizeClasses = {
    sm: { width: 120, height: 40, svgHeight: 28, customImageWidth: 28 }, 
    md: { width: 150, height: 50, svgHeight: 34, customImageWidth: 34 }, 
    lg: { width: 180, height: 60, svgHeight: 40, customImageWidth: 40 }, 
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (loadingSettings) {
    return <Skeleton className={className} style={{ width: currentSize.width, height: currentSize.height, borderRadius: '0.375rem' }} />;
  }

  const customLogoUrl = settings?.logoUrl;

  return (
    <Link href="/" className={cn("flex items-center gap-1.5", className)} style={{ height: currentSize.height }}>
      {customLogoUrl && (
        <div 
          className="relative flex items-center justify-center" 
          style={{ 
            height: currentSize.svgHeight, // Use svgHeight for consistent vertical alignment
            width: currentSize.customImageWidth, // Use customImageWidth
          }}
        >
          <Image
            src={customLogoUrl}
            alt={settings?.siteName || "Custom Site Logo"}
            fill 
            className="object-contain" // Ensures aspect ratio is maintained
            unoptimized={customLogoUrl.startsWith('data:image')}
            priority 
          />
        </div>
      )}
      <ApnaEsportLogo height={currentSize.svgHeight} className="shrink-0" />
    </Link>
  );
}
