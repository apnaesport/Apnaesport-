import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gamepad2, Trophy } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="About Apna Esport" subtitle="Your Ultimate Gaming Tournament Platform." />
      
      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Apna Esport is dedicated to providing a seamless and engaging platform for gamers of all levels to compete, connect,
            and showcase their skills. We believe in the power of esports to build communities and foster friendly competition.
            Our goal is to be the premier destination for online gaming tournaments.
          </p>
          <p>Content for this section will be expanded soon.</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="items-center text-center">
            <Users className="h-12 w-12 text-primary mb-2" />
            <CardTitle>For Players</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Discover tournaments, track your stats, join teams, and climb the leaderboards. Apna Esport is your arena.
            (More details coming soon)
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="items-center text-center">
            <Gamepad2 className="h-12 w-12 text-primary mb-2" />
            <CardTitle>For Organizers</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Easily create and manage tournaments with our intuitive tools. Reach a wide audience of passionate gamers.
            (More details coming soon)
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="items-center text-center">
            <Trophy className="h-12 w-12 text-primary mb-2" />
            <CardTitle>For Communities</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Build your esports community, host events, and engage with players in a dedicated environment.
            (More details coming soon)
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Our Story</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Content coming soon. This section will detail the history and vision behind Apna Esport.</p>
        </CardContent>
      </Card>
    </div>
  );
}
