

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
  orderBy,
  limit,
  type QueryConstraint,
  setDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  onSnapshot, // For real-time chat messages
  Query
} from "firebase/firestore";
import { db } from "./firebase";
import type { Tournament, Game, Participant, Match, NotificationMessage, NotificationFormData, NotificationTarget, SiteSettings, UserProfile, Team, TeamFormData, ChatMessage, TournamentStatus, SponsorshipRequest } from './types';

const GAMES_COLLECTION = "games";
const TOURNAMENTS_COLLECTION = "tournaments";
const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";
const SETTINGS_COLLECTION = "settings";
const GLOBAL_SETTINGS_ID = "global";
const TEAMS_COLLECTION = "teams";
const CHATS_COLLECTION = "chats";
const MESSAGES_SUBCOLLECTION = "messages";
const SPONSORSHIPS_COLLECTION = "sponsorships";


const getTournamentStatus = (tournament: Omit<Tournament, 'id' | 'status'> & { startDate: Date, endDate?: Date }): TournamentStatus => {
    const now = new Date();
    const startTime = tournament.startDate.getTime();
    const endTime = tournament.endDate ? tournament.endDate.getTime() : null;

    if (endTime && now.getTime() > endTime) {
        return "Completed";
    }
    if (now.getTime() >= startTime) {
        return "Live";
    }
    return "Upcoming";
};


// --- Game Functions ---

export const addGameToFirestore = async (gameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, GAMES_COLLECTION), {
    ...gameData,
    iconUrl: gameData.iconUrl || `https://placehold.co/40x40.png?text=${(gameData.name || "G").substring(0,2)}`,
    bannerUrl: gameData.bannerUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(gameData.name || "Game Banner")}`,
    dataAiHint: gameData.dataAiHint || gameData.name.toLowerCase().split(" ").slice(0,2).join(" "),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getGamesFromFirestore = async (): Promise<Game[]> => {
  const gamesSnapshot = await getDocs(query(collection(db, GAMES_COLLECTION), orderBy("name", "asc")));
  return gamesSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      iconUrl: data.iconUrl || `https://placehold.co/40x40.png?text=${(data.name || "G").substring(0,2)}`,
      bannerUrl: data.bannerUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(data.name || "Game Banner")}`,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : undefined,
    } as Game;
  });
};

export const getGameByIdFromFirestore = async (gameId: string): Promise<Game | undefined> => {
  if (!gameId) return undefined;
  const docRef = doc(db, GAMES_COLLECTION, gameId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        iconUrl: data.iconUrl || `https://placehold.co/40x40.png?text=${(data.name || "G").substring(0,2)}`,
        bannerUrl: data.bannerUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(data.name || "Game Banner")}`,
        createdAt: data.createdAt as Timestamp,
        updatedAt: data.updatedAt as Timestamp,
    } as Game;
  }
  return undefined;
};

export const updateGameInFirestore = async (gameId: string, gameData: Partial<Omit<Game, 'id' | 'createdAt'>>): Promise<void> => {
  const docRef = doc(db, GAMES_COLLECTION, gameId);
  await updateDoc(docRef, {
    ...gameData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteGameFromFirestore = async (gameId: string): Promise<void> => {
  await deleteDoc(doc(db, GAMES_COLLECTION, gameId));
};

// --- Tournament Functions ---

export const addTournamentToFirestore = async (tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'startDate' | 'status'> & { startDate: Date }): Promise<string> => {
  const { startDate, ...restData } = tournamentData;
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION), {
    ...restData,
    startDate: Timestamp.fromDate(startDate),
    status: getTournamentStatus({ ...restData, startDate }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    matches: tournamentData.matches || [],
    featured: tournamentData.featured || false,
    entryFee: tournamentData.entryFee || 0,
    currency: tournamentData.entryFee && tournamentData.entryFee > 0 ? tournamentData.currency || 'USD' : null,
    bannerImageUrl: tournamentData.bannerImageUrl || `https://placehold.co/1200x400.png?text=${encodeURIComponent(tournamentData.name)}`,
    sponsorName: tournamentData.sponsorName || null,
    sponsorLogoUrl: tournamentData.sponsorLogoUrl || null,
  });
 return docRef.id;
};

export const getTournamentsFromFirestore = async (queryParams?: { status?: Tournament['status'], gameId?: string, count?: number, participantId?: string, featured?: boolean }): Promise<Tournament[]> => {
  let qConstraints: QueryConstraint[] = [orderBy("startDate", "desc")];

  if (queryParams?.status) {
    qConstraints.push(where("status", "==", queryParams.status));
  }
  
  // This logic is adjusted to avoid needing a composite index for gameId + startDate.
  // We query by gameId only and then sort the results in the application code.
  if (queryParams?.gameId) {
    qConstraints = [where("gameId", "==", queryParams.gameId)];
  }

  if (queryParams?.featured !== undefined) {
    qConstraints.push(where("featured", "==", queryParams.featured));
  }
  if (queryParams?.participantId) {
    qConstraints.push(where("participants", "array-contains", { id: queryParams.participantId }));
  }
  if (queryParams?.count) {
    qConstraints.push(limit(queryParams.count));
  }

  const q = query(collection(db, TOURNAMENTS_COLLECTION), ...qConstraints);
  const tournamentsSnapshot = await getDocs(q);

  const now = new Date();
  const batch = writeBatch(db);
  let tournaments = tournamentsSnapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    const tournament = {
      id: docSnapshot.id,
      ...data,
      bannerImageUrl: data.bannerImageUrl || `https://placehold.co/1200x400.png?text=${encodeURIComponent(data.name)}`,
      gameIconUrl: data.gameIconUrl || `https://placehold.co/40x40.png?text=${data.gameName.substring(0,2)}`,
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
      entryFee: data.entryFee || 0,
      currency: data.currency || (data.entryFee > 0 ? 'USD' : null),
      sponsorName: data.sponsorName || undefined,
      sponsorLogoUrl: data.sponsorLogoUrl || undefined,
    } as Tournament;

    // Auto-update status logic
    const currentStatus = tournament.status;
    const newStatus = getTournamentStatus(tournament);
    
    if (currentStatus !== newStatus && currentStatus !== "Cancelled") {
        tournament.status = newStatus;
        const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournament.id);
        batch.update(tournamentRef, { status: newStatus, updatedAt: serverTimestamp() });
    }
    
    return tournament;
  });
  
  // If we queried by gameId, we need to sort manually now.
  if(queryParams?.gameId) {
    tournaments = tournaments.sort((a,b) => b.startDate.getTime() - a.startDate.getTime());
  }

  await batch.commit();
  return tournaments;
};


export const getTournamentByIdFromFirestore = async (tournamentId: string): Promise<Tournament | undefined> => {
  if (!tournamentId) return undefined;
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();

    let matches = data.matches || [];
    if (matches.length === 0 && data.participants && data.participants.length >= 2 && data.bracketType === "Single Elimination") {
        const numMatches = Math.floor(data.participants.length / 2);
        for(let i = 0; i < numMatches; i++) {
            matches.push({
                id: `m-auto-${tournamentId}-${i+1}`,
                round: 1,
                participants: [data.participants[i*2] || null, data.participants[i*2+1] || null],
                status: 'Pending'
            });
        }
    }
    
    const tournament: Tournament = {
      id: docSnap.id,
      ...data,
      bannerImageUrl: data.bannerImageUrl || `https://placehold.co/1200x400.png?text=${encodeURIComponent(data.name)}`,
      gameIconUrl: data.gameIconUrl || `https://placehold.co/40x40.png?text=${data.gameName.substring(0,2)}`,
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
      matches: matches,
      entryFee: data.entryFee || 0,
      currency: data.currency || (data.entryFee > 0 ? 'USD' : null),
      sponsorName: data.sponsorName || undefined,
      sponsorLogoUrl: data.sponsorLogoUrl || undefined,
    } as Tournament;
    
    // Check and update status if needed
    const currentStatus = tournament.status;
    const newStatus = getTournamentStatus(tournament);
    if(currentStatus !== newStatus && currentStatus !== "Cancelled") {
        tournament.status = newStatus;
        await updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });
    }

    return tournament;
  }
  return undefined;
};

export const updateTournamentInFirestore = async (tournamentId: string, tournamentData: Partial<Omit<Tournament, 'id' | 'createdAt' | 'startDate' | 'endDate'> & { startDate?: Date, endDate?: Date | null }>): Promise<void> => {
  const { startDate, endDate, ...restData } = tournamentData;
  const updateData: any = { ...restData, updatedAt: serverTimestamp() };
  if (startDate) {
    updateData.startDate = Timestamp.fromDate(startDate);
  }
  if (endDate) {
    updateData.endDate = Timestamp.fromDate(endDate);
  } else if (tournamentData.hasOwnProperty('endDate') && tournamentData.endDate === null) {
     updateData.endDate = null;
  }

  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  await updateDoc(docRef, updateData);
};

export const deleteTournamentFromFirestore = async (tournamentId: string): Promise<void> => {
  await deleteDoc(doc(db, TOURNAMENTS_COLLECTION, tournamentId));
};

export const addParticipantToTournamentFirestore = async (tournamentId: string, participant: Participant): Promise<void> => {
  const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const tournamentSnap = await getDoc(tournamentRef);

  if (tournamentSnap.exists()) {
    const tournamentData = tournamentSnap.data() as Tournament;
    const currentParticipants = tournamentData.participants || [];

    if (currentParticipants.find(p => p.id === participant.id)) {
      throw new Error("Participant already registered");
    }
    if (currentParticipants.length >= tournamentData.maxParticipants) {
      throw new Error("Tournament is full");
    }
    await updateDoc(tournamentRef, {
        participants: arrayUnion(participant),
        updatedAt: serverTimestamp()
    });
  } else {
    throw new Error("Tournament not found");
  }
};

// --- Notification Functions ---

export const sendNotificationToFirestore = async (notificationData: NotificationFormData): Promise<string> => {
  const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    ...notificationData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getNotificationsFromFirestore = async (target?: NotificationTarget): Promise<NotificationMessage[]> => {
  let qConstraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

  if (target) {
    qConstraints.push(where("target", "==", target));
  }
  // Composite index required: target (ASC), createdAt (DESC) on notifications collection.
  // Create in Firebase Console if error. Link: https://console.firebase.google.com/v1/r/project/battlezone-faa03/firestore/indexes?create_composite=ClZwcm9qZWN0cy9iYXR0bGV6b25lLWZhYTAzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ub3RpZmljYXRpb25zL2luZGV4ZXMvXxABGgoKBnRhcmdldBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
  const q = query(collection(db, NOTIFICATIONS_COLLECTION), ...qConstraints);
  const notificationsSnapshot = await getDocs(q);

  return notificationsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt as Timestamp,
    } as NotificationMessage;
  });
};

// --- User Functions ---
export const getUserProfileFromFirestore = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  const userRef = doc(db, USERS_COLLECTION, userId);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      displayName: data.displayName || "Unknown User",
      email: data.email || null,
      photoURL: data.photoURL || `https://placehold.co/40x40.png?text=${(data.displayName || "U").substring(0,2)}`,
      isAdmin: data.isAdmin || false,
      createdAt: data.createdAt as Timestamp,
      bio: data.bio || "",
      favoriteGameIds: data.favoriteGameIds || [],
      streamingChannelUrl: data.streamingChannelUrl || "",
      friendUids: data.friendUids || [],
      sentFriendRequests: data.sentFriendRequests || [],
      receivedFriendRequests: data.receivedFriendRequests || [],
      teamId: data.teamId || null,
      points: data.points || 0,
    } as UserProfile;
  }
  return null;
};


export const getAllUsersFromFirestore = async (): Promise<UserProfile[]> => {
  const usersSnapshot = await getDocs(query(collection(db, USERS_COLLECTION), orderBy("displayName", "asc")));
  return usersSnapshot.docs.map(doc => {
    const data = doc.data();
    // This is the fix: return only serializable data
    return {
      uid: doc.id,
      displayName: data.displayName || "Unknown User",
      email: data.email || null,
      photoURL: data.photoURL || `https://placehold.co/40x40.png?text=${(data.displayName || "U").substring(0,2)}`,
      isAdmin: data.isAdmin || false,
      createdAt: data.createdAt as Timestamp,
      bio: data.bio || "",
      favoriteGameIds: data.favoriteGameIds || [],
      streamingChannelUrl: data.streamingChannelUrl || "",
      friendUids: data.friendUids || [],
      sentFriendRequests: data.sentFriendRequests || [],
      receivedFriendRequests: data.receivedFriendRequests || [],
      teamId: data.teamId || null,
      points: data.points || 0,
    };
  });
};

export const updateUserAdminStatusInFirestore = async (userId: string, isAdmin: boolean): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, { isAdmin, updatedAt: serverTimestamp() });
};

export const updateUserProfileInFirestore = async (userId: string, profileData: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'favoriteGameIds' | 'streamingChannelUrl' | 'friendUids' | 'teamId' | 'points' | 'sentFriendRequests' | 'receivedFriendRequests'>>): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const dataToUpdate: any = { ...profileData, updatedAt: serverTimestamp() };
  
  if (profileData.hasOwnProperty('favoriteGameIds') && !Array.isArray(profileData.favoriteGameIds)) {
    dataToUpdate.favoriteGameIds = [];
  }
  if (profileData.hasOwnProperty('friendUids') && !Array.isArray(profileData.friendUids)) {
    dataToUpdate.friendUids = [];
  }
   if (profileData.hasOwnProperty('sentFriendRequests') && !Array.isArray(profileData.sentFriendRequests)) {
    dataToUpdate.sentFriendRequests = [];
  }
  if (profileData.hasOwnProperty('receivedFriendRequests') && !Array.isArray(profileData.receivedFriendRequests)) {
    dataToUpdate.receivedFriendRequests = [];
  }
  if (profileData.hasOwnProperty('teamId') && profileData.teamId === undefined) {
    dataToUpdate.teamId = null;
  }

  await updateDoc(userRef, dataToUpdate);
};

export const searchUsersByNameOrEmail = async (searchTerm: string, currentUserId: string): Promise<UserProfile[]> => {
  if (!searchTerm.trim()) return [];
  const lowerSearchTerm = searchTerm.toLowerCase();

  // Note: Firestore doesn't support case-insensitive search or partial string matching (like SQL LIKE) directly on its own.
  // For small user bases, fetching all and filtering client-side is okay for prototyping.
  // For larger scale, you'd use a dedicated search service like Algolia or Typesense,
  // or denormalize searchable fields (e.g., all lowercase name).
  const allUsers = await getAllUsersFromFirestore();
  return allUsers.filter(user =>
    user.uid !== currentUserId &&
    (user.displayName?.toLowerCase().includes(lowerSearchTerm) || user.email?.toLowerCase().includes(lowerSearchTerm))
  );
};

// --- Friend Request System ---

export const sendFriendRequest = async (fromUid: string, toUid: string): Promise<void> => {
  if (fromUid === toUid) throw new Error("Cannot send a friend request to yourself.");

  const fromUserRef = doc(db, USERS_COLLECTION, fromUid);
  const toUserRef = doc(db, USERS_COLLECTION, toUid);

  const batch = writeBatch(db);

  const fromUserSnap = await getDoc(fromUserRef);
  const toUserSnap = await getDoc(toUserRef);

  if (!fromUserSnap.exists() || !toUserSnap.exists()) {
    throw new Error("User not found.");
  }

  const fromUserData = fromUserSnap.data() as UserProfile;

  if (fromUserData.friendUids?.includes(toUid)) {
    throw new Error("You are already friends with this user.");
  }
  if (fromUserData.sentFriendRequests?.includes(toUid)) {
    throw new Error("Friend request already sent.");
  }
  if (fromUserData.receivedFriendRequests?.includes(toUid)) {
    throw new Error("This user has already sent you a friend request. Please check your incoming requests.");
  }

  batch.update(fromUserRef, {
    sentFriendRequests: arrayUnion(toUid),
    updatedAt: serverTimestamp()
  });
  batch.update(toUserRef, {
    receivedFriendRequests: arrayUnion(fromUid),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
};

export const acceptFriendRequest = async (currentUserUid: string, requesterUid: string): Promise<void> => {
  const currentUserRef = doc(db, USERS_COLLECTION, currentUserUid);
  const requesterRef = doc(db, USERS_COLLECTION, requesterUid);
  const batch = writeBatch(db);

  batch.update(currentUserRef, {
    receivedFriendRequests: arrayRemove(requesterUid),
    friendUids: arrayUnion(requesterUid),
    updatedAt: serverTimestamp()
  });
  batch.update(requesterRef, {
    sentFriendRequests: arrayRemove(currentUserUid),
    friendUids: arrayUnion(currentUserUid),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
};

export const declineFriendRequest = async (currentUserUid: string, requesterUid: string): Promise<void> => {
  const currentUserRef = doc(db, USERS_COLLECTION, currentUserUid);
  const requesterRef = doc(db, USERS_COLLECTION, requesterUid);
  const batch = writeBatch(db);

  batch.update(currentUserRef, {
    receivedFriendRequests: arrayRemove(requesterUid),
    updatedAt: serverTimestamp()
  });
  batch.update(requesterRef, {
    sentFriendRequests: arrayRemove(currentUserUid),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
};

export const cancelFriendRequest = async (currentUserUid: string, targetUid: string): Promise<void> => {
  const currentUserRef = doc(db, USERS_COLLECTION, currentUserUid);
  const targetRef = doc(db, USERS_COLLECTION, targetUid);
  const batch = writeBatch(db);

  batch.update(currentUserRef, {
    sentFriendRequests: arrayRemove(targetUid),
    updatedAt: serverTimestamp()
  });
  batch.update(targetRef, {
    receivedFriendRequests: arrayRemove(currentUserUid),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
};


export const removeFriend = async (currentUserUid: string, friendToRemoveUid: string): Promise<void> => {
  const currentUserRef = doc(db, USERS_COLLECTION, currentUserUid);
  const friendToRemoveRef = doc(db, USERS_COLLECTION, friendToRemoveUid);
  const batch = writeBatch(db);

  batch.update(currentUserRef, {
    friendUids: arrayRemove(friendToRemoveUid),
    updatedAt: serverTimestamp()
  });
  batch.update(friendToRemoveRef, {
    friendUids: arrayRemove(currentUserUid),
    updatedAt: serverTimestamp()
  });

  await batch.commit();
};


// --- Team Functions ---

export const createTeamInFirestore = async (teamData: TeamFormData, leader: UserProfile): Promise<string> => {
  if (!leader) throw new Error("Leader information is required to create a team.");
  
  const existingTeamsLed = await getTeamsByUserIdFromFirestore(leader.uid, true);
  if (existingTeamsLed.length > 0) {
    throw new Error("You can only lead one team.");
  }
  if (leader.teamId) {
      throw new Error("You are already part of a team. Leave your current team to create a new one.");
  }

  const teamDocRef = await addDoc(collection(db, TEAMS_COLLECTION), {
    name: teamData.name,
    leaderUid: leader.uid,
    leaderName: leader.displayName || leader.email,
    memberUids: [leader.uid], 
    createdAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });

  await updateUserTeamInFirestore(leader.uid, teamDocRef.id);

  return teamDocRef.id;
};

export const getTeamByIdFromFirestore = async (teamId: string): Promise<Team | null> => {
  if (!teamId) return null;
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    const data = teamSnap.data();
    return { 
        id: teamSnap.id, 
        ...data,
        createdAt: data.createdAt as Timestamp,
        lastActivityAt: data.lastActivityAt as Timestamp,
     } as Team;
  }
  return null;
};

export const getTeamsByUserIdFromFirestore = async (userId: string, asLeaderOnly: boolean = false): Promise<Team[]> => {
  let qConstraints: QueryConstraint[] = [];
  if (asLeaderOnly) {
    // Index needed: leaderUid (ASC), createdAt (DESC)
    // Example: https://console.firebase.google.com/v1/r/project/battlezone-faa03/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9iYXR0bGV6b25lLWZhYTAzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90ZWFtcy9pbmRleGVzL18QARoNCglsZWFkZXJVaWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC
    qConstraints.push(where("leaderUid", "==", userId));
    qConstraints.push(orderBy("createdAt", "desc")); // Added orderBy for consistency
  } else {
    // Index needed for memberUids array-contains + orderBy createdAt (ASC or DESC)
    qConstraints.push(where("memberUids", "array-contains", userId));
    qConstraints.push(orderBy("createdAt", "desc"));
  }
  
  const q = query(collection(db, TEAMS_COLLECTION), ...qConstraints);
  const teamsSnapshot = await getDocs(q);
  return teamsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt as Timestamp,
          lastActivityAt: data.lastActivityAt as Timestamp,
        } as Team
    });
};


export const updateUserTeamInFirestore = async (userId: string, teamId: string | null): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, { teamId: teamId, updatedAt: serverTimestamp() });
};

export const addMemberToTeamInFirestore = async (teamId: string, userIdToAdd: string): Promise<void> => {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const userRef = doc(db, USERS_COLLECTION, userIdToAdd);
  
  const userSnap = await getDoc(userRef);
  if (userSnap.exists() && userSnap.data().teamId) {
      throw new Error("User is already in another team.");
  }
  if (!userSnap.exists()) {
    throw new Error("User to add not found.");
  }

  const batch = writeBatch(db);
  batch.update(teamRef, { memberUids: arrayUnion(userIdToAdd), lastActivityAt: serverTimestamp() });
  batch.update(userRef, { teamId: teamId, updatedAt: serverTimestamp() });
  await batch.commit();
};

export const removeMemberFromTeamInFirestore = async (teamId: string, userIdToRemove: string): Promise<void> => {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const userRef = doc(db, USERS_COLLECTION, userIdToRemove);
  
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error("Team not found.");
  const teamData = teamSnap.data() as Team;

  const batch = writeBatch(db);
  batch.update(teamRef, { memberUids: arrayRemove(userIdToRemove), lastActivityAt: serverTimestamp() });
  batch.update(userRef, { teamId: null, updatedAt: serverTimestamp() });

  if (teamData.memberUids.length === 1 && teamData.memberUids.includes(userIdToRemove)) {
    batch.delete(teamRef);
  } else if (teamData.leaderUid === userIdToRemove && teamData.memberUids.length > 1) {
    teamData.memberUids.forEach(memberUid => {
        if (memberUid !== userIdToRemove) { 
            const otherUserRef = doc(db, USERS_COLLECTION, memberUid);
            batch.update(otherUserRef, { teamId: null, updatedAt: serverTimestamp() });
        }
    });
    batch.delete(teamRef);
  }
  await batch.commit();
};

export const deleteTeamFromFirestore = async (teamId: string, currentUserId: string): Promise<void> => {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) throw new Error("Team not found.");
  const teamData = teamSnap.data() as Team;

  if (teamData.leaderUid !== currentUserId) {
    throw new Error("Only the team leader can delete the team.");
  }

  const batch = writeBatch(db);
  for (const memberUid of teamData.memberUids) {
    const userRef = doc(db, USERS_COLLECTION, memberUid);
    batch.update(userRef, { teamId: null, updatedAt: serverTimestamp() });
  }
  batch.delete(teamRef);
  await batch.commit();
};

export const updateTeamLastActivity = async (teamId: string): Promise<void> => {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  await updateDoc(teamRef, { lastActivityAt: serverTimestamp() });
};


// --- Site Settings Functions ---
export const getSiteSettingsFromFirestore = async (): Promise<SiteSettings | null> => {
  const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        updatedAt: data.updatedAt as Timestamp,
    } as SiteSettings;
  }
  return null;
};

export const saveSiteSettingsToFirestore = async (settingsData: Omit<SiteSettings, 'id' | 'updatedAt'>): Promise<void> => {
  const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
  await setDoc(docRef, {
    ...settingsData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

// --- Chat Functions ---

/**
 * Generates a consistent chat ID for two user UIDs.
 * The UIDs are sorted to ensure the ID is the same regardless of who initiated the chat.
 */
export const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

export const sendMessageToFirestore = async (chatId: string, senderId: string, senderName: string, text: string): Promise<string> => {
  const messagesColRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION);
  const messageData: Omit<ChatMessage, 'id' | 'chatId'> = {
    senderId,
    senderName,
    text,
    timestamp: serverTimestamp() as Timestamp,
  };
  const messageDocRef = await addDoc(messagesColRef, messageData);
  
  // Optionally, update a 'lastMessageTimestamp' on the parent chat document
  // const chatDocRef = doc(db, CHATS_COLLECTION, chatId);
  // await setDoc(chatDocRef, { lastMessageTimestamp: serverTimestamp(), participantUids: chatId.split('_') }, { merge: true });

  return messageDocRef.id;
};

export const getMessagesForChat = (
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => { // Returns an unsubscribe function
  const messagesColRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION);
  const q = query(messagesColRef, orderBy("timestamp", "asc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      chatId: chatId,
      ...docSnap.data()
    } as ChatMessage));
    callback(messages);
  }, (error) => {
    console.error("Error fetching real-time messages:", error);
    // Optionally, notify the user via toast or other UI element
  });

  return unsubscribe; // Return the unsubscribe function
};

export const deleteMessageFromFirestore = async (chatId: string, messageId: string, currentUserId: string): Promise<void> => {
  const messageDocRef = doc(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION, messageId);
  const messageSnap = await getDoc(messageDocRef);

  if (messageSnap.exists()) {
    const messageData = messageSnap.data() as ChatMessage;
    if (messageData.senderId === currentUserId) {
      await deleteDoc(messageDocRef);
    } else {
      throw new Error("You can only delete your own messages.");
    }
  } else {
    throw new Error("Message not found.");
  }
};

// --- Sponsorship Functions ---

export const addSponsorshipRequestToFirestore = async (formData: Omit<SponsorshipRequest, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    const docRef = await addDoc(collection(db, SPONSORSHIPS_COLLECTION), {
        ...formData,
        status: "New",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getSponsorshipRequestsFromFirestore = async (): Promise<SponsorshipRequest[]> => {
    const snapshot = await getDocs(query(collection(db, SPONSORSHIPS_COLLECTION), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
    } as SponsorshipRequest));
};

export const updateSponsorshipRequestStatusInFirestore = async (id: string, status: SponsorshipRequest['status']): Promise<void> => {
    const docRef = doc(db, SPONSORSHIPS_COLLECTION, id);
    await updateDoc(docRef, { status });
};


// Aliases for easier use
export const getGameDetails = getGameByIdFromFirestore;
export const getTournamentsForGame = (gameId: string) => getTournamentsFromFirestore({ gameId });
export const getTournamentDetails = getTournamentByIdFromFirestore;
