
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
  Bell,
  Users,
  TrendingUp,
  Download,
  Star,
  Home,
  Coins, // Added
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import type { NavIndicator } from "@/lib/types";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tournaments", label: "Tournaments", icon: Swords },
  { href: "/leaderboard", label: "Leaderboard", icon: TrendingUp },
  { href: "/community", label: "Communities", icon: Users },
  { href: "/creators", label: "Creators", icon: Star },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/rewards", label: "Rewards", icon: Coins }, // Added
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const secondaryNavItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

const NavIndicatorBadge = ({ indicator }: { indicator: NavIndicator | undefined }) => {
    if (!indicator || !indicator.enabled) return null;

    const colorClasses = {
        primary: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        amber: 'bg-amber-500 text-white',
    }

    return (
        <Badge className={cn("ml-auto h-5 px-2 text-xs", colorClasses[indicator.color])}>
            {indicator.text}
        </Badge>
    )
}

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout, isAdmin, hasUnreadNotifications } = useAuth();
  const { settings, loadingSettings } = useSiteSettings();
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
        {mainNavItems.map((item) => {
            const indicator = settings?.navIndicators?.[item.href];
            const isNotifications = item.href === '/notifications';
          return (
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
                {isNotifications && hasUnreadNotifications && !indicator?.enabled && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-destructive" />
                )}
                <NavIndicatorBadge indicator={indicator} />
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        )})}
      </SidebarMenu>
      
      <div className="mt-auto flex flex-col gap-2">
         <Separator className="my-1 bg-sidebar-border" />
         <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/landing" passHref legacyBehavior>
                    <SidebarMenuButton as="a" tooltip="Home Page" onClick={() => handleNavigate('/landing')}>
                        <Home/>
                        <span>Home</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
         </SidebarMenu>
        {!loadingSettings && settings?.downloadAppLink && (
          <SidebarMenu className="p-2">
             <SidebarMenuItem>
                <a href={settings.downloadAppLink} target="_blank" rel="noopener noreferrer" className="w-full">
                    <SidebarMenuButton as="div" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <Download />
                        <span>Download App</span>
                    </SidebarMenuButton>
                </a>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <Separator className="my-1 bg-sidebar-border" />
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
