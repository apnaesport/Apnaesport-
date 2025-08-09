
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
  const defaultTitle = "Apna Esport | Play, Compete & Win in Esports Tournaments";
  const defaultDescription = "Join Apna Esport – the ultimate platform for gamers. Create tournaments, play online matches, and connect with the esports community.";

  return {
    title: {
      template: `%s | ${siteName}`,
      default: defaultTitle,
    },
    description: defaultDescription,
    keywords: ["Apna Esport", "esports tournaments India", "online gaming platform", "play and win esports", "gaming competition site", "Free Fire", "BGMI"],
    icons: {
      icon: settings?.faviconUrl || "/favicon.ico", 
    },
    openGraph: {
        title: defaultTitle,
        description: defaultDescription,
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
