
"use client";

import { useState, useCallback, useEffect } from "react";
import type { Creator, CreatorApplication } from "@/lib/types";
import {
  approveCreatorApplicationInFirestore,
  getCreatorApplicationsFromFirestore,
  getCreatorsFromFirestore,
  rejectCreatorApplicationInFirestore,
  deleteCreatorFromFirestore
} from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Link as LinkIcon, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AdminCreatorsClient() {
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedApps, fetchedCreators] = await Promise.all([
        getCreatorApplicationsFromFirestore(),
        getCreatorsFromFirestore(),
      ]);
      setApplications(fetchedApps);
      setCreators(fetchedCreators);
    } catch (error) {
      console.error("Error fetching creator data:", error);
      toast({ title: "Error", description: "Could not load creator applications or list.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleApprove = async (app: CreatorApplication) => {
    setIsProcessing(app.id);
    try {
      await approveCreatorApplicationInFirestore(app);
      toast({ title: "Approved!", description: `${app.name} is now a verified creator.` });
      await fetchAllData();
    } catch (error) {
      console.error("Error approving creator:", error);
      toast({ title: "Error", description: "Could not approve creator.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (appId: string) => {
    setIsProcessing(appId);
    try {
      await rejectCreatorApplicationInFirestore(appId);
      toast({ title: "Rejected", description: "Application has been rejected.", variant: "destructive" });
      await fetchAllData();
    } catch (error) {
      console.error("Error rejecting creator:", error);
      toast({ title: "Error", description: "Could not reject application.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };
  
  const handleDeleteCreator = async (creator: Creator) => {
    if (!confirm(`Are you sure you want to remove "${creator.name}"? This will also delete their votes.`)) return;
    setIsDeleting(creator.id);
    try {
        await deleteCreatorFromFirestore(creator.id);
        toast({ title: "Creator Removed", description: `${creator.name} has been removed from the platform.` });
        await fetchAllData();
    } catch (error) {
        console.error("Error deleting creator:", error);
        toast({ title: "Error", description: "Could not delete creator.", variant: "destructive" });
    } finally {
        setIsDeleting(null);
    }
  }


  return (
    <Tabs defaultValue="applications">
      <TabsList>
        <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
        <TabsTrigger value="verified">Verified Creators ({creators.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="applications">
        <Card>
          <CardHeader>
            <CardTitle>Creator Applications</CardTitle>
            <CardDescription>Review and approve new creator requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="hidden md:table-cell">Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`skeleton-app-${i}`}>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : applications.length > 0 ? applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={app.photoURL} alt={app.name} />
                            <AvatarFallback>{app.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{app.name}</p>
                            <p className="text-xs text-muted-foreground">{app.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={app.channelUrl} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="mr-2 h-4 w-4" /> View Channel
                          </a>
                        </Button>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {formatDistanceToNow(app.createdAt.toDate(), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(app.id)}
                          disabled={isProcessing === app.id}
                        >
                          {isProcessing === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          <span className="sr-only sm:not-sr-only sm:ml-1">Reject</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(app)}
                          disabled={isProcessing === app.id}
                        >
                          {isProcessing === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                           <span className="sr-only sm:not-sr-only sm:ml-1">Approve</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">No pending applications.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="verified">
        <Card>
          <CardHeader>
            <CardTitle>Verified Creators</CardTitle>
            <CardDescription>Manage existing creators on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="hidden md:table-cell">Votes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                         Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-creator-${i}`}>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                    ) : creators.length > 0 ? creators.map((creator) => (
                        <TableRow key={creator.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={creator.avatarUrl} alt={creator.name} />
                                    <AvatarFallback>{creator.name.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{creator.name}</p>
                                </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{creator.tags}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell font-mono">{creator.votes}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteCreator(creator)}
                                disabled={isDeleting === creator.id}
                                >
                                {isDeleting === creator.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">No verified creators yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
