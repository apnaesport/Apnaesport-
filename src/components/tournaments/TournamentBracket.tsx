
"use client";

import type { Tournament, Match } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldQuestion } from "lucide-react";

interface TournamentBracketProps {
  tournament: Tournament;
}

// This is a VERY simplified placeholder. Real bracket rendering is complex.
export function TournamentBracket({ tournament }: TournamentBracketProps) {
  const { matches, bracketType, participants } = tournament;

  if (!matches || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-lg min-h-[300px] bg-muted/20">
        <ShieldQuestion className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Bracket Not Available Yet</h3>
        <p className="text-muted-foreground">
          The tournament bracket will be generated once registrations close or the tournament starts.
          <br />
          Check back soon!
        </p>
      </div>
    );
  }

  // Group matches by round for rendering
  const rounds: { [key: number]: Match[] } = {};
  matches.forEach(match => {
    if (!rounds[match.round]) {
      rounds[match.round] = [];
    }
    rounds[match.round].push(match);
  });

  return (
    <ScrollArea className="w-full h-[500px] p-1"> {/* Added padding for scrollbar */}
      <div className="flex space-x-8 min-w-max">
        {Object.entries(rounds).map(([roundNumber, roundMatches]) => (
          <div key={roundNumber} className="flex flex-col space-y-4 min-w-[250px]">
            <h4 className="text-lg font-semibold text-center text-primary">Round {roundNumber}</h4>
            {roundMatches.map((match) => (
              <Card key={match.id} className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm">Match {match.id.slice(-4)}</CardTitle>
                  <CardDescription className="text-xs">{match.status} {match.score ? `(${match.score})`: ''}</CardDescription>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <div className={`flex justify-between items-center p-2 rounded ${match.winner === match.participants[0] && match.participants[0] !== null ? 'bg-green-500/20 font-bold' : 'bg-secondary/50'}`}>
                    <span>{match.participants[0]?.name || "BYE / TBD"}</span>
                    {/* Placeholder for score part if needed */}
                  </div>
                  <div className="text-center text-xs text-muted-foreground">vs</div>
                  <div className={`flex justify-between items-center p-2 rounded ${match.winner === match.participants[1] && match.participants[1] !== null ? 'bg-green-500/20 font-bold' : 'bg-secondary/50'}`}>
                    <span>{match.participants[1]?.name || "BYE / TBD"}</span>
                     {/* Placeholder for score part if needed */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
