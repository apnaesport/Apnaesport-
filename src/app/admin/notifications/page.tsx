
import { PageTitle } from "@/components/shared/PageTitle";
import AdminNotificationsClient from "./AdminNotificationsClient";

export default function AdminNotificationsPage() {

  return (
    <div className="space-y-8">
      <PageTitle
        title="Send Notifications"
        subtitle="Communicate with users or make platform announcements."
      />
      <AdminNotificationsClient />
    </div>
  );
}
