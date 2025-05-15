// components/shared/ApnaEsportLogo.tsx
import type { SVGProps } from 'react';

export function ApnaEsportLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 220 50" // Increased viewBox width for potentially wider text
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
        fontSize="36" // Increased font size for more vertical fill
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        fontFamily="Arial, sans-serif"
        letterSpacing="1"
      >
        APNA ESPORT
      </text>
    </svg>
  );
}
