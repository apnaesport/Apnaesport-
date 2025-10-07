
import type { User as FirebaseUser } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";
import type { icons } from "lucide-react";

export type LucideIconName = keyof typeof icons;

export interface UnseenWin {
    id: string; // Unique ID for the win, e.g., `${tournamentId}-${rank}`
    tournamentId: string;
    tournamentName: string;
    rank: 1 | 2 | 3;
    prize: number;
}

export interface PremiumFeatures {
  verifiedBadge?: boolean;
  customBanners?: boolean;
  addSponsors?: boolean;
  customPrizes?: boolean;
  prioritySupport?: boolean;
}

export interface UserProfile extends Partial<FirebaseUser> {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  premiumPhotoURL?: string | null; // The URL for the premium avatar
  uid: string;
  isAdmin?: boolean;
  isPremium?: boolean;
  premiumSince?: Timestamp;
  premiumFeatures?: PremiumFeatures;
  hasReceivedPremiumBonus?: boolean;
  hasSeenPremiumPopup?: boolean; // New field for one-time welcome
  emailVerified: boolean;
  createdAt?: Timestamp;
  lastBonusClaimedAt?: Timestamp;
  lastNotificationCheck?: Timestamp; // For unread notifications
  bio?: string;
  favoriteGameIds?: string[];
  streamingChannelUrl?: string;
  communityId?: string | null;
  points: number;
  wins?: number;
  monthlyWins?: number;
  kills?: number;
  deaths?: number;
  apnaId?: string;
  unseenWins?: UnseenWin[];
}

export type PointTransaction = {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  type: 'credit' | 'debit';
  tournamentId?: string;
  createdAt: Timestamp;
}

export type Game = {
  id: string;
  name: string;
  iconUrl: string;
  bannerUrl?: string;
  dataAiHint?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  matchTypes?: string[];
  mapNames?: string[];
};

export type TournamentStatus = "Upcoming" | "Live" | "Ongoing" | "Completed" | "Cancelled";
export type TeamSize = "Solo" | "Duo" | "Squad";

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
  gameUsername: string;
  inGameId: string;
  teamId?: string; 
  teamName?: string;
};

export type Match = {
  id:string;
  round: number;
  participants: [Participant | null, Participant | null];
  winner?: Participant | null;
  score?: string;
  startTime?: Date | Timestamp;
  status: "Pending" | "Live" | "Completed";
  streamUrl?: string;
  highlightUrl?: string;
};

export type Winner = {
    rank: 1 | 2 | 3;
    participant: Participant;
    prize: number;
    teamId?: string;
    teamName?: string;
    kills?: number;
    deaths?: number;
};

export type PrizeDistribution = {
    first: number;
    second: number;
    third: number;
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
  prizePool: number; // This will now be the calculated total
  entryFee: number; 
  prizeDistribution?: PrizeDistribution;
  rules?: string;
  registrationInstructions?: string;
  matchType: string;
  mapName?: string;
  teamSize: TeamSize;
  matches?: Match[];
  featured?: boolean;
  organizer?: string;
  organizerId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  roomCode?: string;
  roomPassword?: string;
  winners?: Winner[];
  isQuickTournament?: boolean;
  communityId?: string;
  isMock?: boolean;
};

export type TournamentFormDataUI = {
  name: string;
  gameId: string;
  description: string;
  startDate: Date;
  status: TournamentStatus;
  maxParticipants: number;
  entryFee: number;
  prizeDistribution?: {
      first: number;
      second: number;
      third: number;
  };
  matchType: string;
  mapName?: string;
  teamSize: TeamSize;
  rules?: string;
  registrationInstructions?: string;
  featured?: boolean;
  bannerImageUrl?: string;
  bannerImageFile?: FileList; 
  sponsorName?: string;
  sponsorLogoUrl?: string;
  isMock?: boolean;
  mockParticipantCount?: number;
};


export type StatItem = {
  title: string;
  value: string | number;
  icon?: LucideIconName;
  change?: string;
};

export interface NavIndicator {
  text: string;
  enabled: boolean;
  color: 'primary' | 'destructive' | 'amber';
}

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
  defaultPremiumAvatarUrl?: string;
  showVideoSectionOnLanding?: boolean;
  landingPageVideoUrl?: string;
  updatedAt?: Timestamp;
  adsEnabled?: boolean;
  adKeyLeaderboard?: string;
  adKeySquare?: string;
  adKeySocialBar?: string;
  adFrequencyInLists?: number;
  geminiApiKey?: string;
  aeCoinLogoUrl?: string;
  navIndicators?: { [key: string]: NavIndicator };
}

export type NotificationType = "info" | "warning" | "success" | "error" | "announcement";
export type NotificationTarget = "all_users" | "specific_users" | "tournament_participants";

export interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
  targetUserId?: string; // For user-specific notifications
  tournamentId?: string; // For tournament-specific notifications
  createdAt: Timestamp;
}

export interface NotificationFormData {
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
  tournamentId?: string;
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

export interface Announcement {
    id: string;
    communityId: string;
    authorId: string;
    authorName: string;
    content: string;
    isAuto: boolean;
    createdAt: Timestamp;
    expiresAt?: Timestamp;
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

// --- Team Types ---
export interface TeamMember {
  uid: string;
  name: string;
  avatarUrl: string;
  role: 'Owner' | 'Member';
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: Timestamp;
}

export interface TeamInvite {
    id: string;
    teamId: string;
    teamName: string;
    fromId: string; // owner uid
    fromName: string;
    toId: string; // invited user uid
    status: 'pending' | 'accepted' | 'declined';
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
    followers: string; // Keep for now, but may phase out
    votes: number;
    votedBy: string[];
    createdAt: Timestamp;
    dataAiHint?: string;
    communityId?: string | null;
    communityName?: string | null;
}

export type CreatorApplicationStatus = "Pending" | "Approved" | "Rejected" | "Archived";

export interface CreatorApplication {
    id: string;
    userId: string;
    name: string; // User's real name
    creatorName: string; // Desired creator name
    logoUrl?: string; // Creator logo
    email: string;
    photoURL?: string;
    channelUrl: string;
    tags: string;
    message?: string;
    status: CreatorApplicationStatus;
    createdAt: Timestamp;
    communityId?: string;
}

// --- Premium Request Types ---
export type PremiumRequestStatus = "Pending" | "Approved" | "Rejected";

export interface PremiumRequest {
  id: string;
  userId: string;
  userName: string;
  userApnaId: string;
  message: string;
  status: PremiumRequestStatus;
  createdAt: Timestamp;
}
