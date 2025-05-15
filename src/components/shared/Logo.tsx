
"use client"; // Required because we're using a hook

import Link from "next/link";
import Image from "next/image";
import { ApnaEsportLogo } from "./ApnaEsportLogo";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Skeleton } from "@/components/ui/skeleton";

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const { settings, loadingSettings } = useSiteSettings();

  const sizeClasses = {
    sm: { width: 120, height: 46, svgHeight: 35 }, // Adjusted svgHeight for better visual balance
    md: { width: 180, height: 70, svgHeight: 50 },
    lg: { width: 240, height: 93, svgHeight: 70 },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (loadingSettings) {
    return <Skeleton className={className} style={{ width: currentSize.width, height: currentSize.height, borderRadius: '0.375rem' }} />;
  }

  const customLogoUrl = settings?.logoUrl;

  return (
    <Link href="/" className={`flex items-center gap-2 font-bold text-primary hover:text-accent transition-colors ${className}`}>
      {customLogoUrl ? (
        <Image
          src={customLogoUrl}
          alt={settings?.siteName || "Apna Esport"}
          width={currentSize.width}
          height={currentSize.height}
          className="object-contain" // Use contain to prevent cropping
          unoptimized={customLogoUrl.startsWith('data:image')} // Important for Data URLs
          priority // Consider if logo is LCP
        />
      ) : (
        <ApnaEsportLogo width={currentSize.width} height={currentSize.svgHeight} />
      )}
    </Link>
  );
}
