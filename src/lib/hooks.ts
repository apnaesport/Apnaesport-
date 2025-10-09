

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getGamesFromFirestore,
  getTournamentsFromFirestore,
  getAllUsersFromFirestore,
  getSiteSettingsFromFirestore,
  getCreatorApplicationsFromFirestore,
  getCreatorsFromFirestore,
  getNotificationsFromFirestore,
  getSponsorshipRequestsFromFirestore,
  getCommunitiesFromFirestore,
  getPointTransactions,
  isDailyBonusAvailable,
  getTopPlayersByMonthlyWins,
  getCommunityMembers,
  getGameDetails,
  getPremiumRequestsFromFirestore,
  getUserAchievements,
} from "./tournamentStore";

// --- React Query Hooks for Firestore ---

export function useGames() {
  return useQuery({
    queryKey: ["games"],
    queryFn: () => getGamesFromFirestore(),
  });
}

export function useGameDetails(gameId: string) {
    return useQuery({
        queryKey: ['game', gameId],
        queryFn: () => getGameDetails(gameId),
        enabled: !!gameId,
    });
}

export function useTournaments(queryParams: any = {}) {
  return useQuery({
    queryKey: ["tournaments", queryParams],
    queryFn: () => getTournamentsFromFirestore(queryParams),
  });
}

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: () => getAllUsersFromFirestore(),
    })
}

export function usePremiumUsers() {
    return useQuery({
        queryKey: ['users', 'premium'],
        queryFn: async () => {
            const allUsers = await getAllUsersFromFirestore();
            return allUsers.filter(user => user.isPremium);
        },
    });
}

export function useSiteSettings() {
    return useQuery({
        queryKey: ['siteSettings'],
        queryFn: () => getSiteSettingsFromFirestore(),
    });
}

export function useCreatorApplications() {
    return useQuery({
        queryKey: ['creatorApplications'],
        queryFn: () => getCreatorApplicationsFromFirestore(),
    });
}

export function useCreators() {
    return useQuery({
        queryKey: ['creators'],
        queryFn: () => getCreatorsFromFirestore(),
    });
}

export function useNotifications(target?: any, userId?: string) {
    return useQuery({
        queryKey: ['notifications', { target, userId }],
        queryFn: () => getNotificationsFromFirestore(target, userId),
        enabled: !!userId, // Only run if userId is available
    });
}

export function useSponsorshipRequests() {
    return useQuery({
        queryKey: ['sponsorshipRequests'],
        queryFn: () => getSponsorshipRequestsFromFirestore(),
    });
}

export function usePremiumRequests() {
    return useQuery({
        queryKey: ['premiumRequests'],
        queryFn: () => getPremiumRequestsFromFirestore(),
    });
}

export function useCommunities(excludeId?: string) {
    return useQuery({
        queryKey: ['communities', { excludeId }],
        queryFn: () => getCommunitiesFromFirestore(excludeId),
    });
}

export function useCommunityMembers(communityId: string) {
    return useQuery({
        queryKey: ['communityMembers', communityId],
        queryFn: () => getCommunityMembers(communityId),
        enabled: !!communityId,
    });
}

export function usePointTransactions(userId: string) {
    return useQuery({
        queryKey: ['pointTransactions', userId],
        queryFn: () => getPointTransactions(userId),
        enabled: !!userId,
    });
}

export function useDailyBonusStatus(userId: string) {
    return useQuery({
        queryKey: ['dailyBonus', userId],
        queryFn: () => isDailyBonusAvailable(userId),
        enabled: !!userId,
    });
}

export function useLeaderboard(count: number) {
    return useQuery({
        queryKey: ['leaderboard', count],
        queryFn: () => getTopPlayersByMonthlyWins(count),
    });
}

export function useUserAchievements(userId: string) {
    return useQuery({
        queryKey: ['achievements', userId],
        queryFn: () => getUserAchievements(userId),
        enabled: !!userId,
    })
}
