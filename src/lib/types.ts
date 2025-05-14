
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
  // Add any other custom user properties
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

// This will be used in the create tournament form
export type TournamentFormDataUI = {
  name: string;
  gameId: string;
  description: string;
  startDate: Date; // Client-side form uses Date object
  maxParticipants: number;
  prizePool?: string;
  bracketType: "Single Elimination" | "Double Elimination" | "Round Robin";
  rules?: string;
  registrationInstructions?: string;
  bannerImageFile?: FileList; // For handling the file input
  bannerImageDataUri?: string; // For storing the Data URL of the image
};


export type StatItem = {
  title: string;
  value: string | number;
  icon?: LucideIconName; 
  change?: string; // e.g., "+5%"
};

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  defaultTheme?: string; // Example: "dark" or "light"
}

export type NotificationType = "info" | "warning" | "success" | "error" | "announcement";
export type NotificationTarget = "all_users" | "specific_users" | "tournament_participants"; // Add more as needed

export interface NotificationMessage {
  id: string; // Firestore document ID
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
  // specificUserIds?: string[]; // For 'specific_users'
  // tournamentId?: string; // For 'tournament_participants'
  createdAt: Timestamp; // Timestamp of when the notification was created/sent
  // isRead?: boolean; // If we implement per-user read status
}

export interface NotificationFormData {
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
}
