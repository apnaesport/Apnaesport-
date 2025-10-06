

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PremiumRequest, PremiumRequestStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Loader2, Check, X, Gift } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { updatePremiumRequestStatusInFirestore } from '@/lib/tournamentStore';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { usePremiumRequests } from '@/lib/hooks';
import { useQueryClient } from "@tanstack/react-query";
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

const statusConfig: Record<PremiumRequestStatus, { color: string; icon: React.ElementType }> = {
    Pending: { color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30", icon: Loader2 },
    Approved: { color: "bg-green-500/20 text-green-500 border-green-500/30", icon: Check },
    Rejected: { color: "bg-red-500/20 text-red-500 border-red-500/30", icon: X },
};

export default function AdminPremiumRequestsClient() {
  const queryClient = useQueryClient();
  const { data: requests = [], isLoading } = usePremiumRequests();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  
  const invalidateQueries = () => {
      queryClient.invalidateQueries({ queryKey: ['premiumRequests'] });
  }

  const handleStatusChange = async (requestId: string, status: PremiumRequestStatus) => {
    setIsUpdating(requestId);
    try {
      await updatePremiumRequestStatusInFirestore(requestId, status);
      toast({ title: "Status Updated", description: `Request status changed to "${status}".` });
      invalidateQueries();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleGrantPremium = (userId: string) => {
    router.push(`/admin/premium?userId=${userId}`);
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Premium Membership Requests</CardTitle>
            <CardDescription>Review and manage incoming requests for premium status.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                        ))
                    ) : requests.length > 0 ? requests.map((request) => (
                        <TableRow key={request.id}>
                            <TableCell>
                                <div className="font-medium">{request.userName}</div>
                                <div className="text-xs text-muted-foreground">{request.userApnaId}</div>
                            </TableCell>
                            <TableCell className="max-w-sm">
                                <p className="truncate text-sm text-muted-foreground">{request.message}</p>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={cn(statusConfig[request.status].color)}>
                                    {request.status}
                                </Badge>
                            </TableCell>
                             <TableCell>
                                {formatDistanceToNow(request.createdAt.toDate(), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right">
                                {request.status === 'Pending' && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="default">
                                                <Gift className="mr-2 h-4 w-4"/> Grant Premium
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Grant Premium to {request.userName}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will take you to the Premium Management page to assign specific features. The request will be marked as 'Approved'.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => {
                                                    handleStatusChange(request.id, 'Approved');
                                                    handleGrantPremium(request.userId);
                                                }}>
                                                    Continue
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={isUpdating === request.id}>
                                            {isUpdating === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Pending')} disabled={request.status === 'Pending'}>
                                            Mark as Pending
                                        </DropdownMenuItem>
                                         <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'Rejected')} className="text-destructive">
                                            Mark as Rejected
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No premium requests yet.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
}

