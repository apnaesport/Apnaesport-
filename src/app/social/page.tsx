
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { LogIn, Users, UserPlus, UserMinus, Search, Shield, Loader2, Users2, Trash2, LogOutIcon, UserPlus2, UserCheck, UserX, Send, Ban, CheckCircle, XCircle, MessageCircle, X, MessageSquare, Lock } from "lucide-react"; // Added Lock
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
  // const { toast } = useToast();

  // const [playerSearchTerm, setPlayerSearchTerm] = useState("");
  // const [playerSearchResults, setPlayerSearchResults] = useState<UserProfile[]>([]);
  
  // const [friends, setFriends] = useState<UserProfile[]>([]);
  // const [incomingRequests, setIncomingRequests] = useState<UserProfile[]>([]);
  // const [sentRequests, setSentRequests] = useState<UserProfile[]>([]);
  
  // const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  // const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);

  // const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  // const [isLoadingIncomingRequests, setIsLoadingIncomingRequests] = useState(true);
  // const [isLoadingSentRequests, setIsLoadingSentRequests] = useState(true);
  // const [isLoadingPlayerSearch, setIsLoadingPlayerSearch] = useState(false);
  // const [isProcessingFriendAction, setIsProcessingFriendAction] = useState<string | null>(null);
  
  // const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  // const [isProcessingTeamAction, setIsProcessingTeamAction] = useState(false);
  // const [memberSearchTermState, setMemberSearchTermState] = useState(""); 
  // const [memberSearchResults, setMemberSearchResults] = useState<UserProfile[]>([]);
  // const [isLoadingMemberSearch, setIsLoadingMemberSearch] = useState(false);

  // const [activeChatContext, setActiveChatContext] = useState<ActiveChatContext | null>(null);
  // const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  // const [isLoadingChatMessages, setIsLoadingChatMessages] = useState(false);
  // const [chatInput, setChatInput] = useState("");
  // const [isSendingMessage, setIsSendingMessage] = useState(false);
  // const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // const [unreadFriendMessageSenders, setUnreadFriendMessageSenders] = useState<Set<string>>(new Set());
  // const friendChatUnsubscribersRef = useRef<Record<string, () => void>>({});


  // const teamForm = useForm<TeamFormData>({
  //   resolver: zodResolver(teamFormSchema),
  //   defaultValues: { name: "" },
  // });

  // const addMemberForm = useForm<{memberSearch: string}>({
  //   resolver: zodResolver(addMemberFormSchema),
  //   defaultValues: { memberSearch: "" },
  // });

  // const getInitials = (name: string | null | undefined) => {
  //   if (!name) return "??";
  //   return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  // };

  // const fetchSocialData = useCallback(async () => {
  //   if (!user) return;
  //   setIsLoadingFriends(true);
  //   setIsLoadingIncomingRequests(true);
  //   setIsLoadingSentRequests(true);
  //   try {
  //     const [friendProfiles, incomingProfiles, sentProfiles] = await Promise.all([
  //       Promise.all((user.friendUids || []).map(uid => getUserProfileFromFirestore(uid))),
  //       Promise.all((user.receivedFriendRequests || []).map(uid => getUserProfileFromFirestore(uid))),
  //       Promise.all((user.sentFriendRequests || []).map(uid => getUserProfileFromFirestore(uid))),
  //     ]);
  //     setFriends(friendProfiles.filter(p => p !== null) as UserProfile[]);
  //     setIncomingRequests(incomingProfiles.filter(p => p !== null) as UserProfile[]);
  //     setSentRequests(sentProfiles.filter(p => p !== null) as UserProfile[]);
  //   } catch (error) {
  //     console.error("Error fetching social data:", error);
  //     toast({ title: "Error", description: "Could not load your social connections.", variant: "destructive" });
  //   } finally {
  //     setIsLoadingFriends(false);
  //     setIsLoadingIncomingRequests(false);
  //     setIsLoadingSentRequests(false);
  //   }
  // }, [user, toast]);

  // const fetchUserTeam = useCallback(async () => {
  //   if (user && user.teamId) {
  //     setIsLoadingTeam(true);
  //     try {
  //       const team = await getTeamByIdFromFirestore(user.teamId);
  //       setCurrentTeam(team);
  //       if (team) {
  //         const memberProfiles = await Promise.all(
  //           team.memberUids.map(uid => getUserProfileFromFirestore(uid).then(p => p || {uid, displayName: 'Unknown User'} as UserProfile))
  //         );
  //         setTeamMembers(memberProfiles);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching team:", error);
  //       toast({ title: "Error", description: "Could not load your team details.", variant: "destructive" });
  //     } finally {
  //       setIsLoadingTeam(false);
  //     }
  //   } else if (user && !user.teamId) {
  //       const ledTeams = await getTeamsByUserIdFromFirestore(user.uid, true);
  //       if (ledTeams.length > 0) {
  //           setCurrentTeam(ledTeams[0]);
  //            const memberProfiles = await Promise.all(
  //               ledTeams[0].memberUids.map(uid => getUserProfileFromFirestore(uid).then(p => p || {uid, displayName: 'Unknown User'} as UserProfile))
  //           );
  //           setTeamMembers(memberProfiles);
  //       } else {
  //            setCurrentTeam(null);
  //            setTeamMembers([]);
  //       }
  //       setIsLoadingTeam(false);
  //   } else {
  //     setCurrentTeam(null);
  //     setTeamMembers([]);
  //     setIsLoadingTeam(false);
  //   }
  // }, [user, toast]);


  // useEffect(() => {
  //   if (user) {
  //     fetchSocialData();
  //     fetchUserTeam();
  //   }
  // }, [user, fetchSocialData, fetchUserTeam]);

  // useEffect(() => {
  //   if (!user || friends.length === 0) {
  //     Object.values(friendChatUnsubscribersRef.current).forEach(unsub => unsub());
  //     friendChatUnsubscribersRef.current = {};
  //     return;
  //   }

  //   const newUnsubscribers: Record<string, () => void> = {};

  //   friends.forEach(friend => {
  //     const chatId = getChatId(user.uid, friend.uid);
  //     if (friendChatUnsubscribersRef.current[chatId]) { 
  //       newUnsubscribers[chatId] = friendChatUnsubscribersRef.current[chatId];
  //       delete friendChatUnsubscribersRef.current[chatId]; 
  //       return;
  //     }

  //     newUnsubscribers[chatId] = getMessagesForChat(chatId, (messages) => {
  //       if (messages.length > 0) {
  //         const latestMessage = messages[messages.length - 1];
  //         if (latestMessage.senderId === friend.uid && activeChatContext?.targetEntity.uid !== friend.uid) {
  //           setUnreadFriendMessageSenders(prev => new Set(prev).add(friend.uid));
  //         }
  //       }
  //     });
  //   });

  //   Object.values(friendChatUnsubscribersRef.current).forEach(unsub => unsub());
  //   friendChatUnsubscribersRef.current = newUnsubscribers;

  //   return () => {
  //     Object.values(friendChatUnsubscribersRef.current).forEach(unsub => unsub());
  //     friendChatUnsubscribersRef.current = {};
  //   };
  // }, [user, friends, activeChatContext]);


  // useEffect(() => {
  //   if (activeChatContext && user) {
  //     setIsLoadingChatMessages(true);
  //     setChatMessages([]); 
  //     const unsubscribe = getMessagesForChat(activeChatContext.id, (messages) => {
  //       setChatMessages(messages);
  //       setIsLoadingChatMessages(false);
  //     });
  //     if (activeChatContext.type === 'friend') {
  //       setUnreadFriendMessageSenders(prev => {
  //         const newSet = new Set(prev);
  //         newSet.delete((activeChatContext.targetEntity as UserProfile).uid);
  //         return newSet;
  //       });
  //     }
  //     return () => unsubscribe(); 
  //   } else {
  //     setChatMessages([]); 
  //   }
  // }, [activeChatContext, user]);
  
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // }, [chatMessages]);


  // const handlePlayerSearch = async (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();
  //   if (!playerSearchTerm.trim() || !user) return;
  //   setIsLoadingPlayerSearch(true);
  //   setPlayerSearchResults([]);
  //   try {
  //     const results = await searchUsersByNameOrEmail(playerSearchTerm, user.uid);
  //     setPlayerSearchResults(results);
  //   } catch (error) {
  //     console.error("Error searching users:", error);
  //     toast({ title: "Search Error", description: "Could not perform user search.", variant: "destructive" });
  //   }
  //   setIsLoadingPlayerSearch(false);
  // };
  
  // const handleSendFriendRequest = async (targetUser: UserProfile) => {
  //   if (!user) return;
  //   setIsProcessingFriendAction(targetUser.uid);
  //   try {
  //     await sendFriendRequest(user.uid, targetUser.uid);
  //     toast({ title: "Request Sent!", description: `Friend request sent to ${targetUser.displayName}.` });
  //     await refreshUser(); 
  //     setPlayerSearchResults(prev => prev.map(u => u.uid === targetUser.uid ? {...u, relationshipStatus: "request_sent_by_me"} : u)); 
  //   } catch (error: any) {
  //     toast({ title: "Error", description: error.message || "Could not send friend request.", variant: "destructive" });
  //   }
  //   setIsProcessingFriendAction(null);
  // };

  // const handleAcceptFriendRequest = async (requester: UserProfile) => {
  //   if (!user) return;
  //   setIsProcessingFriendAction(requester.uid);
  //   try {
  //     await acceptFriendRequest(user.uid, requester.uid);
  //     toast({ title: "Friend Added!", description: `You are now friends with ${requester.displayName}.` });
  //     await refreshUser(); 
  //   } catch (error: any) {
  //     toast({ title: "Error", description: error.message || "Could not accept friend request.", variant: "destructive" });
  //   }
  //   setIsProcessingFriendAction(null);
  // };

  // const handleDeclineFriendRequest = async (requester: UserProfile) => {
  //   if (!user) return;
  //   setIsProcessingFriendAction(requester.uid);
  //   try {
  //     await declineFriendRequest(user.uid, requester.uid);
  //     toast({ title: "Request Declined", description: `Friend request from ${requester.displayName} declined.`, variant: "default" });
  //     await refreshUser();
  //   } catch (error: any) {
  //     toast({ title: "Error", description: error.message || "Could not decline friend request.", variant: "destructive" });
  //   }
  //   setIsProcessingFriendAction(null);
  // };
  
  // const handleCancelFriendRequest = async (targetUser: UserProfile) => {
  //   if (!user) return;
  //   setIsProcessingFriendAction(targetUser.uid);
  //   try {
  //     await cancelFriendRequest(user.uid, targetUser.uid);
  //     toast({ title: "Request Cancelled", description: `Friend request to ${targetUser.displayName} cancelled.`, variant: "default" });
  //     await refreshUser();
  //   } catch (error: any) {
  //     toast({ title: "Error", description: error.message || "Could not cancel friend request.", variant: "destructive" });
  //   }
  //   setIsProcessingFriendAction(null);
  // };

  // const handleRemoveFriend = async (friendToRemove: UserProfile) => {
  //   if (!user) return;
  //   setIsProcessingFriendAction(friendToRemove.uid);
  //   try {
  //     await removeFriend(user.uid, friendToRemove.uid);
  //     toast({ title: "Friend Removed", description: `${friendToRemove.displayName} has been removed from your friends.`, variant: "destructive" });
  //     if (activeChatContext?.type === 'friend' && activeChatContext.targetEntity.uid === friendToRemove.uid) {
  //       setActiveChatContext(null); 
  //     }
  //     await refreshUser();
  //   } catch (error: any) {
  //     toast({ title: "Error", description: error.message || "Could not remove friend.", variant: "destructive" });
  //   }
  //   setIsProcessingFriendAction(null);
  // };


  // const determineRelationshipStatus = (targetUserUid: string) => {
  //   if (!user) return "none";
  //   if (user.friendUids?.includes(targetUserUid)) return "friends";
  //   if (user.sentFriendRequests?.includes(targetUserUid)) return "request_sent_by_me";
  //   if (user.receivedFriendRequests?.includes(targetUserUid)) return "request_received_from_them";
  //   return "none";
  // };

  // const handleCreateTeam: SubmitHandler<TeamFormData> = async (data) => {
  //   if (!user) return;
  //   setIsProcessingTeamAction(true);
  //   try {
  //     const newTeamId = await createTeamInFirestore(data, user);
  //     await updateUserTeamInFirestore(user.uid, newTeamId); 
  //     toast({ title: "Team Created!", description: `Your team "${data.name}" has been created.` });
  //     await refreshUser(); 
  //     await fetchUserTeam(); 
  //     teamForm.reset();
  //   } catch (error: any) {
  //     console.error("Error creating team:", error);
  //     toast({ title: "Team Creation Failed", description: error.message || "Could not create team.", variant: "destructive" });
  //   }
  //   setIsProcessingTeamAction(false);
  // };

  // const handleSearchMember: SubmitHandler<{ memberSearch: string }> = async (data) => {
  //     if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
  //     if (!data.memberSearch.trim()) {
  //       setMemberSearchResults([]);
  //       return;
  //     }
  //     setIsLoadingMemberSearch(true);
  //     try {
  //       const results = await searchUsersByNameOrEmail(data.memberSearch, user.uid);
  //       const availableResults = results.filter(foundUser => 
  //           !currentTeam.memberUids.includes(foundUser.uid) && !foundUser.teamId 
  //       );
  //       setMemberSearchResults(availableResults);
  //        if(availableResults.length === 0 && results.length > 0) {
  //           toast({title: "Note", description: "Found users are already in your team or another team.", variant: "default"})
  //       } else if (availableResults.length === 0 && results.length === 0) {
  //           toast({title: "No Users Found", description: `No users found matching "${data.memberSearch}".`})
  //       }
  //     } catch (error) {
  //       toast({ title: "Search Error", description: "Could not search for members.", variant: "destructive" });
  //     }
  //     setIsLoadingMemberSearch(false);
  // };

  // const confirmAddMember = async (memberId: string) => {
  //   if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
  //   setIsProcessingTeamAction(true);
  //   setIsProcessingFriendAction(memberId); 
  //   try {
  //       await addMemberToTeamInFirestore(currentTeam.id, memberId);
  //       toast({title: "Member Added", description: "Player added to your team."});
  //       await fetchUserTeam(); 
  //       setMemberSearchTermState("");
  //       setMemberSearchResults([]);
  //       addMemberForm.reset();
  //   } catch (error: any) {
  //       toast({title: "Error Adding Member", description: error.message || "Could not add member.", variant: "destructive"})
  //   }
  //   setIsProcessingTeamAction(false);
  //   setIsProcessingFriendAction(null);
  // }

  // const handleRemoveMember = async (memberIdToRemove: string) => {
  //   if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
  //   if (memberIdToRemove === user.uid) {
  //       toast({title: "Action Not Allowed", description: "Leader cannot remove themselves. Delete the team instead or transfer leadership (feature not available).", variant: "destructive"});
  //       return;
  //   }
  //   setIsProcessingTeamAction(true);
  //   setIsProcessingFriendAction(memberIdToRemove);
  //   try {
  //       await removeMemberFromTeamInFirestore(currentTeam.id, memberIdToRemove);
  //       toast({title: "Member Removed", description: "Player removed from team."});
  //       await fetchUserTeam(); 
  //   } catch(error: any) {
  //       toast({title: "Error Removing Member", description: error.message || "Could not remove member.", variant: "destructive"});
  //   }
  //   setIsProcessingTeamAction(false);
  //   setIsProcessingFriendAction(null);
  // };

  // const handleLeaveTeam = async () => {
  //   if (!currentTeam || !user || currentTeam.leaderUid === user.uid) return; 
  //   setIsProcessingTeamAction(true);
  //   try {
  //       await removeMemberFromTeamInFirestore(currentTeam.id, user.uid);
  //       toast({title: "Left Team", description: `You have left ${currentTeam.name}.`});
  //       await refreshUser(); 
  //       await fetchUserTeam();
  //       if (activeChatContext?.type === 'team' && activeChatContext.id === currentTeam.id) {
  //           setActiveChatContext(null); 
  //       }
  //   } catch(error: any) {
  //       toast({title: "Error Leaving Team", description: error.message || "Could not leave team.", variant: "destructive"});
  //   }
  //   setIsProcessingTeamAction(false);
  // };

  // const handleDeleteTeam = async () => {
  //   if (!currentTeam || !user || user.uid !== currentTeam.leaderUid) return;
  //   setIsProcessingTeamAction(true);
  //   try {
  //       await deleteTeamFromFirestore(currentTeam.id, user.uid);
  //       toast({title: "Team Deleted", description: `Team ${currentTeam.name} has been deleted.`});
  //       if (activeChatContext?.type === 'team' && activeChatContext.id === currentTeam.id) {
  //           setActiveChatContext(null); 
  //       }
  //       await refreshUser(); 
  //       await fetchUserTeam();
  //   } catch (error: any) {
  //       toast({title: "Error Deleting Team", description: error.message || "Could not delete team.", variant: "destructive"});
  //   }
  //   setIsProcessingTeamAction(false);
  // };

  // const handleSendMessage = async () => {
  //   if (!user || !activeChatContext || !chatInput.trim()) return;
  //   setIsSendingMessage(true);
  //   try {
  //     await sendMessageToFirestore(activeChatContext.id, user.uid, user.displayName || "User", chatInput.trim());
  //     setChatInput("");
  //     if (activeChatContext.type === 'team' && currentTeam) {
  //       // Optionally update team's lastActivityAt, handled by sendMessageToFirestore if implemented there
  //     }
  //   } catch (error) {
  //     console.error("Error sending message:", error);
  //     toast({ title: "Message Error", description: "Could not send message.", variant: "destructive" });
  //   }
  //   setIsSendingMessage(false);
  // };

  // const handleDeleteMessage = async (messageId: string) => {
  //   if (!user || !activeChatContext) return;
  //   try {
  //     await deleteMessageFromFirestore(activeChatContext.id, messageId, user.uid);
  //     toast({ title: "Message Deleted", variant: "default" });
  //   } catch (error: any) {
  //     toast({ title: "Error Deleting Message", description: error.message, variant: "destructive" });
  //   }
  // };

  // const openFriendChat = (friend: UserProfile) => {
  //   if (!user) return;
  //   setActiveChatContext({
  //       type: 'friend',
  //       targetEntity: friend,
  //       id: getChatId(user.uid, friend.uid),
  //       displayName: friend.displayName || "Friend"
  //   });
  //   setUnreadFriendMessageSenders(prev => { 
  //       const newSet = new Set(prev);
  //       newSet.delete(friend.uid);
  //       return newSet;
  //   });
  // };

  // const openTeamChat = () => {
  //   if (!currentTeam) return;
  //   setActiveChatContext({
  //       type: 'team',
  //       targetEntity: currentTeam,
  //       id: currentTeam.id,
  //       displayName: `${currentTeam.name} (Team Chat)`
  //   });
  // };


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

  // Feature Locked View
  return (
    <div className="space-y-6 md:space-y-8">
      <PageTitle title="Social Hub" />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] text-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Lock className="mr-2 h-7 w-7 text-primary" />
              Feature Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The Social Hub is temporarily unavailable.
              <br />
              We're working on making it even better! Please check back later.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
