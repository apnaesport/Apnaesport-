
"use client"; // Added "use client"

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Ban, ShieldCheck, ShieldAlert, Users } from "lucide-react"; 
import Link from "next/link";
import type { UserProfile } from "@/lib/types"; 
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
import { useState, useEffect } from "react"; // Added useState and useEffect
import { useToast } from "@/hooks/use-toast"; // Added useToast
// For a real backend, you would import Firebase functions e.g.:
// import { collection, getDocs, query, doc, updateDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase"; 
// import { getAuth, admin } from "firebase-admin"; // For setting custom claims (backend)


// Placeholder data
const initialUsers: UserProfile[] = [
  { 
    uid: "user1", displayName: "John Doe", email: "john.doe@example.com", photoURL: "https://placehold.co/40x40.png", isAdmin: false,
    emailVerified: true, isAnonymous: false, metadata: {} as any, providerData: [], refreshToken: '', tenantId: null, delete: async () => {}, getIdToken: async () => '', getIdTokenResult: async () => ({} as any), reload: async () => {}, toJSON: () => ({}), phoneNumber: null, providerId: ''
  },
  { 
    uid: "user2", displayName: "Jane Smith", email: "jane.smith@example.com", photoURL: "https://placehold.co/40x40.png", isAdmin: false,
    emailVerified: true, isAnonymous: false, metadata: {} as any, providerData: [], refreshToken: '', tenantId: null, delete: async () => {}, getIdToken: async () => '', getIdTokenResult: async () => ({} as any), reload: async () => {}, toJSON: () => ({}), phoneNumber: null, providerId: ''
  },
  { 
    uid: "adminUser", displayName: "Admin User", email: ADMIN_EMAIL, photoURL: "https://placehold.co/40x40.png", isAdmin: true,
    emailVerified: true, isAnonymous: false, metadata: {} as any, providerData: [], refreshToken: '', tenantId: null, delete: async () => {}, getIdToken: async () => '', getIdTokenResult: async () => ({} as any), reload: async () => {}, toJSON: () => ({}), phoneNumber: null, providerId: ''
  },
];

const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const { toast } = useToast();
  // const [isLoading, setIsLoading] = useState(true);

  // Example: Fetch users from Firestore (uncomment and adapt)
  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     setIsLoading(true);
  //     try {
  //       // const usersCollectionRef = collection(db, "users");
  //       // const usersSnapshot = await getDocs(query(usersCollectionRef));
  //       // const fetchedUsers = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
  //       // setUsers(fetchedUsers);
  //       setUsers(initialUsers); // Using placeholder
  //     } catch (error) {
  //       console.error("Error fetching users:", error);
  //       toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
  //     }
  //     setIsLoading(false);
  //   };
  //   fetchUsers();
  // }, [toast]);

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean | undefined, displayName: string | null) => {
    const newIsAdmin = !currentIsAdmin;
    if (confirm(`Are you sure you want to ${newIsAdmin ? 'promote' : 'demote'} ${displayName || 'this user'} ${newIsAdmin ? 'to' : 'from'} admin?`)) {
      // setIsLoading(true);
      try {
        // TODO: Implement backend logic to set custom claims for admin role
        // This typically involves a Firebase Function callable from the client or an admin SDK on a server.
        // Example (conceptual - requires backend):
        // await setAdminClaim({ userId, isAdmin: newIsAdmin }); // This would be a call to your Firebase Function

        // For client-side simulation/update in Firestore user document:
        // await updateDoc(doc(db, "users", userId), { isAdmin: newIsAdmin });
        
        setUsers(users.map(u => u.uid === userId ? { ...u, isAdmin: newIsAdmin } : u));
        toast({ title: "User Role Updated", description: `${displayName || 'User'}'s role has been changed.` });
      } catch (error) {
        console.error("Error updating user role:", error);
        toast({ title: "Error", description: "Could not update user role.", variant: "destructive" });
      }
      // setIsLoading(false);
    }
  };
  
  const handleBanUser = (userId: string, displayName: string | null) => {
    // TODO: Implement ban logic (e.g., disable Firebase Auth user, set 'banned' flag in Firestore)
    alert(`Simulating ban for user: ${displayName || userId}. This requires backend implementation.`);
  };

  // if (isLoading) return <p>Loading users...</p>;

  return (
    <div className="space-y-8">
      <PageTitle
        title="Manage Users"
        subtitle="View, edit roles, and manage platform users."
        actions={
          <Button asChild disabled>
            {/* Link to a "Create User" page if needed, or handle via Firebase console */}
            <Link href="#"> 
              <UserPlus className="mr-2 h-4 w-4" /> Add New User (Manual - Disabled)
            </Link>
          </Button>
        }
      />

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
                      <AvatarImage 
                        src={user.photoURL || "https://placehold.co/40x40.png"} 
                        alt={user.displayName || "User"} 
                        data-ai-hint="user avatar"
                        onError={(e) => e.currentTarget.src = "https://placehold.co/40x40.png"}
                      />
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
                  <Badge variant="outline">Active</Badge> 
                </TableCell>
                <TableCell className="space-x-2 whitespace-nowrap">
                  <Button variant="outline" size="sm" title="Edit User Details (Coming Soon)" disabled>
                    <Edit className="h-4 w-4" />
                  </Button>
                   {user.email !== ADMIN_EMAIL && ( 
                    <>
                     <Button 
                        variant={user.isAdmin ? "secondary" : "default"} 
                        size="sm" 
                        title={user.isAdmin ? "Demote to Player" : "Promote to Admin"}
                        onClick={() => handleToggleAdmin(user.uid, user.isAdmin, user.displayName)}
                        // disabled={isLoading}
                      >
                        {user.isAdmin ? <Users className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </Button>
                      <Button variant="destructive" size="sm" title="Ban User" onClick={() => handleBanUser(user.uid, user.displayName)} /*disabled={isLoading}*/>
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
