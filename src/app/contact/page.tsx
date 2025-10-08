

"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { ContactForm } from "@/components/contact/ContactForm";
import type { Metadata } from 'next';
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";


const metadata: Metadata = {
  title: "Contact Us - Apna Esport",
  description: "Get in touch with the Apna Esport (apnasport) team. Send us your questions, suggestions, or collaboration inquiries through our official contact form. We're here for gaming support and esports collaborations.",
  keywords: ["Apna Esport contact", "apnasport contact", "gaming support", "esports collaboration", "contact Apna Esport", "apna esport help center", "apna esport support email"],
};

export default function ContactPage() {
  const { settings, loadingSettings } = useSiteSettings();

  return (
    <div className="space-y-8">
      <PageTitle 
        title="Contact Us" 
        subtitle="Got questions about our esports tournaments or suggestions for our online gaming platform? Fill the form below, and we’ll get back to you soon!" 
      />
      
      {loadingSettings ? (
          <Skeleton className="h-24 w-full" />
      ) : settings?.externalContactUrl && (
           <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <PhoneCall className="h-6 w-6"/>
                        Need Immediate Assistance?
                    </CardTitle>
                    <p className="text-muted-foreground mt-1">For urgent support or partnership inquiries, contact us directly.</p>
                </div>
                <Button asChild size="lg" className="w-full sm:w-auto">
                    <a href={settings.externalContactUrl} target="_blank" rel="noopener noreferrer">Contact Us Live</a>
                </Button>
            </CardHeader>
           </Card>
      )}

      <ContactForm />
    </div>
  );
}
