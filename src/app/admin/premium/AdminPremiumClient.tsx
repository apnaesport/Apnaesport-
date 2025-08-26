
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAllUsersFromFirestore, updateUserPremiumStatus } from '@/lib/tournamentStore';
import { Loader2, Crown, Trash2, BadgeInfo } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

const grantPremiumSchema = z.object({
  identifier: z.string().min(1, 'Please enter an email or Apna ID.'),
});
type GrantPremiumFormData = z.infer<typeof grantPremiumSchema>;

export default function AdminPremiumClient() {
  const [premiumUsers, setPremiumUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<GrantPremiumFormData>({
    resolver: zodResolver(grantPremiumSchema),
    defaultValues: { identifier: '' },
  });

  const fetchPremiumUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsersFromFirestore();
      setPremiumUsers(allUsers.filter((user) => user.isPremium));
    } catch (error) {
      toast({ title: 'Error', description: 'Could not load premium users.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPremiumUsers();
  }, [fetchPremiumUsers]);

  const handleGrantPremium: SubmitHandler<GrantPremiumFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      await updateUserPremiumStatus(data.identifier, true);
      toast({ title: 'Success!', description: `Premium status granted.` });
      form.reset();
      await fetchPremiumUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not grant premium status.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokePremium = async (userId: string) => {
    setIsRevoking(userId);
    try {
      await updateUserPremiumStatus(userId, false);
      toast({ title: 'Premium Revoked', description: 'User no longer has premium status.', variant: 'destructive' });
      await fetchPremiumUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Could not revoke premium status.', variant: 'destructive' });
    } finally {
      setIsRevoking(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Grant Premium</CardTitle>
            <CardDescription>Enter a user's email or Apna ID to grant them premium access.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleGrantPremium)} className="space-y-4">
              <div>
                <Input {...form.register('identifier')} placeholder="user@example.com or AE123456" disabled={isSubmitting} />
                {form.formState.errors.identifier && <p className="text-destructive text-xs mt-1">{form.formState.errors.identifier.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
                Grant Premium
              </Button>
            </form>
          </CardContent>
        </Card>
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
                    <TableHead className="text-right">Actions</TableHead>
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={isRevoking === user.uid}>
                                {isRevoking === user.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Revoke Premium?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to revoke premium status for {user.displayName}? This will disable their premium features immediately.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={isRevoking === user.uid}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRevokePremium(user.uid)} disabled={isRevoking === user.uid}>
                                  {isRevoking === user.uid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Confirm
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
