
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { LogIn, Users, UserPlus, UserMinus, Search, MessageSquare, Shield, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { UserProfile } from "@/lib/types";
import { searchUsersByNameOrEmail, addFriend, removeFriend, getUserProfileFromFirestore } from "@/lib/tournamentStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function SocialPage() {
  const { user, loading: authLoading, setUser: setAuthUser } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isUpdatingFriend, setIsUpdatingFriend] = useState<string | null>(null);

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
    }
  }, [user, fetchFriendsDetails]);

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim() || !user) return;
    setIsLoadingSearch(true);
    try {
      const results = await searchUsersByNameOrEmail(searchTerm, user.uid);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({ title: "Search Error", description: "Could not perform user search.", variant: "destructive" });
    }
    setIsLoadingSearch(false);
  };

  const handleAddFriend = async (targetUserId: string) => {
    if (!user) return;
    setIsUpdatingFriend(targetUserId);
    try {
      await addFriend(user.uid, targetUserId);
      toast({ title: "Friend Added!", description: "They are now on your friends list." });
      // Refresh user context to get updated friendUids
      const updatedCurrentUser = await getUserProfileFromFirestore(user.uid);
      if (updatedCurrentUser) setAuthUser(updatedCurrentUser); // This will trigger fetchFriendsDetails
      setSearchResults(prev => prev.filter(u => u.uid !== targetUserId)); // Optionally remove from search results
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
      const updatedCurrentUser = await getUserProfileFromFirestore(user.uid);
       if (updatedCurrentUser) setAuthUser(updatedCurrentUser); // This will trigger fetchFriendsDetails
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({ title: "Error", description: "Could not remove friend.", variant: "destructive" });
    }
    setIsUpdatingFriend(null);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-6 w-6 text-primary" />
              My Friends ({friends.length})
            </CardTitle>
            <CardDescription>Your connections on Apna Esport.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFriends ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : friends.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {friends.map(friend => (
                  <li key={friend.uid} className="flex items-center justify-between p-2 border rounded-md bg-secondary/30 hover:bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={friend.photoURL || ""} alt={friend.displayName || "User"} data-ai-hint="user avatar" />
                        <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{friend.displayName}</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend.uid)}
                      disabled={isUpdatingFriend === friend.uid}
                    >
                      {isUpdatingFriend === friend.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserMinus className="h-4 w-4" />}
                       <span className="ml-1 hidden sm:inline">Remove</span>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">You haven't added any friends yet. Use the search to find players!</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-6 w-6 text-primary" />
              Find Players
            </CardTitle>
            <CardDescription>Search for other players by name or email to connect.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearchUsers} className="flex gap-2 mb-6">
              <Input
                type="search"
                placeholder="Enter name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow"
                disabled={isLoadingSearch}
              />
              <Button type="submit" disabled={isLoadingSearch || !searchTerm.trim()}>
                {isLoadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-1 hidden sm:inline">Search</span>
              </Button>
            </form>

            {isLoadingSearch && (
                 <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            )}
            {!isLoadingSearch && searchResults.length > 0 && (
              <ul className="space-y-3 max-h-80 overflow-y-auto">
                {searchResults.map(foundUser => (
                  <li key={foundUser.uid} className="flex items-center justify-between p-2 border rounded-md bg-card hover:bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={foundUser.photoURL || ""} alt={foundUser.displayName || "User"} data-ai-hint="user avatar" />
                        <AvatarFallback>{getInitials(foundUser.displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{foundUser.displayName}</span>
                        <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                      </div>
                    </div>
                    {!isFriend(foundUser.uid) ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAddFriend(foundUser.uid)}
                        disabled={isUpdatingFriend === foundUser.uid}
                      >
                        {isUpdatingFriend === foundUser.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        <span className="ml-1 hidden sm:inline">Add Friend</span>
                      </Button>
                    ) : (
                      <span className="text-sm text-green-500">Already Friends</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!isLoadingSearch && searchResults.length === 0 && searchTerm && (
              <p className="text-muted-foreground text-center">No users found matching your search.</p>
            )}
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="hover:shadow-lg transition-shadow opacity-50 cursor-not-allowed">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-6 w-6 text-primary" />
              Teams
            </CardTitle>
            <CardDescription>Create or join teams to compete together.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Team functionality is under development. Soon you'll be able to create teams, manage rosters, and enter team-based tournaments.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow opacity-50 cursor-not-allowed">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-6 w-6 text-primary" />
              Discussions
            </CardTitle>
            <CardDescription>Chat with participants in tournaments or discuss strategies.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Tournament chat and general discussion forums are planned for a future update.</p>
          </CardContent>
        </Card>
       </div>

       <div className="text-center mt-12">
            <p className="text-lg text-muted-foreground">More social features are coming soon to Apna Esport!</p>
        </div>
    </div>
  );
}
