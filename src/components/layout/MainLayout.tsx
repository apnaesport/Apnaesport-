

"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Logo } from "@/components/shared/Logo";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { SponsorshipCTA } from "./SponsorshipCTA";
import { Separator } from "../ui/separator";
import { Youtube, Twitter, Instagram, Facebook, Download, Users, PlusCircle } from "lucide-react"; 
import { Button } from "../ui/button";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "../ui/badge";
import { ImageWithFallback } from "../shared/ImageWithFallback";
import { Skeleton } from "../ui/skeleton";
import { useState, useEffect } from "react";
import type { Community } from "@/lib/types";
import { listenToCommunityById } from "@/lib/tournamentStore";

interface MainLayoutProps {
  children: ReactNode;
}

const MyCommunityCard = () => {
    const { user, loading } = useAuth();
    const [community, setCommunity] = useState<Community | null>(null);
    const [communityLoading, setCommunityLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.communityId) {
            setCommunityLoading(false);
            setCommunity(null);
            return;
        }

        setCommunityLoading(true);
        const unsubscribe = listenToCommunityById(user.communityId, (liveCommunity) => {
            setCommunity(liveCommunity);
            setCommunityLoading(false);
        });

        return () => unsubscribe();
    }, [user, user?.communityId]);

    if (loading) {
        return <Skeleton className="h-32 w-full" />;
    }

    if (!user?.communityId) {
        return (
            <Card className="bg-card/50">
                <CardHeader className="p-3">
                    <CardTitle className="text-base">No Community Joined</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <p className="text-sm text-muted-foreground mb-3">Join a community to connect with other players.</p>
                    <Button asChild size="sm" className="w-full">
                        <Link href="/community">
                            <Users className="mr-2 h-4 w-4" /> Explore
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    if (communityLoading) {
        return <Skeleton className="h-32 w-full" />;
    }

    if (!community) {
         return (
            <Card className="bg-card/50 border-destructive">
                <CardHeader className="p-3">
                    <CardTitle className="text-base">Community Error</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <p className="text-sm text-muted-foreground">Could not load your community details. You may need to leave and rejoin.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card/50">
            <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center justify-between">
                    <span>My Community</span>
                    <Badge variant="outline">Member</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <Link href={`/community/${community.id}`} className="flex items-center gap-3 group">
                    <ImageWithFallback 
                        src={community.logoUrl || ''} 
                        fallbackSrc={`https://placehold.co/40x40.png?text=${community.name.substring(0, 2)}`}
                        alt={`${community.name} Logo`}
                        width={40} height={40}
                        className="rounded-md"
                        data-ai-hint="community logo"
                    />
                    <div>
                        <p className="font-semibold group-hover:text-primary transition-colors line-clamp-1">{community.name}</p>
                        <p className="text-xs text-muted-foreground">Click to view</p>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );
};

export function MainLayout({ children }: MainLayoutProps) {
  const { settings } = useSiteSettings();
  
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <Logo size="md" />
        </SidebarHeader>
        <SidebarContent className="p-2 flex flex-col">
            <div className="flex-grow">
                <SidebarNav />
            </div>
            <div className="p-2">
                <MyCommunityCard />
            </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
        <footer className="bg-secondary/20 border-t">
            <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {/* Branding Column */}
                <div className="space-y-4 md:col-span-4 lg:col-span-2 flex flex-col items-center text-center md:items-start md:text-left">
                  <Logo size="lg"/>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    The ultimate destination for competitive gaming. Join tournaments, build communities, and become a champion.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full">
                     <Card className="w-full">
                        <CardHeader className="p-4">
                           <CardTitle className="text-base flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Communities</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                           <p className="text-sm text-muted-foreground mb-3">Create or join a community to compete with friends.</p>
                           <Button asChild className="w-full" size="sm"><Link href="/community">Explore Communities</Link></Button>
                        </CardContent>
                     </Card>
                     <Card className="w-full">
                         <CardHeader className="p-4">
                           <CardTitle className="text-base">Sponsorships</CardTitle>
                         </CardHeader>
                         <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground mb-3">Get your brand in front of passionate gamers.</p>
                            <SponsorshipCTA />
                         </CardContent>
                     </Card>
                  </div>
                </div>

                {/* Links Columns */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:col-span-4 lg:col-span-3 gap-8 text-center sm:text-left">
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
                            <li><Link href="/tournaments" className="text-muted-foreground hover:text-primary transition-colors">Tournaments</Link></li>
                            <li><Link href="/community" className="text-muted-foreground hover:text-primary transition-colors">Communities</Link></li>
                            <li><Link href="/games" className="text-muted-foreground hover:text-primary transition-colors">Games</Link></li>
                            <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-6 col-span-2 sm:col-span-1">
                      <div>
                        <h4 className="font-semibold text-foreground mb-4">Connect With Us</h4>
                        <div className="flex items-center space-x-3 justify-center sm:justify-start">
                          <Button variant="outline" size="icon" asChild>
                              <a href="https://m.youtube.com/@apnaesport" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                  <Youtube className="h-5 w-5 text-red-600"/>
                              </a>
                          </Button>
                          <Button variant="outline" size="icon" asChild>
                              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                  <Twitter className="h-5 w-5 text-sky-500"/>
                              </a>
                          </Button>
                          <Button variant="outline" size="icon" asChild>
                              <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                  <Instagram className="h-5 w-5 text-pink-500"/>
                              </a>
                          </Button>
                        </div>
                      </div>
                      {settings?.downloadAppLink && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-4">Get our App</h4>
                          <Button asChild className="w-full">
                            <a href={settings.downloadAppLink} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" /> Download App
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                </div>
              </div>

              <Separator className="my-8" />
              
              <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Apna Esport. All rights reserved.</p>
                <p className="mt-2 sm:mt-0">Created by Jitender Prajapat</p>
              </div>
            </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

    