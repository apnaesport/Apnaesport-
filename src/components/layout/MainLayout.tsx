
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
        <SidebarFooter className="p-2 text-xs text-muted-foreground/80 flex flex-col items-center gap-1">
          <div>&copy; {new Date().getFullYear()} Apna Esport</div>
          <div className="flex gap-2 text-xs">
            <Link href="/about" className="hover:text-primary">About</Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="/contact" className="hover:text-primary">Contact</Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="/terms" className="hover:text-primary">Terms</Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="/privacy" className="hover:text-primary">Privacy</Link>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
        <footer className="bg-background border-t">
          <SponsorshipCTA />
          <div className="container mx-auto py-4 px-4 md:px-6 lg:px-8 text-center text-sm text-muted-foreground">
             <p>Built with ❤️ by Jitender Prajapat</p>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
