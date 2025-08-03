
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gamepad2, Trophy, Target, Eye, Briefcase } from "lucide-react"; // Added icons
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Apna Esport",
  description: "Learn about Apna Esport, India’s upcoming online esports platform. Discover our vision, what we offer, and how we are building a community for passionate gamers.",
};


export default function AboutUsPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="About Apna Esport" subtitle="India’s upcoming online esports platform, crafted for passionate gamers and students looking to compete, learn, and rise as champions." />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Target className="mr-2 h-6 w-6 text-primary"/>Our Vision</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            We aim to build the most engaging esports platform in India—where every gamer, regardless of age or location, has the chance to shine and grow.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Gamepad2 className="mr-2 h-6 w-6 text-primary"/>What We Offer</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>Open and student-based tournaments</li>
                <li>Problem Leagues with redeemable rewards</li>
                <li>Chance to host your own tournaments with custom codes</li>
                <li>A Champions Board highlighting top performers</li>
            </ul>
        </CardContent>
      </Card>


      <div className="grid md:grid-cols-1 gap-6">
        <Card>
          <CardHeader className="items-center text-center">
            <Eye className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Why Choose Us?</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
            Apna Esport focuses on both competitive play and personal development—combining gaming with growth, education, and opportunity.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-6 w-6 text-primary"/>Contact & Collaboration</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>We’re open to sponsorships, collaborations, and school-based gaming events. Reach out to us at <a href="mailto:Apnaesportservice@gmail.com" className="text-primary hover:underline">Apnaesportservice@gmail.com</a>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
