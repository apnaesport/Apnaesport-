

"use client";

import Image, { type ImageProps } from "next/image";
import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import { forwardRef, useMemo } from "react";
import { Coins } from "lucide-react"; // Import a default icon
import type { UserProfile } from "@/lib/types";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc: string | StaticImport | null;
  user?: UserProfile | null; // Pass the whole user object
  onError?: React.ReactEventHandler<HTMLImageElement>;
  as?: React.ElementType;
}

export const ImageWithFallback = forwardRef<HTMLImageElement, ImageWithFallbackProps>(
  ({ src, fallbackSrc, alt, user, onError, as: Comp = Image, unoptimized: unoptimizedProp, ...props }, ref) => {
    
    const { settings } = useSiteSettings();
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

    // Determine the final source based on premium status
    const finalSrc = useMemo(() => {
        if (user?.isPremium && user.premiumPhotoURL) {
            return user.premiumPhotoURL;
        }
         if (user?.isPremium && !user.premiumPhotoURL && settings?.defaultPremiumAvatarUrl) {
            return settings.defaultPremiumAvatarUrl;
        }
        return src || fallbackSrc;
    }, [user, src, fallbackSrc, settings]);


    if (!finalSrc) {
        // If all sources are missing, render a placeholder icon
        return <Coins className="w-full h-full text-muted-foreground" />;
    }
    
    const finalAlt = alt || 'Apna Esport placeholder image';
    
    // Correctly handle the 'unoptimized' prop. It should be true or undefined, not false.
    const unoptimized = (unoptimizedProp || isDataUri) ? true : undefined;

    return <Comp ref={ref} src={finalSrc} alt={finalAlt} onError={handleError} unoptimized={unoptimized} {...props} />;
  }
);

ImageWithFallback.displayName = "ImageWithFallback";
