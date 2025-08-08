
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
  const [memberSearchTermState, setMemberSearchTermState] = useState(""); 
  const [memberSearchResults, setMemberSearchResults] = useState<UserProfile[]>([]);
  const [isLoadingMemberSearch, setIsLoadingMemberSearch] = useState(false);

  const [activeChatContext, setActiveChatContext] = useState<ActiveChatContext | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChatMessages, setIsLoadingChatMessages] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [unreadFriendMessageSenders, setUnreadFriendMessageSenders] = useState<Set<string>>(new Set());
  const friendChatUnsubscribersRef = useRef<Record<string, () => void>>({});


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

  useEffect(() => {
    if (!user || friends.length === 0) {
      Object.values(friendChatUnsubscribersRef.current).forEach(unsub => unsub());
      friendChatUnsubscribersRef.current = {};
      return;
    }

    const newUnsubscribers: Record<string, () => void> = {};

    friends.forEach(friend => {
      const chatId = getChatId(user.uid, friend.uid);
      if (friendChatUnsubscribersRef.current[chatId]) { 
        newUnsubscribers[chatId] = friendChatUnsubscribersRef.current[chatId];
        delete friendChatUnsubscribersRef.current[chatId]; 
        return;
      }

      newUnsubscribers[chatId] = getMessagesForChat(chatId, (messages) => {
        if (messages.length > 0) {
          const latestMessage = messages[messages.length - 1];
          if (latestMessage.senderId === friend.uid && activeChatContext?.targetEntity.uid !== friend.uid) {
            setUnreadFriendMessageSenders(prev => new Set(prev).add(friend.uid));
          }
        }
      });
    });

    Object.values(friendChatUnsubscribersRef.current).forEach(unsub => unsub());
    friendChatUnsubscribersRef.current = newUnsubscribers;

    return () => {
      Object.values(friendChatUnsubscribersRef.current).forEach(unsub => unsub());
      friendChatUnsubscribersRef.current = {};
    };
  }, [user, friends, activeChatContext]);


  useEffect(() => {
    if (activeChatContext && user) {
      setIsLoadingChatMessages(true);
      setChatMessages([]); 
      const unsubscribe = getMessagesForChat(activeChatContext.id, (messages) => {
        setChatMessages(messages);
        setIsLoadingChatMessages(false);
      });
      if (activeChatContext.type === 'friend') {
        setUnreadFriendMessageSenders(prev => {
          const newSet = new Set(prev);
          newSet.delete((activeChatContext.targetEntity as UserProfile).uid);
          return newSet;
        });
      }
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
      setPlayerSearchResults(prev => prev.map(u => u.uid === targetUser.uid ? {...u, relationshipStatus: "request_sent_by_me"} : u)); 
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
      await refreshUser(); 
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
        setActiveChatContext(null); 
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
      await updateUserTeamInFirestore(user.uid, newTeamId); 
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
            toast({title: "Note", description: "Found users are already in your team or another team.", variant: "default"})
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
    setIsProcessingFriendAction(memberId); 
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
            setActiveChatContext(null); 
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
            setActiveChatContext(null); 
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
    setUnreadFriendMessageSenders(prev => { 
        const newSet = new Set(prev);
        newSet.delete(friend.uid);
        return newSet;
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
      <PageTitle title="Social Hub" subtitle="Connect with friends and build your team." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Friends & Player Search */}
        <div className="lg:col-span-1 space-y-6">
          {/* Find Players */}
          <Card>
            <CardHeader>
              <CardTitle>Find Players</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePlayerSearch} className="flex gap-2">
                <Input 
                  placeholder="Search by name or email..." 
                  value={playerSearchTerm} 
                  onChange={(e) => setPlayerSearchTerm(e.target.value)}
                />
                <Button type="submit" size="icon" disabled={isLoadingPlayerSearch}>
                  {isLoadingPlayerSearch ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                </Button>
              </form>
              {playerSearchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold text-sm">Search Results:</h4>
                  <ul className="space-y-2">
                  {playerSearchResults.map(p => (
                      <li key={p.uid} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8"><AvatarImage src={p.photoURL || undefined} /><AvatarFallback>{getInitials(p.displayName)}</AvatarFallback></Avatar>
                          <span>{p.displayName}</span>
                        </div>
                        {determineRelationshipStatus(p.uid) === 'none' && (
                            <Button size="sm" variant="outline" onClick={() => handleSendFriendRequest(p)} disabled={isProcessingFriendAction === p.uid}>
                                {isProcessingFriendAction === p.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserPlus className="h-4 w-4" />}
                            </Button>
                        )}
                        {determineRelationshipStatus(p.uid) === 'friends' && <Badge variant="secondary">Friends</Badge>}
                        {determineRelationshipStatus(p.uid) === 'request_sent_by_me' && <Badge variant="outline">Request Sent</Badge>}
                        {determineRelationshipStatus(p.uid) === 'request_received_from_them' && <Badge variant="default">Request Received</Badge>}
                      </li>
                  ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Friends List */}
          <Card>
            <CardHeader>
              <CardTitle>Friends ({friends.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFriends ? <Loader2 className="mx-auto h-6 w-6 animate-spin"/> : friends.length > 0 ? (
                <ul className="space-y-2">
                  {friends.map(friend => (
                    <li key={friend.uid} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarImage src={friend.photoURL || undefined} /><AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback></Avatar>
                        <span>{friend.displayName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openFriendChat(friend)} className="relative">
                            <MessageSquare className="h-4 w-4" />
                            {unreadFriendMessageSenders.has(friend.uid) && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="icon" variant="destructive" disabled={isProcessingFriendAction === friend.uid}><UserMinus className="h-4 w-4"/></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Remove Friend?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to remove {friend.displayName} from your friends?</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveFriend(friend)}>Remove</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">You haven't added any friends yet.</p>}
            </CardContent>
          </Card>
          
          {/* Friend Requests */}
          {(incomingRequests.length > 0 || sentRequests.length > 0) && (
            <Card>
              <CardHeader><CardTitle>Friend Requests</CardTitle></CardHeader>
              <CardContent>
                {isLoadingIncomingRequests || isLoadingSentRequests ? <Loader2 className="mx-auto h-6 w-6 animate-spin"/> : (
                  <div className="space-y-4">
                    {incomingRequests.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Incoming ({incomingRequests.length})</h4>
                        <ul className="space-y-2">
                          {incomingRequests.map(req => (
                            <li key={req.uid} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                               <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8"><AvatarImage src={req.photoURL || undefined} /><AvatarFallback>{getInitials(req.displayName)}</AvatarFallback></Avatar>
                                <span>{req.displayName}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button size="icon" variant="default" onClick={() => handleAcceptFriendRequest(req)} disabled={isProcessingFriendAction === req.uid}>{isProcessingFriendAction === req.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserCheck className="h-4 w-4" />}</Button>
                                <Button size="icon" variant="destructive" onClick={() => handleDeclineFriendRequest(req)} disabled={isProcessingFriendAction === req.uid}><UserX className="h-4 w-4"/></Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                     {sentRequests.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Sent ({sentRequests.length})</h4>
                         <ul className="space-y-2">
                           {sentRequests.map(req => (
                            <li key={req.uid} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                               <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8"><AvatarImage src={req.photoURL || undefined} /><AvatarFallback>{getInitials(req.displayName)}</AvatarFallback></Avatar>
                                <span>{req.displayName}</span>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleCancelFriendRequest(req)} disabled={isProcessingFriendAction === req.uid}>
                                {isProcessingFriendAction === req.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Cancel'}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Column: Team & Chat */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Section */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>My Team</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTeam ? <Loader2 className="mx-auto h-6 w-6 animate-spin"/> : currentTeam ? (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-primary">{currentTeam.name}</h3>
                    <p className="text-sm text-muted-foreground">Leader: {currentTeam.leaderName}</p>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Members ({teamMembers.length})</h4>
                      <ul className="space-y-2">
                        {teamMembers.map(member => (
                          <li key={member.uid} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8"><AvatarImage src={member.photoURL || undefined} /><AvatarFallback>{getInitials(member.displayName)}</AvatarFallback></Avatar>
                                <span>{member.displayName}</span>
                            </div>
                            {user.uid === currentTeam.leaderUid && member.uid !== user.uid && (
                                <Button size="icon" variant="destructive" onClick={() => handleRemoveMember(member.uid)} disabled={isProcessingTeamAction || isProcessingFriendAction === member.uid}>{isProcessingFriendAction === member.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserMinus className="h-4 w-4"/>}</Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Separator />
                    
                    {user.uid === currentTeam.leaderUid && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Manage Team</h4>
                        <form onSubmit={addMemberForm.handleSubmit(handleSearchMember)} className="flex gap-2">
                            <Input {...addMemberForm.register("memberSearch")} placeholder="Search member to add..." disabled={isProcessingTeamAction} />
                            <Button type="submit" size="icon" disabled={isLoadingMemberSearch}><Search className="h-4 w-4"/></Button>
                        </form>
                        {memberSearchResults.length > 0 && (
                            <ul className="mt-2 space-y-2">
                                {memberSearchResults.map(p => (
                                    <li key={p.uid} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                                        <span>{p.displayName}</span>
                                        <Button size="sm" variant="default" onClick={() => confirmAddMember(p.uid)} disabled={isProcessingFriendAction === p.uid}>{isProcessingFriendAction === p.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Add'}</Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                         <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" className="w-full mt-4" disabled={isProcessingTeamAction}>Delete Team</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete Team?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the team. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTeam}>Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                     {user.uid !== currentTeam.leaderUid && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" className="w-full" disabled={isProcessingTeamAction}>Leave Team</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Leave Team?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to leave {currentTeam.name}?</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleLeaveTeam}>Leave</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     )}
                     <Button variant="outline" className="w-full" onClick={openTeamChat}>Team Chat</Button>

                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">You are not part of a team yet. Create one to start competing together!</p>
                    <form onSubmit={teamForm.handleSubmit(handleCreateTeam)} className="space-y-4">
                        <div>
                            <Label htmlFor="team-name">Team Name</Label>
                            <Input id="team-name" {...teamForm.register("name")} disabled={isProcessingTeamAction}/>
                            {teamForm.formState.errors.name && <p className="text-destructive text-xs mt-1">{teamForm.formState.errors.name.message}</p>}
                        </div>
                        <Button type="submit" disabled={isProcessingTeamAction} className="w-full">
                           {isProcessingTeamAction ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Users2 className="h-4 w-4 mr-2"/>}
                            Create Team
                        </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat Section */}
            <Card className="md:col-span-1 flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center justify-between">
                    <span>Chat</span>
                    {activeChatContext && (
                        <Button variant="ghost" size="icon" onClick={() => setActiveChatContext(null)}><X className="h-4 w-4"/></Button>
                    )}
                </CardTitle>
                <CardDescription>
                  {activeChatContext ? activeChatContext.displayName : "Select a friend or team to chat"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col min-h-0">
                <ScrollArea className="flex-grow h-64 pr-4 -mr-4">
                    {isLoadingChatMessages ? <Loader2 className="mx-auto my-auto h-6 w-6 animate-spin"/> : chatMessages.length > 0 ? (
                        <div className="space-y-4">
                            {chatMessages.map(msg => (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user.uid ? "justify-end" : "justify-start")}>
                                    {msg.senderId !== user.uid && <Avatar className="h-6 w-6"><AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback></Avatar>}
                                    <div className={cn("max-w-xs rounded-lg p-2 text-sm group relative", msg.senderId === user.uid ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                        <p className="font-bold text-xs">{msg.senderId === user.uid ? 'You' : msg.senderName}</p>
                                        <p>{msg.text}</p>
                                        <p className="text-xs opacity-70 mt-1">{msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : 'sending...'}</p>
                                        {msg.senderId === user.uid && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Delete message?</AlertDialogTitle></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMessage(msg.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-center">
                            <p className="text-muted-foreground">{activeChatContext ? 'No messages yet. Say hello!' : 'Chat is not selected.'}</p>
                        </div>
                    )}
                   <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>
              {activeChatContext && (
                <div className="p-4 border-t flex-shrink-0">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                        <Input placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} disabled={isSendingMessage} />
                        <Button type="submit" size="icon" disabled={isSendingMessage || !chatInput.trim()}>
                            {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                        </Button>
                    </form>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
