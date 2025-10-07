import { MainLayout } from "@/components/layout/MainLayout";
import type { ReactNode } from "react";

export default function MyTournamentsLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
