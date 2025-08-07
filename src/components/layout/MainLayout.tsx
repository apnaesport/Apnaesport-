
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
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { SponsorshipCTA } from "./SponsorshipCTA";
import { Separator } from "../ui/separator";

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
        {/* The sidebar footer is removed from here to consolidate into a single main footer. */}
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
        <footer className="bg-background border-t">
          <SponsorshipCTA />
          <Separator />
          <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 text-center text-sm text-muted-foreground">
             <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mb-4">
                <Link href="/about" className="hover:text-primary transition-colors">About</Link>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
             </div>
             <p className="mb-2">Built with ❤️ by Jitender Prajapat</p>
             <p>&copy; {new Date().getFullYear()} Apna Esport. All rights reserved.</p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
