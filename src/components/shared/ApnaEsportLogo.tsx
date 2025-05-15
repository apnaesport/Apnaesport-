// components/shared/ApnaEsportLogo.tsx
import type { SVGProps } from 'react';

export function ApnaEsportLogo(props: SVGProps<SVGSVGElement>) {
  // Adjusted viewBox and text positioning for a cleaner "Apna Esport" text logo
  // Removed the angular border path
  return (
    <svg
      width="180" // Default width, can be scaled by parent
      height="70" // Default height, can be scaled by parent
      viewBox="0 0 180 50" // Adjusted viewBox for potentially tighter text
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="apnaEsportLogoTitle"
      role="img"
      {...props}
    >
      <title id="apnaEsportLogoTitle">Apna Esport Logo</title>
      {/* Text: Apna Esport */}
      <text
        x="50%"
        y="50%" // Centered vertically
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="22" // Slightly adjusted font size
        fontWeight="bold"
        fill="hsl(var(--foreground))" // Using foreground color from theme
        fontFamily="Arial, sans-serif" // A common bold font
        letterSpacing="1"
      >
        APNA ESPORT
      </text>
    </svg>
  );
}
