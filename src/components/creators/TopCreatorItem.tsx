
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Creator } from "@/lib/types";

export interface TopCreatorItemProps {
    creator: Creator;
    rank: number;
    tier: 'gold' | 'silver' | 'bronze';
}

export function TopCreatorItem({ creator, rank, tier }: TopCreatorItemProps) {
    const tierStyles = {
        gold: "bg-yellow-400/20 text-yellow-400 border-yellow-500/30",
        silver: "bg-slate-400/20 text-slate-400 border-slate-500/30",
        bronze: "bg-orange-400/20 text-orange-400 border-orange-500/30",
    };

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
            <div className={cn(
                "flex-shrink-0 h-10 w-10 grid place-items-center rounded-lg font-bold text-lg border",
                tierStyles[tier]
            )}>
                {rank}
            </div>
            <Avatar className="h-10 w-10">
                <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint={creator.dataAiHint} />
                <AvatarFallback>{creator.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
             <div className="flex-grow">
                <p className="font-semibold text-foreground text-sm">{creator.name}</p>
                <p className="text-xs text-muted-foreground">{creator.tags} • {creator.followers} followers</p>
            </div>
        </div>
    );
}
