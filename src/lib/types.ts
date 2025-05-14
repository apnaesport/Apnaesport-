
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
  createdAt?: Timestamp; // Added for user creation date
}

export type Game = {
  id: string; // Firestore document ID
  name: string;
  iconUrl: string; // URL to game icon/logo or Data URL
  bannerUrl?: string; // Optional banner for game page or Data URL
  dataAiHint?: string; // For AI image generation hints
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type TournamentStatus = "Upcoming" | "Live" | "Ongoing" | "Completed" | "Cancelled";

export type Participant = {
  id: string; // User UID
  name: string;
  avatarUrl?: string;
};

export type Match = {
  id: string;
  round: number;
  participants: [Participant | null, Participant | null]; // Can be null if BYE
  winner?: Participant | null; // Winner of the match
  score?: string; // e.g., "2-1"
  startTime?: Date | Timestamp; // Allow both for easier handling
  status: "Pending" | "Live" | "Completed";
};

export type Tournament = {
  id: string; // Firestore document ID
  name: string;
  gameId: string; // Reference to Game ID in Firestore
  gameName: string; // Denormalized for easy display
  gameIconUrl: string; // Denormalized
  bannerImageUrl: string; // URL or Data URL
  description: string;
  status: TournamentStatus;
  startDate: Date | Timestamp; // Store as Timestamp in Firestore, use Date in app
  endDate?: Date | Timestamp;
  participants: Participant[];
  maxParticipants: number;
  prizePool?: string;
  rules?: string;
  registrationInstructions?: string;
  bracketType: "Single Elimination" | "Double Elimination" | "Round Robin";
  matches?: Match[];
  featured?: boolean;
  organizer?: string; // User display name
  organizerId?: string; // UID of the user who created it
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
};


export type StatItem = {
  title: string;
  value: string | number;
  icon?: LucideIconName; 
  change?: string; 
};

export interface SiteSettings {
  id?: string; // Typically "global" or a fixed ID
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

