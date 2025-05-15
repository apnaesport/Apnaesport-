
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { LogIn, Users, UserPlus, UserMinus, Search, MessageSquare, Shield, Loader2, Users2, Trash2, LogOutIcon, UserPlus2, UserCheck, UserX, Send, Ban, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { UserProfile, Team, TeamFormData } from "@/lib/types";
import { Badge } from "@/components/ui/badge"; // Added import
import { 
  searchUsersByNameOrEmail,
  getUserProfileFromFirestore,
  createTeamInFirestore,
  getTeamByIdFromFirestore,
  getTeamsByUserIdFromFirestore,
  addMemberToTeamInFirestore,
  removeMemberFromTeamInFirestore,
  deleteTeamFromFirestore,
  updateUserTeamInFirestore,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend
} from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";


const teamFormSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters.").max(50, "Team name too long."),
});

const addMemberFormSchema = z.object({
  memberSearch: z.string().min(2, "Enter at least 2 characters to search."),
});

export default function SocialPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();

  const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  const [playerSearchResults, setPlayerSearchResults] = useState<UserProfile[]>([]);
  
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<UserProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<UserProfile[]>([]);
  
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);

  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingIncomingRequests, setIsLoadingIncomingRequests] = useState(true);
  const [isLoadingSentRequests, setIsLoadingSentRequests] = useState(true);
  const [isLoadingPlayerSearch, setIsLoadingPlayerSearch] = useState(false);
  const [isProcessingFriendAction, setIsProcessingFriendAction] = useState<string | null>(null); // Stores UID of user being processed
  
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [isProcessingTeamAction, setIsProcessingTeamAction] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState<UserProfile[]>([]);
  const [isLoadingMemberSearch, setIsLoadingMemberSearch] = useState(false);

  const teamForm = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: "" },
  });

  const addMemberForm = useForm<{memberSearch: string}>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: { memberSearch: "" },
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const fetchSocialData = useCallback(async () => {
    if (!user) return;

    setIsLoadingFriends(true);
    setIsLoadingIncomingRequests(true);
    setIsLoadingSentRequests(true);

    try {
      const [friendProfiles, incomingProfiles, sentProfiles] = await Promise.all([
        Promise.all((user.friendUids || []).map(uid => getUserProfileFromFirestore(uid))),
        Promise.all((user.receivedFriendRequests || []).map(uid => getUserProfileFromFirestore(uid))),
        Promise.all((user.sentFriendRequests || []).map(uid => getUserProfileFromFirestore(uid))),
      ]);
      setFriends(friendProfiles.filter(p => p !== null) as UserProfile[]);
      setIncomingRequests(incomingProfiles.filter(p => p !== null) as UserProfile[]);
      setSentRequests(sentProfiles.filter(p => p !== null) as UserProfile[]);
    } catch (error) {
      console.error("Error fetching social data:", error);
      toast({ title: "Error", description: "Could not load your social connections.", variant: "destructive" });
    } finally {
      setIsLoadingFriends(false);
      setIsLoadingIncomingRequests(false);
      setIsLoadingSentRequests(false);
    }
  }, [user, toast]);

  const fetchUserTeam = useCallback(async () => {
    if (user && user.teamId) {
      setIsLoadingTeam(true);
      try {
        const team = await getTeamByIdFromFirestore(user.teamId);
        setCurrentTeam(team);
        if (team) {
          const memberProfiles = await Promise.all(
            team.memberUids.map(uid => getUserProfileFromFirestore(uid).then(p => p || {uid, displayName: 'Unknown User'} as UserProfile))
          );
          setTeamMembers(memberProfiles);
        }
      } catch (error) {
        console.error("Error fetching team:", error);
        toast({ title: "Error", description: "Could not load your team details.", variant: "destructive" });
      } finally {
        setIsLoadingTeam(false);
      }
    } else if (user && !user.teamId) {
        const ledTeams = await getTeamsByUserIdFromFirestore(user.uid, true);
        if (ledTeams.length > 0) {
            setCurrentTeam(ledTeams[0]);
            await updateUserTeamInFirestore(user.uid, ledTeams[0].id); 
             const memberProfiles = await Promise.all(
                ledTeams[0].memberUids.map(uid => getUserProfileFromFirestore(uid).then(p => p || {uid, displayName: 'Unknown User'} as UserProfile))
            );
            setTeamMembers(memberProfiles);
        } else {
             setCurrentTeam(null);
             setTeamMembers([]);
        }
        setIsLoadingTeam(false);
    } else {
      setCurrentTeam(null);
      setTeamMembers([]);
      setIsLoadingTeam(false);
    }
  }, [user, toast]);


  useEffect(() => {
    if (user) {
      fetchSocialData();
      fetchUserTeam();
    }
  }, [user, fetchSocialData, fetchUserTeam]);

  const handlePlayerSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!playerSearchTerm.trim() || !user) return;
    setIsLoadingPlayerSearch(true);
    setPlayerSearchResults([]);
    try {
      const results = await searchUsersByNameOrEmail(playerSearchTerm, user.uid);
      setPlayerSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({ title: "Search Error", description: "Could not perform user search.", variant: "destructive" });
    }
    setIsLoadingPlayerSearch(false);
  };
  
  // Friend Actions
  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user) return;
    setIsProcessingFriendAction(targetUserId);
    try {
      await sendFriendRequest(user.uid, targetUserId);
      toast({ title: "Request Sent!", description: "Your friend request has been sent." });
      await refreshUser(); // Refreshes AuthContext and re-triggers fetchSocialData
      setPlayerSearchResults(prev => prev.map(u => u.uid === targetUserId ? {...u, relationshipStatus: "request_sent_by_me"} : u));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not send friend request.", variant: "destructive" });
    }
    setIsProcessingFriendAction(null);
  };

  const handleAcceptFriendRequest = async (requesterUid: string) => {
    if (!user) return;
    setIsProcessingFriendAction(requesterUid);
    try {
      await acceptFriendRequest(user.uid, requesterUid);
      toast({ title: "Friend Added!", description: "You are now friends." });
      await refreshUser();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not accept friend request.", variant: "destructive" });
    }
    setIsProcessingFriendAction(null);
  };

  const handleDeclineFriendRequest = async (requesterUid: string) => {
    if (!user) return;
    setIsProcessingFriendAction(requesterUid);
    try {
      await declineFriendRequest(user.uid, requesterUid);
      toast({ title: "Request Declined", variant: "default" });
      await refreshUser();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not decline friend request.", variant: "destructive" });
    }
    setIsProcessingFriendAction(null);
  };
  
  const handleCancelFriendRequest = async (targetUid: string) => {
    if (!user) return;
    setIsProcessingFriendAction(targetUid);
    try {
      await cancelFriendRequest(user.uid, targetUid);
      toast({ title: "Request Cancelled", variant: "default" });
      await refreshUser();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not cancel friend request.", variant: "destructive" });
    }
    setIsProcessingFriendAction(null);
  };

  const handleRemoveFriend = async (friendUid: string) => {
    if (!user) return;
    setIsProcessingFriendAction(friendUid);
    try {
      await removeFriend(user.uid, friendUid);
      toast({ title: "Friend Removed", variant: "destructive" });
      await refreshUser();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not remove friend.", variant: "destructive" });
    }
    setIsProcessingFriendAction(null);
  };


  const determineRelationshipStatus = (targetUser: UserProfile) => {
    if (!user) return "none";
    if (user.friendUids?.includes(targetUser.uid)) return "friends";
    if (user.sentFriendRequests?.includes(targetUser.uid)) return "request_sent_by_me";
    if (user.receivedFriendRequests?.includes(targetUser.uid)) return "request_received_from_them";
    return "none";
  };


  const handleCreateTeam: SubmitHandler<TeamFormData> = async (data) => {
    if (!user) return;
    setIsProcessingTeamAction(true);
    try {
      await createTeamInFirestore(data, user);
      toast({ title: "Team Created!", description: `Your team "${data.name}" has been created.` });
      await refreshUser(); 
      fetchUserTeam(); // Re-fetch team details
      teamForm.reset();
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast({ title: "Team Creation Failed", description: error.message || "Could not create team.", variant: "destructive" });
    }
    setIsProcessingTeamAction(false);
  };

  const handleAddMemberToTeam: SubmitHandler<{ memberSearch: string }> = async (data) => {
      if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
      if (!data.memberSearch.trim()) {
        setMemberSearchResults([]);
        return;
      }
      setIsLoadingMemberSearch(true);
      try {
        const results = await searchUsersByNameOrEmail(data.memberSearch, user.uid);
        const availableResults = results.filter(foundUser => 
            !currentTeam.memberUids.includes(foundUser.uid) && !foundUser.teamId
        );
        setMemberSearchResults(availableResults);
         if(availableResults.length === 0 && results.length > 0) {
            toast({title: "Note", description: "Found users are already in a team or in your team.", variant: "default"})
        } else if (availableResults.length === 0 && results.length === 0) {
            toast({title: "No Users Found", description: `No users found matching "${data.memberSearch}".`})
        }
      } catch (error) {
        toast({ title: "Search Error", description: "Could not search for members.", variant: "destructive" });
      }
      setIsLoadingMemberSearch(false);
  };

  const confirmAddMember = async (memberId: string) => {
    if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
    setIsProcessingTeamAction(true);
    setIsProcessingFriendAction(memberId); // Use friend action state for member button loading
    try {
        await addMemberToTeamInFirestore(currentTeam.id, memberId);
        toast({title: "Member Added", description: "Player added to your team."});
        await fetchUserTeam(); 
        setMemberSearchTerm("");
        setMemberSearchResults([]);
        addMemberForm.reset();
    } catch (error: any) {
        toast({title: "Error Adding Member", description: error.message || "Could not add member.", variant: "destructive"})
    }
    setIsProcessingTeamAction(false);
    setIsProcessingFriendAction(null);
  }

  const handleRemoveMember = async (memberIdToRemove: string) => {
    if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
    if (memberIdToRemove === user.uid) {
        toast({title: "Action Not Allowed", description: "Leader cannot remove themselves. Delete the team instead or transfer leadership (feature not available).", variant: "destructive"});
        return;
    }
    setIsProcessingTeamAction(true);
    setIsProcessingFriendAction(memberIdToRemove);
    try {
        await removeMemberFromTeamInFirestore(currentTeam.id, memberIdToRemove);
        toast({title: "Member Removed", description: "Player removed from team."});
        await fetchUserTeam(); 
    } catch(error: any) {
        toast({title: "Error Removing Member", description: error.message || "Could not remove member.", variant: "destructive"});
    }
    setIsProcessingTeamAction(false);
    setIsProcessingFriendAction(null);
  };

  const handleLeaveTeam = async () => {
    if (!currentTeam || !user || currentTeam.leaderUid === user.uid) return; 
    setIsProcessingTeamAction(true);
    try {
        await removeMemberFromTeamInFirestore(currentTeam.id, user.uid);
        toast({title: "Left Team", description: `You have left ${currentTeam.name}.`});
        await refreshUser(); 
        await fetchUserTeam();
    } catch(error: any) {
        toast({title: "Error Leaving Team", description: error.message || "Could not leave team.", variant: "destructive"});
    }
    setIsProcessingTeamAction(false);
  };

  const handleDeleteTeam = async () => {
    if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
    setIsProcessingTeamAction(true);
    try {
        await deleteTeamFromFirestore(currentTeam.id, user.uid);
        toast({title: "Team Deleted", description: `Team ${currentTeam.name} has been deleted.`});
        await refreshUser(); 
        await fetchUserTeam();
    } catch (error: any) {
        toast({title: "Error Deleting Team", description: error.message || "Could not delete team.", variant: "destructive"});
    }
    setIsProcessingTeamAction(false);
  };


  if (authLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <PageTitle title="Social Hub" subtitle="Connecting Players and Teams" />
            <Loader2 className="h-12 w-12 animate-spin text-primary my-6" />
            <p className="text-lg text-muted-foreground">Loading social features...</p>
        </div>
    );
  }

  if (!user) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
          <PageTitle title="Access Denied" subtitle="You need to be logged in to access social features." />
           <LogIn className="h-16 w-16 text-primary my-6" />
          <Button asChild size="lg">
            <Link href="/auth/login?redirect=/social">Login to Access Social Features</Link>
          </Button>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle title="Social Hub" subtitle="Connect with players, form teams, and grow your network!" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Friends & Requests */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center text-xl"><Users className="mr-2 h-5 w-5 text-primary" />My Friends ({friends.length})</CardTitle></CardHeader>
            <CardContent>
              {isLoadingFriends ? <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                : friends.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {friends.map(friend => (
                    <li key={friend.uid} className="flex items-center justify-between p-2 border rounded-md hover:bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarImage src={friend.photoURL || ""} alt={friend.displayName || ""} /><AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback></Avatar>
                        <span className="font-medium text-sm truncate">{friend.displayName}</span>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={isProcessingFriendAction === friend.uid} title="Remove Friend"><UserMinus className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Remove {friend.displayName}?</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveFriend(friend.uid)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>))}
                </ul>
              ) : <p className="text-muted-foreground text-center py-2 text-sm">No friends yet. Find some!</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center text-xl"><UserPlus2 className="mr-2 h-5 w-5 text-primary" />Incoming Requests ({incomingRequests.length})</CardTitle></CardHeader>
            <CardContent>
              {isLoadingIncomingRequests ? <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                : incomingRequests.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {incomingRequests.map(req => (
                    <li key={req.uid} className="flex items-center justify-between p-2 border rounded-md hover:bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarImage src={req.photoURL || ""} alt={req.displayName || ""} /><AvatarFallback>{getInitials(req.displayName)}</AvatarFallback></Avatar>
                        <span className="font-medium text-sm truncate">{req.displayName}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="xs" variant="default" onClick={() => handleAcceptFriendRequest(req.uid)} disabled={isProcessingFriendAction === req.uid} title="Accept">
                            {isProcessingFriendAction === req.uid ? <Loader2 className="h-3 w-3 animate-spin"/> : <CheckCircle className="h-3 w-3"/>}
                        </Button>
                        <Button size="xs" variant="destructive" onClick={() => handleDeclineFriendRequest(req.uid)} disabled={isProcessingFriendAction === req.uid} title="Decline">
                           {isProcessingFriendAction === req.uid ? <Loader2 className="h-3 w-3 animate-spin"/> : <XCircle className="h-3 w-3"/>}
                        </Button>
                      </div>
                    </li>))}
                </ul>
              ) : <p className="text-muted-foreground text-center py-2 text-sm">No incoming requests.</p>}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle className="flex items-center text-xl"><Send className="mr-2 h-5 w-5 text-primary" />Sent Requests ({sentRequests.length})</CardTitle></CardHeader>
            <CardContent>
              {isLoadingSentRequests ? <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                : sentRequests.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {sentRequests.map(req => (
                    <li key={req.uid} className="flex items-center justify-between p-2 border rounded-md hover:bg-secondary/30">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarImage src={req.photoURL || ""} alt={req.displayName || ""} /><AvatarFallback>{getInitials(req.displayName)}</AvatarFallback></Avatar>
                        <span className="font-medium text-sm truncate">{req.displayName}</span>
                      </div>
                      <Button variant="outline" size="xs" onClick={() => handleCancelFriendRequest(req.uid)} disabled={isProcessingFriendAction === req.uid} title="Cancel Request">
                        {isProcessingFriendAction === req.uid ? <Loader2 className="h-3 w-3 animate-spin"/> : <Ban className="h-3 w-3"/>}
                      </Button>
                    </li>))}
                </ul>
              ) : <p className="text-muted-foreground text-center py-2 text-sm">No pending sent requests.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Find Players & Teams */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center text-xl"><Search className="mr-2 h-5 w-5 text-primary" />Find Players</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handlePlayerSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
                <Input type="search" placeholder="Search by name or email..." value={playerSearchTerm} onChange={(e) => setPlayerSearchTerm(e.target.value)} className="flex-grow" disabled={isLoadingPlayerSearch} />
                <Button type="submit" disabled={isLoadingPlayerSearch || !playerSearchTerm.trim()} className="w-full sm:w-auto">
                  {isLoadingPlayerSearch ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />} Search
                </Button>
              </form>
              {isLoadingPlayerSearch && <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
              {!isLoadingPlayerSearch && playerSearchResults.length > 0 && (
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {playerSearchResults.map(foundUser => {
                    const status = determineRelationshipStatus(foundUser);
                    return (
                      <li key={foundUser.uid} className="flex items-center justify-between p-2.5 border rounded-md hover:bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarImage src={foundUser.photoURL || ""} alt={foundUser.displayName || ""} /><AvatarFallback>{getInitials(foundUser.displayName)}</AvatarFallback></Avatar>
                          <div>
                            <span className="font-medium text-sm">{foundUser.displayName}</span>
                            <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                          </div>
                        </div>
                        {status === "none" && 
                            <Button variant="default" size="sm" onClick={() => handleSendFriendRequest(foundUser.uid)} disabled={isProcessingFriendAction === foundUser.uid}>
                                {isProcessingFriendAction === foundUser.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserPlus className="h-4 w-4"/>}
                            </Button>}
                        {status === "request_sent_by_me" && <Button variant="outline" size="sm" disabled>Request Sent</Button>}
                        {status === "request_received_from_them" && 
                            <Button variant="secondary" size="sm" onClick={() => { /* Could scroll to incoming requests or open a modal */ toast({title: "Respond to Request", description: "Check your incoming requests list."}) } }>
                                Respond
                            </Button>}
                        {status === "friends" && <Badge variant="secondary" className="text-xs"><UserCheck className="h-3 w-3 mr-1"/>Friends</Badge>}
                      </li>
                    );
                  })}
                </ul>
              )}
              {!isLoadingPlayerSearch && playerSearchResults.length === 0 && playerSearchTerm && <p className="text-muted-foreground text-center text-sm">No users found.</p>}
            </CardContent>
          </Card>

           <Card>
            <CardHeader><CardTitle className="flex items-center text-xl"><Users2 className="mr-2 h-5 w-5 text-primary" />My Team</CardTitle></CardHeader>
            <CardContent className="min-h-[200px]">
              {isLoadingTeam ? <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              : currentTeam ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">{currentTeam.name}</h3>
                  <p className="text-sm text-muted-foreground">Leader: {currentTeam.leaderName}</p>
                  <h4 className="font-medium text-sm">Members ({teamMembers.length}):</h4>
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                    {teamMembers.map(member => (
                      <li key={member.uid} className="flex items-center justify-between p-1.5 border rounded hover:bg-muted">
                        <div className="flex items-center gap-2">
                           <Avatar className="h-6 w-6"><AvatarImage src={member.photoURL || ""} /><AvatarFallback className="text-xs">{getInitials(member.displayName)}</AvatarFallback></Avatar>
                           <span>{member.displayName} {member.uid === currentTeam.leaderUid && <Badge variant="outline" className="ml-1 text-xs px-1 py-0">Leader</Badge>}</span>
                        </div>
                        {user.uid === currentTeam.leaderUid && member.uid !== user.uid && (
                           <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" disabled={isProcessingTeamAction || isProcessingFriendAction === member.uid} title="Remove Member"><UserX className="h-3.5 w-3.5"/></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove {member.displayName}?</AlertDialogTitle></AlertDialogHeader><AlertDialogDescription>Are you sure?</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveMember(member.uid)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                           </AlertDialog>
                        )}
                      </li>))}
                  </ul>
                  {user.uid === currentTeam.leaderUid && (
                    <div className="pt-3 border-t mt-3 space-y-2">
                      <h4 className="font-medium text-sm">Add New Member:</h4>
                       <form onSubmit={addMemberForm.handleSubmit(handleAddMemberToTeam)} className="flex flex-col sm:flex-row gap-1.5">
                            <Input {...addMemberForm.register("memberSearch")} placeholder="Search user..." className="h-8 text-xs flex-grow" disabled={isProcessingTeamAction || isLoadingMemberSearch} onChange={(e) => setMemberSearchTerm(e.target.value)} />
                            <Button type="submit" size="sm" className="text-xs h-8 w-full sm:w-auto" disabled={isProcessingTeamAction || isLoadingMemberSearch || !memberSearchTerm.trim()}>
                                {isLoadingMemberSearch ? <Loader2 className="h-3 w-3 animate-spin"/> : <Search className="h-3 w-3"/>}<span className="ml-1">Search</span></Button>
                       </form>
                       {isLoadingMemberSearch && <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>}
                       {memberSearchResults.length > 0 && (
                           <ul className="space-y-1.5 max-h-32 overflow-y-auto border p-1.5 rounded-md text-xs">
                               {memberSearchResults.map(foundUser => (
                                   <li key={foundUser.uid} className="flex items-center justify-between p-1 rounded hover:bg-muted">
                                       <span>{foundUser.displayName} ({foundUser.email})</span>
                                       <Button size="xs" className="h-6 px-1.5 text-xs" onClick={() => confirmAddMember(foundUser.uid)} disabled={isProcessingTeamAction || isProcessingFriendAction === foundUser.uid}>
                                           {isProcessingTeamAction && isProcessingFriendAction === foundUser.uid ? <Loader2 className="h-3 w-3 animate-spin"/> : <UserPlus2 className="h-3 w-3"/>}<span className="ml-1">Add</span></Button>
                                   </li>))}
                           </ul>
                       )}
                       {memberSearchResults.length === 0 && addMemberForm.getValues("memberSearch") && !isLoadingMemberSearch && (<p className="text-xs text-muted-foreground">No available users found.</p>)}
                      <Separator className="my-2"/>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="w-full text-xs h-8" disabled={isProcessingTeamAction}><Trash2 className="mr-1 h-3.5 w-3.5"/> Delete Team</Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Team "{currentTeam.name}"?</AlertDialogTitle></AlertDialogHeader><AlertDialogDescription>This cannot be undone.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTeam} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  {user.uid !== currentTeam.leaderUid && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="w-full mt-2 text-xs h-8" disabled={isProcessingTeamAction}><LogOutIcon className="mr-1 h-3.5 w-3.5"/> Leave Team</Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Leave Team "{currentTeam.name}"?</AlertDialogTitle></AlertDialogHeader><AlertDialogDescription>Are you sure?</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleLeaveTeam}>Leave</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                     </AlertDialog>
                  )}
                </div>
              ) : (
                <form onSubmit={teamForm.handleSubmit(handleCreateTeam)} className="space-y-2">
                  <p className="text-muted-foreground text-sm text-center py-2">You are not in a team. Create one!</p>
                  <div><Label htmlFor="teamName" className="text-xs">Team Name</Label><Input id="teamName" {...teamForm.register("name")} className="h-9" disabled={isProcessingTeamAction} />
                    {teamForm.formState.errors.name && <p className="text-destructive text-xs mt-1">{teamForm.formState.errors.name.message}</p>}</div>
                  <Button type="submit" disabled={isProcessingTeamAction} className="w-full h-9"> {isProcessingTeamAction ? <Loader2 className="h-4 w-4 animate-spin"/> : <Users2 className="h-4 w-4"/>}<span className="ml-1">Create Team</span></Button>
                </form>
              )}
              <p className="text-xs text-muted-foreground mt-3 text-center">Note: Team features are basic. Team chat and advanced management are coming soon.</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader><CardTitle className="flex items-center text-xl"><MessageSquare className="mr-2 h-5 w-5 text-primary" />Discussions</CardTitle></CardHeader>
            <CardContent className="text-center min-h-[100px] flex flex-col justify-center items-center">
              <p className="text-muted-foreground mb-3">Community Forums & Chat</p>
              <Button asChild variant="outline" disabled><span>Explore (Coming Soon)</span></Button>
              <p className="text-xs text-muted-foreground mt-1.5">Real-time chat and forums are planned.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
