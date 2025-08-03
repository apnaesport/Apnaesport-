
import { PageTitle } from "@/components/shared/PageTitle";
import { getNotificationsFromFirestore } from "@/lib/tournamentStore";
import AdminNotificationsClient from "./AdminNotificationsClient";

export default async function AdminNotificationsPage() {
  const sentNotifications = await getNotificationsFromFirestore();

  return (
    <div className="space-y-8">
      <PageTitle
        title="Send Notifications"
        subtitle="Communicate with users or make platform announcements."
      />
      <AdminNotificationsClient initialNotifications={sentNotifications} />
    </div>
  );
}
