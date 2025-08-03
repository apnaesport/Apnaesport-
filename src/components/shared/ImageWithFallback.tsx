
"use client";

import Image, { type ImageProps } from "next/image";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import { forwardRef } from "react";

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc: string | StaticImport;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  as?: React.ElementType;
}

export const ImageWithFallback = forwardRef<HTMLImageElement, ImageWithFallbackProps>(
  ({ src, fallbackSrc, onError, as: Comp = Image, ...props }, ref) => {
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

    return <Comp ref={ref} src={finalSrc} onError={handleError} {...props} />;
  }
);

ImageWithFallback.displayName = "ImageWithFallback";
