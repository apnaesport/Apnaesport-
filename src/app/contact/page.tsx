
import { PageTitle } from "@/components/shared/PageTitle";
import { ContactForm } from "@/components/contact/ContactForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Us - Apna Esport",
  description: "Get in touch with the Apna Esport (apnasport) team. Send us your questions, suggestions, or collaboration inquiries through our official contact form. We're here for gaming support and esports collaborations.",
  keywords: ["Apna Esport contact", "apnasport contact", "gaming support", "esports collaboration", "contact Apna Esport", "apna esport help center", "apna esport support email"],
};


export default function ContactPage() {
  return (
    <div className="space-y-8">
      <PageTitle 
        title="Contact Us" 
        subtitle="Got questions about our esports tournaments or suggestions for our online gaming platform? Fill the form below, and we’ll get back to you soon!" 
      />
      <ContactForm />
    </div>
  );
}
