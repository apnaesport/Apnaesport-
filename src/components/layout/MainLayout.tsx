
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
import { Youtube, Twitter, Instagram, Facebook } from "lucide-react"; 
import { Button } from "../ui/button";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4">
          <Logo size="md" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
        <footer className="bg-secondary/20 border-t">
            <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center md:text-left">
                {/* Branding Column */}
                <div className="space-y-4 lg:col-span-1 flex flex-col items-center md:items-start">
                  <Logo size="lg"/>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    The ultimate destination for competitive gaming. Join tournaments, climb the leaderboard, and become a champion.
                  </p>
                </div>

                {/* Links Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:col-span-3 gap-8">
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
                            <li><Link href="/tournaments" className="text-muted-foreground hover:text-primary transition-colors">Tournaments</Link></li>
                            <li><Link href="/leaderboard" className="text-muted-foreground hover:text-primary transition-colors">Leaderboard</Link></li>
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
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-foreground mb-4">Connect With Us</h4>
                        <div className="flex items-center space-x-3 justify-center md:justify-start">
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
                       <div className="space-y-2 p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <h4 className="font-semibold text-foreground">Promote Your Brand</h4>
                        <SponsorshipCTA />
                      </div>
                    </div>
                </div>
              </div>

              <Separator className="my-8" />
              
              <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Apna Esport. All rights reserved.</p>
                <p className="mt-2 sm:mt-0">Built with ❤️ by Jitender Prajapat</p>
              </div>
            </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
