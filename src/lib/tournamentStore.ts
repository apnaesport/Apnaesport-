
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
import type { Tournament, Game, Participant, Match, NotificationMessage, NotificationFormData, NotificationTarget, SiteSettings, UserProfile } from './types';

const GAMES_COLLECTION = "games";
const TOURNAMENTS_COLLECTION = "tournaments";
const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";
const SETTINGS_COLLECTION = "settings";
const GLOBAL_SETTINGS_ID = "global";


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

  if (tournamentData.participants === undefined && Object.keys(restData).includes('participants')) {
    if (restData.participants === undefined && !tournamentData.hasOwnProperty('participants')) {
        delete updateData.participants;
    }
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
    const updatedParticipants = [...currentParticipants, participant];
    await updateDoc(tournamentRef, {
        participants: updatedParticipants,
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
      favoriteGames: data.favoriteGames || "",
      favoriteGameIds: data.favoriteGameIds || [],
      streamingChannelUrl: data.streamingChannelUrl || "",
      friendUids: data.friendUids || [], // Added for friends list
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
      favoriteGames: data.favoriteGames || "",
      favoriteGameIds: data.favoriteGameIds || [],
      streamingChannelUrl: data.streamingChannelUrl || "",
      friendUids: data.friendUids || [], // Added for friends list
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

export const updateUserProfileInFirestore = async (userId: string, profileData: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'favoriteGames' | 'favoriteGameIds' | 'streamingChannelUrl' | 'friendUids'>>): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const dataToUpdate = { ...profileData };
  if (profileData.hasOwnProperty('favoriteGameIds') && !Array.isArray(profileData.favoriteGameIds)) {
    dataToUpdate.favoriteGameIds = [];
  }
  if (profileData.hasOwnProperty('friendUids') && !Array.isArray(profileData.friendUids)) {
    dataToUpdate.friendUids = [];
  }
  await updateDoc(userRef, { ...dataToUpdate, updatedAt: serverTimestamp() });
};

export const searchUsersByNameOrEmail = async (searchTerm: string, currentUserId: string): Promise<UserProfile[]> => {
  if (!searchTerm.trim()) return [];
  const lowerSearchTerm = searchTerm.toLowerCase();

  // Firestore does not support case-insensitive search or partial string matching directly on multiple fields easily.
  // A common workaround is to store a lowercased version of fields you want to search.
  // For this prototype, we'll fetch all users and filter client-side, which is NOT scalable for large datasets.
  // For production, consider using a dedicated search service like Algolia or Typesense, or restructuring data.
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

  // Add targetUserUid to currentUser's friendUids
  batch.update(currentUserRef, { friendUids: arrayUnion(targetUserUid), updatedAt: serverTimestamp() });
  // Add currentUserUid to targetUser's friendUids (bilateral friendship)
  batch.update(targetUserRef, { friendUids: arrayUnion(currentUserUid), updatedAt: serverTimestamp() });

  await batch.commit();
};

export const removeFriend = async (currentUserUid: string, targetUserUid: string): Promise<void> => {
  const batch = writeBatch(db);
  const currentUserRef = doc(db, USERS_COLLECTION, currentUserUid);
  const targetUserRef = doc(db, USERS_COLLECTION, targetUserUid);

  // Remove targetUserUid from currentUser's friendUids
  batch.update(currentUserRef, { friendUids: arrayRemove(targetUserUid), updatedAt: serverTimestamp() });
  // Remove currentUserUid from targetUser's friendUids
  batch.update(targetUserRef, { friendUids: arrayRemove(currentUserUid), updatedAt: serverTimestamp() });

  await batch.commit();
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
