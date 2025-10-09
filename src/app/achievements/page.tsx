
import { PageTitle } from "@/components/shared/PageTitle";
import { MainLayout } from "@/components/layout/MainLayout";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AchievementsClient from "./AchievementsClient";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "My Achievements - Apna Esport",
  description: "View your collection of prestigious achievements earned by competing in Apna Esport tournaments. Showcase your skill and dedication.",
};

export const dynamic = 'force-dynamic';

export default function AchievementsPage() {
    return (
        <MainLayout>
            <div className="space-y-8">
                <PageTitle
                    title="My Achievements"
                    subtitle="A collection of your greatest accomplishments on Apna Esport."
                />
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <AchievementsClient />
                </Suspense>
            </div>
        </MainLayout>
    )
}
