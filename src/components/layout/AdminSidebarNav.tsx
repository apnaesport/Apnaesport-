

"use client";

import {
  LayoutDashboard,
  Swords,
  Gamepad2,
  Users,
  Settings,
  LogOut,
  Bell,
  BarChartBig,
  Loader2,
  Handshake,
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

const adminNavItems = [
  { href: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
  { href: "/admin/tournaments", label: "Tournaments", icon: Swords },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/games", label: "Games", icon: Gamepad2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChartBig },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/sponsorships", label: "Sponsorships", icon: Handshake },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

export function AdminSidebarNav() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
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
        {adminNavItems.map((item) => (
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
