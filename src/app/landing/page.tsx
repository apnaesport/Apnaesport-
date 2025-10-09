
import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

export const metadata: Metadata = {
  title: "Apna Esport | India's Premier Gaming Tournament Platform",
  description: "Welcome to Apna Esport (apnasport), the ultimate destination for competitive gaming in India. Join tournaments for BGMI, Free Fire, and more. Build communities, and rise as a champion. Professional, trusted, and community-focused.",
  keywords: ["Apna Esport", "apnasport", "esports India", "gaming tournaments", "online gaming community", "BGMI tournaments", "Free Fire tournaments", "competitive gaming", "play and win"],
};

export default function LandingPage() {
  return (
    <div className="landing-page relative font-sans">
      <LandingPageClient />
    </div>
  );
}
