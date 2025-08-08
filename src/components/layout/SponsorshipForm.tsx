
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { addSponsorshipRequestToFirestore } from "@/lib/tournamentStore";
import type { SponsorshipRequest } from "@/lib/types";

export function SponsorshipForm() {
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Not Logged In", description: "You must be logged in to send an inquiry.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const requestData: Omit<SponsorshipRequest, 'id' | 'createdAt' | 'status'> = {
        brandName: data.brandName as string,
        contactName: user.displayName || 'N/A',
        email: user.email || 'N/A',
        sponsorshipType: data.sponsorshipType as any,
        message: data.message as string,
    };

    try {
      await addSponsorshipRequestToFirestore(requestData);
      toast({
        title: "Inquiry Sent!",
        description: "Thank you for your interest! We will get back to you shortly.",
      });
      form.reset();
      // Here you could close the dialog if the state was managed from the parent
    } catch (error) {
      console.error("Error submitting sponsorship form:", error);
      toast({ title: "Error", description: "Could not send your inquiry. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return (
      <div className="text-center space-y-4 p-4 border rounded-md bg-muted/50">
        <h3 className="font-semibold">Please Login to Continue</h3>
        <p className="text-sm text-muted-foreground">You need to be logged in to send a partnership inquiry.</p>
        <Button asChild>
          <Link href="/auth/login?redirect=/dashboard">
            <LogIn className="mr-2 h-4 w-4" /> Login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="brandName">Brand / Company Name *</Label>
        <Input id="brandName" name="brandName" required disabled={isSubmitting} />
      </div>

       <div>
        <Label>Your Name</Label>
        <Input value={user.displayName || ""} disabled />
      </div>

       <div>
        <Label>Your Email</Label>
        <Input value={user.email || ""} disabled />
      </div>
      
      <div>
        <Label htmlFor="sponsorshipType">Type of Sponsorship *</Label>
        <Select name="sponsorshipType" required disabled={isSubmitting}>
          <SelectTrigger>
            <SelectValue placeholder="Select sponsorship type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tournament">Tournament Sponsorship</SelectItem>
            <SelectItem value="site-wide">Site-Wide Branding</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Message *</Label>
        <Textarea id="message" name="message" required disabled={isSubmitting} placeholder="Tell us about your brand and what you're looking for..."/>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {isSubmitting ? "Sending..." : "Send Inquiry"}
        </Button>
      </div>
    </form>
  );
}
