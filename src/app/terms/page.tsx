import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Terms & Conditions" subtitle="Please read our terms carefully." />
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            Welcome to Apna Esport! These terms and conditions outline the rules and regulations for the use of
            Apna Esport&apos;s Website, located at this domain.
          </p>
          <p>
            By accessing this website we assume you accept these terms and conditions. Do not continue to use Apna Esport
            if you do not agree to take all of the terms and conditions stated on this page.
          </p>
          <h2>1. Introduction</h2>
          <p>Content coming soon. This section will detail the scope of the terms.</p>
          <h2>2. User Accounts</h2>
          <p>Content coming soon. This section will cover account creation, responsibilities, and termination.</p>
          <h2>3. Tournament Rules</h2>
          <p>Content coming soon. This section will detail general tournament participation rules, code of conduct, and fair play.</p>
          <h2>4. Intellectual Property</h2>
          <p>Content coming soon. The Service and its original content, features and functionality are and will remain the exclusive property of Apna Esport and its licensors.</p>
          <h2>5. Limitation of Liability</h2>
          <p>Content coming soon. In no event shall Apna Esport, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages...</p>
          <h2>6. Governing Law</h2>
          <p>Content coming soon. These Terms shall be governed and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.</p>
          <h2>7. Changes to Terms</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days&apos; notice prior to any new terms taking effect.</p>
          <h2>8. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us (link to contact page will be here).</p>
        </CardContent>
      </Card>
    </div>
  );
}
