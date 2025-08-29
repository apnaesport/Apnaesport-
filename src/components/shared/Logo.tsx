
"use client";

import Link from "next/link";
import { useSiteSettings } from "@/contexts/SiteSettingsContext"; 
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SVGProps } from 'react';

// Inlined from ApnaEsportLogo.tsx for simplicity
function InlinedApnaEsportLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 220 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <title>Apna Esport Logo</title>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="30"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        fontFamily="Arial, sans-serif"
        letterSpacing="0.5"
      >
        APNA ESPORT
      </text>
    </svg>
  );
}


export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const { settings, loadingSettings } = useSiteSettings(); 

  const sizeClasses = {
    sm: { height: 32, svgHeight: 28 },
    md: { height: 40, svgHeight: 36 },
    lg: { height: 48, svgHeight: 42 },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (loadingSettings) {
    const skeletonWidth = currentSize.svgHeight * 4; 
    return <Skeleton className={cn(className, "rounded-md")} style={{ width: skeletonWidth, height: currentSize.height }} />;
  }

  return (
    <Link 
      href="/" 
      className={cn("flex items-center", className)}
      style={{ height: currentSize.height }}
      aria-label="Apna Esport Homepage"
    >
      <InlinedApnaEsportLogo height={currentSize.svgHeight} className="shrink-0" />
    </Link>
  );
}
