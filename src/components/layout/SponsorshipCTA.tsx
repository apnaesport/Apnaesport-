
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Handshake, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { addSponsorshipRequestToFirestore } from "@/lib/tournamentStore";

const sponsorshipSchema = z.object({
  brandName: z.string().min(2, "Brand name is required."),
  contactName: z.string().min(2, "Contact name is required."),
  email: z.string().email("Please enter a valid email address."),
  sponsorshipType: z.enum(['tournament', 'site-wide', 'other'], { required_error: "Please select a sponsorship type."}),
  message: z.string().min(10, "Please provide a brief message (min. 10 characters).").max(1000, "Message is too long."),
});

type SponsorshipFormData = z.infer<typeof sponsorshipSchema>;

export function SponsorshipCTA() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SponsorshipFormData>({
    resolver: zodResolver(sponsorshipSchema),
    defaultValues: {
      brandName: "",
      contactName: "",
      email: "",
      sponsorshipType: undefined,
      message: "",
    },
  });

  const onSubmit = async (data: SponsorshipFormData) => {
    setIsSubmitting(true);
    try {
      await addSponsorshipRequestToFirestore(data);
      toast({
        title: "Inquiry Sent!",
        description: "Thank you for your interest! We will get back to you shortly.",
      });
      form.reset();
    } catch (error) {
      console.error("Sponsorship form error:", error);
      toast({
        title: "Submission Failed",
        description: "Could not send your inquiry. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-secondary/30 py-12 sm:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center">
              <Handshake className="mr-3 h-10 w-10 text-primary" />
              Partner With Us
            </h2>
            <p className="text-lg text-muted-foreground">
              Amplify your brand's reach by partnering with Apna Esport. We offer unique sponsorship opportunities to connect with a passionate and engaged gaming community. Let's create something amazing together.
            </p>
          </div>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-background p-6 rounded-lg shadow-lg border">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brandName">Brand Name</Label>
                <Input id="brandName" {...form.register("brandName")} disabled={isSubmitting} />
                {form.formState.errors.brandName && <p className="text-destructive text-xs mt-1">{form.formState.errors.brandName.message}</p>}
              </div>
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input id="contactName" {...form.register("contactName")} disabled={isSubmitting} />
                {form.formState.errors.contactName && <p className="text-destructive text-xs mt-1">{form.formState.errors.contactName.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="email">Business Email</Label>
              <Input id="email" type="email" {...form.register("email")} disabled={isSubmitting} />
              {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
            </div>
             <div>
                <Label htmlFor="sponsorshipType">Sponsorship Type</Label>
                <Controller
                    name="sponsorshipType"
                    control={form.control}
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={isSubmitting}>
                        <SelectTrigger id="sponsorshipType">
                            <SelectValue placeholder="Select an option..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tournament">Tournament Sponsorship</SelectItem>
                            <SelectItem value="site-wide">Site-Wide Branding</SelectItem>
                            <SelectItem value="other">Other Inquiry</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
                {form.formState.errors.sponsorshipType && <p className="text-destructive text-xs mt-1">{form.formState.errors.sponsorshipType.message}</p>}
              </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" {...form.register("message")} disabled={isSubmitting} />
              {form.formState.errors.message && <p className="text-destructive text-xs mt-1">{form.formState.errors.message.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Sending Inquiry..." : "Send Inquiry"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
