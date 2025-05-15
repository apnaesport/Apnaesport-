
"use client";

import Link from "next/link";
import Image from "next/image";
import { ApnaEsportLogo } from "./ApnaEsportLogo";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const { settings, loadingSettings } = useSiteSettings();

  // Adjusted sizes: svgHeight dictates the height of graphic elements.
  // customImageWidth is same as svgHeight to make a square container.
  // height is for the overall Link container for alignment.
  const sizeClasses = {
    sm: { height: 32, svgHeight: 28, customImageWidth: 28 },
    md: { height: 40, svgHeight: 36, customImageWidth: 36 },
    lg: { height: 48, svgHeight: 42, customImageWidth: 42 },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (loadingSettings) {
    // Skeleton width approximates a square custom logo + text logo width
    const skeletonWidth = currentSize.customImageWidth + (currentSize.svgHeight * 3.6); // Approx aspect ratio of text logo
    return <Skeleton className={cn(className, "rounded-md")} style={{ width: skeletonWidth, height: currentSize.height }} />;
  }

  const customLogoUrl = settings?.logoUrl;

  return (
    <Link 
      href="/" 
      className={cn("flex items-center gap-1.5", className)}
      style={{ height: currentSize.height }}
    >
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
            alt={settings?.siteName || "Apna Esport Custom Logo"}
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
