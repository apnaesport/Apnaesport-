
"use client";

import { type RefObject } from 'react';
import { toast } from '@/hooks/use-toast';

// Dynamically import html2canvas only when needed to reduce initial bundle size.
const getHtml2Canvas = () => import('html2canvas');

interface ExportOptions {
    scale?: number;
}

/**
 * Captures an HTML element and returns it as an HTMLCanvasElement.
 * @param element The HTML element to capture.
 * @param options Configuration for the canvas capture.
 * @returns A promise that resolves with the canvas element.
 */
const captureCardAsCanvas = async (element: HTMLElement, options: ExportOptions = {}): Promise<HTMLCanvasElement> => {
    const html2canvas = (await getHtml2Canvas()).default;
    if (!element) {
        throw new Error("Target element for capture not found.");
    }
    // Use improved options for better quality and reliability
    return html2canvas(element, {
        allowTaint: true,
        useCORS: true,
        scale: options.scale || 3, // Increased scale for higher resolution
        backgroundColor: null, // Ensure transparency is handled correctly
    });
};

/**
 * Triggers a browser download for the captured canvas image.
 * @param cardRef Ref to the HTML element to be downloaded.
 * @param fileName The desired name for the downloaded file.
 */
export const downloadAchievementImage = async (cardRef: RefObject<HTMLDivElement>, fileName: string) => {
    if (!cardRef.current) {
        toast({ title: "Error", description: "Card element not found.", variant: "destructive" });
        return;
    }
    try {
        const canvas = await captureCardAsCanvas(cardRef.current);
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        a.click();
    } catch (e) {
        console.error("Download Error:", e);
        toast({ title: "Error", description: "Could not download image. Please try again.", variant: "destructive" });
    }
};

/**
 * Uses the Web Share API to share the captured image, with a fallback to downloading.
 * @param cardRef Ref to the HTML element to be shared.
 * @param sharePayload Text content to share along with the image.
 */
export const shareAchievementCard = async (cardRef: RefObject<HTMLDivElement>, sharePayload: { title: string; text: string; fileName: string; }) => {
    if (!cardRef.current) {
        toast({ title: "Error", description: "Card element not found.", variant: "destructive" });
        return;
    }
    try {
        const canvas = await captureCardAsCanvas(cardRef.current);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png", 0.95));
        
        if (!blob) {
            throw new Error("Could not create image blob from canvas.");
        }
      
        const file = new File([blob], sharePayload.fileName, { type: "image/png" });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: sharePayload.title,
                text: sharePayload.text,
            });
        } else {
            // Fallback for browsers that don't support sharing files (like desktop)
            toast({ title: "Sharing Not Supported", description: "Your browser doesn't support sharing files directly. Downloading image instead.", variant: "default" });
            downloadAchievementImage(cardRef, sharePayload.fileName);
        }
    } catch (e) {
        console.error("Share Error:", e);
        toast({ title: "Sharing Failed", description: "Could not share the achievement card. Please try downloading it instead.", variant: "destructive" });
    }
};
