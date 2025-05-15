// components/shared/ApnaEsportLogo.tsx
import type { SVGProps } from 'react';

export function ApnaEsportLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="180"
      height="70"
      viewBox="0 0 180 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="apnaEsportLogoTitle"
      role="img"
      {...props}
    >
      <title id="apnaEsportLogoTitle">Apna Esport Logo</title>
      {/* Angular Border */}
      <path
        d="M5 20 L15 5 L165 5 L175 20 L175 50 L165 65 L15 65 L5 50 Z"
        stroke="hsl(var(--primary))" // Using primary color from theme
        strokeWidth="3"
        fill="transparent"
      />
      {/* Text: APNA */}
      <text
        x="50%"
        y="32" // Adjusted y for APNA
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="24"
        fontWeight="bold"
        fill="hsl(var(--foreground))" // Using foreground color from theme
        fontFamily="Arial, sans-serif" // A common bold font
        letterSpacing="1"
      >
        APNA
      </text>
      {/* Text: ESPORT */}
      <text
        x="50%"
        y="55" // Adjusted y for ESPORT
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="24"
        fontWeight="bold"
        fill="hsl(var(--foreground))" // Using foreground color from theme
        fontFamily="Arial, sans-serif" // A common bold font
        letterSpacing="1"
      >
        ESPORT
      </text>
    </svg>
  );
}
