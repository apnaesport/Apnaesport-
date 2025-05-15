
import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Privacy Policy" subtitle="At Apna Esport, your privacy matters to us." />
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy for Apna Esport</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Last updated: April 2025</p> {/* Note: Consider making the date dynamic or easily updatable */}
          <p>
            This page explains how we collect, use, and safeguard your data when you use our platform.
          </p>
          
          <h2>Information We Collect</h2>
          <p>We collect data such as usernames, email addresses, and participation details when users register or join tournaments.</p>
          
          <h2>How We Use Information</h2>
          <p>We use your data to personalize your experience, manage your profile, and notify you about events or rewards.</p>
          
          <h2>Third-Party Advertising</h2>
          <p>We may use Google AdSense or similar ad networks, which may use cookies or related technologies to deliver personalized ads.</p>
          
          <h2>Cookies</h2>
          <p>Cookies help us improve your experience. You can disable them in your browser settings if preferred.</p>
          
          <h2>Data Security</h2>
          <p>We prioritize data protection. Your personal information is stored securely and is not shared or sold to third parties without your consent.</p>
          
          <h2>Changes to Policy</h2>
          <p>We may occasionally update this Privacy Policy. Users will be notified of significant changes via the website.</p>
          
          <h2>Contact Us</h2>
          <p>If you have questions or concerns, feel free to reach us at: <a href="mailto:Apnaesportservice@gmail.com" className="text-primary hover:underline">Apnaesportservice@gmail.com</a></p>
        </CardContent>
      </Card>
    </div>
  );
}
