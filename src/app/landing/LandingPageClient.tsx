
"use client";

import { FeatureCard, FloatingShape, StatItem } from "./LandingPageComponents";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingCTAButtons } from "@/components/layout/LandingCTAButtons";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Trophy, Users, ShieldCheck, Gamepad2, Star, Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdsterraBlock } from '@/components/ads/AdsterraBlock';

export default function LandingPageClient() {
  const { settings, loadingSettings } = useSiteSettings();

  return (
    <>
      <FloatingShape className="w-72 h-72 bg-primary top-10 left-[-10%]" delay="0s" />
      <FloatingShape className="w-80 h-80 bg-secondary top-1/2 right-[-15%]" delay="2s" />
      <FloatingShape className="w-60 h-60 bg-accent bottom-20 left-[20%]" delay="4s" />

      <LandingHeader />

      <section className="min-h-screen flex items-center justify-center text-center px-4 pt-20 relative overflow-hidden">
        <div className="z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tighter leading-tight">
            Welcome to <span className="gradient-text">Apna Esport</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            India's premier platform for competitive gaming. Join tournaments, build communities, and become a champion.
          </p>
          <div className="mt-8">
            <LandingCTAButtons />
          </div>
        </div>
      </section>

      {/* Adsterra Block: Leaderboard below hero */}
      <section className="py-10 px-4 relative z-10 flex justify-center">
        <AdsterraBlock format="leaderboard" className="w-full max-w-4xl" />
      </section>
      
      {!loadingSettings && settings?.showVideoSectionOnLanding && settings.landingPageVideoUrl && (
        <section id="video" className="py-20 px-4 relative z-10">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-white">See What's Happening</h2>
            <div className="aspect-video max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary/30">
              <iframe
                className="w-full h-full"
                src={settings.landingPageVideoUrl}
                title="Apna Esport Promotion"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>
      )}

      <section id="features" className="py-20 px-4 relative z-10">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-white">Why Choose Apna Esport?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={Trophy} title="Competitive Tournaments" description="Participate in professionally organized tournaments for your favorite games and win amazing prizes." />
            <FeatureCard icon={Users} title="Build Your Community" description="Create or join communities, connect with fellow gamers, and grow together as a team." />
            <FeatureCard icon={ShieldCheck} title="Trusted & Secure" description="Our platform ensures fair play with robust anti-cheat measures and a secure environment." />
            <FeatureCard icon={Gamepad2} title="Wide Game Support" description="We host events for a vast range of popular PC and mobile esports titles across India." />
            <FeatureCard icon={Star} title="Creator Hub" description="Get noticed as a rising creator. Gain votes, get featured, and grow your audience." />
            <FeatureCard icon={Megaphone} title="Seamless Experience" description="An intuitive, user-friendly interface designed for gamers, by gamers." />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto glassmorphism-card rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatItem value="10,000+" label="Active Players" />
            <StatItem value="500+" label="Tournaments Hosted" />
            <StatItem value="₹1 Lakh+" label="Prizes Distributed" />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 text-center relative z-10">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Rise?</h2>
          <p className="max-w-xl mx-auto text-muted-foreground mb-8">
            Your journey to esports glory starts here. Create your account and join the action today.
          </p>
          <LandingCTAButtons />
        </div>
      </section>
       {/* Adsterra Block: Above footer */}
      <section className="py-10 px-4 relative z-10 flex justify-center">
        <AdsterraBlock format="leaderboard" className="w-full max-w-5xl" />
      </section>
      <footer className="py-8 px-4 border-t border-white/10 text-center text-muted-foreground text-sm z-10 relative">
        <p>&copy; {new Date().getFullYear()} Apna Esport. All rights reserved.</p>
      </footer>
    </>
  );
}
