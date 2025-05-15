import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Terms & Conditions" subtitle="Please read our terms carefully." />
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p>Last updated: May 2025</p>
            <p>
              Welcome to Apna Esport! By accessing or using our website, participating in tournaments, or creating an account, you agree to comply with and be bound by these Terms and Conditions. Please read them carefully.
            </p>

            <hr className="my-4"/>

            <h2>1. Eligibility</h2>
            <ul>
              <li>Users must be 13 years or older to create an account and participate in tournaments.</li>
              <li>If under 18, users must have permission from a parent or guardian.</li>
              <li>Only Indian residents are eligible for real-world rewards (diamonds, vouchers, etc.).</li>
            </ul>

            <hr className="my-4"/>

            <h2>2. Account Registration</h2>
            <ul>
              <li>You must register with accurate information including a valid email and Free Fire UID/name.</li>
              <li>Multiple accounts by the same user/IP are not allowed.</li>
              <li>Temporary/disposable email accounts are strictly prohibited.</li>
            </ul>

            <hr className="my-4"/>

            <h2>3. Tournament Participation</h2>
            <ul>
              <li>Entry into tournaments may require:
                <ul className="list-disc pl-5">
                    <li>Points (earned by watching ads, referring users, completing tasks).</li>
                    <li>Meeting deadlines and UID submission.</li>
                </ul>
              </li>
              <li>Admins reserve the right to reject, delay, or cancel any tournament or entry at any time.</li>
            </ul>

            <hr className="my-4"/>

            <h2>4. Point System</h2>
            <ul>
              <li>Points are virtual and not convertible to real money.</li>
              <li>Points can be used for tournament entry or rewards.</li>
              <li>Points may be reset or adjusted if abuse or manipulation is detected.</li>
            </ul>

            <hr className="my-4"/>

            <h2>5. Rewards and Prizes</h2>
            <ul>
              <li>Rewards such as diamonds or redeem codes are subject to availability.</li>
              <li>Users will be eligible for rewards only if rules are followed completely.</li>
              <li>Inappropriate behavior, cheating, or rule-breaking may result in ban or reward cancellation.</li>
            </ul>

            <hr className="my-4"/>

            <h2>6. Sponsorships & Promotions</h2>
            <ul>
              <li>Sponsored banners and offers may be displayed in the app or website.</li>
              <li>Clicking or interacting with these promotions is optional.</li>
              <li>We are not responsible for third-party sponsor actions or their reward fulfillment.</li>
            </ul>

            <hr className="my-4"/>

            <h2>7. User-Generated Content</h2>
            <ul>
              <li>Profile photos, usernames, and activity may be used in promotional banners and social posts.</li>
              <li>By registering, you grant us the right to showcase your in-game name, photo, or content on our platforms.</li>
            </ul>

            <hr className="my-4"/>

            <h2>8. Community Rules</h2>
            <ul>
              <li>Hate speech, abuse, spam, or scams are not tolerated.</li>
              <li>Admins can delete posts, mute or ban users without warning.</li>
              <li>Posting irrelevant or promotional content in community sections is prohibited.</li>
            </ul>

            <hr className="my-4"/>

            <h2>9. Data & Privacy</h2>
            <ul>
              <li>We store user data (email, points, UID, etc.) securely using Firebase.</li>
              <li>Your data will never be sold or misused. See our <Link href="/privacy">Privacy Policy</Link> for more.</li>
              <li>Admins may access user data only for moderation, rewards, or system analysis.</li>
            </ul>

            <hr className="my-4"/>

            <h2>10. Terms Update & Consent</h2>
            <ul>
              <li>These terms may be updated without prior notice.</li>
              <li>Users will be prompted to accept the latest Terms & Conditions during login or registration.</li>
              <li>Continued use of the website implies agreement to the updated terms.</li>
            </ul>

            <hr className="my-4"/>

            <h2>11. Disclaimer</h2>
            <ul>
              <li>Apna Esport is not affiliated with Free Fire, BGMI, or any official game developer.</li>
              <li>We organize tournaments independently for entertainment and community engagement.</li>
            </ul>

            <hr className="my-4"/>
            
            <h2>12. Contact</h2>
            <p>If you have any questions, reach us at:</p>
            <ul>
              <li>Email: support@apnaesport.com</li>
              <li>Support Page: <Link href="/contact">Visit Contact Us Page</Link></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
