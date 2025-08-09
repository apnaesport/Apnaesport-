
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter font for a modern look
import "./globals.css";
import { AppProviders } from "@/components/layout/AppProviders";
import { cn } from "@/lib/utils";
import { getSiteSettingsFromFirestore } from "@/lib/tournamentStore";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans", 
});


export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsFromFirestore();

  const siteName = settings?.siteName || 'Apna Esport';
  const description = settings?.siteDescription || 'The ultimate platform for competitive gaming tournaments in India. Join or host tournaments for popular games, climb the leaderboard, and become a champion with Apna Esport.';

  return {
    title: {
      template: `%s | ${siteName}`,
      default: `${siteName} - India's Online Esports Tournament Platform`,
    },
    description: description,
    keywords: ["esports", "tournaments", "gaming", "India", "Apna Esport", "online gaming", "competitive gaming", "Free Fire", "BGMI"],
    icons: {
      icon: settings?.faviconUrl || "/favicon.ico", 
    },
    openGraph: {
        title: `${siteName} - Online Esports Tournaments`,
        description: description,
        siteName: siteName,
        type: 'website',
        locale: 'en_IN',
    }
  };
}


// This forces all pages to be dynamically rendered.
// It's a broad-stroke solution to prevent prerendering errors on Vercel
// for pages that fetch data from Firebase on the server.
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <AppProviders>{children}</AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
