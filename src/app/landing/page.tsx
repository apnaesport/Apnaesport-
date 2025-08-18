
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Trophy, Users, ShieldCheck, Gamepad2, Star, Megaphone } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export const metadata: Metadata = {
  title: "Apna Esport | India's Premier Gaming Tournament Platform",
  description: "Welcome to Apna Esport, the ultimate destination for competitive gaming in India. Join tournaments, build communities, and rise as a champion in your favorite games. Professional, trusted, and community-focused.",
  keywords: ["Apna Esport", "esports India", "gaming tournaments", "online gaming community", "BGMI tournaments", "Free Fire tournaments", "competitive gaming", "play and win"],
};

const FloatingShape = ({ className, delay }: { className: string, delay: string }) => (
  <div 
    className={`absolute rounded-full filter blur-3xl opacity-30 animate-float ${className}`}
    style={{ animationDelay: delay }}
  />
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="glassmorphism-card p-6 rounded-2xl text-center group transition-all duration-300 hover:border-primary/50 hover:-translate-y-2">
    <div className="inline-block p-4 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
      <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
    </div>
    <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const StatItem = ({ value, label }: { value: string, label: string }) => (
  <div className="text-center">
    <p className="text-4xl md:text-5xl font-bold gradient-text">{value}</p>
    <p className="text-sm text-muted-foreground uppercase tracking-widest">{label}</p>
  </div>
);

export default function LandingPage() {
  return (
    <div className="landing-page relative font-sans">
      {/* Background Shapes */}
      <FloatingShape className="w-72 h-72 bg-primary top-10 left-[-10%]" delay="0s" />
      <FloatingShape className="w-80 h-80 bg-secondary top-1/2 right-[-15%]" delay="2s" />
      <FloatingShape className="w-60 h-60 bg-accent bottom-20 left-[20%]" delay="4s" />

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-4 sm:p-6 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Logo size="md" />
          <Button asChild>
            <Link href="/dashboard">Launch App <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center text-center px-4 pt-20 relative overflow-hidden">
        <div className="z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tighter leading-tight">
            Welcome to <span className="gradient-text">Apna Esport</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            India's premier platform for competitive gaming. Join tournaments, build communities, and become a champion.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto text-lg shadow-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105">
              <Link href="/tournaments">Explore Tournaments</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-lg border-2 bg-transparent hover:bg-card/50 hover:text-white">
              <Link href="/auth/register">Join for Free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
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

      {/* Statistics Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto glassmorphism-card rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StatItem value="10,000+" label="Active Players" />
            <StatItem value="500+" label="Tournaments Hosted" />
            <StatItem value="₹1 Lakh+" label="Prizes Distributed" />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 text-center relative z-10">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Rise?</h2>
          <p className="max-w-xl mx-auto text-muted-foreground mb-8">
            Your journey to esports glory starts here. Create your account and join the action today.
          </p>
          <Button asChild size="lg" className="text-lg shadow-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105">
            <Link href="/auth/register">Sign Up and Compete Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10 text-center text-muted-foreground text-sm z-10 relative">
        <p>&copy; {new Date().getFullYear()} Apna Esport. All rights reserved.</p>
      </footer>
    </div>
  );
}
