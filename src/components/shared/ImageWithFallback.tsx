
"use client";

import Image, { type ImageProps } from "next/image";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import { forwardRef, useMemo } from "react";
import { Coins } from "lucide-react"; // Import a default icon

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc: string | StaticImport | null;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  as?: React.ElementType;
}

export const ImageWithFallback = forwardRef<HTMLImageElement, ImageWithFallbackProps>(
  ({ src, fallbackSrc, alt, onError, as: Comp = Image, unoptimized: unoptimizedProp, ...props }, ref) => {
    
    const isDataUri = useMemo(() => typeof src === 'string' && src.startsWith('data:'), [src]);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const fallbackUrl = typeof fallbackSrc === 'string' ? fallbackSrc : (fallbackSrc as StaticImport)?.src;
        if (fallbackUrl && e.currentTarget.src !== fallbackUrl) {
            e.currentTarget.src = fallbackUrl;
            if (onError) {
                onError(e);
            }
        }
    };

    const finalSrc = src || fallbackSrc;
    if (!finalSrc) {
        // If both src and fallbackSrc are missing, render a placeholder icon
        return <Coins className="w-full h-full text-muted-foreground" />;
    }
    
    const finalAlt = alt || 'Apna Esport placeholder image';
    
    // Correctly handle the 'unoptimized' prop. It should be true or undefined, not false.
    const unoptimized = (unoptimizedProp || isDataUri) ? true : undefined;

    return <Comp ref={ref} src={finalSrc} alt={finalAlt} onError={handleError} unoptimized={unoptimized} {...props} />;
  }
);

ImageWithFallback.displayName = "ImageWithFallback";
