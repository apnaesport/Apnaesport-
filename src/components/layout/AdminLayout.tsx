
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
        router.push("/dashboard"); // Or an unauthorized page
      }
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) {
    // Show loading spinner, or a more specific "Access Denied" message if !isAdmin after loading
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
         <SidebarFooter className="p-2 text-xs text-muted-foreground/50">
          TournamentHub Admin
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
