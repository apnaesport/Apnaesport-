
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Ban, ShieldCheck, Users, Loader2, ShieldAlert } from "lucide-react"; 
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
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { getAllUsersFromFirestore, updateUserAdminStatusInFirestore } from "@/lib/tournamentStore";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";

const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const { toast } = useToast();
  const { user: currentUser } = useAuth(); 
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null); 

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getAllUsersFromFirestore();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleAdmin = async (userIdToUpdate: string, currentIsAdmin: boolean | undefined, displayName: string | null) => {
    if (currentUser && userIdToUpdate === currentUser.uid) {
        toast({ title: "Action Not Allowed", description: "You cannot change your own admin status.", variant: "destructive" });
        return;
    }
    if (users.find(u => u.uid === userIdToUpdate)?.email === ADMIN_EMAIL && currentIsAdmin) {
         toast({ title: "Action Not Allowed", description: `The primary admin (${ADMIN_EMAIL}) cannot be demoted.`, variant: "destructive" });
        return;
    }

    const newIsAdmin = !currentIsAdmin;
    setIsUpdatingRole(userIdToUpdate);
    try {
      await updateUserAdminStatusInFirestore(userIdToUpdate, newIsAdmin);
      toast({ title: "User Role Updated", description: `${displayName || 'User'}'s role has been changed.` });
      await fetchUsers(); 
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({ title: "Error", description: "Could not update user role.", variant: "destructive" });
    } finally {
      setIsUpdatingRole(null);
    }
  };
  
  const handleBanUser = (userId: string, displayName: string | null) => {
    alert(`Simulating ban for user: ${displayName || userId}. This requires backend implementation to disable Firebase Auth user.`);
    toast({ title: "Ban Action (Simulated)", description: `Banning ${displayName || userId} would typically involve backend actions.`});
  };

  if (isLoading) {
    return (
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Loading users...</p>
        </div>
    );
  }

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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <ImageWithFallback 
                        as={AvatarImage}
                        src={user.photoURL || ""}
                        fallbackSrc={`https://placehold.co/40x40.png?text=${getInitials(user.displayName)}`}
                        alt={user.displayName || "User"} 
                        data-ai-hint="user avatar"
                      />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.displayName || "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <Badge variant="destructive" className="whitespace-nowrap"><ShieldAlert className="mr-1 h-3 w-3"/>Admin</Badge>
                  ) : (
                    <Badge variant="secondary">Player</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell className="space-x-1 sm:space-x-2 whitespace-nowrap">
                  <Button variant="outline" size="icon" title="Edit User Details (Coming Soon)" disabled className="h-8 w-8 sm:h-9 sm:w-9">
                    <Edit className="h-4 w-4" />
                  </Button>
                   {user.email !== ADMIN_EMAIL && user.uid !== currentUser?.uid && ( 
                    <>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button 
                                variant={user.isAdmin ? "secondary" : "default"} 
                                size="icon" 
                                title={user.isAdmin ? "Demote to Player" : "Promote to Admin"}
                                disabled={isUpdatingRole === user.uid}
                                className="h-8 w-8 sm:h-9 sm:w-9"
                              >
                                {isUpdatingRole === user.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : (user.isAdmin ? <Users className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />) }
                              </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to {user.isAdmin ? 'demote' : 'promote'} {user.displayName || 'this user'} {user.isAdmin ? 'from' : 'to'} admin?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isUpdatingRole === user.uid}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleToggleAdmin(user.uid, user.isAdmin, user.displayName)} disabled={isUpdatingRole === user.uid}>
                                    {isUpdatingRole === user.uid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                      <Button variant="destructive" size="icon" title="Ban User (Simulated)" onClick={() => handleBanUser(user.uid, user.displayName)} className="h-8 w-8 sm:h-9 sm:w-9">
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
