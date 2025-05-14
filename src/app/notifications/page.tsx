
"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import type { NotificationMessage, NotificationType } from "@/lib/types";
import { getNotificationsFromFirestore } from "@/lib/tournamentStore";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BellRing, AlertTriangle, CheckCircle2, Info, XCircle, Megaphone, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NotificationIcon = ({ type, className }: { type: NotificationType, className?: string }) => {
  const iconProps = { className: cn("h-5 w-5", className) };
  switch (type) {
    case "success": return <CheckCircle2 {...iconProps} />;
    case "error": return <XCircle {...iconProps} />;
    case "warning": return <AlertTriangle {...iconProps} />;
    case "info": return <Info {...iconProps} />;
    case "announcement": return <Megaphone {...iconProps} />;
    default: return <BellRing {...iconProps} />;
  }
};

const getNotificationCardStyles = (type: NotificationType): string => {
  switch (type) {
    case "success": return "border-green-500/50 bg-green-500/10 hover:bg-green-500/20";
    case "error": return "border-red-500/50 bg-red-500/10 hover:bg-red-500/20";
    case "warning": return "border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20";
    case "info": return "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20";
    case "announcement": return "border-primary/50 bg-primary/10 hover:bg-primary/20";
    default: return "bg-card hover:bg-secondary/30";
  }
};


export default function UserNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return; // Should be protected by layout/redirect logic but good to have
    setIsLoading(true);
    try {
      // Users typically see 'all_users' notifications.
      // More complex targeting would require different query logic.
      const fetchedNotifications = await getNotificationsFromFirestore("all_users");
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({ title: "Error", description: "Could not load notifications.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotifications();
    }
     if (!authLoading && !user) {
      setIsLoading(false); // Stop loading if user is not authenticated
    }
  }, [authLoading, user, fetchNotifications]);

  if (authLoading || isLoading) {
    return (
      <MainLayout>
        <PageTitle title="Notifications" />
        <div className="flex items-center justify-center min-h-[calc(100vh-15rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading notifications...</p>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
     return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <PageTitle title="Access Denied" subtitle="You need to be logged in to view notifications." />
           <LogIn className="h-16 w-16 text-primary my-6" />
          <Button asChild size="lg">
            <Link href="/auth/login?redirect=/notifications">Login to View Notifications</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageTitle title="Notifications" subtitle="Stay updated with the latest announcements and alerts." />
      
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map(notif => (
            <Card key={notif.id} className={cn("transition-all duration-200", getNotificationCardStyles(notif.type))}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <NotificationIcon type={notif.type} className="mr-3 shrink-0" />
                    {notif.title}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                     {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : "Unknown date"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed ml-[calc(1.25rem+0.75rem)]">{notif.message}</p> 
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-10">
          <CardContent>
            <BellRing className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You have no new notifications at the moment.</p>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
