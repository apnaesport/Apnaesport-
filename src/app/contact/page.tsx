import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send } from "lucide-react";

export default function ContactPage() {
  // This is a placeholder form and does not actually send emails.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert("Contact form submitted (placeholder - no email sent). Thank you for reaching out!");
    // In a real app, you would handle form submission here (e.g., send data to an API endpoint).
  };

  return (
    <div className="space-y-8">
      <PageTitle title="Contact Us" subtitle="We'd love to hear from you!" />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center"><Mail className="mr-2 h-5 w-5 text-primary"/>Send us a Message</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input id="name" name="name" type="text" placeholder="John Doe" required />
            </div>
            <div>
              <Label htmlFor="email">Your Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" type="text" placeholder="Tournament Inquiry" required />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" placeholder="Your message here..." rows={5} required />
            </div>
            <Button type="submit" className="w-full">
              <Send className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
