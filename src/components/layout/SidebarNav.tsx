
"use client";

import {
  LayoutDashboard,
  Swords,
  Gamepad2,
  Settings,
  LogOut,
  ShieldCheck,
  BarChart3,
  Loader2,
  Bell // Added Bell for notifications
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
import { useState, useEffect } from "react";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tournaments", label: "Tournaments", icon: Swords },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/stats", label: "My Stats", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell }, // Added Notifications link
];

const secondaryNavItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { logout, isAdmin } = useAuth();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href; 
    if (href === "/admin/dashboard" && pathname.startsWith("/admin")) return true; 
    return pathname.startsWith(href) && href !== "/admin/dashboard"; 
  };
  
  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const handleNavigate = (href: string) => {
    if (pathname !== href) { 
      setNavigatingTo(href);
    }
  };


  return (
    <>
      <SidebarMenu>
        {mainNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                as="a" 
                isActive={isActive(item.href)}
                tooltip={item.label}
                onClick={() => handleNavigate(item.href)}
                className={cn(
                  isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                {navigatingTo === item.href ? <Loader2 className="animate-spin" /> : <item.icon />}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <div className="mt-auto"> 
        <SidebarMenu>
          {isAdmin && (
             <SidebarMenuItem>
               <Link href="/admin/dashboard" passHref legacyBehavior>
                 <SidebarMenuButton
                    as="a"
                    isActive={isActive("/admin/dashboard")}
                    tooltip="Admin Panel"
                    onClick={() => handleNavigate("/admin/dashboard")}
                    className={cn(
                      isActive("/admin/dashboard") && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                 >
                    {navigatingTo === "/admin/dashboard" ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                    <span>Admin Panel</span>
                 </SidebarMenuButton>
               </Link>
             </SidebarMenuItem>
          )}
          {secondaryNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  as="a"
                  isActive={isActive(item.href)}
                  tooltip={item.label}
                  onClick={() => handleNavigate(item.href)}
                  className={cn(
                    isActive(item.href) && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  {navigatingTo === item.href ? <Loader2 className="animate-spin" /> : <item.icon />}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => {
                logout();
              }} 
              tooltip="Logout" 
              className="text-destructive hover:bg-destructive/20 hover:text-destructive-foreground/80 focus:bg-destructive/30 focus:text-destructive-foreground"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </>
  );
}
