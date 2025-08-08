
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter font for a modern look
import "./globals.css";
import { AppProviders } from "@/components/layout/AppProviders";
import { cn } from "@/lib/utils";
import { getSiteSettingsFromFirestore } from "@/lib/tournamentStore";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans", // Changed variable name to --font-sans for consistency
});

// Statically generate metadata if possible, but the app is dynamic
// export async function generateMetadata(): Promise<Metadata> {
//   const settings = await getSiteSettingsFromFirestore();

//   return {
//     title: settings?.siteName || "Apna Esport - Your Ultimate Gaming Platform",
//     description: settings?.siteDescription || "Organize and participate in online gaming tournaments on Apna Esport.",
//     icons: {
//       icon: settings?.faviconUrl || "/favicon.ico", // Default fallback
//     },
//   };
// }

export const metadata: Metadata = {
    title: "Apna Esport - Your Ultimate Gaming Platform",
    description: "Organize and participate in online gaming tournaments on Apna Esport.",
    icons: {
      icon: "/favicon.ico",
    },
};

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
      </body>
    </html>
  );
}
