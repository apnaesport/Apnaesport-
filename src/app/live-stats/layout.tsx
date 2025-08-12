
import { MainLayout } from "@/components/layout/MainLayout";
import type { ReactNode } from "react";

export default function LiveStatsLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
