
import { PageTitle } from "@/components/shared/PageTitle";
import AdminGamesClient from "./AdminGamesClient";

export default function AdminGamesPage() {

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Games"
        subtitle="Add, edit, or remove games supported on the platform."
      />
      <AdminGamesClient />
    </div>
  );
}
