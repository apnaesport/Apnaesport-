
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "../ui/skeleton";

export function LandingHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="absolute top-0 left-0 w-full p-4 sm:p-6 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Logo size="md" />
        {loading ? (
          <Skeleton className="h-10 w-36 rounded-md" />
        ) : user ? (
          <Button asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Open Dashboard
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/auth/register">
              Join Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
