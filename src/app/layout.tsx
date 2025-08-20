
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
  const defaultDescription = "Join Apna Esport (or apnasport) – the ultimate platform for gamers in India. Create and join tournaments for top games like BGMI and Free Fire, play online matches, earn AE Points, and connect with the esports community.";
  const keywords = ["Apna Esport", "apnasport", "esports tournaments India", "online gaming platform", "play and win esports", "gaming competition site", "Free Fire", "BGMI", "Apna Esport tournaments", "Apna Esport gaming", "live gaming tournament", "mobile gaming tournaments", "apna esport login", "apna esport registration", "AE Points", "Apna ID"];

  return {
    title: {
      template: `%s | ${siteName}`,
      default: defaultTitle,
    },
    description: defaultDescription,
    keywords: keywords,
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
        {/* Google AdSense */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-3791001029407994'}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Google Tag Manager */}
        <Script id="google-tag-manager-head" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PKL3DXDN');
          `}
        </Script>
        {/* End Google Tag Manager */}
        
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-WQ4H7M6M3F" strategy="afterInteractive"></Script>
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-WQ4H7M6M3F');
          `}
        </Script>
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
            <iframe
                src="https://www.googletagmanager.com/ns.html?id=GTM-PKL3DXDN"
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
            ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <AppProviders>{children}</AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
