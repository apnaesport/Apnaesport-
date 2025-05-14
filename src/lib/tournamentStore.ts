
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
  setDoc // Added for setting doc with specific ID
} from "firebase/firestore";
import { db } from "./firebase";
import type { Tournament, Game, Participant, Match, NotificationMessage, NotificationFormData, NotificationTarget, SiteSettings, UserProfile } from './types';

const GAMES_COLLECTION = "games";
const TOURNAMENTS_COLLECTION = "tournaments";
const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";
const SETTINGS_COLLECTION = "settings";
const GLOBAL_SETTINGS_ID = "global"; // Fixed ID for the single site settings document


// --- Game Functions ---

export const addGameToFirestore = async (gameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<Game> => {
  const docRef = await addDoc(collection(db, GAMES_COLLECTION), {
    ...gameData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const newGameSnapshot = await getDoc(docRef); // Fetch to get server timestamp
  const newGameData = newGameSnapshot.data();
  return { 
    id: docRef.id, 
    ...gameData, 
    createdAt: newGameData?.createdAt as Timestamp,
    updatedAt: newGameData?.updatedAt as Timestamp
  };
};

export const getGamesFromFirestore = async (): Promise<Game[]> => {
  const gamesSnapshot = await getDocs(query(collection(db, GAMES_COLLECTION), orderBy("name", "asc")));
  return gamesSnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
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

export const addTournamentToFirestore = async (tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'startDate'> & { startDate: Date }): Promise<Tournament> => {
  const { startDate, ...restData } = tournamentData;
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION), {
    ...restData,
    startDate: Timestamp.fromDate(startDate),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    matches: tournamentData.matches || [], 
  });
  const newTournamentSnapshot = await getDoc(docRef);
  const newTournamentData = newTournamentSnapshot.data();
  
  return {
    ...tournamentData,
    id: docRef.id,
    createdAt: newTournamentData?.createdAt as Timestamp,
    updatedAt: newTournamentData?.updatedAt as Timestamp,
    startDate: Timestamp.fromDate(startDate), // Ensure it's a Timestamp for consistency
  };
};

export const getTournamentsFromFirestore = async (queryParams?: { status?: Tournament['status'], gameId?: string, count?: number, participantId?: string }): Promise<Tournament[]> => {
  let qConstraints: QueryConstraint[] = [orderBy("startDate", "desc")];
  
  if (queryParams?.status) {
    qConstraints.push(where("status", "==", queryParams.status));
  }
  if (queryParams?.gameId) {
    qConstraints.push(where("gameId", "==", queryParams.gameId));
  }
  if (queryParams?.participantId) {
    qConstraints.push(where("participants", "array-contains", queryParams.participantId)); // This is a simplified way to check participation. For actual participant objects, you'd check for objects containing the id. See note below.
  }
  if (queryParams?.count) {
    qConstraints.push(limit(queryParams.count));
  }
  // Note: Firestore's array-contains query works for primitive values in an array.
  // If participants is an array of objects, you'd query `where("participants.id", "==", participantId)` if `participants` field was an array of maps, 
  // but for `array-contains` to work on an array of objects, the entire object must match.
  // A common workaround is to store an array of participant IDs alongside the array of participant objects, or restructure.
  // For now, the participantId filter will assume `participants` field contains an array of UIDs if that's how it's queried.
  // Given Participant is {id, name, avatarUrl}, a more robust query for "user participated in" would be harder without denormalizing participant IDs into a separate array field.
  // Let's assume for the stats page, we fetch all tournaments and filter client-side for participation for now.

  const q = query(collection(db, TOURNAMENTS_COLLECTION), ...qConstraints);
  const tournamentsSnapshot = await getDocs(q);
  
  return tournamentsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: (data.startDate as Timestamp).toDate(), 
      endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
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
      startDate: (data.startDate as Timestamp).toDate(),
      endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
      matches: matches,
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
    // Convert Firestore Timestamps back to Date objects for comparison if necessary, or ensure types are consistent
    // For this logic, we primarily care about participant list and maxParticipants
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

export const sendNotificationToFirestore = async (notificationData: NotificationFormData): Promise<NotificationMessage> => {
  const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    ...notificationData,
    createdAt: serverTimestamp(),
  });
  const newNotificationSnapshot = await getDoc(docRef);
  const newNotificationData = newNotificationSnapshot.data();
  return {
    id: docRef.id,
    ...notificationData,
    createdAt: newNotificationData?.createdAt as Timestamp,
  };
};

export const getNotificationsFromFirestore = async (target?: NotificationTarget): Promise<NotificationMessage[]> => {
  let qConstraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

  if (target) {
    qConstraints.push(where("target", "==", target));
  }
  
  // IMPORTANT: This query might require a composite index in Firestore if 'target' is used.
  // The index would be: collection 'notifications', fields 'target' (ASC), 'createdAt' (DESC).
  // Firestore usually provides a link in the console error (like the one you received) to create this index.
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
export const getAllUsersFromFirestore = async (): Promise<UserProfile[]> => {
  const usersSnapshot = await getDocs(query(collection(db, USERS_COLLECTION), orderBy("displayName", "asc")));
  return usersSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      // Ensure all fields from UserProfile are mapped, falling back if necessary
      uid: doc.id,
      displayName: data.displayName || null,
      email: data.email || null,
      photoURL: data.photoURL || null,
      isAdmin: data.isAdmin || false,
      createdAt: data.createdAt as Timestamp,
      // FirebaseUser specific fields (less relevant for display, but good for type)
      emailVerified: data.emailVerified || false,
      isAnonymous: data.isAnonymous || false,
      metadata: data.metadata || {},
      providerData: data.providerData || [],
      refreshToken: data.refreshToken || '',
      tenantId: data.tenantId || null,
      delete: async () => {}, // Placeholder, not directly callable from client
      getIdToken: async () => '', // Placeholder
      getIdTokenResult: async () => ({} as any), // Placeholder
      reload: async () => {}, // Placeholder
      toJSON: () => ({}), // Placeholder
      phoneNumber: data.phoneNumber || null,
      providerId: data.providerId || '',
    } as UserProfile;
  });
};

export const updateUserAdminStatusInFirestore = async (userId: string, isAdmin: boolean): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, { isAdmin });
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
  return null; // No settings found
};

export const saveSiteSettingsToFirestore = async (settingsData: Omit<SiteSettings, 'id' | 'updatedAt'>): Promise<void> => {
  const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
  await setDoc(docRef, { // Use setDoc to create or overwrite
    ...settingsData,
    updatedAt: serverTimestamp(),
  });
};


// Aliases for easier use (some might be deprecated if replaced by direct Firestore calls in components)
export const getGameDetails = getGameByIdFromFirestore;
export const getTournamentsForGame = (gameId: string) => getTournamentsFromFirestore({ gameId });
export const getTournamentDetails = getTournamentByIdFromFirestore;
export const addTournament = addTournamentToFirestore; // Kept for potential direct use
export const addGame = addGameToFirestore; // Kept
export const updateGameInStore = updateGameInFirestore; // Renamed for clarity vs Firestore
export const deleteGameFromStore = deleteGameFromFirestore; // Renamed
export const deleteTournamentFromStore = deleteTournamentFromFirestore; // Renamed
export const getTournaments = () => getTournamentsFromFirestore(); // Kept
export const getGames = getGamesFromFirestore; // Kept

