
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { LogIn, Users, UserPlus, UserMinus, Search, Shield, Loader2, Users2, Trash2, LogOutIcon, UserPlus2, UserCheck, UserX, Send, Ban, CheckCircle, XCircle, MessageCircle, X, MessageSquare } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import type { UserProfile, Team, TeamFormData, ChatMessage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
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
  removeFriend,
  getChatId,
  sendMessageToFirestore,
  getMessagesForChat,
  deleteMessageFromFirestore,
} from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useForm, type SubmitHandler } from "react-hook-form";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

const teamFormSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters.").max(50, "Team name too long."),
});

const addMemberFormSchema = z.object({
  memberSearch: z.string().min(2, "Enter at least 2 characters to search."),
});

interface ActiveChatContext {
  id: string; // Firestore chat document ID (friend1_friend2 or team_id)
  displayName: string; // Name to show in chat header
  type: 'friend' | 'team';
  targetEntity: UserProfile | Team; // The friend profile or team object
}

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
  const [isProcessingFriendAction, setIsProcessingFriendAction] = useState<string | null>(null);
  
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [isProcessingTeamAction, setIsProcessingTeamAction] = useState(false);
  const [memberSearchTermState, setMemberSearchTermState] = useState(""); // Renamed to avoid conflict with form
  const [memberSearchResults, setMemberSearchResults] = useState<UserProfile[]>([]);
  const [isLoadingMemberSearch, setIsLoadingMemberSearch] = useState(false);

  // Unified Chat state
  const [activeChatContext, setActiveChatContext] = useState<ActiveChatContext | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChatMessages, setIsLoadingChatMessages] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
            // This update should ideally happen when team is created or joined
            // await updateUserTeamInFirestore(user.uid, ledTeams[0].id); 
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

  // Unified Chat: Fetch messages when activeChatContext changes
  useEffect(() => {
    if (activeChatContext && user) {
      setIsLoadingChatMessages(true);
      setChatMessages([]); // Clear previous messages
      const unsubscribe = getMessagesForChat(activeChatContext.id, (messages) => {
        setChatMessages(messages);
        setIsLoadingChatMessages(false);
      });
      return () => unsubscribe(); 
    } else {
      setChatMessages([]); 
    }
  }, [activeChatContext, user]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);


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
  
  const handleSendFriendRequest = async (targetUser: UserProfile) => {
    if (!user) return;
    setIsProcessingFriendAction(targetUser.uid);
    try {
      await sendFriendRequest(user.uid, targetUser.uid);
      toast({ title: "Request Sent!", description: `Friend request sent to ${targetUser.displayName}.` });
      await refreshUser(); 
      setPlayerSearchResults(prev => prev.map(u => u.uid === targetUser.uid ? {...u, relationshipStatus: "request_sent_by_me"} : u)); // Optimistic update for search
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not send friend request.", variant: "destructive" });
    }
    setIsProcessingFriendAction(null);
  };

  const handleAcceptFriendRequest = async (requester: UserProfile) => {
    if (!user) return;
    setIsProcessingFriendAction(requester.uid);
    try {
      await acceptFriendRequest(user.uid, requester.uid);
      toast({ title: "Friend Added!", description: `You are now friends with ${requester.displayName}.` });
      await refreshUser(); // This will re-trigger fetchSocialData
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not accept friend request.", variant: "destructive" });
    }
    setIsProcessingFriendAction(null);
  };

  const handleDeclineFriendRequest = async (requester: UserProfile) => {
    if (!user) return;
    setIsProcessingFriendAction(requester.uid);
    try {
      await declineFriendRequest(user.uid, requester.uid);
      toast({ title: "Request Declined", description: `Friend request from ${requester.displayName} declined.`, variant: "default" });
      await refreshUser();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not decline friend request.", variant: "destructive" });
    }
    setIsProcessingFriendAction(null);
  };
  
  const handleCancelFriendRequest = async (targetUser: UserProfile) => {
    if (!user) return;
    setIsProcessingFriendAction(targetUser.uid);
    try {
      await cancelFriendRequest(user.uid, targetUser.uid);
      toast({ title: "Request Cancelled", description: `Friend request to ${targetUser.displayName} cancelled.`, variant: "default" });
      await refreshUser();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not cancel friend request.", variant: "destructive" });
    }
    setIsProcessingFriendAction(null);
  };

  const handleRemoveFriend = async (friendToRemove: UserProfile) => {
    if (!user) return;
    setIsProcessingFriendAction(friendToRemove.uid);
    try {
      await removeFriend(user.uid, friendToRemove.uid);
      toast({ title: "Friend Removed", description: `${friendToRemove.displayName} has been removed from your friends.`, variant: "destructive" });
      if (activeChatContext?.type === 'friend' && activeChatContext.targetEntity.uid === friendToRemove.uid) {
        setActiveChatContext(null); // Close chat if active with removed friend
      }
      await refreshUser();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not remove friend.", variant: "destructive" });
    }
    setIsProcessingFriendAction(null);
  };


  const determineRelationshipStatus = (targetUserUid: string) => {
    if (!user) return "none";
    if (user.friendUids?.includes(targetUserUid)) return "friends";
    if (user.sentFriendRequests?.includes(targetUserUid)) return "request_sent_by_me";
    if (user.receivedFriendRequests?.includes(targetUserUid)) return "request_received_from_them";
    return "none";
  };

  const handleCreateTeam: SubmitHandler<TeamFormData> = async (data) => {
    if (!user) return;
    setIsProcessingTeamAction(true);
    try {
      const newTeamId = await createTeamInFirestore(data, user);
      await updateUserTeamInFirestore(user.uid, newTeamId); // Ensure user's teamId is updated
      toast({ title: "Team Created!", description: `Your team "${data.name}" has been created.` });
      await refreshUser(); 
      await fetchUserTeam(); 
      teamForm.reset();
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast({ title: "Team Creation Failed", description: error.message || "Could not create team.", variant: "destructive" });
    }
    setIsProcessingTeamAction(false);
  };

  const handleSearchMember: SubmitHandler<{ memberSearch: string }> = async (data) => {
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
    setIsProcessingFriendAction(memberId); // Use friend action state for individual member processing
    try {
        await addMemberToTeamInFirestore(currentTeam.id, memberId);
        toast({title: "Member Added", description: "Player added to your team."});
        await fetchUserTeam(); 
        setMemberSearchTermState("");
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
        if (activeChatContext?.type === 'team' && activeChatContext.id === currentTeam.id) {
            setActiveChatContext(null); // Close team chat if user leaves team
        }
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
        if (activeChatContext?.type === 'team' && activeChatContext.id === currentTeam.id) {
            setActiveChatContext(null); // Close team chat if team is deleted
        }
        await refreshUser(); 
        await fetchUserTeam();
    } catch (error: any) {
        toast({title: "Error Deleting Team", description: error.message || "Could not delete team.", variant: "destructive"});
    }
    setIsProcessingTeamAction(false);
  };

  const handleSendMessage = async () => {
    if (!user || !activeChatContext || !chatInput.trim()) return;
    setIsSendingMessage(true);
    try {
      await sendMessageToFirestore(activeChatContext.id, user.uid, user.displayName || "User", chatInput.trim());
      setChatInput("");
      if (activeChatContext.type === 'team' && currentTeam) {
        // Optionally update team's lastActivityAt, handled by sendMessageToFirestore if implemented there
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Message Error", description: "Could not send message.", variant: "destructive" });
    }
    setIsSendingMessage(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user || !activeChatContext) return;
    try {
      await deleteMessageFromFirestore(activeChatContext.id, messageId, user.uid);
      toast({ title: "Message Deleted", variant: "default" });
    } catch (error: any) {
      toast({ title: "Error Deleting Message", description: error.message, variant: "destructive" });
    }
  };

  const openFriendChat = (friend: UserProfile) => {
    if (!user) return;
    setActiveChatContext({
        type: 'friend',
        targetEntity: friend,
        id: getChatId(user.uid, friend.uid),
        displayName: friend.displayName || "Friend"
    });
  };

  const openTeamChat = () => {
    if (!currentTeam) return;
    setActiveChatContext({
        type: 'team',
        targetEntity: currentTeam,
        id: currentTeam.id,
        displayName: `${currentTeam.name} (Team Chat)`
    });
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
    <div className="space-y-6 md:space-y-8">
      <PageTitle title="Social Hub" subtitle="Connect with players, form teams, and chat!" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: Friends & Requests */}
        <div className={cn("lg:col-span-1 space-y-6", activeChatContext ? "hidden lg:block" : "block")}>
          <Card className="shadow-md">
            <CardHeader><CardTitle className="flex items-center text-lg"><Users className="mr-2 h-5 w-5 text-primary" />My Friends ({friends.length})</CardTitle></CardHeader>
            <CardContent>
              {isLoadingFriends ? <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                : friends.length > 0 ? (
                <ScrollArea className="h-48">
                <ul className="space-y-2">
                  {friends.map(friend => (
                    <li key={friend.uid} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => openFriendChat(friend)}>
                        <Avatar className="h-8 w-8"><AvatarImage src={friend.photoURL || ""} alt={friend.displayName || ""} /><AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback></Avatar>
                        <span className="font-medium text-sm truncate">{friend.displayName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80" onClick={() => openFriendChat(friend)} title="Chat">
                            <MessageCircle className="h-4 w-4"/>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" disabled={isProcessingFriendAction === friend.uid} title="Remove Friend"><UserMinus className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Remove {friend.displayName}?</AlertDialogTitle><AlertDialogDescription>Are you sure?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveFriend(friend)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </li>))}
                </ul>
                </ScrollArea>
              ) : <p className="text-muted-foreground text-center py-2 text-sm">No friends yet. Find some!</p>}
            </CardContent>
          </Card>
            
          <Card className="shadow-md">
            <CardHeader><CardTitle className="flex items-center text-lg"><UserPlus2 className="mr-2 h-5 w-5 text-primary" />Incoming Requests ({incomingRequests.length})</CardTitle></CardHeader>
            <CardContent>
            {isLoadingIncomingRequests ? <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                : incomingRequests.length > 0 ? (
                <ScrollArea className="h-40">
                <ul className="space-y-2">
                {incomingRequests.map(req => (
                    <li key={req.uid} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarImage src={req.photoURL || ""} alt={req.displayName || ""} /><AvatarFallback>{getInitials(req.displayName)}</AvatarFallback></Avatar>
                        <span className="font-medium text-sm truncate">{req.displayName}</span>
                    </div>
                    <div className="flex gap-1">
                        <Button size="xs" variant="default" onClick={() => handleAcceptFriendRequest(req)} disabled={isProcessingFriendAction === req.uid} title="Accept">
                            {isProcessingFriendAction === req.uid ? <Loader2 className="h-3 w-3 animate-spin"/> : <CheckCircle className="h-3 w-3"/>}
                        </Button>
                        <Button size="xs" variant="destructive" onClick={() => handleDeclineFriendRequest(req)} disabled={isProcessingFriendAction === req.uid} title="Decline">
                        {isProcessingFriendAction === req.uid ? <Loader2 className="h-3 w-3 animate-spin"/> : <XCircle className="h-3 w-3"/>}
                        </Button>
                    </div>
                    </li>))}
                </ul>
                </ScrollArea>
                ) : <p className="text-muted-foreground text-center py-2 text-sm">No incoming requests.</p>}
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader><CardTitle className="flex items-center text-lg"><Send className="mr-2 h-5 w-5 text-primary" />Sent Requests ({sentRequests.length})</CardTitle></CardHeader>
            <CardContent>
            {isLoadingSentRequests ? <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                : sentRequests.length > 0 ? (
                <ScrollArea className="h-40">
                <ul className="space-y-2">
                {sentRequests.map(req => (
                    <li key={req.uid} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarImage src={req.photoURL || ""} alt={req.displayName || ""} /><AvatarFallback>{getInitials(req.displayName)}</AvatarFallback></Avatar>
                        <span className="font-medium text-sm truncate">{req.displayName}</span>
                    </div>
                    <Button variant="outline" size="xs" onClick={() => handleCancelFriendRequest(req)} disabled={isProcessingFriendAction === req.uid} title="Cancel Request">
                        {isProcessingFriendAction === req.uid ? <Loader2 className="h-3 w-3 animate-spin"/> : <Ban className="h-3 w-3"/>}
                    </Button>
                    </li>))}
                </ul>
                </ScrollArea>
                ) : <p className="text-muted-foreground text-center py-2 text-sm">No pending sent requests.</p>}
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Main Content Area (Search, Team, Active Chat) */}
        <div className={cn("lg:col-span-2 space-y-6", activeChatContext ? "lg:col-span-2" : "lg:col-span-2")}>
          {!activeChatContext && (
            <>
            <Card className="shadow-md">
                <CardHeader><CardTitle className="flex items-center text-lg"><Search className="mr-2 h-5 w-5 text-primary" />Find Players</CardTitle></CardHeader>
                <CardContent>
                <form onSubmit={handlePlayerSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Input type="search" placeholder="Search by name or email..." value={playerSearchTerm} onChange={(e) => setPlayerSearchTerm(e.target.value)} className="flex-grow h-9" disabled={isLoadingPlayerSearch} />
                    <Button type="submit" disabled={isLoadingPlayerSearch || !playerSearchTerm.trim()} className="w-full sm:w-auto h-9">
                    {isLoadingPlayerSearch ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />} Search
                    </Button>
                </form>
                {isLoadingPlayerSearch && <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                {!isLoadingPlayerSearch && playerSearchResults.length > 0 && (
                    <ScrollArea className="max-h-60">
                    <ul className="space-y-2">
                    {playerSearchResults.map(foundUser => {
                        const status = determineRelationshipStatus(foundUser.uid);
                        return (
                        <li key={foundUser.uid} className="flex items-center justify-between p-2.5 border rounded-md hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9"><AvatarImage src={foundUser.photoURL || ""} alt={foundUser.displayName || ""} /><AvatarFallback>{getInitials(foundUser.displayName)}</AvatarFallback></Avatar>
                            <div>
                                <span className="font-medium text-sm">{foundUser.displayName}</span>
                                <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                            </div>
                            </div>
                            {status === "none" && 
                                <Button variant="default" size="sm" className="h-8 text-xs" onClick={() => handleSendFriendRequest(foundUser)} disabled={isProcessingFriendAction === foundUser.uid}>
                                    {isProcessingFriendAction === foundUser.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserPlus className="h-4 w-4"/>}
                                </Button>}
                            {status === "request_sent_by_me" && <Button variant="outline" size="sm" className="h-8 text-xs" disabled>Request Sent</Button>}
                            {status === "request_received_from_them" && 
                                <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={() => { toast({title: "Respond to Request", description: "Check your incoming requests list."}) } }>
                                    Respond
                                </Button>}
                            {status === "friends" && <Badge variant="secondary" className="text-xs"><UserCheck className="h-3 w-3 mr-1"/>Friends</Badge>}
                        </li>
                        );
                    })}
                    </ul>
                    </ScrollArea>
                )}
                {!isLoadingPlayerSearch && playerSearchResults.length === 0 && playerSearchTerm && <p className="text-muted-foreground text-center text-sm">No users found.</p>}
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardHeader><CardTitle className="flex items-center text-lg"><Users2 className="mr-2 h-5 w-5 text-primary" />My Team</CardTitle></CardHeader>
                <CardContent className="min-h-[150px]">
                {isLoadingTeam ? <div className="flex justify-center py-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                : currentTeam && user ? (
                    <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-md font-semibold text-foreground">{currentTeam.name}</h3>
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={openTeamChat}><MessageSquare className="mr-1 h-3.5 w-3.5"/> Team Chat</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Leader: {currentTeam.leaderName}</p>
                    <h4 className="font-medium text-xs">Members ({teamMembers.length}):</h4>
                    <ScrollArea className="max-h-40">
                    <ul className="space-y-1.5 text-xs">
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
                    </ScrollArea>
                    {user.uid === currentTeam.leaderUid && (
                        <div className="pt-3 border-t mt-3 space-y-2">
                        <h4 className="font-medium text-xs">Add New Member:</h4>
                        <form onSubmit={addMemberForm.handleSubmit(handleSearchMember)} className="flex flex-col sm:flex-row gap-1.5">
                                <Input {...addMemberForm.register("memberSearch")} placeholder="Search user..." className="h-8 text-xs flex-grow" disabled={isProcessingTeamAction || isLoadingMemberSearch} onChange={(e) => setMemberSearchTermState(e.target.value)} />
                                <Button type="submit" size="sm" className="text-xs h-8 w-full sm:w-auto" disabled={isProcessingTeamAction || isLoadingMemberSearch || !memberSearchTermState.trim()}>
                                    {isLoadingMemberSearch ? <Loader2 className="h-3 w-3 animate-spin"/> : <Search className="h-3 w-3"/>}<span className="ml-1">Search</span></Button>
                        </form>
                        {isLoadingMemberSearch && <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>}
                        {memberSearchResults.length > 0 && (
                            <ScrollArea className="max-h-32">
                            <ul className="space-y-1.5 border p-1.5 rounded-md text-xs">
                                {memberSearchResults.map(foundUser => (
                                    <li key={foundUser.uid} className="flex items-center justify-between p-1 rounded hover:bg-muted">
                                        <span>{foundUser.displayName} ({foundUser.email})</span>
                                        <Button size="xs" className="h-6 px-1.5 text-xs" onClick={() => confirmAddMember(foundUser.uid)} disabled={isProcessingTeamAction || isProcessingFriendAction === foundUser.uid}>
                                            {isProcessingTeamAction && isProcessingFriendAction === foundUser.uid ? <Loader2 className="h-3 w-3 animate-spin"/> : <UserPlus2 className="h-3 w-3"/>}<span className="ml-1">Add</span></Button>
                                    </li>))}
                            </ul>
                            </ScrollArea>
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
                </CardContent>
            </Card>
            </>
          )}

          {/* Unified Chat Panel */}
          {activeChatContext && user && (
            <Card className={cn("shadow-lg sticky top-20", activeChatContext.type === 'team' ? 'border-primary' : 'border-border')}>
              <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  {activeChatContext.type === 'friend' && (activeChatContext.targetEntity as UserProfile).photoURL && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={(activeChatContext.targetEntity as UserProfile).photoURL || ""} />
                        <AvatarFallback>{getInitials((activeChatContext.targetEntity as UserProfile).displayName)}</AvatarFallback>
                    </Avatar>
                  )}
                   {activeChatContext.type === 'team' && (
                     <Users2 className="h-6 w-6 text-primary" />
                  )}
                  <CardTitle className="text-md font-semibold">{activeChatContext.displayName}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setActiveChatContext(null)} className="h-7 w-7">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close Chat</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-18rem)] min-h-[300px] max-h-[500px] p-3 space-y-3 bg-background">
                  {isLoadingChatMessages ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : chatMessages.length > 0 ? (
                    chatMessages.map(msg => (
                      <div key={msg.id} className={cn("flex flex-col group", msg.senderId === user.uid ? "items-end" : "items-start")}>
                        {activeChatContext.type === 'team' && msg.senderId !== user.uid && (
                            <span className="text-xs text-muted-foreground ml-2 mb-0.5">{msg.senderName}</span>
                        )}
                        <div className={cn("max-w-[75%] p-2 rounded-lg shadow-sm", 
                                          msg.senderId === user.uid ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                          <p className="text-sm break-words">{msg.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs opacity-70">
                                {msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : "sending..."}
                            </p>
                            {msg.senderId === user.uid && (
                              <Trash2 
                                className="h-3 w-3 cursor-pointer opacity-0 group-hover:opacity-60 hover:opacity-100 hover:text-destructive transition-opacity" 
                                onClick={() => handleDeleteMessage(msg.id)}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4 text-sm">No messages yet. Start the conversation!</p>
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>
                <div className="p-3 border-t bg-muted/30">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                    <Input 
                      value={chatInput} 
                      onChange={(e) => setChatInput(e.target.value)} 
                      placeholder="Type a message..." 
                      disabled={isSendingMessage}
                      className="h-9 bg-background"
                    />
                    <Button type="submit" size="sm" disabled={isSendingMessage || !chatInput.trim()} className="h-9">
                      {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

    