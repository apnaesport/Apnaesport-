
"use client";

import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SponsorshipForm } from "./SponsorshipForm"; // We will create this component

export function SponsorshipCTA() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full shadow-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 transition-all duration-300 transform hover:scale-105">
            <Handshake className="mr-2 h-5 w-5" />
            Partner With Us
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sponsorship & Partnership Inquiry</DialogTitle>
          <DialogDescription>
            We're excited to partner with you. Please fill out the form below and we'll be in touch.
          </DialogDescription>
        </DialogHeader>
        <SponsorshipForm />
      </DialogContent>
    </Dialog>
  );
}
