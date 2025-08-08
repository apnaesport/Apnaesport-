
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react"; 
import Link from "next/link";
import AdminUsersClient from "./AdminUsersClient";

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Users"
        subtitle="View, edit roles, and manage platform users."
        actions={
          <Button asChild disabled>
            <Link href="#"> 
              <UserPlus className="mr-2 h-4 w-4" /> Add New User (Manual - Disabled)
            </Link>
          </Button>
        }
      />
      <AdminUsersClient />
    </div>
  );
}
