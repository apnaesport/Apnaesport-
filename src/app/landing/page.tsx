
import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

export const metadata: Metadata = {
  title: "Apna Esport | India's Premier Online Gaming Tournament Platform",
  description: "Welcome to Apna Esport (apnasport), the ultimate destination for competitive gaming in India. Join tournaments for popular games like BGMI and Free Fire. Build communities, compete for prizes, and rise as a champion. Professional, trusted, and community-focused.",
  keywords: ["Apna Esport", "apnasport", "esports India", "gaming tournaments", "online gaming community", "BGMI tournaments", "Free Fire tournaments", "competitive gaming", "play and win", "Indian gamers"],
};

export default function LandingPage() {
  return (
    <div className="landing-page relative font-sans">
      <LandingPageClient />
    </div>
  );
}
