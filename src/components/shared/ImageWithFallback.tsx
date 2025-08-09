
"use client";

import Image, { type ImageProps } from "next/image";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import { forwardRef, useMemo } from "react";

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc: string | StaticImport;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  as?: React.ElementType;
}

export const ImageWithFallback = forwardRef<HTMLImageElement, ImageWithFallbackProps>(
  ({ src, fallbackSrc, alt, onError, as: Comp = Image, unoptimized, ...props }, ref) => {
    
    const isDataUri = useMemo(() => typeof src === 'string' && src.startsWith('data:'), [src]);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const fallbackUrl = typeof fallbackSrc === 'string' ? fallbackSrc : fallbackSrc.src;
        if (e.currentTarget.src !== fallbackUrl) {
            e.currentTarget.src = fallbackUrl;
            if (onError) {
                onError(e);
            }
        }
    };

    const finalSrc = src || fallbackSrc;
    if (!finalSrc) {
        // If both src and fallbackSrc are missing, render a placeholder or nothing
        return <div className="w-full h-full bg-muted" />; // Simple placeholder
    }
    
    const finalAlt = alt || 'Apna Esport placeholder image';

    return <Comp ref={ref} src={finalSrc} alt={finalAlt} onError={handleError} unoptimized={unoptimized || isDataUri} {...props} />;
  }
);

ImageWithFallback.displayName = "ImageWithFallback";
