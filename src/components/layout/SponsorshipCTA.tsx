
"use client";

import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SponsorshipCTA() {

  // This component will now primarily be a styled button.
  // The complex form logic has been moved to a dedicated /contact or /sponsorship page if needed,
  // or could be put in a Dialog triggered by this button.
  
  // For now, this links to the contact page as a simple and effective CTA.
  return (
     <a href="/contact" className="w-full">
        <Button variant="default" className="w-full shadow-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105">
            <Handshake className="mr-2 h-5 w-5" />
            Partner With Us
        </Button>
    </a>
  );
}
