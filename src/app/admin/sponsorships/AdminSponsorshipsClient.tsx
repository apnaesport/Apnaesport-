
"use client";

import { useState, useCallback, useEffect } from "react";
import type { SponsorshipRequest, SponsorshipRequestStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { updateSponsorshipRequestStatusInFirestore, getSponsorshipRequestsFromFirestore } from "@/lib/tournamentStore";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<SponsorshipRequestStatus, string> = {
    New: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    Contacted: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    "In Progress": "bg-purple-500/20 text-purple-500 border-purple-500/30",
    Closed: "bg-gray-500/20 text-muted-foreground border-gray-500/30",
};


export default function AdminSponsorshipsClient() {
  const [requests, setRequests] = useState<SponsorshipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedRequests = await getSponsorshipRequestsFromFirestore();
      setRequests(fetchedRequests.map(req => ({
          ...req,
          createdAt: (req.createdAt as any).toDate ? (req.createdAt as any).toDate() : new Date(req.createdAt)
      })));
    } catch (error) {
      console.error("Error fetching sponsorship requests:", error);
      toast({ title: "Error", description: "Could not refresh requests.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = async (requestId: string, status: SponsorshipRequestStatus) => {
    setIsUpdating(requestId);
    try {
      await updateSponsorshipRequestStatusInFirestore(requestId, status);
      toast({ title: "Status Updated", description: `Request status changed to "${status}".` });
      await fetchRequests();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Could not update status.", variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Sponsorship Inquiries</CardTitle>
            <CardDescription>Review and manage incoming sponsorship and partnership requests.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Brand Name</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-req-${i}`}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : requests.length > 0 ? requests.map((request) => (
                    <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.brandName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        <div>{request.contactName}</div>
                        <a href={`mailto:${request.email}`} className="text-xs text-muted-foreground hover:text-primary">{request.email}</a>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell capitalize">{request.sponsorshipType.replace('-', ' ')}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className={cn("whitespace-nowrap", statusColors[request.status])}>{request.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{format(new Date(request.createdAt), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isUpdating === request.id}>
                                    {isUpdating === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {Object.keys(statusColors).map(status => (
                                    <DropdownMenuItem key={status} onClick={() => handleStatusChange(request.id, status as SponsorshipRequestStatus)}>
                                        Set as {status}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No sponsorship requests yet.
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
