
// components/shared/ApnaEsportLogo.tsx
import type { SVGProps } from 'react';

export function ApnaEsportLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 220 50" // Adjusted viewBox width to better fit "APNA ESPORT"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="apnaEsportLogoTitle"
      role="img"
      {...props}
    >
      <title id="apnaEsportLogoTitle">Apna Esport Logo</title>
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="30" // Slightly adjusted font size for balance
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        fontFamily="Arial, sans-serif" // Consider a more modern sans-serif if available/themed
        letterSpacing="0.5" // Adjusted letter spacing
      >
        APNA ESPORT
      </text>
    </svg>
  );
}
