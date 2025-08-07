
import { PageTitle } from "@/components/shared/PageTitle";
import { getGamesFromFirestore } from "@/lib/tournamentStore";
import AdminGamesClient from "./AdminGamesClient";

export default async function AdminGamesPage() {
  const games = await getGamesFromFirestore();

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Games"
        subtitle="Add, edit, or remove games supported on the platform."
      />
      <AdminGamesClient initialGames={games} />
    </div>
  );
}
