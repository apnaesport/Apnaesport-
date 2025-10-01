
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans", 
  display: 'swap',
});

// This layout is minimal and specific to the landing page.
// It does not include the main app's sidebar or header providers.
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}
    >
      {children}
    </div>
  );
}
