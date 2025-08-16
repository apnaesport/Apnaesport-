
"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/shared/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Metadata } from 'next';

// Although metadata can't be exported from a client component, 
// we can define it here for reference or future conversion to server component.
export const metadata: Metadata = {
  title: "Login to Apna Esport",
  description: "Sign in to your Apna Esport account to join tournaments, manage your profile, and connect with the community. Secure apna esport login.",
  keywords: ["apna esport login", "apna esport sign in", "esports account login", "gaming login"],
};


export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectPath);
    }
  }, [user, loading, router, redirectPath]);

  if (loading || user) { // Also show loading if user object exists, to wait for redirect
    return <LoadingSpinner fullPage text="Checking session..." />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="mb-8">
        <Logo size="lg" />
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back!</CardTitle>
          <CardDescription>Sign in to access your Apna Esport dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Apna Esport. All rights reserved.
      </p>
    </div>
  );
}
