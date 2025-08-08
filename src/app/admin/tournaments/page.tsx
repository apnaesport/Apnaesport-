
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import AdminTournamentsClient from "./AdminTournamentsClient";

export default function AdminTournamentsPage() {

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Tournaments"
        subtitle="Create, edit, and oversee all platform tournaments."
        actions={
          <Button asChild>
            <Link href="/tournaments/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Tournament
            </Link>
          </Button>
        }
      />
      <AdminTournamentsClient />
    </div>
  );
}
