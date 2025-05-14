
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter font for a modern look
import "./globals.css";
import { AppProviders } from "@/components/layout/AppProviders";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans", // Changed variable name to --font-sans for consistency
});

export const metadata: Metadata = {
  title: "Apna Esport - Your Ultimate Gaming Platform",
  description: "Organize and participate in online gaming tournaments on Apna Esport.",
};

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
