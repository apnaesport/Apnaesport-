
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { UserProfile, PremiumFeatures } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { updateUserPremiumStatus, getUserProfileFromFirestore } from '@/lib/tournamentStore';
import { Loader2, Crown, Trash2, BadgeInfo, CheckCircle, ImagePlus, Handshake, ShieldCheck } from 'lucide-react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { usePremiumUsers } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const findUserSchema = z.object({
  identifier: z.string().min(1, 'Please enter an email or Apna ID.'),
});
type FindUserFormData = z.infer<typeof findUserSchema>;

const premiumFeaturesList: { id: keyof PremiumFeatures; label: string; icon: React.ElementType }[] = [
    { id: 'verifiedBadge', label: 'Verified Premium Badge', icon: CheckCircle },
    { id: 'customBanners', label: 'Custom Tournament Banners', icon: ImagePlus },
    { id: 'addSponsors', label: 'Add Sponsors to Tournaments', icon: Handshake },
    { id: 'prioritySupport', label: 'Priority Support', icon: ShieldCheck },
];

export default function AdminPremiumClient() {
  const queryClient = useQueryClient();
  const { data: premiumUsers = [], isLoading } = usePremiumUsers();
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const findUserForm = useForm<FindUserFormData>({
    resolver: zodResolver(findUserSchema),
    defaultValues: { identifier: '' },
  });

  const premiumFeaturesForm = useForm<PremiumFeatures>();

  const invalidateQueries = () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'premium'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
  }

  const handleFindUser: SubmitHandler<FindUserFormData> = async (data) => {
    setIsSearching(true);
    setSelectedUser(null);
    premiumFeaturesForm.reset({});
    try {
      const userProfile = await getUserProfileFromFirestore(data.identifier);
      if (userProfile) {
        setSelectedUser(userProfile);
        premiumFeaturesForm.reset(userProfile.premiumFeatures || {});
      } else {
        toast({ title: 'User Not Found', description: 'No user found with that identifier.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not find user.', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleUpdatePremiumFeatures = async (data: PremiumFeatures) => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
        await updateUserPremiumStatus(selectedUser.uid, data);
        toast({ title: "Success!", description: `${selectedUser.displayName}'s premium features have been updated.` });
        invalidateQueries();
        // Refetch the user to update the form state
        const updatedUser = await getUserProfileFromFirestore(selectedUser.uid);
        if (updatedUser) {
            setSelectedUser(updatedUser);
            premiumFeaturesForm.reset(updatedUser.premiumFeatures || {});
        }

    } catch (error: any) {
        toast({ title: "Update Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  };

  const handleRevokeAll = async () => {
      if (!selectedUser) return;
      setIsUpdating(true);
      try {
          await updateUserPremiumStatus(selectedUser.uid, {}); // Empty object revokes all
          toast({ title: "Premium Revoked", description: `${selectedUser.displayName} no longer has premium status.` });
          invalidateQueries();
          setSelectedUser(null); // Clear selection
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Could not revoke premium status.', variant: 'destructive' });
      } finally {
        setIsUpdating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Premium Features</CardTitle>
            <CardDescription>Find a user to grant or revoke specific premium perks.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={findUserForm.handleSubmit(handleFindUser)} className="space-y-4">
              <div>
                <Input {...findUserForm.register('identifier')} placeholder="user@example.com or AE123456" disabled={isSearching} />
                {findUserForm.formState.errors.identifier && <p className="text-destructive text-xs mt-1">{findUserForm.formState.errors.identifier.message}</p>}
              </div>
              <Button type="submit" disabled={isSearching} className="w-full">
                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Find User
              </Button>
            </form>
          </CardContent>
        </Card>

        {selectedUser && (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                         <Avatar>
                            <AvatarImage src={selectedUser.photoURL || ''} alt={selectedUser.displayName || 'User'} />
                            <AvatarFallback>{selectedUser.displayName?.substring(0, 2) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>{selectedUser.displayName}</CardTitle>
                            <CardDescription>{selectedUser.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={premiumFeaturesForm.handleSubmit(handleUpdatePremiumFeatures)} className="space-y-4">
                        <div className="space-y-3">
                            <Label className="font-semibold">Select Features</Label>
                            {premiumFeaturesList.map((feature) => (
                                <div key={feature.id} className="flex items-center space-x-2">
                                     <Controller
                                        name={feature.id}
                                        control={premiumFeaturesForm.control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id={feature.id}
                                                checked={!!field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                    <label htmlFor={feature.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                        <feature.icon className="h-4 w-4 text-primary" /> {feature.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button type="submit" disabled={isUpdating} className="w-full">
                                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full" disabled={isUpdating}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Revoke All
                                    </Button>
                                </AlertDialogTrigger>
                                 <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Revoke All Premium Features?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This will immediately remove all premium perks from {selectedUser.displayName}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRevokeAll}>Confirm</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )}

      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Premium Users</CardTitle>
            <CardDescription>A list of all users with active premium status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Premium Since</TableHead>
                    <TableHead className="text-right">Features</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-10 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-9 w-20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : premiumUsers.length > 0 ? (
                    premiumUsers.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                              <AvatarFallback>{user.displayName?.substring(0, 2) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{user.displayName}</p>
                                <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/10 whitespace-nowrap">
                                    <Crown className="h-3 w-3 mr-1" /> Premium
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.premiumSince ? formatDistanceToNow(user.premiumSince.toDate(), { addSuffix: true }) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="link" size="sm" onClick={() => handleFindUser({ identifier: user.uid })}>
                                Manage
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24">
                        No premium users yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
