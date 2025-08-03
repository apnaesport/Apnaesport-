
"use client";

import { useState } from "react";
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Metadata } from 'next';

// Note: Metadata in a client component is not directly supported for dynamic values,
// but we can set a static one here. For full dynamic SEO, a server component wrapper would be needed.
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Apna Esport team. Send us your questions, suggestions, or collaboration inquiries through our contact form.",
};


export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/xovdevwb", { // Replace with your Formspree endpoint if different
        method: "POST",
        headers: { 'Accept': 'application/json' },
        body: formData
      });

      if (response.ok) {
        form.reset();
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        toast({
          title: "Submission Error",
          description: errorData.error || "There was a problem sending your message. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network Error",
        description: "Failed to send message. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageTitle 
        title="Contact Us" 
        subtitle="Got questions or suggestions? Fill the form below, and we’ll get back to you soon!" 
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Mail className="mr-2 h-5 w-5 text-primary" />
            Send us a Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                name="name" 
                type="text" 
                placeholder="Your full name" 
                required 
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="you@example.com" 
                required 
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="message">Your Message *</Label>
              <Textarea 
                id="message" 
                name="message" 
                placeholder="Write your message here..." 
                rows={5} 
                required 
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-500 text-center text-xl">Message Sent!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Thank you for contacting us. We’ll reply shortly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={() => setShowSuccessModal(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
