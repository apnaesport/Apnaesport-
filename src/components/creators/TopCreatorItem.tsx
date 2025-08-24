
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Creator } from "@/lib/types";
import { Trophy } from "lucide-react";

export interface TopCreatorItemProps {
    creator: Creator;
    rank: number;
    tier: 'gold' | 'silver' | 'bronze';
}

export function TopCreatorItem({ creator, rank, tier }: TopCreatorItemProps) {
    const tierStyles = {
        gold: "text-yellow-400 border-yellow-500/30",
        silver: "text-slate-400 border-slate-500/30",
        bronze: "text-orange-400 border-orange-500/30",
    };

    return (
        <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent/50 transition-colors">
            <Trophy className={cn("h-6 w-6 shrink-0", tierStyles[tier])} />
            <Avatar className="h-10 w-10">
                <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint={creator.dataAiHint} />
                <AvatarFallback>{creator.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
             <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-foreground text-sm truncate">{creator.name}</p>
                <p className="text-xs text-muted-foreground">{creator.votes.toLocaleString()} Votes</p>
            </div>
        </div>
    );
}
