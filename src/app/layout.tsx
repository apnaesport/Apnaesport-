
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter font for a modern look
import "./globals.css";
import { AppProviders } from "@/components/layout/AppProviders";
import { cn } from "@/lib/utils";
import { getSiteSettingsFromFirestore } from "@/lib/tournamentStore";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

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
    keywords: ["Apna Esport", "esports tournaments India", "online gaming platform", "play and win esports", "gaming competition site", "Free Fire", "BGMI", "Apna Esport tournaments", "Apna Esport gaming", "live gaming tournament", "mobile gaming tournaments"],
    verification: {
      google: "TSL2LK5j2gIj78fs8OcZ-GlswqLrFURzzeFiV88pYho",
      other: {
        "google-adsense-account": "ca-pub-3791001029407994",
      }
    },
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
      <head>
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-GL9PTE05HH"></Script>
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-GL9PTE05HH');
          `}
        </Script>
      </head>
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
