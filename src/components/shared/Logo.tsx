
"use client"; // Required because we're using a hook

import Link from "next/link";
import Image from "next/image";
import { ApnaEsportLogo } from "./ApnaEsportLogo";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const { settings, loadingSettings } = useSiteSettings();

  // Increased sizes for a more prominent logo
  const sizeClasses = {
    sm: { width: 213, height: 50, svgHeight: 45, customImageWidth: 45 }, // Was: width: 140, height: 45, svgHeight: 30, customImageWidth: 30
    md: { width: 259, height: 60, svgHeight: 55, customImageWidth: 55 }, // Was: width: 165, height: 55, svgHeight: 36, customImageWidth: 36
    lg: { width: 305, height: 70, svgHeight: 65, customImageWidth: 65 }, // Was: width: 190, height: 65, svgHeight: 42, customImageWidth: 42 
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (loadingSettings) {
    return <Skeleton className={cn(className, "rounded-md")} style={{ width: currentSize.width, height: currentSize.height }} />;
  }

  const customLogoUrl = settings?.logoUrl;

  return (
    <Link 
      href="/" 
      className={cn("flex items-center gap-1.5", className)} // Reduced gap slightly
      style={{ height: currentSize.height }}
    >
      {customLogoUrl && (
        <div
          className="relative flex items-center justify-center"
          style={{
            height: currentSize.svgHeight, // Use svgHeight for consistency
            width: currentSize.customImageWidth, // Use explicit width for custom image container
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
