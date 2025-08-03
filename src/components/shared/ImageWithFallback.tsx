
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
        if (e.currentTarget.src !== fallbackSrc) {
            e.currentTarget.src = typeof fallbackSrc === 'string' ? fallbackSrc : fallbackSrc.src;
            if (onError) {
                onError(e);
            }
        }
    };

    return <Comp ref={ref} src={src} onError={handleError} {...props} />;
  }
);

ImageWithFallback.displayName = "ImageWithFallback";
