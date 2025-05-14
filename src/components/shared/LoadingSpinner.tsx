
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
  text?: string;
  showLogo?: boolean;
  showProgressBar?: boolean;
}

const loadingMessages = [
  "Initializing TournamentHub...",
  "Loading user data...",
  "Preparing dashboard...",
  "Fetching latest tournaments...",
  "Almost there...",
];

export function LoadingSpinner({
  size = "md",
  className,
  fullPage = false,
  text = "Loading...",
  showLogo = false,
  showProgressBar = false,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const [currentMessage, setCurrentMessage] = useState(text);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (showProgressBar) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 800);

      const messageInterval = setInterval(() => {
        setCurrentMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
      }, 2000);

      return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
      };
    }
  }, [showProgressBar]);


  const spinnerContent = (
    <div className={cn("flex flex-col items-center justify-center gap-6", className)}>
      {showLogo ? (
        <div className="animate-pulse">
          <Logo size="lg" />
        </div>
      ) : (
        <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      )}
      <p className="text-lg text-foreground">{currentMessage}</p>
      {showProgressBar && (
        <div className="w-1/2 max-w-md">
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
