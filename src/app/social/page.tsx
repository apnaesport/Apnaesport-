
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { LogIn, Users, UserPlus, UserMinus, Search, MessageSquare, Shield, Loader2, Users2, Trash2, LogOutIcon, UserPlus2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { UserProfile, Team, TeamFormData } from "@/lib/types";
import { 
  searchUsersByNameOrEmail, 
  addFriend, 
  removeFriend, 
  getUserProfileFromFirestore,
  createTeamInFirestore,
  getTeamByIdFromFirestore,
  getTeamsByUserIdFromFirestore,
  addMemberToTeamInFirestore,
  removeMemberFromTeamInFirestore,
  deleteTeamFromFirestore,
  updateUserTeamInFirestore
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


const teamFormSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters.").max(50, "Team name too long."),
});

const addMemberFormSchema = z.object({
  memberSearch: z.string().min(2, "Enter at least 2 characters to search."),
});

export default function SocialPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [playerSearchResults, setPlayerSearchResults] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);

  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingPlayerSearch, setIsLoadingPlayerSearch] = useState(false);
  const [isUpdatingFriend, setIsUpdatingFriend] = useState<string | null>(null);
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
        // Check if user is a leader of any team (in case teamId on user profile was out of sync)
        const ledTeams = await getTeamsByUserIdFromFirestore(user.uid, true);
        if (ledTeams.length > 0) {
            setCurrentTeam(ledTeams[0]);
            await updateUserTeamInFirestore(user.uid, ledTeams[0].id); // Sync user's teamId
            // Re-fetch team members for the found team
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


  const fetchFriendsDetails = useCallback(async () => {
    if (user && user.friendUids && user.friendUids.length > 0) {
      setIsLoadingFriends(true);
      try {
        const friendProfiles = await Promise.all(
          user.friendUids.map(uid => getUserProfileFromFirestore(uid))
        );
        setFriends(friendProfiles.filter(p => p !== null) as UserProfile[]);
      } catch (error) {
        console.error("Error fetching friend details:", error);
        toast({ title: "Error", description: "Could not load friends list.", variant: "destructive" });
      }
      setIsLoadingFriends(false);
    } else {
      setFriends([]);
      setIsLoadingFriends(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      fetchFriendsDetails();
      fetchUserTeam();
    }
  }, [user, fetchFriendsDetails, fetchUserTeam]);

  const handlePlayerSearch: SubmitHandler<{searchTerm: string}> = async (data) => {
    if (!data.searchTerm.trim() || !user) return;
    setIsLoadingPlayerSearch(true);
    try {
      const results = await searchUsersByNameOrEmail(data.searchTerm, user.uid);
      setPlayerSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({ title: "Search Error", description: "Could not perform user search.", variant: "destructive" });
    }
    setIsLoadingPlayerSearch(false);
  };

  const handleAddFriend = async (targetUserId: string) => {
    if (!user) return;
    setIsUpdatingFriend(targetUserId);
    try {
      await addFriend(user.uid, targetUserId);
      toast({ title: "Friend Added!", description: "They are now on your friends list." });
      await refreshUser(); // Refresh user context to get updated friendUids
      setPlayerSearchResults(prev => prev.filter(u => u.uid !== targetUserId)); 
    } catch (error) {
      console.error("Error adding friend:", error);
      toast({ title: "Error", description: "Could not add friend.", variant: "destructive" });
    }
    setIsUpdatingFriend(null);
  };

  const handleRemoveFriend = async (targetUserId: string) => {
    if (!user) return;
    setIsUpdatingFriend(targetUserId);
    try {
      await removeFriend(user.uid, targetUserId);
      toast({ title: "Friend Removed", description: "They have been removed from your friends list.", variant: "destructive" });
      await refreshUser();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({ title: "Error", description: "Could not remove friend.", variant: "destructive" });
    }
    setIsUpdatingFriend(null);
  };

  const handleCreateTeam: SubmitHandler<TeamFormData> = async (data) => {
    if (!user) return;
    setIsProcessingTeamAction(true);
    try {
      const teamId = await createTeamInFirestore(data, user);
      toast({ title: "Team Created!", description: `Your team "${data.name}" has been created.` });
      await refreshUser(); // This will update user.teamId
      teamForm.reset();
      // fetchUserTeam will be called due to user context update
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
        // Filter out existing team members and users who are already in another team
        const availableResults = results.filter(foundUser => 
            !currentTeam.memberUids.includes(foundUser.uid) && !foundUser.teamId
        );
        setMemberSearchResults(availableResults);
         if(availableResults.length === 0 && results.length > 0) {
            toast({title: "Note", description: "Found users are already in a team or in your team.", variant: "default"})
        }
      } catch (error) {
        toast({ title: "Search Error", description: "Could not search for members.", variant: "destructive" });
      }
      setIsLoadingMemberSearch(false);
  };

  const confirmAddMember = async (memberId: string) => {
    if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
    setIsProcessingTeamAction(true);
    try {
        await addMemberToTeamInFirestore(currentTeam.id, memberId);
        toast({title: "Member Added", description: "Player added to your team."});
        await fetchUserTeam(); // Refresh team details
        setMemberSearchTerm("");
        setMemberSearchResults([]);
        addMemberForm.reset();
    } catch (error) {
        toast({title: "Error Adding Member", description: "Could not add member.", variant: "destructive"})
    }
    setIsProcessingTeamAction(false);
  }

  const handleRemoveMember = async (memberIdToRemove: string) => {
    if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
    if (memberIdToRemove === user.uid) {
        toast({title: "Action Not Allowed", description: "Leader cannot remove themselves. Delete the team instead or transfer leadership (feature not available).", variant: "destructive"});
        return;
    }
    setIsProcessingTeamAction(true);
    try {
        await removeMemberFromTeamInFirestore(currentTeam.id, memberIdToRemove);
        toast({title: "Member Removed", description: "Player removed from team."});
        await fetchUserTeam(); // Refresh team details
    } catch(error) {
        toast({title: "Error Removing Member", description: "Could not remove member.", variant: "destructive"});
    }
    setIsProcessingTeamAction(false);
  };

  const handleLeaveTeam = async () => {
    if (!currentTeam || !user || currentTeam.leaderUid === user.uid) return; // Leader should use delete
    setIsProcessingTeamAction(true);
    try {
        await removeMemberFromTeamInFirestore(currentTeam.id, user.uid);
        toast({title: "Left Team", description: `You have left ${currentTeam.name}.`});
        await refreshUser(); // This will update user.teamId
        // fetchUserTeam will be called due to user context update
    } catch(error) {
        toast({title: "Error Leaving Team", description: "Could not leave team.", variant: "destructive"});
    }
    setIsProcessingTeamAction(false);
  };

  const handleDeleteTeam = async () => {
    if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
    setIsProcessingTeamAction(true);
    try {
        await deleteTeamFromFirestore(currentTeam.id, user.uid);
        toast({title: "Team Deleted", description: `Team ${currentTeam.name} has been deleted.`});
        await refreshUser(); // This will update user.teamId
        // fetchUserTeam will be called due to user context update
    } catch (error: any) {
        toast({title: "Error Deleting Team", description: error.message || "Could not delete team.", variant: "destructive"});
    }
    setIsProcessingTeamAction(false);
  };


  const getInitials = (name: string | null | undefined) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
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

  const isFriend = (userId: string) => user.friendUids?.includes(userId) || false;

  return (
    <div className="space-y-8">
      <PageTitle title="Social Hub" subtitle="Connect with players, form teams, and join the conversation!" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Friends Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Users className="mr-2 h-5 w-5 text-primary" />
              My Friends ({friends.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingFriends ? (
              <div className="flex justify-center items-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : friends.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {friends.map(friend => (
                  <li key={friend.uid} className="flex items-center justify-between p-2 border rounded-md bg-card hover:bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={friend.photoURL || ""} alt={friend.displayName || "User"} data-ai-hint="user avatar" />
                        <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{friend.displayName}</span>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isUpdatingFriend === friend.uid}>
                                {isUpdatingFriend === friend.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserMinus className="h-4 w-4" />}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Remove Friend?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to remove {friend.displayName} from your friends list?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveFriend(friend.uid)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm">You haven't added any friends yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Player Search Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Search className="mr-2 h-5 w-5 text-primary" /> Find Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handlePlayerSearch({ searchTerm }); }} className="flex flex-col sm:flex-row gap-2 mb-6">
              <Input
                type="search"
                placeholder="Enter name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow"
                disabled={isLoadingPlayerSearch}
              />
              <Button type="submit" disabled={isLoadingPlayerSearch || !searchTerm.trim()} className="w-full sm:w-auto">
                {isLoadingPlayerSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-1">Search</span>
              </Button>
            </form>

            {isLoadingPlayerSearch && <div className="flex justify-center items-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {!isLoadingPlayerSearch && playerSearchResults.length > 0 && (
              <ul className="space-y-3 max-h-80 overflow-y-auto">
                {playerSearchResults.map(foundUser => (
                  <li key={foundUser.uid} className="flex items-center justify-between p-2 border rounded-md bg-card hover:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={foundUser.photoURL || ""} alt={foundUser.displayName || "User"} data-ai-hint="user avatar"/>
                        <AvatarFallback>{getInitials(foundUser.displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium text-sm">{foundUser.displayName}</span>
                        <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                      </div>
                    </div>
                    {!isFriend(foundUser.uid) ? (
                      <Button variant="default" size="sm" onClick={() => handleAddFriend(foundUser.uid)} disabled={isUpdatingFriend === foundUser.uid}>
                        {isUpdatingFriend === foundUser.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      </Button>
                    ) : (
                      <span className="text-xs text-green-500">Already Friends</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!isLoadingPlayerSearch && playerSearchResults.length === 0 && searchTerm && (
              <p className="text-muted-foreground text-center text-sm">No users found matching your search.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Teams Card */}
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Users2 className="mr-2 h-5 w-5 text-primary" /> My Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTeam ? (
            <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : currentTeam ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Team: {currentTeam.name}</h3>
              <p className="text-sm text-muted-foreground">Leader: {currentTeam.leaderName}</p>
              <h4 className="font-medium">Members ({teamMembers.length}):</h4>
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {teamMembers.map(member => (
                  <li key={member.uid} className="flex items-center justify-between p-2 border rounded-md bg-secondary/30">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                           <AvatarImage src={member.photoURL || ""} alt={member.displayName || ""} data-ai-hint="user avatar" />
                           <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.displayName} {member.uid === currentTeam.leaderUid && "(Leader)"}</span>
                    </div>
                    {user.uid === currentTeam.leaderUid && member.uid !== user.uid && (
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="xs" disabled={isProcessingTeamAction}>
                                {isProcessingTeamAction && <Loader2 className="h-3 w-3 animate-spin mr-1"/>} Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Remove {member.displayName}?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogDescription>Are you sure you want to remove this member from the team?</AlertDialogDescription>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveMember(member.uid)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                       </AlertDialog>
                    )}
                  </li>
                ))}
              </ul>
              {user.uid === currentTeam.leaderUid && (
                <div className="pt-4 border-t mt-4 space-y-3">
                  <h4 className="font-medium">Add New Member:</h4>
                   <form onSubmit={addMemberForm.handleSubmit(handleAddMemberToTeam)} className="flex flex-col sm:flex-row gap-2">
                        <Input 
                            {...addMemberForm.register("memberSearch")}
                            placeholder="Search user by name/email"
                            className="flex-grow"
                            disabled={isProcessingTeamAction || isLoadingMemberSearch}
                        />
                        <Button type="submit" disabled={isProcessingTeamAction || isLoadingMemberSearch || !addMemberForm.watch("memberSearch")?.trim()} className="w-full sm:w-auto">
                            {isLoadingMemberSearch ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                            <span className="ml-1">Search</span>
                        </Button>
                   </form>
                   {isLoadingMemberSearch && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>}
                   {memberSearchResults.length > 0 && (
                       <ul className="space-y-2 max-h-48 overflow-y-auto border p-2 rounded-md">
                           {memberSearchResults.map(foundUser => (
                               <li key={foundUser.uid} className="flex items-center justify-between p-1.5 rounded hover:bg-muted">
                                   <span className="text-sm">{foundUser.displayName} ({foundUser.email})</span>
                                   <Button size="xs" onClick={() => confirmAddMember(foundUser.uid)} disabled={isProcessingTeamAction}>
                                       <UserPlus2 className="h-3 w-3 mr-1"/> Add
                                   </Button>
                               </li>
                           ))}
                       </ul>
                   )}
                   {memberSearchResults.length === 0 && addMemberForm.watch("memberSearch") && !isLoadingMemberSearch && (
                       <p className="text-xs text-muted-foreground">No available users found for "{addMemberForm.watch("memberSearch")}". They might be in your team or another team already.</p>
                   )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto" disabled={isProcessingTeamAction}><Trash2 className="mr-1 h-4 w-4"/> Delete Team</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete Team "{currentTeam.name}"?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogDescription>This action cannot be undone. All members will be removed from the team.</AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteTeam}>Delete Team</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              {user.uid !== currentTeam.leaderUid && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto mt-2" disabled={isProcessingTeamAction}><LogOutIcon className="mr-1 h-4 w-4"/> Leave Team</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Leave Team "{currentTeam.name}"?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogDescription>Are you sure you want to leave this team?</AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLeaveTeam}>Leave Team</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
              )}
            </div>
          ) : (
            <form onSubmit={teamForm.handleSubmit(handleCreateTeam)} className="space-y-3">
              <p className="text-muted-foreground text-sm">You are not currently part of a team. Create one!</p>
              <div>
                <Label htmlFor="teamName" className="text-xs">Team Name</Label>
                <Input id="teamName" {...teamForm.register("name")} disabled={isProcessingTeamAction} />
                {teamForm.formState.errors.name && <p className="text-destructive text-xs mt-1">{teamForm.formState.errors.name.message}</p>}
              </div>
              <Button type="submit" disabled={isProcessingTeamAction} className="w-full sm:w-auto">
                {isProcessingTeamAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users2 className="h-4 w-4" />}
                <span className="ml-1">Create Team</span>
              </Button>
            </form>
          )}
           <p className="text-xs text-muted-foreground mt-4">Note: Users can only lead one team. Automatic deletion of inactive teams is a backend feature not implemented in this prototype.</p>
        </CardContent>
      </Card>

      {/* Discussions Card */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            Discussions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">Community Forums & Tournament Chat</p>
          <Button asChild variant="outline" disabled> 
            {/* <Link href="/forums">Go to Forums (Coming Soon)</Link> */}
             <span>Explore Discussions (Coming Soon)</span>
          </Button>
           <p className="text-xs text-muted-foreground mt-2">Real-time chat and forums are planned for a future update.</p>
        </CardContent>
      </Card>

      <div className="text-center mt-12">
        <p className="text-lg text-muted-foreground">More social features are coming soon to Apna Esport!</p>
      </div>
    </div>
  );
}
