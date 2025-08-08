
"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebarNav } from "@/components/layout/AdminSidebarNav";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ShieldAlert } from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import Link from "next/link"; // Added Link for footer

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login?redirect=/admin/dashboard");
      } else if (!isAdmin) {
        router.push("/dashboard"); 
      }
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) {
    return <LoadingSpinner fullPage text={loading ? "Verifying access..." : "Access Denied"} />;
  }

  return (
     <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          <span className="text-xl font-bold text-destructive">Admin</span>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <AdminSidebarNav />
        </SidebarContent>
         <SidebarFooter className="p-2 text-xs text-muted-foreground/80 flex flex-col items-center gap-1">
          <div>Apna Esport Admin Panel</div>
           <div className="flex gap-2 text-xs">
            <Link href="/terms" className="hover:text-primary" target="_blank">Terms</Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="/privacy" className="hover:text-primary" target="_blank">Privacy</Link>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
