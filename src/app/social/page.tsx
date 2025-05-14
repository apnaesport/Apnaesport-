
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, MessageSquare, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";

export default function SocialPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <PageTitle title="Social Hub" subtitle="Connecting Players and Teams" />
             <p className="text-lg text-muted-foreground">Loading social features...</p>
        </div>
    );
  }
  
  if (!user) {
     return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <PageTitle title="Access Denied" subtitle="You need to be logged in to access social features." />
           <LogIn className="h-16 w-16 text-primary my-6" />
          <Button asChild size="lg">
            <Link href="/auth/login?redirect=/social">Login to Access Social Features</Link>
          </Button>
        </div>
      </>
    );
  }


  return (
    <div className="space-y-8">
      <PageTitle title="Social Hub" subtitle="Connect with players, form teams, and join the conversation!" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-6 w-6 text-primary" />
              Friends
            </CardTitle>
            <CardDescription>Connect with fellow players and build your network.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Friend system coming soon! You'll be able to add friends, see their activity, and more.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-6 w-6 text-primary" />
              Teams
            </CardTitle>
            <CardDescription>Create or join teams to compete together.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Team functionality is under development. Soon you'll be able to create teams, manage rosters, and enter team-based tournaments.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-6 w-6 text-primary" />
              Discussions
            </CardTitle>
            <CardDescription>Chat with participants in tournaments or discuss strategies.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Tournament chat and general discussion forums are planned for a future update.</p>
          </CardContent>
        </Card>
      </div>

       <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground">Stay tuned for exciting social features coming to Apna Esport!</p>
        </div>
    </div>
  );
}
