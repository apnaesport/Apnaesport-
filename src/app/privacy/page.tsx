

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Privacy Policy - Apna Esport",
  description: "Read the official Privacy Policy for Apna Esport. We are committed to protecting your data and privacy while you enjoy our online esports gaming platform.",
};


export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Privacy Policy" subtitle="At Apna Esport, your privacy is our priority." />
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy for Apna Esport</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Last updated: April 2025</p> 
          <p>
            This page explains how Apna Esport collects, uses, and safeguards your personal data when you use our online tournament platform. Your privacy and data security are of utmost importance to us.
          </p>
          
          <h2>Information We Collect</h2>
          <p>To provide our services, Apna Esport collects data such as usernames, email addresses, and game participation details when users register for an account or join a tournament.</p>
          
          <h2>How We Use Information</h2>
          <p>We use your data to manage your user profile, personalize your platform experience, and to notify you about important events, tournament updates, or rewards you have earned on Apna Esport.</p>
          
          <h2>Third-Party Advertising</h2>
          <p>We may use advertising networks like Google AdSense. These services may use cookies or similar technologies to deliver personalized ads based on your browsing history. Apna Esport does not share your personal account data with these advertisers.</p>
          
          <h2>Cookies</h2>
          <p>Cookies are small files that help us improve your experience on the Apna Esport website. You can choose to disable them in your browser settings if you prefer.</p>
          
          <h2>Data Security</h2>
          <p>We are committed to data protection. Your personal information is stored securely on Google Firebase and is not shared or sold to third parties without your explicit consent, except as required by law.</p>
          
          <h2>Changes to this Policy</h2>
          <p>We may occasionally update this Privacy Policy. Apna Esport will notify users of any significant changes via announcements on the website.</p>
          
          <h2>Contact Us</h2>
          <p>If you have any questions or concerns about the Apna Esport privacy policy, please feel free to reach us at: <a href="mailto:Apnaesportservice@gmail.com" className="text-primary hover:underline">Apnaesportservice@gmail.com</a></p>
        </CardContent>
      </Card>
    </div>
  );
}
