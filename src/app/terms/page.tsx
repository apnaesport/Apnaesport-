

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Terms & Conditions - Apna Esport",
  description: "Read the official Terms and Conditions for using the Apna Esport platform. Your use of our website and participation in our tournaments constitutes your agreement to these terms.",
};


export default function TermsPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Terms & Conditions" subtitle="Please read the terms of service for Apna Esport carefully." />
      <Card>
        <CardHeader>
          <CardTitle>Apna Esport - Terms of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose dark:prose-invert max-w-none">
            <p>Last updated: May 2025</p>
            <p>
              Welcome to Apna Esport! By accessing or using our website, participating in any Apna Esport tournament, or creating an account, you agree to comply with and be bound by these Terms and Conditions. Please read them carefully as they govern your use of the Apna Esport platform.
            </p>

            <hr className="my-4"/>

            <h2>1. Eligibility</h2>
            <ul>
              <li>Users must be 13 years or older to create an account and participate in tournaments on Apna Esport.</li>
              <li>If under 18, users must have permission from a parent or legal guardian.</li>
              <li>Only residents of India are eligible for real-world rewards (e.g., diamonds, vouchers, etc.) from Apna Esport events.</li>
            </ul>

            <hr className="my-4"/>

            <h2>2. Account Registration</h2>
            <ul>
              <li>You must register with accurate information including a valid email and your correct in-game username/ID.</li>
              <li>Operating multiple accounts by the same user or from the same IP address is not allowed on Apna Esport.</li>
              <li>The use of temporary or disposable email accounts for registration is strictly prohibited.</li>
            </ul>

            <hr className="my-4"/>

            <h2>3. Tournament Participation</h2>
            <ul>
              <li>Entry into Apna Esport tournaments may require:
                <ul className="list-disc pl-5">
                    <li>Using points earned through platform activities like watching ads, referring users, or completing tasks.</li>
                    <li>Meeting all registration deadlines and submitting the correct in-game UID.</li>
                </ul>
              </li>
              <li>Apna Esport administrators reserve the right to reject, delay, or cancel any tournament or player entry at any time for any reason.</li>
            </ul>

            <hr className="my-4"/>

            <h2>4. Point System</h2>
            <ul>
              <li>Points earned on the Apna Esport platform are virtual and cannot be converted to real money.</li>
              <li>Points can be used for tournament entry or for redeeming specific rewards as available.</li>
              <li>Apna Esport reserves the right to reset or adjust user points if abuse, cheating, or system manipulation is detected.</li>
            </ul>

            <hr className="my-4"/>

            <h2>5. Rewards and Prizes</h2>
            <ul>
              <li>Rewards such as in-game diamonds or redeem codes are subject to availability and tournament-specific rules.</li>
              <li>Users are only eligible for rewards if all tournament and platform rules are followed completely.</li>
              <li>Any inappropriate behavior, cheating, or rule-breaking will result in a ban from Apna Esport and forfeiture of any rewards.</li>
            </ul>

            <hr className="my-4"/>

            <h2>6. Sponsorships & Promotions</h2>
            <ul>
              <li>Sponsored banners and promotional offers may be displayed on the Apna Esport website and applications.</li>
              <li>Interacting with these promotions is entirely optional for the user.</li>
              <li>Apna Esport is not responsible for the actions or reward fulfillment of third-party sponsors.</li>
            </ul>

            <hr className="my-4"/>

            <h2>7. User-Generated Content</h2>
            <ul>
              <li>Your profile information, such as photos, usernames, and tournament activity, may be used by Apna Esport in promotional materials, banners, and social media posts.</li>
              <li>By registering, you grant Apna Esport the right to showcase your in-game name, photo, or related content on our platforms.</li>
            </ul>

            <hr className="my-4"/>

            <h2>8. Community Rules</h2>
            <ul>
              <li>Hate speech, abuse, spam, or scams are not tolerated within the Apna Esport community.</li>
              <li>Administrators can delete posts, mute, or ban users from the platform without prior warning for rule violations.</li>
              <li>Posting irrelevant or promotional content in community sections is prohibited.</li>
            </ul>

            <hr className="my-4"/>

            <h2>9. Data & Privacy</h2>
            <ul>
              <li>We securely store user data (email, points, UID, etc.) using Google Firebase.</li>
              <li>Your data will never be sold or misused. Please see our official <Link href="/privacy">Apna Esport Privacy Policy</Link> for more details.</li>
              <li>Admins may access user data only for moderation, reward distribution, or system analysis purposes.</li>
            </ul>

            <hr className="my-4"/>

            <h2>10. Terms Update & Consent</h2>
            <ul>
              <li>These terms may be updated at any time without prior notice.</li>
              <li>Users will be prompted to accept the latest Terms & Conditions upon login or registration.</li>
              <li>Continued use of the Apna Esport website implies your agreement to the most current terms.</li>
            </ul>

            <hr className="my-4"/>

            <h2>11. Disclaimer</h2>
            <ul>
              <li>Apna Esport is an independent entity and is not affiliated with, endorsed by, or in any way officially connected with Garena Free Fire, BGMI, or any other game developer.</li>
              <li>We organize tournaments independently for community entertainment and engagement.</li>
            </ul>

            <hr className="my-4"/>
            
            <h2>12. Contact</h2>
            <p>If you have any questions about these terms, please contact the Apna Esport team:</p>
            <ul>
              <li>Email: support@apnaesport.com</li>
              <li>Support Page: <Link href="/contact">Visit Apna Esport Contact Page</Link></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
