
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowUp, Loader2, Users } from "lucide-react";
import type { Creator } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { voteForCreatorInFirestore } from "@/lib/tournamentStore";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";


interface CreatorCardProps {
    creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [isVoting, setIsVoting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const hasVoted = user && creator.votedBy?.includes(user.uid);

    const handleVote = async (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent dialog from opening
        if (!user) {
            toast({ title: "Login Required", description: "You must be logged in to vote.", variant: "destructive"});
            return;
        }
        if (hasVoted) {
            toast({ title: "Already Voted", description: "You can only vote for a creator once." });
            return;
        }

        setIsVoting(true);
        try {
            await voteForCreatorInFirestore(creator.id, user.uid);
            toast({ title: "Vote Cast!", description: `Your vote for ${creator.name} has been counted.`});
        } catch (error: any) {
             toast({ title: "Vote Failed", description: error.message || "Could not cast your vote.", variant: "destructive"});
        } finally {
            setIsVoting(false);
        }
    }


    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
            <Card className="hover:bg-accent/50 transition-colors duration-200 group hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
                <CardContent className="p-3 flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/50 group-hover:border-primary transition-all">
                        <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint={creator.dataAiHint} />
                        <AvatarFallback>{creator.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                        <h4 className="font-semibold text-foreground truncate">{creator.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{creator.tags}</p>
                        {creator.communityName && (
                            <Link href={`/community/${creator.communityId}`} onClick={(e) => e.stopPropagation()} className="flex items-center text-xs text-primary hover:underline mt-1">
                                <Users className="h-3 w-3 mr-1" />
                                <span className="truncate">{creator.communityName}</span>
                            </Link>
                        )}
                    </div>
                    <Button 
                        size="sm"
                        variant={hasVoted ? "default" : "outline"}
                        className={cn(
                            "flex items-center gap-1 text-sm font-bold bg-primary/10 px-2 py-1 rounded-md",
                            hasVoted ? "border-primary text-primary" : "text-primary hover:bg-primary/20"
                        )}
                        onClick={handleVote}
                        disabled={isVoting || loading}
                        title={hasVoted ? "You have voted" : "Upvote this creator"}
                    >
                        {isVoting ? <Loader2 className="h-4 w-4 animate-spin"/> : <ArrowUp className="h-4 w-4"/>}
                        <span>{creator.votes}</span>
                    </Button>
                </CardContent>
            </Card>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>External Link</DialogTitle>
                <DialogDescription>
                    You are about to navigate to {creator.name}'s channel. Do you want to continue?
                </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button asChild>
                    <a href={creator.channelUrl} target="_blank" rel="noopener noreferrer" onClick={() => setIsDialogOpen(false)}>
                        Open Channel
                    </a>
                </Button>
            </div>
        </DialogContent>
        </Dialog>
    );
}

    