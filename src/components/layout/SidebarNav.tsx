
"use client";

import {
  Home,
  LayoutDashboard,
  Swords,
  Gamepad2,
  Settings,
  LogOut,
  ShieldCheck,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tournaments", label: "Tournaments", icon: Swords },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/stats", label: "My Stats", icon: BarChart3 },
];

const secondaryNavItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { logout, isAdmin } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <SidebarMenu>
        {mainNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={item.label}
                className={cn(
                  isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <a>
                  <item.icon />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <div className="mt-auto"> {/* Pushes secondary items and logout to the bottom */}
        <SidebarMenu>
          {isAdmin && (
             <SidebarMenuItem>
               <Link href="/admin/dashboard" passHref legacyBehavior>
                 <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/dashboard")}
                    tooltip="Admin Panel"
                    className={cn(
                      isActive("/admin/dashboard") && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                 >
                    <a>
                      <ShieldCheck />
                      <span>Admin Panel</span>
                    </a>
                 </SidebarMenuButton>
               </Link>
             </SidebarMenuItem>
          )}
          {secondaryNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  tooltip={item.label}
                  className={cn(
                    isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="Logout" className="text-destructive hover:bg-destructive/20 hover:text-destructive-foreground/80 focus:bg-destructive/30 focus:text-destructive-foreground">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </>
  );
}
