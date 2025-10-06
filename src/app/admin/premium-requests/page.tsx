

"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const AdminPremiumRequestsClient = dynamic(() => import("./AdminPremiumRequestsClient"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function AdminPremiumRequestsPage() {

  return (
    <div className="space-y-8">
      <PageTitle
        title="Premium Requests"
        subtitle="Review and manage user requests for premium status."
      />
      <AdminPremiumRequestsClient />
    </div>
  );
}

