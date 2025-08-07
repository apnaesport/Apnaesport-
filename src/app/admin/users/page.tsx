
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react"; 
import Link from "next/link";
import { getAllUsersFromFirestore } from "@/lib/tournamentStore";
import AdminUsersClient from "./AdminUsersClient";
import type { UserProfile } from "@/lib/types";


// Helper to convert Firestore Timestamps to serializable format
const serializeUsers = (users: UserProfile[]): any[] => {
  return users.map(user => {
    const newUser = { ...user };
    if (newUser.createdAt && typeof (newUser.createdAt as any).toDate === 'function') {
      (newUser.createdAt as any) = (newUser.createdAt as any).toDate().toISOString();
    }
    return newUser;
  });
};


export default async function AdminUsersPage() {
  const rawUsers = await getAllUsersFromFirestore();
  const users = serializeUsers(rawUsers);


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
      <AdminUsersClient initialUsers={users} />
    </div>
  );
}
