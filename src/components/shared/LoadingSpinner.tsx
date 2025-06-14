
"use client";

import { Loader2, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/shared/Logo";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fullPage?: boolean;
  text?: string; // This will be treated as the initial text
  showLogo?: boolean;
  showProgressBar?: boolean;
}

const loadingMessages = [
  "Preparing dashboard...",
  "Fetching latest tournaments...",
  "Almost there...",
  "Polishing the pixels...",
  "Warming up the servers...",
  "Gathering the champions...",
];

export function LoadingSpinner({
  size = "md",
  className,
  fullPage = false,
  text: initialText = "Loading...",
  showLogo = false,
  showProgressBar = false,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const [currentMessage, setCurrentMessage] = useState(initialText);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    setCurrentMessage(initialText); // Always set the initial message

    let progressInterval: NodeJS.Timeout | undefined;
    let messageInterval: NodeJS.Timeout | undefined;
    let initialDisplayTimeout: NodeJS.Timeout | undefined;

    if (showProgressBar) {
      setProgress(10);

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 800);

      // Only cycle messages if not in fullPage mode, or if specifically desired later.
      // For fullPage, stick to initialText unless showProgressBar is false.
      if (!fullPage && showProgressBar) { 
        initialDisplayTimeout = setTimeout(() => {
          setCurrentMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
          messageInterval = setInterval(() => {
            setCurrentMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
          }, 2000);
        }, 750);
      }
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (messageInterval) clearInterval(messageInterval);
      if (initialDisplayTimeout) clearTimeout(initialDisplayTimeout);
    };
  }, [initialText, showProgressBar, fullPage]);

  if (fullPage) {
    // Returning null when fullPage is true to "remove" the full-page loading system as requested.
    return null;
  }

  const spinnerContent = (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
      {showLogo ? (
        <div className="animate-pulse">
          <Logo size="lg" />
        </div>
      ) : (
        <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      )}
      <p className="text-lg text-foreground text-center px-4">{currentMessage}</p>
      {showProgressBar && (
        <div className="w-1/2 max-w-md mt-2">
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );

  return spinnerContent;
}
