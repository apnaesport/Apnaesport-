import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Privacy Policy" subtitle="Your privacy is important to us." />
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy for Apna Esport</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            Apna Esport (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;) operates this website (the &quot;Service&quot;).
            This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our
            Service and the choices you have associated with that data.
          </p>
          <h2>1. Information Collection and Use</h2>
          <p>Content coming soon. We collect several different types of information for various purposes to provide and improve our Service to you (e.g., email, display name, IP address for security).</p>
          <h2>2. Data Usage</h2>
          <p>Content coming soon. Apna Esport uses the collected data for various purposes: to provide and maintain the Service, to notify you about changes, to allow participation in interactive features, for customer care, for analysis, and to monitor usage.</p>
          <h2>3. Cookies</h2>
          <p>Content coming soon. We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.</p>
          <h2>4. Data Security</h2>
          <p>Content coming soon. The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
          <h2>5. Your Data Protection Rights</h2>
          <p>Content coming soon. Depending on your location, you may have certain data protection rights (e.g., access, rectification, erasure).</p>
          <h2>6. Changes to This Privacy Policy</h2>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
          <h2>7. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us (link to contact page will be here).</p>
        </CardContent>
      </Card>
    </div>
  );
}
