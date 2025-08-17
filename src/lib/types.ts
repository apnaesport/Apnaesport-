
import type { User as FirebaseUser } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";
import type { icons } from "lucide-react";

export type LucideIconName = keyof typeof icons;

export interface UserProfile extends Partial<FirebaseUser> {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
  isAdmin?: boolean;
  emailVerified: boolean;
  createdAt?: Timestamp;
  bio?: string;
  favoriteGameIds?: string[];
  streamingChannelUrl?: string;
  communityId?: string | null; // Added
  points?: number;
  wins?: number;
  kills?: number;
  deaths?: number;
}

export type Game = {
  id: string;
  name: string;
  iconUrl: string;
  bannerUrl?: string;
  dataAiHint?: string;
  isApiPowered?: boolean; 
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type TournamentStatus = "Upcoming" | "Live" | "Ongoing" | "Completed" | "Cancelled";

export type Participant = {
  id: string;
  name: string;
  avatarUrl?: string;
  gameUsername: string;
  inGameId: string;
  contactEmail?: string;
};

export type Match = {
  id: string;
  round: number;
  participants: [Participant | null, Participant | null];
  winner?: Participant | null;
  score?: string;
  startTime?: Date | Timestamp;
  status: "Pending" | "Live" | "Completed";
  streamUrl?: string;
  highlightUrl?: string;
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
  entryFee?: number;
  currency?: string;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  roomCode?: string;
  roomPassword?: string;
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
  entryFee?: number;
  currency?: string;
  sponsorName?: string;
  sponsorLogoUrl?: string;
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
  downloadAppLink?: string;
  defaultTheme?: string;
  basePlayerCount?: number;
  defaultCommunityLogoUrl?: string;
  defaultCommunityBannerUrl?: string;
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

export type SponsorshipRequestStatus = "New" | "Contacted" | "In Progress" | "Closed";

export interface SponsorshipRequest {
    id: string;
    brandName: string;
    contactName: string;
    email: string;
    additionalEmail?: string;
    phone?: string;
    sponsorshipType: 'tournament' | 'site-wide' | 'other';
    message: string;
    status: SponsorshipRequestStatus;
    createdAt: Timestamp;
}


// --- Community Types ---

export type CommunityRole = "Owner" | "Admin" | "Moderator" | "Member";

export interface CommunityMember {
    uid: string;
    displayName: string;
    avatarUrl?: string;
    role: CommunityRole;
    points: number;
    joinedAt: Timestamp;
}

export interface Community {
    id: string;
    name: string;
    tagline: string;
    description: string;
    ownerId: string;
    ownerName: string;
    gameId?: string | null;
    gameName?: string;
    logoUrl?: string;
    bannerUrl?: string;
    memberCount: number;
    level: number;
    points: number;
    socialLinks?: {
        youtube?: string;
        discord?: string;
        twitch?: string;
        instagram?: string;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type CommunityPostType = "Announcement" | "Media" | "General";

export interface CommunityPost {
    id: string;
    communityId: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string;
    type: CommunityPostType;
    title?: string;
    content: string;
    mediaUrl?: string; // For images or video clips
    likes: number;
    likedBy: string[]; // Array of UIDs
    createdAt: Timestamp;
}

// --- Creator Hub Types ---
export interface Creator {
    id: string;
    userId: string;
    name: string;
    avatarUrl?: string;
    channelUrl: string;
    tags: string;
    followers: string;
    votes: number;
    votedBy: string[];
    createdAt: Timestamp;
    dataAiHint?: string;
}

export interface CreatorApplication {
    id: string;
    userId: string;
    name: string;
    email: string;
    photoURL?: string;
    channelUrl: string;
    tags: string;
    message?: string;
    createdAt: Timestamp;
}
