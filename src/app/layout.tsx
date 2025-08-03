
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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsFromFirestore();

  return {
    title: settings?.siteName || "Apna Esport - Your Ultimate Gaming Platform",
    description: settings?.siteDescription || "Organize and participate in online gaming tournaments on Apna Esport.",
    icons: {
      icon: settings?.faviconUrl || "/favicon.ico", // Default fallback
    },
  };
}


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
