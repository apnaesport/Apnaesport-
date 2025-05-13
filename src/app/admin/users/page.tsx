
import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Ban, ShieldCheck, ShieldAlert, Users } from "lucide-react"; // Added Users icon
import Link from "next/link";
import type { UserProfile } from "@/lib/types"; // Assuming UserProfile includes isAdmin
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ADMIN_EMAIL } from "@/lib/firebase";

// Placeholder data
const placeholderUsers: UserProfile[] = [
  { 
    uid: "user1", displayName: "John Doe", email: "john.doe@example.com", photoURL: "https://picsum.photos/seed/user1/40/40", isAdmin: false,
    emailVerified: true, isAnonymous: false, metadata: {} as any, providerData: [], refreshToken: '', tenantId: null, delete: async () => {}, getIdToken: async () => '', getIdTokenResult: async () => ({} as any), reload: async () => {}, toJSON: () => ({}), phoneNumber: null, providerId: ''
  },
  { 
    uid: "user2", displayName: "Jane Smith", email: "jane.smith@example.com", photoURL: "https://picsum.photos/seed/user2/40/40", isAdmin: false,
    emailVerified: true, isAnonymous: false, metadata: {} as any, providerData: [], refreshToken: '', tenantId: null, delete: async () => {}, getIdToken: async () => '', getIdTokenResult: async () => ({} as any), reload: async () => {}, toJSON: () => ({}), phoneNumber: null, providerId: ''
  },
  { 
    uid: "adminUser", displayName: "Admin User", email: ADMIN_EMAIL, photoURL: "https://picsum.photos/seed/adminUser/40/40", isAdmin: true,
    emailVerified: true, isAnonymous: false, metadata: {} as any, providerData: [], refreshToken: '', tenantId: null, delete: async () => {}, getIdToken: async () => '', getIdTokenResult: async () => ({} as any), reload: async () => {}, toJSON: () => ({}), phoneNumber: null, providerId: ''
  },
];

const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

export default function AdminUsersPage() {
  const users = placeholderUsers; // Replace with actual data fetching

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Users"
        subtitle="View, edit roles, and manage platform users."
        actions={
          <Button asChild>
            {/* Link to a "Create User" page if needed, or handle via Firebase console */}
            <Link href="#"> 
              <UserPlus className="mr-2 h-4 w-4" /> Add New User (Manual)
            </Link>
          </Button>
        }
      />

      {/* TODO: Add filtering and search capabilities */}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} data-ai-hint="user avatar" />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.displayName || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <Badge variant="destructive"><ShieldAlert className="mr-1 h-3 w-3"/>Admin</Badge>
                  ) : (
                    <Badge variant="secondary">Player</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {/* Placeholder for user status e.g. Active/Banned */}
                  <Badge variant="outline">Active</Badge> 
                </TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  <Button variant="outline" size="sm" title="Edit User Details">
                    <Edit className="h-4 w-4" />
                  </Button>
                   {user.email !== ADMIN_EMAIL && ( // Prevent self-action for the main admin
                    <>
                     <Button 
                        variant={user.isAdmin ? "secondary" : "default"} 
                        size="sm" 
                        title={user.isAdmin ? "Demote to Player" : "Promote to Admin"}
                        onClick={() => alert(`Toggle admin for ${user.displayName}`)}
                      >
                        {user.isAdmin ? <Users className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </Button>
                      <Button variant="destructive" size="sm" title="Ban User">
                        <Ban className="h-4 w-4" />
                      </Button>
                    </>
                   )}
                </TableCell>
              </TableRow>
            )) : (
               <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

