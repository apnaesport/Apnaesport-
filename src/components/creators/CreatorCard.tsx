
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";

export interface Creator {
    name: string;
    tags: string;
    followers: string;
    votes: string;
    avatarUrl: string;
    dataAiHint?: string;
}

interface CreatorCardProps {
    creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
    return (
        <Card className="hover:bg-accent/50 transition-colors duration-200 group hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10">
            <CardContent className="p-3 flex items-center gap-4">
                 <Avatar className="h-14 w-14 border-2 border-primary/50 group-hover:border-primary transition-all">
                    <AvatarImage src={creator.avatarUrl} alt={creator.name} data-ai-hint={creator.dataAiHint} />
                    <AvatarFallback>{creator.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <h4 className="font-semibold text-foreground">{creator.name}</h4>
                    <p className="text-xs text-muted-foreground">{creator.tags} • {creator.followers} followers</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                    <ArrowUp className="h-4 w-4"/>
                    <span>{creator.votes}</span>
                </div>
            </CardContent>
        </Card>
    );
}
