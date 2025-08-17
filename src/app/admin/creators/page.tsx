
import { PageTitle } from "@/components/shared/PageTitle";
import AdminCreatorsClient from "./AdminCreatorsClient";

export default function AdminCreatorsPage() {

  return (
    <div className="space-y-8">
      <PageTitle
        title="Creator Management"
        subtitle="Approve new creator applications and manage verified creators."
      />
      <AdminCreatorsClient />
    </div>
  );
}
