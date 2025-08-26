
import { PageTitle } from "@/components/shared/PageTitle";
import AdminPremiumClient from "./AdminPremiumClient";

export default function AdminPremiumPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Premium User Management"
        subtitle="Grant or revoke premium status for users on the platform."
      />
      <AdminPremiumClient />
    </div>
  );
}
