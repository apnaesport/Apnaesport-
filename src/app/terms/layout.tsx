import { MainLayout } from "@/components/layout/MainLayout";
import type { ReactNode } from "react";

export default function TermsLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
