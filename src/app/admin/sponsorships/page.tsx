
import { PageTitle } from "@/components/shared/PageTitle";
import AdminSponsorshipsClient from "./AdminSponsorshipsClient";

export default function AdminSponsorshipsPage() {

  return (
    <div className="space-y-8">
      <PageTitle
        title="Sponsorship Management"
        subtitle="Review and manage incoming sponsorship and partnership requests."
      />
      <AdminSponsorshipsClient />
    </div>
  );
}
