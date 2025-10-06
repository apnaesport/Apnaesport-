
"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogIn, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { Team } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createTeamInFirestore } from "@/lib/tournamentStore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Placeholder for now
const TeamCard = ({ team }: { team: Team }) => (
    <div className="border p-4 rounded-lg">
        <h3 className="font-bold">{team.name}</h3>
        <p>Owner: {team.members.find(m => m.role === 'Owner')?.name}</p>
        <p>{team.members.length} / 4 members</p>
    </div>
);

export default function TeamsPage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isCreatingTeam, setIsCreatingTeam] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [teamName, setTeamName] = useState("");
    
    // In a real app, you would fetch teams here.
    // For now, we'll just use a placeholder.

    const canCreateTeam = teams.length < 2;

    const handleCreateTeam = async () => {
        if (!user || !teamName.trim() || !canCreateTeam) return;

        setIsCreatingTeam(true);
        try {
            await createTeamInFirestore(teamName, user);
            toast({ title: "Team Created!", description: `Your team "${teamName}" has been created.` });
            // Here you would refetch the teams list
            setIsCreateDialogOpen(false);
            setTeamName("");
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not create team.", variant: "destructive" });
        } finally {
            setIsCreatingTeam(false);
        }
    };
    
    if(loading) {
        return <Loader2 className="h-16 w-16 animate-spin text-primary" />
    }

    if(!user) {
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

            {teams.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teams.map(team => <TeamCard key={team.id} team={team} />)}
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">No Teams Yet</h3>
                    <p className="text-muted-foreground mt-2">You haven't created or joined any teams. Create one to get started!</p>
                </div>
            )}
        </div>
    );
}

