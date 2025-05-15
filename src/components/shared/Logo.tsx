
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
    sm: { width: 120, height: 46, svgHeight: 30 }, // Adjusted svgHeight for balance
    md: { width: 180, height: 70, svgHeight: 40 }, // Adjusted svgHeight
    lg: { width: 240, height: 93, svgHeight: 50 }, // Adjusted svgHeight
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (loadingSettings) {
    // Skeleton represents the entire logo area
    return <Skeleton className={className} style={{ width: currentSize.width, height: currentSize.height, borderRadius: '0.375rem' }} />;
  }

  const customLogoUrl = settings?.logoUrl;

  return (
    <Link href="/" className={cn("flex items-center gap-2", className)} style={{ height: currentSize.height }}>
      {customLogoUrl && (
        // Container for the custom image
        <div 
          className="relative flex items-center justify-center" 
          style={{ 
            height: currentSize.svgHeight, 
            // Max width for custom logo, e.g., twice its height. Aspect ratio will be maintained by object-contain.
            width: currentSize.svgHeight * 2, 
          }}
        >
          <Image
            src={customLogoUrl}
            alt={settings?.siteName || "Custom Site Logo"}
            fill // Use fill and object-contain for better responsive scaling within the parent div
            className="object-contain"
            unoptimized={customLogoUrl.startsWith('data:image')}
            priority // Consider if logo is LCP
          />
        </div>
      )}
      {/* Apna Esport Text Logo - SVG scales based on height prop and its viewBox */}
      <ApnaEsportLogo height={currentSize.svgHeight} className="shrink-0" />
    </Link>
  );
}
