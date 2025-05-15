import Link from "next/link";
import { ApnaEsportLogo } from "./ApnaEsportLogo"; // Import the new SVG logo

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: { width: 120, height: 46 }, // Approx 2/3 of md
    md: { width: 180, height: 70 },
    lg: { width: 240, height: 93 }, // Approx 4/3 of md
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <Link href="/" className={`flex items-center gap-2 font-bold text-primary hover:text-accent transition-colors ${className}`}>
      <ApnaEsportLogo width={currentSize.width} height={currentSize.height} />
    </Link>
  );
}
