
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "../ui/skeleton";
import { Swords, Gamepad2 } from "lucide-react";

export function LandingCTAButtons() {
    const { user, loading } = useAuth();

    if (loading) {
        return <Skeleton className="h-12 w-80 mx-auto rounded-md" />
    }

    if (user) {
        return (
             <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto text-lg shadow-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105">
                    <Link href="/tournaments"><Swords className="mr-2 h-5 w-5"/> Explore Tournaments</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-lg border-2 bg-transparent hover:bg-card/50 hover:text-white">
                    <Link href="/games"><Gamepad2 className="mr-2 h-5 w-5"/> Browse Games</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto text-lg shadow-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105">
                <Link href="/tournaments">Explore Tournaments</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-lg border-2 bg-transparent hover:bg-card/50 hover:text-white">
                <Link href="/auth/register">Join for Free</Link>
            </Button>
        </div>
    )
}
