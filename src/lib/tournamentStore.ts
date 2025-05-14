
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
  const newGameSnapshot = await getDoc(docRef); 
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
    startDate: Timestamp.fromDate(startDate), 
  };
};

export const getTournamentsFromFirestore = async (queryParams?: { status?: Tournament['status'], gameId?: string, count?: number, participantId?: string }): Promise<Tournament[]> => {
  let qConstraints: QueryConstraint[] = [orderBy("startDate", "desc")];
  
  if (queryParams?.status) {
    qConstraints.push(where("status", "==", queryParams.status));
  }
  if (queryParams?.gameId) {
    // IMPORTANT: Querying by gameId AND ordering by startDate may require a composite index in Firestore.
    // Example: Collection: tournaments, Fields: gameId (ASC), startDate (DESC or ASC depending on Firestore's suggestion).
    // Firebase error messages will typically provide a link to create this index.
    qConstraints.push(where("gameId", "==", queryParams.gameId));
  }
  if (queryParams?.participantId) {
    // This queries if the participantId string is present in the 'participants' array (if it's an array of UIDs).
    // If 'participants' is an array of objects, you'd query a specific field in those objects,
    // e.g., where("participantIds", "array-contains", queryParams.participantId) if you had a denormalized array of IDs.
    // For complex objects, you might need to adjust your data structure or use array-contains-any with up to 10 UIDs.
    // A common approach is to filter client-side for broader participation checks or structure data for easier querying.
    qConstraints.push(where("participants", "array-contains", { id: queryParams.participantId })); // Assuming participants is an array of objects with an id field
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
    const tournamentData = tournamentSnap.data() as Tournament; // Type assertion
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
  // Example: Collection: notifications, Fields: target (ASC), createdAt (DESC).
  // Firebase error messages will typically provide a link to create this index.
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
      uid: doc.id,
      displayName: data.displayName || null,
      email: data.email || null,
      photoURL: data.photoURL || null,
      isAdmin: data.isAdmin || false,
      createdAt: data.createdAt as Timestamp, // Assuming createdAt is stored
      // FirebaseUser specific fields (fill with defaults or ensure they exist)
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
  return null; 
};

export const saveSiteSettingsToFirestore = async (settingsData: Omit<SiteSettings, 'id' | 'updatedAt'>): Promise<void> => {
  const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
  await setDoc(docRef, { 
    ...settingsData,
    updatedAt: serverTimestamp(),
  }, { merge: true }); // Use merge: true to create or update
};


// Aliases for easier use 
export const getGameDetails = getGameByIdFromFirestore;
export const getTournamentsForGame = (gameId: string) => getTournamentsFromFirestore({ gameId });
export const getTournamentDetails = getTournamentByIdFromFirestore;
// addTournament and addGame are already clear as addTournamentToFirestore and addGameToFirestore
// updateGameInStore, deleteGameFromStore, deleteTournamentFromStore are good as updateGameInFirestore, etc.
// getTournaments and getGames are clear

    