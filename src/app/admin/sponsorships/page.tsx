
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const AdminSponsorshipsClient = dynamic(() => import("./AdminSponsorshipsClient"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function AdminSponsorshipsPage() {

  return (
    <div className="space-y-8">
      <PageTitle
        title="Sponsorship Management"
        subtitle="Review and manage incoming sponsorship and partnership requests."
      />
      <AdminSponsorshipsClient />
    </div>
  );
}
