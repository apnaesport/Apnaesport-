
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const AdminGamesClient = dynamic(() => import("./AdminGamesClient"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function AdminGamesPage() {

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Games"
        subtitle="Add, edit, or remove games supported on the platform."
      />
      <AdminGamesClient />
    </div>
  );
}
