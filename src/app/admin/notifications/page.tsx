
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, History, Megaphone, Loader2, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import type { NotificationMessage, NotificationFormData, NotificationType } from "@/lib/types";
import { sendNotificationToFirestore, getNotificationsFromFirestore } from "@/lib/tournamentStore";
import { format } from "date-fns";

const notificationSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title too long."),
  message: z.string().min(10, "Message must be at least 10 characters.").max(1000, "Message too long."),
  target: z.enum(["all_users", "specific_users", "tournament_participants"]), 
  type: z.enum(["info", "warning", "success", "error", "announcement"]),
});

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "error": return <XCircle className="h-4 w-4 text-red-500" />;
    case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "info": return <Info className="h-4 w-4 text-blue-500" />;
    case "announcement": return <Megaphone className="h-4 w-4 text-primary" />;
    default: return <Info className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [sentNotifications, setSentNotifications] = useState<NotificationMessage[]>([]);

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      message: "",
      target: "all_users",
      type: "announcement",
    },
  });

  const fetchNotificationHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getNotificationsFromFirestore();
      setSentNotifications(history);
    } catch (error) {
      console.error("Error fetching notification history:", error);
      toast({ title: "Error", description: "Could not load notification history.", variant: "destructive" });
    }
    setIsLoadingHistory(false);
  }, [toast]);

  useEffect(() => {
    fetchNotificationHistory();
  }, [fetchNotificationHistory]);

  const onSubmit: SubmitHandler<NotificationFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      await sendNotificationToFirestore(data);
      toast({
        title: "Notification Sent!",
        description: `"${data.title}" has been broadcasted to ${data.target.replace('_', ' ')}.`,
      });
      form.reset();
      await fetchNotificationHistory(); 
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({ title: "Send Failed", description: "Could not send notification.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageTitle
        title="Send Notifications"
        subtitle="Communicate with users or make platform announcements."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Megaphone className="mr-2 h-5 w-5 text-primary" /> Create Notification
          </CardTitle>
          <CardDescription>Compose and send a message to your users.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register("title")} disabled={isSubmitting} />
              {form.formState.errors.title && <p className="text-destructive text-xs mt-1">{form.formState.errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" {...form.register("message")} rows={5} disabled={isSubmitting} />
              {form.formState.errors.message && <p className="text-destructive text-xs mt-1">{form.formState.errors.message.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="target">Target Audience</Label>
                <Controller
                  name="target"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isSubmitting}>
                      <SelectTrigger id="target">
                        <SelectValue placeholder="Select target..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_users">All Users</SelectItem>
                        <SelectItem value="specific_users" disabled>Specific Users (Coming Soon)</SelectItem>
                        <SelectItem value="tournament_participants" disabled>Tournament Participants (Coming Soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="type">Notification Type</Label>
                <Controller
                    name="type"
                    control={form.control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isSubmitting}>
                        <SelectTrigger id="type">
                            <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="announcement">Announcement</SelectItem>
                            <SelectItem value="info">Information</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                        </Select>
                    )}
                />
              </div>
            </div>
            
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Sending..." : "Send Notification"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5 text-primary" /> Notification History
          </CardTitle>
          <CardDescription>View previously sent notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading history...</p>
            </div>
          ) : sentNotifications.length > 0 ? (
            <ul className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {sentNotifications.map(notif => (
                <li key={notif.id} className="p-4 border rounded-md bg-card shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                           <NotificationIcon type={notif.type} />
                           <h4 className="font-semibold text-foreground">{notif.title}</h4>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {notif.createdAt ? format(notif.createdAt.toDate(), "MMM dd, yyyy 'at' p") : "Unknown date"}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 pl-6 truncate">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1 pl-6">Target: {notif.target.replace("_", " ")}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No notifications have been sent yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
