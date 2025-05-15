
"use client";

import Link from "next/link";
import { ApnaEsportLogo } from "./ApnaEsportLogo";
import { useSiteSettings } from "@/contexts/SiteSettingsContext"; // Kept for potential future use (e.g. site name)
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const { settings, loadingSettings } = useSiteSettings(); // Still useful for siteName if needed elsewhere

  const sizeClasses = {
    sm: { height: 32, svgHeight: 28 },
    md: { height: 40, svgHeight: 36 },
    lg: { height: 48, svgHeight: 42 },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (loadingSettings) {
    const skeletonWidth = currentSize.svgHeight * 4; // Approx width for "APNA ESPORT" text
    return <Skeleton className={cn(className, "rounded-md")} style={{ width: skeletonWidth, height: currentSize.height }} />;
  }

  return (
    <Link 
      href="/" 
      className={cn("flex items-center", className)}
      style={{ height: currentSize.height }}
      aria-label={settings?.siteName || "Apna Esport Home"}
    >
      <ApnaEsportLogo height={currentSize.svgHeight} className="shrink-0" />
    </Link>
  );
}
