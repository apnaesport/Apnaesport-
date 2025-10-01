
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const AdminNotificationsClient = dynamic(() => import("./AdminNotificationsClient"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});


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
