
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
import type { Tournament, Game, Participant } from './types';

const GAMES_COLLECTION = "games";
const TOURNAMENTS_COLLECTION = "tournaments";

// --- Game Functions ---

export const addGameToFirestore = async (gameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<Game> => {
  const docRef = await addDoc(collection(db, GAMES_COLLECTION), {
    ...gameData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...gameData, id: docRef.id, createdAt: Timestamp.now(), updatedAt: Timestamp.now() }; // Approximate client-side timestamp
};

export const getGamesFromFirestore = async (): Promise<Game[]> => {
  const gamesSnapshot = await getDocs(query(collection(db, GAMES_COLLECTION), orderBy("createdAt", "desc")));
  return gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
};

export const getGameByIdFromFirestore = async (gameId: string): Promise<Game | undefined> => {
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
  });
  // For client-side immediate use, we'll use the client's Date object for startDate
  // but acknowledge it will be a Timestamp in Firestore
  return { 
    ...tournamentData, 
    id: docRef.id, 
    createdAt: Timestamp.now(), // Approximate client-side timestamp
    updatedAt: Timestamp.now()  // Approximate client-side timestamp
  };
};

export const getTournamentsFromFirestore = async (queryParams?: { status?: Tournament['status'], gameId?: string, count?: number }): Promise<Tournament[]> => {
  let q = query(collection(db, TOURNAMENTS_COLLECTION), orderBy("startDate", "desc"));

  if (queryParams?.status) {
    q = query(q, where("status", "==", queryParams.status));
  }
  if (queryParams?.gameId) {
    q = query(q, where("gameId", "==", queryParams.gameId));
  }
  if (queryParams?.count) {
    q = query(q, limit(queryParams.count));
  }

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
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Basic placeholder match generation if none exist and participants are present
    let matches = data.matches || [];
    if (matches.length === 0 && data.participants && data.participants.length >= 2) {
        const numMatches = Math.floor(data.participants.length / 2);
        for(let i = 0; i < numMatches; i++) {
            matches.push({
                id: `m-${tournamentId}-${i+1}`,
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
      matches: matches, // Include generated matches if applicable
    } as Tournament;
  }
  return undefined;
};

export const updateTournamentInFirestore = async (tournamentId: string, tournamentData: Partial<Omit<Tournament, 'id' | 'createdAt' | 'startDate' | 'endDate'> & { startDate?: Date, endDate?: Date }>): Promise<void> => {
  const { startDate, endDate, ...restData } = tournamentData;
  const updateData: any = { ...restData, updatedAt: serverTimestamp() };
  if (startDate) {
    updateData.startDate = Timestamp.fromDate(startDate);
  }
  if (endDate) {
    updateData.endDate = Timestamp.fromDate(endDate);
  } else if (tournamentData.hasOwnProperty('endDate') && typeof tournamentData.endDate === 'undefined') {
     updateData.endDate = null; // Explicitly set to null if undefined is passed
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
      console.warn("Participant already registered");
      return; // Or throw error
    }
    if (tournament.participants.length >= tournament.maxParticipants) {
      console.warn("Tournament is full");
      throw new Error("Tournament is full");
    }
    const updatedParticipants = [...tournament.participants, participant];
    await updateTournamentInFirestore(tournamentId, { participants: updatedParticipants });
  } else {
    throw new Error("Tournament not found");
  }
};

// These functions are simplified versions of what was in tournamentStore.ts
// For more complex scenarios, consider using onSnapshot for real-time updates.

export const getGameDetails = getGameByIdFromFirestore; // Alias
export const getTournamentsForGame = (gameId: string) => getTournamentsFromFirestore({ gameId }); // Alias
export const getTournamentDetails = getTournamentByIdFromFirestore; // Alias
export const addTournament = addTournamentToFirestore; // Alias for Create Tournament page
export const addGame = addGameToFirestore; // Alias for Admin Games page
export const updateGameInStore = updateGameInFirestore; // Alias
export const deleteGameFromStore = deleteGameFromFirestore; // Alias
export const deleteTournamentFromStore = deleteTournamentFromFirestore; // Alias for Admin Tournaments Page / Tournament Detail Page
export const getTournaments = () => getTournamentsFromFirestore(); // Get all tournaments
export const getGames = getGamesFromFirestore; // Get all games

// Note: The simple 'subscribe' and 'notifyListeners' mechanism is removed.
// Components should re-fetch or manage their state based on Firestore operations.
// For true real-time, use Firestore's onSnapshot listeners in components.
