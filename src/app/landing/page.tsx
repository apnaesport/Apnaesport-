
import type { Metadata } from "next";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card } from "@/components/ui/card";
import { ArrowRight, Trophy, Users, ShieldCheck, Gamepad2, Star, Megaphone } from "lucide-react";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingPageVideoAnimation } from "@/components/layout/LandingPageVideoAnimation";
import { useAuth } from "@/contexts/AuthContext";
import { LandingCTAButtons } from "@/components/layout/LandingCTAButtons";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { MainLayout } from "@/components/layout/MainLayout";
import LandingPageClient from "./LandingPageClient";

export const metadata: Metadata = {
  title: "Apna Esport | India's Premier Gaming Tournament Platform",
  description: "Welcome to Apna Esport, the ultimate destination for competitive gaming in India. Join tournaments, build communities, and rise as a champion in your favorite games. Professional, trusted, and community-focused.",
  keywords: ["Apna Esport", "esports India", "gaming tournaments", "online gaming community", "BGMI tournaments", "Free Fire tournaments", "competitive gaming", "play and win"],
};

export default function LandingPage() {
  return (
    <div className="landing-page relative font-sans">
      <LandingPageClient />
    </div>
  );
}
