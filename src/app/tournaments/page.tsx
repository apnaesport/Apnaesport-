
"use client"; 

import { PageTitle } from "@/components/shared/PageTitle";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import type { Tournament } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Search, Filter, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; 
import { getTournamentsFromFirestore } from "@/lib/tournamentStore";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function AllTournamentsPage() {
  const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Record<Tournament["status"] | "all", boolean>>({
    "all": true,
    "Upcoming": false,
    "Live": false,
    "Ongoing": false,
    "Completed": false,
    "Cancelled": false,
  });

  const { user } = useAuth(); 
  const { toast } = useToast();

  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    try {
      const tournamentsFromDb = await getTournamentsFromFirestore();
      setAllTournaments(tournamentsFromDb);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      toast({ title: "Error", description: "Could not fetch tournaments.", variant: "destructive" });
      setAllTournaments([]); // Set to empty array on error
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  useEffect(() => {
    let newFilteredTournaments = allTournaments;

    if (searchTerm) {
      newFilteredTournaments = newFilteredTournaments.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.gameName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const activeStatusFilters = Object.entries(statusFilter)
      .filter(([_, isActive]) => isActive)
      .map(([status]) => status as Tournament["status"] | "all");
    
    if (!activeStatusFilters.includes("all") && activeStatusFilters.length > 0) {
      newFilteredTournaments = newFilteredTournaments.filter(tournament =>
        activeStatusFilters.includes(tournament.status)
      );
    }
    
    setFilteredTournaments(newFilteredTournaments);
  }, [searchTerm, statusFilter, allTournaments]);


  const handleStatusFilterChange = (status: Tournament["status"] | "all") => {
    setStatusFilter(prev => {
      const newState = { ...prev };
      if (status === "all") {
        Object.keys(newState).forEach(key => newState[key as keyof typeof newState] = false);
        newState.all = !prev.all; 
        if (!newState.all && !Object.values(newState).some(val => val)) { 
           newState.all = true;
        }
      } else {
        newState.all = false;
        newState[status] = !prev[status];
        if (!newState[status] && !Object.values(newState).filter((v, k) => Object.keys(newState)[k] !== 'all').some(val => val) ) {
          newState.all = true;
        }
      }
      return newState;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading tournaments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle 
        title="All Tournaments" 
        subtitle="Browse all active, upcoming, and completed tournaments."
        actions={
          user && ( 
            <Button asChild>
              <Link href="/tournaments/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Tournament
              </Link>
            </Button>
          )
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search tournaments by name or game..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" /> Filter by Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.keys(statusFilter).map((statusKey) => (
              <DropdownMenuCheckboxItem
                key={statusKey}
                checked={statusFilter[statusKey as keyof typeof statusFilter]}
                onCheckedChange={() => handleStatusFilterChange(statusKey as Tournament["status"] | "all")}
              >
                {statusKey.charAt(0).toUpperCase() + statusKey.slice(1).replace('_', ' ')}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-10">
          No tournaments match your criteria. Try adjusting filters or check back later.
        </p>
      )}
    </div>
  );
}
