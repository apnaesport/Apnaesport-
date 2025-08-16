

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gamepad2, Trophy, Target, Eye, Briefcase, HelpCircle, CheckCircle } from "lucide-react"; 
import type { Metadata } from 'next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


export const metadata: Metadata = {
  title: "About Apna Esport - India's Gaming Community",
  description: "Learn about Apna Esport (apnasport), India’s premier online esports platform. Discover our vision for competitive gaming, what tournaments we offer, and how we're building a top community for passionate gamers.",
  keywords: ["Apna Esport", "apnasport", "about Apna Esport", "esports vision", "Indian gaming community", "student gamers", "esports faq"],
};

const faqItems = [
    {
        question: "What is Apna Esport?",
        answer: "Apna Esport is an online esports platform in India designed for passionate gamers and students to compete in tournaments, improve their skills, and join a vibrant gaming community."
    },
    {
        question: "How do I join a tournament?",
        answer: "To join a tournament, simply create an account, browse the available tournaments for your favorite game, and click the 'Register' or 'Join' button. Make sure to read the specific rules and registration requirements for each event."
    },
    {
        question: "Are the tournaments free to join?",
        answer: "We offer both free-to-enter and premium tournaments with entry fees. Free tournaments may use a point system for entry, while premium ones might have cash or larger prize pools. Details are listed on each tournament's page."
    },
    {
        question: "What games do you host tournaments for?",
        answer: "We host tournaments for a variety of popular mobile and PC games in India, including titles like BGMI, Free Fire, and more. Check our 'Games' page for a full list of supported games."
    },
    {
        question: "How can I partner or sponsor with Apna Esport?",
        answer: "We are always looking for new partners and sponsors! If you're interested in collaborating, please visit our footer and click 'Partner With Us' or email us directly at Apnaesportservice@gmail.com."
    }
];


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
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
               <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" /><span>Open and student-focused esports tournaments for popular games in India.</span></li>
               <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" /><span>Competitive problem leagues with redeemable rewards and prizes.</span></li>
               <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" /><span>The ability to host your own private tournaments with custom codes.</span></li>
               <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-primary mt-1 shrink-0" /><span>A prestigious Champions Board highlighting top-performing players on Apna Esport.</span></li>
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
          <CardTitle className="flex items-center"><HelpCircle className="mr-2 h-6 w-6 text-primary"/>Frequently Asked Questions (FAQ)</CardTitle>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                         {item.answer}
                      </AccordionContent>
                  </AccordionItem>
              ))}
            </Accordion>
        </CardContent>
      </Card>

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
