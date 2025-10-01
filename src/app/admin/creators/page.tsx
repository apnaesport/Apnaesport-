
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const AdminCreatorsClient = dynamic(() => import("./AdminCreatorsClient"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function AdminCreatorsPage() {

  return (
    <div className="space-y-8">
      <PageTitle
        title="Creator Management"
        subtitle="Approve new creator applications and manage verified creators."
      />
      <AdminCreatorsClient />
    </div>
  );
}
