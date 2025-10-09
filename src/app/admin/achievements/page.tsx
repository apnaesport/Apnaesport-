
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

const AdminAchievementsClient = dynamic(() => import("./AdminAchievementsClient"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function AdminAchievementsPage() {

  return (
    <div className="space-y-8">
      <PageTitle
        title="Award Achievements"
        subtitle="Manually grant an achievement card and prize to a user for a specific tournament."
      />
      <AdminAchievementsClient />
    </div>
  );
}
