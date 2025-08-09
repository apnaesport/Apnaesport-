

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gamepad2, Trophy, Target, Eye, Briefcase } from "lucide-react"; 
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Apna Esport - India's Gaming Community",
  description: "Learn about Apna Esport, India’s premier online esports platform. Discover our vision for competitive gaming, what tournaments we offer, and how we're building a top community for passionate gamers.",
};


export default function AboutUsPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="About Apna Esport" subtitle="India’s upcoming online esports platform, crafted for passionate gamers and students looking to compete, learn, and rise as champions in their favorite games." />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Target className="mr-2 h-6 w-6 text-primary"/>Our Vision at Apna Esport</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Our vision at Apna Esport is to build the most engaging and competitive esports platform in India. We believe every gamer, regardless of age or location, deserves a chance to showcase their skills, compete in fair and exciting tournaments, and grow within a supportive community. We are dedicated to making Apna Esport the top destination for amateur and student gamers looking for an online gaming platform.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Gamepad2 className="mr-2 h-6 w-6 text-primary"/>What We Offer for Gamers</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground mb-4">Apna Esport is a premier gaming competition site where you can play and win in your favorite esports titles.</p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                <li>Open and student-focused esports tournaments for popular games in India.</li>
                <li>Competitive problem leagues with redeemable rewards and prizes.</li>
                <li>The ability to host your own private tournaments with custom codes.</li>
                <li>A prestigious Champions Board highlighting top-performing players on Apna Esport.</li>
            </ul>
        </CardContent>
      </Card>


      <div className="grid md:grid-cols-1 gap-6">
        <Card>
          <CardHeader className="items-center text-center">
            <Eye className="h-12 w-12 text-primary mb-2" />
            <CardTitle>Why Choose Apna Esport?</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
            Apna Esport is more than just a tournament platform; we focus on both competitive play and personal development. We are committed to combining the excitement of gaming with opportunities for growth, education, and recognition in the Indian esports scene.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-6 w-6 text-primary"/>Contact & Collaboration</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>We are always open to sponsorships, collaborations, and school-based gaming events. To partner with Apna Esport, please reach out to us at <a href="mailto:Apnaesportservice@gmail.com" className="text-primary hover:underline">Apnaesportservice@gmail.com</a>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
