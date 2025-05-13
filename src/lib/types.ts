import type { User as FirebaseUser } from "firebase/auth";

export interface UserProfile extends FirebaseUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
  isAdmin?: boolean;
  // Add any other custom user properties
}

export type Game = {
  id: string;
  name: string;
  iconUrl: string; // URL to game icon/logo
  bannerUrl?: string; // Optional banner for game page
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
  participants: [Participant | null, Participant | null]; // Can be null if BYE
  winner?: Participant | null; // Winner of the match
  score?: string; // e.g., "2-1"
  startTime?: Date;
  status: "Pending" | "Live" | "Completed";
};

export type Tournament = {
  id: string;
  name: string;
  gameId: string; // Reference to Game
  gameName: string; // Denormalized for easy display
  gameIconUrl: string; // Denormalized
  bannerImageUrl: string;
  description: string;
  status: TournamentStatus;
  startDate: Date;
  endDate?: Date;
  participants: Participant[];
  maxParticipants: number;
  prizePool?: string;
  rules?: string;
  bracketType: "Single Elimination" | "Double Elimination" | "Round Robin";
  matches?: Match[]; // Embedded or fetched separately
  featured?: boolean;
  organizer?: string; // User ID or name
};

export type StatItem = {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  change?: string; // e.g., "+5%"
};
