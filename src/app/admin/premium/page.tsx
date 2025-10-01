
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const AdminPremiumClient = dynamic(() => import("./AdminPremiumClient"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function AdminPremiumPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Premium User Management"
        subtitle="Grant or revoke premium status for users on the platform."
      />
      <AdminPremiumClient />
    </div>
  );
}
