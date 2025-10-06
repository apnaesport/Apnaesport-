

"use client";

import { useState, useCallback, useEffect } from "react";
import type { UserProfile } from "@/lib/types"; 
import { Button } from "@/components/ui/button";
import { Edit, Ban, ShieldCheck, Users, Loader2, ShieldAlert, Coins } from "lucide-react"; 
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
import { useToast } from "@/hooks/use-toast";
import { ADMIN_EMAIL } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserAdminStatusInFirestore, adjustUserPoints } from "@/lib/tournamentStore";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import type { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUsers } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";

// Helper function to convert Timestamp to a readable string or return a fallback
const formatDateFromTimestamp = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
    }
    // Fallback for serialized dates or other formats
    try {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleDateString();
    } catch (e) {
        return 'N/A';
    }
};

const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
};

const pointsSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be at least 1.").max(10000, "Amount cannot exceed 10,000."),
  type: z.enum(["credit", "debit"]),
  reason: z.string().min(3, "Reason must be at least 3 characters.").max(100, "Reason is too long."),
});

type PointsFormData = z.infer<typeof pointsSchema>;


export default function AdminUsersClient() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useUsers();
  const { toast } = useToast();
  const { user: currentUser } = useAuth(); 
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);

  const pointsForm = useForm<PointsFormData>({
    resolver: zodResolver(pointsSchema),
    defaultValues: {
        amount: 10,
        type: "credit",
        reason: "",
    },
  });

  const invalidateUsersQuery = () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
  }

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
      invalidateUsersQuery(); 
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

  const openPointsDialog = (user: UserProfile) => {
    setSelectedUser(user);
    pointsForm.reset();
    setIsPointsDialogOpen(true);
  };
  
  const handleAdjustPoints: SubmitHandler<PointsFormData> = async (data) => {
    if (!selectedUser) return;
    setIsAdjustingPoints(true);
    try {
        await adjustUserPoints(selectedUser.uid, data.amount, data.type, data.reason);
        toast({
            title: "Points Adjusted",
            description: `${data.amount} points have been ${data.type === 'credit' ? 'added to' : 'removed from'} ${selectedUser.displayName}.`
        });
        invalidateUsersQuery();
        setIsPointsDialogOpen(false);
    } catch(error: any) {
        toast({ title: "Error Adjusting Points", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
        setIsAdjustingPoints(false);
    }
  }


  return (
    <>
    <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Adjust Points for {selectedUser?.displayName}</DialogTitle>
                <DialogDescription>
                    Manually add or remove AE points from this user's account. This action will be recorded in their transaction history.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={pointsForm.handleSubmit(handleAdjustPoints)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="type">Action</Label>
                        <Select onValueChange={(value) => pointsForm.setValue('type', value as "credit" | "debit")} defaultValue="credit">
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Select action..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="credit">Add Points</SelectItem>
                                <SelectItem value="debit">Remove Points</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" type="number" {...pointsForm.register("amount")} disabled={isAdjustingPoints}/>
                    </div>
                </div>
                 {pointsForm.formState.errors.amount && <p className="text-destructive text-xs mt-1">{pointsForm.formState.errors.amount.message}</p>}
                <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input id="reason" {...pointsForm.register("reason")} placeholder="e.g., Giveaway prize, refund" disabled={isAdjustingPoints}/>
                    {pointsForm.formState.errors.reason && <p className="text-destructive text-xs mt-1">{pointsForm.formState.errors.reason.message}</p>}
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button variant="ghost" disabled={isAdjustingPoints}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isAdjustingPoints}>
                        {isAdjustingPoints && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Confirm
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>AE Points</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="hidden md:table-cell">Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-user-${i}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-9 w-28" /></TableCell>
              </TableRow>
            ))
          ) : users.length > 0 ? users.map((user) => (
            <TableRow key={user.uid}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <ImageWithFallback 
                      as={AvatarImage}
                      src={user.photoURL || ""}
                      user={user}
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
                  <div className="flex items-center gap-1 font-semibold">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      {user.points || 0}
                  </div>
              </TableCell>
              <TableCell>
                {user.isAdmin ? (
                  <Badge variant="destructive" className="whitespace-nowrap"><ShieldAlert className="mr-1 h-3 w-3"/>Admin</Badge>
                ) : (
                  <Badge variant="secondary">Player</Badge>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {formatDateFromTimestamp(user.createdAt)}
              </TableCell>
              <TableCell className="space-x-1 sm:space-x-2 whitespace-nowrap">
                <Button variant="outline" size="icon" title="Adjust Points" onClick={() => openPointsDialog(user)} className="h-8 w-8 sm:h-9 sm:w-9">
                  <Coins className="h-4 w-4" />
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
              <TableCell colSpan={6} className="text-center h-24">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </>
  );
}
