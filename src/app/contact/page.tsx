

import { PageTitle } from "@/components/shared/PageTitle";
import { ContactForm } from "@/components/contact/ContactForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Us - Apna Esport",
  description: "Get in touch with the Apna Esport team. Send us your questions, suggestions, or collaboration inquiries through our official contact form.",
};


export default function ContactPage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="Contact Us" 
        subtitle="Got questions or suggestions? Fill the form below, and we’ll get back to you soon!" 
      />
      <ContactForm />
    </div>
  );
}
