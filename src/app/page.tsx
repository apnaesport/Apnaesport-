
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Directly redirect to the main content page, which is now public
    router.replace("/dashboard");
  }, [router]);

  // Show a brief loading spinner during the redirection process
  return <LoadingSpinner fullPage showLogo showProgressBar text="Initializing TournamentHub..." />;
}
