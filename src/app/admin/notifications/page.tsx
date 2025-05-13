
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, History, Megaphone } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const notificationSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
  target: z.enum(["all_users", "specific_users", "tournament_participants"]), // Add more targets as needed
  // specificUserIds: z.string().optional(), // For 'specific_users'
  // tournamentId: z.string().optional(), // For 'tournament_participants'
  type: z.enum(["info", "warning", "success", "error", "announcement"]),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      message: "",
      target: "all_users",
      type: "announcement",
    },
  });

  const onSubmit: SubmitHandler<NotificationFormData> = (data) => {
    console.log("Sending notification:", data);
    // TODO: Implement actual notification sending logic (e.g., via Firebase Cloud Messaging, email service)
    toast({
      title: "Notification Sent (Simulated)",
      description: `"${data.title}" has been broadcasted to ${data.target.replace('_', ' ')}.`,
    });
    form.reset();
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
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && <p className="text-destructive text-xs mt-1">{form.formState.errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" {...form.register("message")} rows={5} />
              {form.formState.errors.message && <p className="text-destructive text-xs mt-1">{form.formState.errors.message.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="target">Target Audience</Label>
                <Select onValueChange={(value) => form.setValue("target", value as NotificationFormData["target"])} defaultValue={form.getValues("target")}>
                  <SelectTrigger id="target">
                    <SelectValue placeholder="Select target..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">All Users</SelectItem>
                    <SelectItem value="specific_users" disabled>Specific Users (Coming Soon)</SelectItem>
                    <SelectItem value="tournament_participants" disabled>Tournament Participants (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Notification Type</Label>
                 <Select onValueChange={(value) => form.setValue("type", value as NotificationFormData["type"])} defaultValue={form.getValues("type")}>
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
              </div>
            </div>
            
            {/* Conditional inputs for specific targets would go here */}

            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
              <Send className="mr-2 h-4 w-4" /> {form.formState.isSubmitting ? "Sending..." : "Send Notification"}
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
          {/* Placeholder for notification history table/list */}
          <p className="text-muted-foreground">Notification history will be displayed here.</p>
          <ul className="mt-4 space-y-2">
            <li className="p-3 border rounded-md bg-card">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Welcome to TournamentHub v2!</h4>
                    <span className="text-xs text-muted-foreground">Aug 15, 2024 - Announcement</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate">Check out the new features and improvements...</p>
            </li>
             <li className="p-3 border rounded-md bg-card">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Scheduled Maintenance</h4>
                    <span className="text-xs text-muted-foreground">Aug 10, 2024 - Warning</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 truncate">Platform will be down for maintenance on...</p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

