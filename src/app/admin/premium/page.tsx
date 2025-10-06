
"use client";

import { Suspense } from 'react';
import { PageTitle } from "@/components/shared/PageTitle";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const AdminPremiumClient = dynamic(() => import("./AdminPremiumClient"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

function AdminPremiumPageContent() {
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

export default function AdminPremiumPage() {
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <AdminPremiumPageContent />
        </Suspense>
    );
}
