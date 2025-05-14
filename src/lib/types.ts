
import type { User as FirebaseUser } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";
import type { icons } from "lucide-react";

export type LucideIconName = keyof typeof icons;

export interface UserProfile extends FirebaseUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
  isAdmin?: boolean;
  createdAt?: Timestamp; 
  bio?: string; 
  favoriteGames?: string; 
  streamingChannelUrl?: string; 
}

export type Game = {
  id: string; 
  name: string;
  iconUrl: string; 
  bannerUrl?: string; 
  dataAiHint?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type TournamentStatus = "Upcoming" | "Live" | "Ongoing" | "Completed" | "Cancelled";

export type Participant = {
  id: string; 
  name: string;
  avatarUrl?: string;
};

export type Match = {
  id: string;
  round: number;
  participants: [Participant | null, Participant | null]; 
  winner?: Participant | null; 
  score?: string; 
  startTime?: Date | Timestamp; 
  status: "Pending" | "Live" | "Completed";
};

export type Tournament = {
  id: string; 
  name: string;
  gameId: string; 
  gameName: string; 
  gameIconUrl: string; 
  bannerImageUrl: string; 
  description: string;
  status: TournamentStatus;
  startDate: Date | Timestamp; 
  endDate?: Date | Timestamp;
  participants: Participant[];
  maxParticipants: number;
  prizePool?: string;
  rules?: string;
  registrationInstructions?: string;
  bracketType: "Single Elimination" | "Double Elimination" | "Round Robin";
  matches?: Match[];
  featured?: boolean;
  organizer?: string; 
  organizerId?: string; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  entryFee?: number; // New: Entry fee for the tournament
  currency?: string; // New: Currency for the entry fee (e.g., "USD", "INR")
};

export type TournamentFormDataUI = {
  name: string;
  gameId: string;
  description: string;
  startDate: Date;
  maxParticipants: number;
  prizePool?: string;
  bracketType: "Single Elimination" | "Double Elimination" | "Round Robin";
  rules?: string;
  registrationInstructions?: string;
  bannerImageFile?: FileList;
  bannerImageDataUri?: string;
  featured?: boolean;
  entryFee?: number; // New
  currency?: string; // New
};


export type StatItem = {
  title: string;
  value: string | number;
  icon?: LucideIconName;
  change?: string;
};

export interface SiteSettings {
  id?: string; 
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  defaultTheme?: string;
  updatedAt?: Timestamp;
}

export type NotificationType = "info" | "warning" | "success" | "error" | "announcement";
export type NotificationTarget = "all_users" | "specific_users" | "tournament_participants";

export interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
  createdAt: Timestamp;
}

export interface NotificationFormData {
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
}

