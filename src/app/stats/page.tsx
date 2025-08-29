
"use client"; 

import { MainLayout } from "@/components/layout/MainLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import type { StatItem, Tournament } from "@/lib/types";
import { LogIn, Loader2, Lock } from "lucide-react"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserStats = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // This is a placeholder for a locked feature.
      // No data is fetched.
    } catch (error) {
      console.error("Error fetching user stats (locked feature):", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) { 
      fetchUserStats();
    }
  }, [authLoading, user, fetchUserStats]);


  if (authLoading) {
     return (
      <MainLayout>
        <PageTitle title="My Statistics" />
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading...</p>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <PageTitle title="Access Denied" subtitle="You need to be logged in to view your statistics." />
          <LogIn className="h-16 w-16 text-primary my-6" />
          <Button asChild size="lg">
            <Link href="/auth/login?redirect=/stats">Login to View Stats</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Feature Locked View
  return (
    <MainLayout>
      <PageTitle title="My Statistics" />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] text-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Lock className="mr-2 h-7 w-7 text-primary" />
              Feature Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The Statistics page is temporarily unavailable.
              <br />
              Please check back later!
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
