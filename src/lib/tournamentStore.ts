
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
  limit
} from "firebase/firestore";
import { db } from "./firebase";
import type { Tournament, Game, Participant, Match, NotificationMessage, NotificationFormData } from './types';

const GAMES_COLLECTION = "games";
const TOURNAMENTS_COLLECTION = "tournaments";
const NOTIFICATIONS_COLLECTION = "notifications";

// --- Game Functions ---

export const addGameToFirestore = async (gameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<Game> => {
  const docRef = await addDoc(collection(db, GAMES_COLLECTION), {
    ...gameData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const newGame: Game = { 
    id: docRef.id, 
    ...gameData, 
    createdAt: Timestamp.now(), // Client-side approximation
    updatedAt: Timestamp.now()  // Client-side approximation
  };
  return newGame;
};

export const getGamesFromFirestore = async (): Promise<Game[]> => {
  const gamesSnapshot = await getDocs(query(collection(db, GAMES_COLLECTION), orderBy("name", "asc")));
  return gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
};

export const getGameByIdFromFirestore = async (gameId: string): Promise<Game | undefined> => {
  if (!gameId) return undefined;
  const docRef = doc(db, GAMES_COLLECTION, gameId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Game;
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
    startDate: Timestamp.fromDate(startDate), // Convert Date to Timestamp
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    matches: tournamentData.matches || [], // Ensure matches array exists
  });
  
  const newTournament: Tournament = {
    ...tournamentData,
    id: docRef.id,
    createdAt: Timestamp.now(), // Client-side approximation
    updatedAt: Timestamp.now()  // Client-side approximation
  };
  return newTournament;
};

export const getTournamentsFromFirestore = async (queryParams?: { status?: Tournament['status'], gameId?: string, count?: number }): Promise<Tournament[]> => {
  let qConstraints = [orderBy("startDate", "desc")];
  
  if (queryParams?.status) {
    qConstraints.push(where("status", "==", queryParams.status) as any);
  }
  if (queryParams?.gameId) {
    qConstraints.push(where("gameId", "==", queryParams.gameId) as any);
  }
  if (queryParams?.count) {
    qConstraints.push(limit(queryParams.count) as any);
  }

  const q = query(collection(db, TOURNAMENTS_COLLECTION), ...qConstraints);
  const tournamentsSnapshot = await getDocs(q);
  
  return tournamentsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: (data.startDate as Timestamp).toDate(), // Convert Timestamp to Date
      endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
    } as Tournament;
  });
};

export const getTournamentByIdFromFirestore = async (tournamentId: string): Promise<Tournament | undefined> => {
  if (!tournamentId) return undefined;
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    
    // Basic placeholder match generation if none exist and participants are present for Single Elimination
    let matches = data.matches || [];
    if (matches.length === 0 && data.participants && data.participants.length >= 2 && data.bracketType === "Single Elimination") {
        const numMatches = Math.floor(data.participants.length / 2);
        for(let i = 0; i < numMatches; i++) {
            matches.push({
                id: `m-auto-${tournamentId}-${i+1}`, // Auto-generated ID prefix
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
     updateData.endDate = null; // Explicitly set to null if passed
  }

  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  await updateDoc(docRef, updateData);
};

export const deleteTournamentFromFirestore = async (tournamentId: string): Promise<void> => {
  await deleteDoc(doc(db, TOURNAMENTS_COLLECTION, tournamentId));
};

export const addParticipantToTournament = async (tournamentId: string, participant: Participant): Promise<void> => {
  const tournament = await getTournamentByIdFromFirestore(tournamentId);
  if (tournament) {
    if (tournament.participants.find(p => p.id === participant.id)) {
      throw new Error("Participant already registered");
    }
    if (tournament.participants.length >= tournament.maxParticipants) {
      throw new Error("Tournament is full");
    }
    const updatedParticipants = [...tournament.participants, participant];
    await updateTournamentInFirestore(tournamentId, { participants: updatedParticipants });
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
  const newNotification: NotificationMessage = {
    id: docRef.id,
    ...notificationData,
    createdAt: Timestamp.now(), // Client-side approximation
  };
  return newNotification;
};

export const getNotificationsFromFirestore = async (target?: NotificationTarget): Promise<NotificationMessage[]> => {
  let qConstraints = [orderBy("createdAt", "desc")];

  if (target) {
    qConstraints.push(where("target", "==", target) as any);
  }
  
  // Fetch all notifications if no specific target or for admin view
  const q = query(collection(db, NOTIFICATIONS_COLLECTION), ...qConstraints);
  const notificationsSnapshot = await getDocs(q);
  
  return notificationsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt as Timestamp, // Ensure createdAt is Timestamp
    } as NotificationMessage;
  });
};


// Aliases for easier use from components
export const getGameDetails = getGameByIdFromFirestore;
export const getTournamentsForGame = (gameId: string) => getTournamentsFromFirestore({ gameId });
export const getTournamentDetails = getTournamentByIdFromFirestore;
export const addTournament = addTournamentToFirestore;
export const addGame = addGameToFirestore;
export const updateGameInStore = updateGameInFirestore;
export const deleteGameFromStore = deleteGameFromFirestore;
export const deleteTournamentFromStore = deleteTournamentFromFirestore;
export const getTournaments = () => getTournamentsFromFirestore();
export const getGames = getGamesFromFirestore;
