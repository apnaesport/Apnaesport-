
"use client";

import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface AdPlacementProps {
  adKey: string;
  type: 'leaderboard' | 'mediumRectangle' | 'video';
  className?: string;
}

const adConfig = {
    leaderboard: { width: 728, height: 90, format: 'iframe' },
    mediumRectangle: { width: 300, height: 250, format: 'iframe' },
    video: { width: 300, height: 250, format: 'iframe' }, // Adsterra in-page is often this size
};

export function AdPlacement({ adKey, type, className }: AdPlacementProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current || !adKey || !adContainerRef.current) {
        return;
    }

    // Clear previous ad just in case
    adContainerRef.current.innerHTML = '';

    const config = adConfig[type];

    const containerId = `container-${adKey}-${Math.random().toString(36).substring(7)}`;

    // Create the container div that the Adsterra script looks for
    const adContainerDiv = document.createElement('div');
    adContainerDiv.id = containerId;
    
    // Create the script that calls the ad
    const adInvocationScript = document.createElement('script');
    adInvocationScript.type = 'text/javascript';
    adInvocationScript.innerHTML = `
        atOptions = {
            'key' : '${adKey}',
            'format' : '${config.format}',
            'height' : ${config.height},
            'width' : ${config.width},
            'params' : {}
        };
    `;

    // Create the main Adsterra script tag that loads their library
    const adsterraScript = document.createElement('script');
    adsterraScript.async = true;
    adsterraScript.src = `//pl23429392.highcpmgate.com/${adKey}/invoke.js`;
    
    // Append all parts to the container
    adContainerRef.current.appendChild(adContainerDiv);
    adContainerRef.current.appendChild(adInvocationScript);
    adContainerRef.current.appendChild(adsterraScript);
    
    hasRunRef.current = true;

  }, [adKey, type]);
  
  const getAspectRatio = () => {
    const config = adConfig[type];
    if (type === 'mediumRectangle' || type === 'video') return 'aspect-[300/250]';
    return 'aspect-[728/90]';
  };

  return (
    <Card className={cn(
        "flex items-center justify-center bg-muted/50 border-dashed w-full",
        className
    )}>
        <CardContent 
            className="p-1 w-full"
            style={{ 
                maxWidth: `${adConfig[type].width}px`, 
                maxHeight: `${adConfig[type].height}px`
            }}
        >
             <div
                ref={adContainerRef}
                className={cn(
                    "flex items-center justify-center w-full h-full min-h-[50px]",
                    getAspectRatio()
                )}
            >
                <Skeleton className="w-full h-full"/>
             </div>
        </CardContent>
    </Card>
  );
}
