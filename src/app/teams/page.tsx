

"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogIn, Loader2, Users, Send, Check, X, Copy, Share2, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import type { Team, TeamInvite, UserProfile } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
    createTeamInFirestore, 
    getUserTeams,
    sendTeamInvite,
    getUserTeamInvites,
    respondToTeamInvite,
    removePlayerFromTeam,
    updateTeamNameInFirestore,
    deleteTeamFromFirestore
} from "@/lib/tournamentStore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdsterraBlock } from "@/components/ads/AdsterraBlock";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function TeamsPage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [invites, setInvites] = useState<TeamInvite[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTeamForAction, setSelectedTeamForAction] = useState<Team | null>(null);
    const [teamName, setTeamName] = useState("");
    const [inviteeApnaId, setInviteeApnaId] = useState("");
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);
    const [isDeletingTeam, setIsDeletingTeam] = useState(false);


    const canCreateTeam = teams.length < 2;

    const fetchTeamData = useCallback(async (uid: string) => {
        setIsDataLoading(true);
        try {
            const [userTeams, userInvites] = await Promise.all([
                getUserTeams(uid),
                getUserTeamInvites(uid)
            ]);
            setTeams(userTeams);
            setInvites(userInvites.filter(inv => inv.status === 'pending'));
        } catch (error) {
            console.error("Error fetching team data:", error);
            toast({ title: "Error", description: "Could not fetch your team information.", variant: "destructive" });
        } finally {
            setIsDataLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (user && !loading) {
            fetchTeamData(user.uid);
        } else if (!user && !loading) {
            setIsDataLoading(false);
        }
    }, [user, loading, fetchTeamData]);

    const handleCreateTeam = async () => {
        if (!user || !teamName.trim() || !canCreateTeam) return;
        setIsCreatingTeam(true);
        try {
            await createTeamInFirestore(teamName, user);
            toast({ title: "Team Created!", description: `Your team "${teamName}" has been created.` });
            await fetchTeamData(user.uid);
            setIsCreateDialogOpen(false);
            setTeamName("");
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not create team.", variant: "destructive" });
        } finally {
            setIsCreatingTeam(false);
        }
    };
    
    const handleSendInvite = async () => {
        if (!user || !inviteeApnaId.trim() || !selectedTeamForAction) return;
        setIsSendingInvite(true);
        try {
            await sendTeamInvite(selectedTeamForAction, inviteeApnaId, user);
            toast({ title: "Invite Sent!", description: `Invitation sent to user ${inviteeApnaId}.` });
            setIsInviteDialogOpen(false);
            setInviteeApnaId("");
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not send invite.", variant: "destructive" });
        } finally {
            setIsSendingInvite(false);
        }
    };
    
    const handleInviteResponse = async (inviteId: string, response: 'accepted' | 'declined') => {
        if (!user) return;
        try {
            await respondToTeamInvite(inviteId, response, user);
            toast({ title: `Invite ${response}!`, description: `You have ${response} the team invitation.`});
            await fetchTeamData(user.uid);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not process your response.", variant: "destructive" });
        }
    }
    
    const handleRemovePlayer = async (teamId: string, player: UserProfile) => {
        if (!user || !confirm(`Are you sure you want to remove ${player.displayName} from the team?`)) return;
        try {
            await removePlayerFromTeam(teamId, player);
            toast({ title: "Player Removed", description: `${player.displayName} has been removed from the team.` });
            await fetchTeamData(user.uid);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not remove player.", variant: "destructive" });
        }
    }
    
    const handleUpdateTeamName = async () => {
        if (!selectedTeamForAction || !teamName.trim()) return;
        setIsUpdatingTeam(true);
        try {
            await updateTeamNameInFirestore(selectedTeamForAction.id, teamName);
            toast({ title: "Team Updated", description: "Team name has been changed." });
            await fetchTeamData(user.uid);
            setIsEditDialogOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not update team name.", variant: "destructive" });
        } finally {
            setIsUpdatingTeam(false);
        }
    }

    const handleDeleteTeam = async () => {
        if (!selectedTeamForAction) return;
        setIsDeletingTeam(true);
        try {
            await deleteTeamFromFirestore(selectedTeamForAction.id);
            toast({ title: "Team Deleted", description: `Team "${selectedTeamForAction.name}" has been deleted.` });
            await fetchTeamData(user.uid);
        } catch(error: any) {
            toast({ title: "Error", description: error.message || "Could not delete team.", variant: "destructive" });
        } finally {
            setIsDeletingTeam(false);
        }
    }


    if (loading || isDataLoading) {
        return (
             <div className="space-y-8">
                <PageTitle title="My Teams" subtitle="Create and manage your esports teams."/>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4">
                <PageTitle title="Access Denied" subtitle="You need to be logged in to manage your teams." />
                <LogIn className="h-16 w-16 text-primary my-6" />
                <Button asChild size="lg">
                    <Link href="/auth/login?redirect=/teams">Login to View Teams</Link>
                </Button>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <PageTitle
                title="My Teams"
                subtitle="Create and manage your esports teams."
                actions={
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button disabled={!canCreateTeam}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create a New Team</DialogTitle>
                                <DialogDescription>Give your new team a name to get started.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-2">
                                <Label htmlFor="teamName">Team Name</Label>
                                <Input 
                                    id="teamName"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="e.g., The Champions"
                                    disabled={isCreatingTeam}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateTeam} disabled={isCreatingTeam || !teamName.trim()}>
                                    {isCreatingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            <AdsterraBlock format="leaderboard" />

            {invites.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Team Invitations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {invites.map(invite => (
                            <div key={invite.id} className="p-3 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <p className="font-semibold">{invite.fromName}</p>
                                    <p className="text-sm text-muted-foreground">has invited you to join <span className="font-medium text-primary">{invite.teamName}</span>.</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button size="sm" variant="destructive" onClick={() => handleInviteResponse(invite.id, 'declined')}><X className="h-4 w-4"/> Decline</Button>
                                    <Button size="sm" onClick={() => handleInviteResponse(invite.id, 'accepted')}><Check className="h-4 w-4"/> Accept</Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {teams.length > 0 ? (
                 <div className="space-y-6">
                    {teams.map(team => (
                        <Card key={team.id}>
                            <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                <div>
                                    <CardTitle className="text-2xl">{team.name}</CardTitle>
                                    <CardDescription>Owner: {team.members.find(m => m.role === 'Owner')?.name}</CardDescription>
                                </div>
                                {team.ownerId === user.uid && (
                                     <div className="flex gap-2">
                                        <Dialog open={isInviteDialogOpen && selectedTeamForAction?.id === team.id} onOpenChange={(open) => { if (!open) setSelectedTeamForAction(null); setIsInviteDialogOpen(open); }}>
                                            <DialogTrigger asChild>
                                                <Button onClick={() => setSelectedTeamForAction(team)}>
                                                    <Send className="mr-2 h-4 w-4" /> Invite
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Invite to {team.name}</DialogTitle>
                                                    <DialogDescription>Enter the Apna ID of the player you want to invite.</DialogDescription>
                                                </DialogHeader>
                                                <div className="py-4 space-y-2">
                                                    <Label htmlFor="apnaId">Player's Apna ID</Label>
                                                    <Input id="apnaId" value={inviteeApnaId} onChange={e => setInviteeApnaId(e.target.value)} placeholder="e.g., AE123456" disabled={isSendingInvite}/>
                                                </div>
                                                <DialogFooter>
                                                    <DialogClose asChild><Button variant="ghost" disabled={isSendingInvite}>Cancel</Button></DialogClose>
                                                    <Button onClick={handleSendInvite} disabled={isSendingInvite || !inviteeApnaId.trim()}>
                                                        {isSendingInvite && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Send Invite
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        <Dialog open={isEditDialogOpen && selectedTeamForAction?.id === team.id} onOpenChange={(open) => { if (!open) setSelectedTeamForAction(null); setIsEditDialogOpen(open); }}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" onClick={() => { setSelectedTeamForAction(team); setTeamName(team.name); }}>
                                                    <Edit className="mr-2 h-4 w-4"/> Manage
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Manage {team.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="py-4 space-y-4">
                                                    <div>
                                                        <Label htmlFor="editTeamName">Team Name</Label>
                                                        <Input id="editTeamName" value={teamName} onChange={e => setTeamName(e.target.value)} disabled={isUpdatingTeam}/>
                                                    </div>
                                                     <Button onClick={handleUpdateTeamName} disabled={isUpdatingTeam || !teamName.trim()}>
                                                        {isUpdatingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Name
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" className="w-full">
                                                                <Trash2 className="mr-2 h-4 w-4"/> Delete Team
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will permanently delete the team "{team.name}". This action cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={handleDeleteTeam}>Delete Team</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                     </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <h4 className="font-semibold mb-2">Members ({team.members.length} / 4)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {team.members.map(member => (
                                        <div key={member.uid} className="flex items-center justify-between p-3 border rounded-lg bg-secondary/30">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={member.avatarUrl} alt={member.name}/>
                                                    <AvatarFallback>{member.name.substring(0,2)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.role}</p>
                                                </div>
                                            </div>
                                            {team.ownerId === user.uid && member.role !== 'Owner' && (
                                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleRemovePlayer(team.id, member as UserProfile)}>
                                                    <X className="h-4 w-4"/>
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                 <Button variant="outline" onClick={() => {
                                     navigator.clipboard.writeText(`${window.location.origin}/teams/join?teamId=${team.id}`);
                                     toast({ title: 'Link Copied!', description: 'Invite link copied to clipboard.' });
                                 }}>
                                    <Share2 className="mr-2 h-4 w-4" /> Share Invite Link
                                 </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Teams Yet</h3>
                    <p className="text-muted-foreground mt-2">You haven't created or joined any teams. Create one to get started!</p>
                </div>
            )}

            <AdsterraBlock format="leaderboard" />
        </div>
    );
}

