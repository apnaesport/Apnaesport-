
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
  "Initializing TournamentHub...",
  "Loading user data...",
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
  text: initialText = "Loading...", // Renamed prop for clarity, will be the first message shown
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
    // Always set the initial message when the component mounts or initialText changes
    setCurrentMessage(initialText);

    let progressInterval: NodeJS.Timeout | undefined;
    let messageInterval: NodeJS.Timeout | undefined;
    let initialDisplayTimeout: NodeJS.Timeout | undefined;

    if (showProgressBar) {
      setProgress(10); // Reset progress

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 800);

      // Show the initialText for a short duration before starting to cycle
      initialDisplayTimeout = setTimeout(() => {
        // Set the first cycling message
        setCurrentMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        // Then start the interval for cycling messages
        messageInterval = setInterval(() => {
          setCurrentMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
        }, 2000);
      }, 750); // Display initialText for 0.75 seconds

    } else {
      // If not showing progress bar, just stick with the initial text
      setCurrentMessage(initialText);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (messageInterval) clearInterval(messageInterval);
      if (initialDisplayTimeout) clearTimeout(initialDisplayTimeout);
    };
  }, [initialText, showProgressBar]); // Rerun if initialText or showProgressBar changes

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

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
}
