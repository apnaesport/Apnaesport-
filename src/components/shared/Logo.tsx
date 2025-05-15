
"use client"; // Required because we're using a hook

import Link from "next/link";
import Image from "next/image";
import { ApnaEsportLogo } from "./ApnaEsportLogo";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const { settings, loadingSettings } = useSiteSettings();

  const sizeClasses = {
    sm: { width: 130, height: 50, svgHeight: 34, customImageWidth: 34 }, // Adjusted for better proportions
    md: { width: 190, height: 75, svgHeight: 46, customImageWidth: 46 }, // Adjusted for better proportions
    lg: { width: 250, height: 100, svgHeight: 60, customImageWidth: 60 }, // Adjusted for better proportions
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (loadingSettings) {
    // Skeleton represents the entire logo area
    return <Skeleton className={className} style={{ width: currentSize.width, height: currentSize.height, borderRadius: '0.375rem' }} />;
  }

  const customLogoUrl = settings?.logoUrl;

  return (
    <Link href="/" className={cn("flex items-center gap-1.5", className)} style={{ height: currentSize.height }}>
      {customLogoUrl && (
        <div 
          className="relative flex items-center justify-center" 
          style={{ 
            height: currentSize.svgHeight, 
            width: currentSize.customImageWidth, 
          }}
        >
          <Image
            src={customLogoUrl}
            alt={settings?.siteName || "Custom Site Logo"}
            fill 
            className="object-contain"
            unoptimized={customLogoUrl.startsWith('data:image')}
            priority 
          />
        </div>
      )}
      <ApnaEsportLogo height={currentSize.svgHeight} className="shrink-0" />
    </Link>
  );
}
