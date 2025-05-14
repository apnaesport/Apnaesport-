
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
  arrayRemove
} from "firebase/firestore";
import { db } from "./firebase";
import type { Tournament, Game, Participant, Match, NotificationMessage, NotificationFormData, NotificationTarget, SiteSettings, UserProfile, Team, TeamFormData } from './types';

const GAMES_COLLECTION = "games";
const TOURNAMENTS_COLLECTION = "tournaments";
const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";
const SETTINGS_COLLECTION = "settings";
const GLOBAL_SETTINGS_ID = "global";
const TEAMS_COLLECTION = "teams";


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
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : undefined,
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

export const addTournamentToFirestore = async (tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'startDate'> & { startDate: Date }): Promise<string> => {
  const { startDate, ...restData } = tournamentData;
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION), {
    ...restData,
    startDate: Timestamp.fromDate(startDate),
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
  if (queryParams?.gameId) {
    // Index needed: gameId (ASC), startDate (DESC)
    // Firebase console link (example): https://console.firebase.google.com/project/_/firestore/indexes?create_composite=ClRwcm9qZWN0cy9iYXR0bGV6b25lLWZhYTAzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90b3VybmFtZW50cy9pbmRleGVzL18QARoKCgZnYW1lSWQQARoNCglzdGFydERhdGUQAhoMCghfX25hbWVfXxAC
    // (The above comment is an example, Firebase error usually provides the correct link)
    qConstraints.push(where("gameId", "==", queryParams.gameId));
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

  return tournamentsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
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
  });
};


export const getTournamentByIdFromFirestore = async (tournamentId: string): Promise<Tournament | undefined> => {
  if (!tournamentId) return undefined;
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();

    let matches = data.matches || [];
    // Basic match generation for Single Elimination if none exist and participants are present
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

    return {
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

  // Preserve participants array if not explicitly being updated
  if (tournamentData.participants === undefined && Object.keys(restData).includes('participants')) {
    // This condition seems problematic. If participants is in restData, it's being updated.
    // If it's not in tournamentData at all, we should not delete it.
    // Let's adjust to only delete if explicitly set to undefined in tournamentData.
    if (restData.participants === undefined && !tournamentData.hasOwnProperty('participants')) {
        // This means tournamentData was passed without 'participants' key, so don't touch it.
    }
  } else if (tournamentData.hasOwnProperty('participants') && tournamentData.participants === undefined) {
    // This means participants was explicitly passed as undefined, intending to remove/clear it.
    // This case is unlikely for array updates; usually, one passes an empty array or a new array.
    // For safety, we usually update with a new array, or use arrayUnion/arrayRemove for specific items.
    // For this general update function, if tournamentData.participants is provided, it will overwrite.
  }


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
    // Use arrayUnion to add a participant to avoid duplicates if this function is called multiple times concurrently
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
  // Create in Firebase Console if error. Example link for index creation:
  // https://console.firebase.google.com/project/_/firestore/indexes?create_composite=ClZwcm9qZWN0cy9YOUR_PROJECT_ID_HERE/ZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL25vdGlmaWNhdGlvbnMvaW5kZXhlcy9fEAEaCgoGdGFyZ2V0EAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
  // Replace YOUR_PROJECT_ID_HERE with your actual Firebase project ID.
  // Index for battlezone-faa03 already created:
  // https://console.firebase.google.com/v1/r/project/battlezone-faa03/firestore/indexes?create_composite=ClZwcm9qZWN0cy9iYXR0bGV6b25lLWZhYTAzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ub3RpZmljYXRpb25zL2luZGV4ZXMvXxABGgoKBnRhcmdldBABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
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
      teamId: data.teamId || null,
      // Dummy FirebaseUser properties - not fully populated from Firestore
      emailVerified: data.emailVerified || false,
      isAnonymous: data.isAnonymous || false,
      metadata: data.metadata || {},
      providerData: data.providerData || [],
      refreshToken: data.refreshToken || '',
      tenantId: data.tenantId || null,
      delete: async () => { console.warn("Delete not implemented on client-side UserProfile"); },
      getIdToken: async () => { console.warn("getIdToken not implemented on client-side UserProfile"); return ""; },
      getIdTokenResult: async () => { console.warn("getIdTokenResult not implemented on client-side UserProfile"); return ({} as any); },
      reload: async () => { console.warn("reload not implemented on client-side UserProfile"); },
      toJSON: () => ({ uid: docSnap.id, email: data.email, displayName: data.displayName }),
      phoneNumber: data.phoneNumber || null,
      providerId: data.providerId || '',
    } as UserProfile;
  }
  return null;
};


export const getAllUsersFromFirestore = async (): Promise<UserProfile[]> => {
  const usersSnapshot = await getDocs(query(collection(db, USERS_COLLECTION), orderBy("displayName", "asc")));
  return usersSnapshot.docs.map(doc => {
    const data = doc.data();
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
      teamId: data.teamId || null,
      // Dummy FirebaseUser properties
      emailVerified: data.emailVerified || false,
      isAnonymous: data.isAnonymous || false,
      metadata: data.metadata || {},
      providerData: data.providerData || [],
      refreshToken: data.refreshToken || '',
      tenantId: data.tenantId || null,
      delete: async () => { console.warn("Delete not implemented on client-side UserProfile"); },
      getIdToken: async () => { console.warn("getIdToken not implemented on client-side UserProfile"); return ""; },
      getIdTokenResult: async () => { console.warn("getIdTokenResult not implemented on client-side UserProfile"); return ({} as any); },
      reload: async () => { console.warn("reload not implemented on client-side UserProfile"); },
      toJSON: () => ({ uid: doc.id, email: data.email, displayName: data.displayName }),
      phoneNumber: data.phoneNumber || null,
      providerId: data.providerId || '',
    } as UserProfile;
  });
};

export const updateUserAdminStatusInFirestore = async (userId: string, isAdmin: boolean): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, { isAdmin, updatedAt: serverTimestamp() });
};

export const updateUserProfileInFirestore = async (userId: string, profileData: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'favoriteGameIds' | 'streamingChannelUrl' | 'friendUids' | 'teamId'>>): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const dataToUpdate: any = { ...profileData, updatedAt: serverTimestamp() };
  
  if (profileData.hasOwnProperty('favoriteGameIds') && !Array.isArray(profileData.favoriteGameIds)) {
    dataToUpdate.favoriteGameIds = [];
  }
  if (profileData.hasOwnProperty('friendUids') && !Array.isArray(profileData.friendUids)) {
    dataToUpdate.friendUids = [];
  }
  if (profileData.hasOwnProperty('teamId') && profileData.teamId === undefined) {
    dataToUpdate.teamId = null; // Ensure we can clear teamId
  }

  await updateDoc(userRef, dataToUpdate);
};

export const searchUsersByNameOrEmail = async (searchTerm: string, currentUserId: string): Promise<UserProfile[]> => {
  if (!searchTerm.trim()) return [];
  const lowerSearchTerm = searchTerm.toLowerCase();

  const allUsers = await getAllUsersFromFirestore();
  return allUsers.filter(user =>
    user.uid !== currentUserId &&
    (user.displayName?.toLowerCase().includes(lowerSearchTerm) || user.email?.toLowerCase().includes(lowerSearchTerm))
  );
};

export const addFriend = async (currentUserUid: string, targetUserUid: string): Promise<void> => {
  if (currentUserUid === targetUserUid) throw new Error("Cannot add yourself as a friend.");

  const batch = writeBatch(db);
  const currentUserRef = doc(db, USERS_COLLECTION, currentUserUid);
  const targetUserRef = doc(db, USERS_COLLECTION, targetUserUid);

  batch.update(currentUserRef, { friendUids: arrayUnion(targetUserUid), updatedAt: serverTimestamp() });
  batch.update(targetUserRef, { friendUids: arrayUnion(currentUserUid), updatedAt: serverTimestamp() });

  await batch.commit();
};

export const removeFriend = async (currentUserUid: string, targetUserUid: string): Promise<void> => {
  const batch = writeBatch(db);
  const currentUserRef = doc(db, USERS_COLLECTION, currentUserUid);
  const targetUserRef = doc(db, USERS_COLLECTION, targetUserUid);

  batch.update(currentUserRef, { friendUids: arrayRemove(targetUserUid), updatedAt: serverTimestamp() });
  batch.update(targetUserRef, { friendUids: arrayRemove(currentUserUid), updatedAt: serverTimestamp() });

  await batch.commit();
};

// --- Team Functions ---

export const createTeamInFirestore = async (teamData: TeamFormData, leader: UserProfile): Promise<string> => {
  if (!leader) throw new Error("Leader information is required to create a team.");
  
  // Check if the leader already has a team (optional, based on rules)
  const existingTeam = await getTeamsByUserIdFromFirestore(leader.uid, true);
  if (existingTeam.length > 0) {
    throw new Error("You can only lead one team.");
  }

  const teamDocRef = await addDoc(collection(db, TEAMS_COLLECTION), {
    name: teamData.name,
    leaderUid: leader.uid,
    leaderName: leader.displayName || leader.email,
    memberUids: [leader.uid], // Leader is initially the only member
    createdAt: serverTimestamp(),
    lastActivityAt: serverTimestamp(),
  });

  // Update user's profile with teamId
  await updateUserTeamInFirestore(leader.uid, teamDocRef.id);

  return teamDocRef.id;
};

export const getTeamByIdFromFirestore = async (teamId: string): Promise<Team | null> => {
  if (!teamId) return null;
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamSnap = await getDoc(teamRef);
  if (teamSnap.exists()) {
    return { id: teamSnap.id, ...teamSnap.data() } as Team;
  }
  return null;
};

export const getTeamsByUserIdFromFirestore = async (userId: string, asLeaderOnly: boolean = false): Promise<Team[]> => {
  let qConstraints: QueryConstraint[] = [];
  if (asLeaderOnly) {
    qConstraints.push(where("leaderUid", "==", userId));
  } else {
    qConstraints.push(where("memberUids", "array-contains", userId));
  }
  qConstraints.push(orderBy("createdAt", "desc"));
  
  // Index required for memberUids array-contains + orderBy createdAt
  // Firestore message: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/battlezone-faa03/firestore/indexes?create_composite=Clxwcm9qZWN0cy9iYXR0bGV6b25lLWZhYTAzL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90ZWFtcy9pbmRleGVzL18QARISCgptZW1iZXJVaWRzEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg
  const q = query(collection(db, TEAMS_COLLECTION), ...qConstraints);
  const teamsSnapshot = await getDocs(q);
  return teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
};


export const updateUserTeamInFirestore = async (userId: string, teamId: string | null): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, { teamId: teamId, updatedAt: serverTimestamp() });
};

export const addMemberToTeamInFirestore = async (teamId: string, userIdToAdd: string): Promise<void> => {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const userRef = doc(db, USERS_COLLECTION, userIdToAdd);

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

  // If the leader is removing themselves AND they are the last member, consider deleting the team
  // OR implement leadership transfer (more complex). For now, simple removal.
  // If leader removed and team still has members, current logic needs leader to explicitly delete team.
  if (teamData.leaderUid === userIdToRemove && teamData.memberUids.length === 1) {
    // Last member (leader) is leaving, delete the team
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
  // Clear teamId for all members
  for (const memberUid of teamData.memberUids) {
    const userRef = doc(db, USERS_COLLECTION, memberUid);
    batch.update(userRef, { teamId: null, updatedAt: serverTimestamp() });
  }
  batch.delete(teamRef); // Delete the team document
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


// Aliases for easier use
export const getGameDetails = getGameByIdFromFirestore;
export const getTournamentsForGame = (gameId: string) => getTournamentsFromFirestore({ gameId });
export const getTournamentDetails = getTournamentByIdFromFirestore;

