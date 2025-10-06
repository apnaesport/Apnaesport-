

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
  onSnapshot, 
  Query,
  increment,
  runTransaction
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./firebase";
import type { Tournament, Game, Participant, Match, NotificationMessage, NotificationFormData, NotificationTarget, SiteSettings, UserProfile, TournamentStatus, SponsorshipRequest, Community, CommunityMember, Creator, CreatorApplication, Winner, Announcement, TeamSize, PointTransaction, UnseenWin } from './types';

const GAMES_COLLECTION = "games";
const TOURNAMENTS_COLLECTION = "tournaments";
const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";
const TRANSACTIONS_COLLECTION = "transactions";
const SETTINGS_COLLECTION = "settings";
const GLOBAL_SETTINGS_ID = "global";
const SPONSORSHIPS_COLLECTION = "sponsorships";
const COMMUNITIES_COLLECTION = "communities";
const CREATORS_COLLECTION = "creators";
const CREATOR_APPLICATIONS_COLLECTION = "creatorApplications";
const UNSEEN_WINS_COLLECTION = "unseenWins";

const TOURNAMENT_CREATION_FEE = 40;
const TOURNAMENT_DELETION_PENALTY = 5;
const PLATFORM_FEE_PERCENTAGE = 0.20; // 20%
const DAILY_LOGIN_BONUS = 5;
const PREMIUM_POINT_BONUS = 200;

// Initialize Firebase Storage
const storage = getStorage();

export const uploadImageAndGetURL = async (file: File, path: string): Promise<string> => {
  if (!file) {
    throw new Error("No file provided for upload.");
  }
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

const getTournamentStatus = (tournament: Omit<Tournament, 'id'>): TournamentStatus => {
    const now = new Date();
    const startDate = tournament.startDate instanceof Date ? tournament.startDate : (tournament.startDate as Timestamp).toDate();
    const startTime = startDate.getTime();
    
    // Auto-complete tournaments 2 hours after start time if they are still 'Live' or 'Ongoing'
    const twoHoursAfterStart = startTime + (2 * 60 * 60 * 1000);

    if (tournament.status === 'Completed' || tournament.status === 'Cancelled') {
        return tournament.status;
    }
    
    if (now.getTime() > twoHoursAfterStart && (tournament.status === 'Live' || tournament.status === 'Ongoing')) {
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

export const addTournamentToFirestore = async (
    tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'prizePool'> & { startDate: Date }, 
    userId: string
): Promise<string> => {
  
  const userRef = doc(db, USERS_COLLECTION, userId);

  return runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists() || (userDoc.data().points || 0) < TOURNAMENT_CREATION_FEE) {
      throw new Error(`You need at least ${TOURNAMENT_CREATION_FEE} AE Points to create a tournament.`);
    }

    const { startDate, ...restData } = tournamentData;
    const game = await getGameByIdFromFirestore(tournamentData.gameId);
    if (!game) throw new Error("Selected game not found.");

    const newTournamentDocRef = doc(collection(db, TOURNAMENTS_COLLECTION));
    const newTournamentData = {
      ...restData,
      startDate: Timestamp.fromDate(startDate),
      status: "Upcoming", // Always start as upcoming
      prizePool: 0, // Prize pool starts at 0 and is funded by entry fees
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      matches: tournamentData.matches || [],
      featured: tournamentData.featured || false,
      entryFee: tournamentData.entryFee || 0,
      sponsorName: tournamentData.sponsorName || null,
      sponsorLogoUrl: tournamentData.sponsorLogoUrl || null,
    };

    transaction.set(newTournamentDocRef, newTournamentData);
    transaction.update(userRef, { points: increment(-TOURNAMENT_CREATION_FEE) });
    
    const transactionRef = doc(collection(db, USERS_COLLECTION, userId, TRANSACTIONS_COLLECTION));
    transaction.set(transactionRef, { 
        amount: TOURNAMENT_CREATION_FEE, 
        type: 'debit', 
        reason: `Fee for creating tournament: ${tournamentData.name}`,
        tournamentId: newTournamentDocRef.id,
        createdAt: serverTimestamp() 
    });

    return newTournamentDocRef.id;
  });
};


export const getTournamentsFromFirestore = async (queryParams?: { status?: Tournament['status'], gameId?: string, count?: number, participantId?: string, featured?: boolean, excludeQuick?: boolean }): Promise<Tournament[]> => {
  let constraints: QueryConstraint[] = [orderBy("startDate", "desc")];
  
  if (queryParams?.gameId) {
    constraints.push(where("gameId", "==", queryParams.gameId));
  }
  if (queryParams?.excludeQuick) {
    constraints.push(where("isQuickTournament", "in", [false, null]));
  }
  if (queryParams?.count) {
    constraints.push(limit(queryParams.count));
  }

  const q = query(collection(db, TOURNAMENTS_COLLECTION), ...constraints);
  const tournamentsSnapshot = await getDocs(q);
  
  const now = new Date();
  
  const tournaments = tournamentsSnapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data() as Omit<Tournament, 'id'>;
    
    const startDate = (data.startDate as Timestamp).toDate();
    let status = data.status;

    if (status !== 'Completed' && status !== 'Cancelled') {
        const twoHoursAfterStart = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        if (now >= twoHoursAfterStart) {
            status = 'Completed';
        } else if (now >= startDate) {
            status = 'Live';
        } else {
            status = 'Upcoming';
        }
    }

    return {
      id: docSnapshot.id,
      ...data,
      startDate: startDate,
      status: status, // Use the dynamically calculated status
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
    } as Tournament;
  });

  return tournaments;
};


export const getTournamentByIdFromFirestore = async (tournamentId: string): Promise<Tournament | undefined> => {
    if (!tournamentId) return undefined;
    const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            bannerImageUrl: data.bannerImageUrl || `https://placehold.co/1200x400.png?text=${encodeURIComponent(data.name)}`,
            gameIconUrl: data.gameIconUrl || `https://placehold.co/40x40.png?text=${data.gameName.substring(0, 2)}`,
        } as Tournament;
    }
    return undefined;
};


export const listenToTournamentById = (
  tournamentId: string,
  callback: (tournament: Tournament | null) => void
): (() => void) => {
  if (!tournamentId) {
    callback(null);
    return () => {}; 
  }
  const docRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
       const tournament: Tournament = {
        id: docSnap.id,
        ...data,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: data.endDate ? (data.endDate as Timestamp).toDate() : undefined,
      } as Tournament;
       callback(tournament);
    } else {
      callback(null);
    }
  });

  return unsubscribe; 
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

export const deleteTournamentFromFirestore = async (tournament: Tournament, organizerId: string): Promise<void> => {
    return runTransaction(db, async (transaction) => {
        const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournament.id);
        const organizerRef = doc(db, USERS_COLLECTION, organizerId);

        // 1. Penalize the organizer
        transaction.update(organizerRef, { points: increment(-TOURNAMENT_DELETION_PENALTY) });
        const penaltyTransactionRef = doc(collection(db, USERS_COLLECTION, organizerId, TRANSACTIONS_COLLECTION));
        transaction.set(penaltyTransactionRef, { 
            amount: TOURNAMENT_DELETION_PENALTY, 
            type: 'debit', 
            reason: `Penalty for deleting tournament: ${tournament.name}`,
            tournamentId: tournament.id,
            createdAt: serverTimestamp() 
        });

        // 2. Refund all participants
        if (tournament.participants && tournament.participants.length > 0 && tournament.entryFee > 0) {
            for (const participant of tournament.participants) {
                const participantRef = doc(db, USERS_COLLECTION, participant.id);
                transaction.update(participantRef, { points: increment(tournament.entryFee) });
                
                const refundTransactionRef = doc(collection(db, USERS_COLLECTION, participant.id, TRANSACTIONS_COLLECTION));
                transaction.set(refundTransactionRef, { 
                    amount: tournament.entryFee, 
                    type: 'credit', 
                    reason: `Refund for cancelled tournament: ${tournament.name}`,
                    tournamentId: tournament.id,
                    createdAt: serverTimestamp() 
                });
            }
        }
        
        // 3. Delete the tournament document
        transaction.delete(tournamentRef);
    });
};

export const addParticipantToTournamentFirestore = async (tournamentId: string, participant: Participant, fee: number): Promise<void> => {
  return runTransaction(db, async (transaction) => {
    const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
    const userRef = doc(db, USERS_COLLECTION, participant.id);
    const transactionRef = doc(collection(db, USERS_COLLECTION, participant.id, TRANSACTIONS_COLLECTION));

    const tournamentSnap = await transaction.get(tournamentRef);
    const userSnap = await transaction.get(userRef);

    if (!tournamentSnap.exists()) throw new Error("Tournament not found");
    if (!userSnap.exists()) throw new Error("User not found");

    const tournamentData = tournamentSnap.data() as Tournament;
    const userData = userSnap.data() as UserProfile;

    if (tournamentData.participants.find(p => p.id === participant.id)) {
      throw new Error("Participant already registered");
    }
    if (tournamentData.participants.length >= tournamentData.maxParticipants) {
      throw new Error("Tournament is full");
    }
    if ((userData.points || 0) < fee) {
      throw new Error("Insufficient AE Points to join.");
    }
    
    if (fee > 0) {
        // Deduct points from user
        transaction.update(userRef, { points: increment(-fee) });
         // Create a transaction record
        transaction.set(transactionRef, { 
            amount: fee, 
            type: 'debit', 
            reason: `Entry fee for: ${tournamentData.name}`,
            tournamentId: tournamentId,
            createdAt: serverTimestamp() 
        });
    }

    // Add participant to tournament and increase prize pool
    transaction.update(tournamentRef, {
      participants: arrayUnion(participant),
      prizePool: increment(fee),
      updatedAt: serverTimestamp()
    });
  });
};

export const awardTournamentWinners = async (
    tournamentId: string, 
    winners: { first: Winner, second: Winner, third: Winner }
): Promise<void> => {
    return runTransaction(db, async (transaction) => {
        const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournamentId);
        const tournamentDoc = await transaction.get(tournamentRef);

        if (!tournamentDoc.exists()) throw new Error("Tournament not found.");
        const tournamentData = tournamentDoc.data() as Tournament;

        const startDate = (tournamentData.startDate as Timestamp).toDate();
        if (new Date() < startDate) {
             throw new Error("Tournament has not started yet.");
        }

        if (tournamentData.winners && tournamentData.winners.length > 0) {
            throw new Error("Winners have already been declared for this tournament.");
        }

        const totalPrizePool = (tournamentData.entryFee || 0) * tournamentData.participants.length;

        const prizeDistribution = {
            first: Math.floor(totalPrizePool * 0.5),
            second: Math.floor(totalPrizePool * 0.3),
            third: Math.floor(totalPrizePool * 0.2)
        };
        const finalWinners: Winner[] = [];

        const processWinner = (winnerData: Winner, rank: 1 | 2 | 3, prize: number) => {
            const { participant, kills, deaths } = winnerData;
            
            const winnerRef = doc(db, USERS_COLLECTION, participant.id);
            const updatePayload: any = {
                monthlyWins: increment(1),
                kills: increment(kills || 0),
                deaths: increment(deaths || 0),
                unseenWins: arrayUnion({
                    id: `${tournamentId}-${rank}`,
                    tournamentId,
                    tournamentName: tournamentData.name,
                    rank,
                    prize,
                })
            };
            if (prize > 0) {
                updatePayload.points = increment(prize);
                const prizeTransactionRef = doc(collection(db, USERS_COLLECTION, participant.id, TRANSACTIONS_COLLECTION));
                transaction.set(prizeTransactionRef, {
                    amount: prize,
                    type: 'credit',
                    reason: `Prize for ${rank === 1 ? '1st' : rank === 2 ? 'nd' : '3rd'} place in ${tournamentData.name}`,
                    tournamentId: tournamentId,
                    createdAt: serverTimestamp()
                });
            }
            transaction.update(winnerRef, updatePayload);
            finalWinners.push({ rank, participant, prize, kills, deaths });
        };
        
        processWinner(winners.first, 1, prizeDistribution.first);
        processWinner(winners.second, 2, prizeDistribution.second);
        processWinner(winners.third, 3, prizeDistribution.third);
        
        // Update tournament doc
        transaction.update(tournamentRef, { status: "Completed", winners: finalWinners, updatedAt: serverTimestamp() });
    });
};


// --- Notification Functions ---

export const sendNotificationToFirestore = async (notificationData: NotificationFormData): Promise<string[]> => {
  const batch = writeBatch(db);
  const docIds: string[] = [];

  if (notificationData.target === 'tournament_participants' && notificationData.tournamentId) {
      const tournament = await getTournamentByIdFromFirestore(notificationData.tournamentId);
      if (tournament && tournament.participants.length > 0) {
          tournament.participants.forEach(p => {
              const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
              batch.set(docRef, { 
                  ...notificationData, 
                  targetUserId: p.id, // Target specific user
                  createdAt: serverTimestamp() 
              });
              docIds.push(docRef.id);
          });
      } else {
          throw new Error("Tournament not found or has no participants.");
      }
  } else {
      const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
      batch.set(docRef, { 
          ...notificationData, 
          target: "all_users", // Default to all_users if not targeting specific tournament
          createdAt: serverTimestamp() 
      });
      docIds.push(docRef.id);
  }

  await batch.commit();
  return docIds;
};

export const getNotificationsFromFirestore = async (target?: NotificationTarget, userId?: string): Promise<NotificationMessage[]> => {
  let q;
  const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
  
  if (userId) {
      // Fetch global notifications OR notifications targeted to this user
      const globalQuery = query(notificationsRef, where("target", "==", "all_users"));
      const userSpecificQuery = query(notificationsRef, where("targetUserId", "==", userId));
      
      const [globalSnapshot, userSnapshot] = await Promise.all([
          getDocs(globalQuery),
          getDocs(userSpecificQuery)
      ]);
      
      const allNotifications: NotificationMessage[] = [];
      globalSnapshot.forEach(doc => allNotifications.push({ id: doc.id, ...doc.data() } as NotificationMessage));
      userSnapshot.forEach(doc => allNotifications.push({ id: doc.id, ...doc.data() } as NotificationMessage));
      
      // Sort combined notifications by date
      allNotifications.sort((a, b) => (b.createdAt as Timestamp).toMillis() - (a.createdAt as Timestamp).toMillis());
      return allNotifications;

  } else {
      // Admin view: fetch all notifications
      q = query(notificationsRef, orderBy("createdAt", "desc"));
  }
  
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

export const generateApnaId = async (): Promise<string> => {
    let newId;
    let isUnique = false;
    while (!isUnique) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        newId = `AE${randomNum}`;
        const q = query(collection(db, USERS_COLLECTION), where("apnaId", "==", newId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            isUnique = true;
        }
    }
    return newId;
};

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
      isPremium: data.isPremium || false,
      premiumSince: data.premiumSince as Timestamp,
      createdAt: data.createdAt as Timestamp,
      lastBonusClaimedAt: data.lastBonusClaimedAt as Timestamp,
      hasReceivedPremiumBonus: data.hasReceivedPremiumBonus || false,
      hasSeenPremiumPopup: data.hasSeenPremiumPopup,
      bio: data.bio || "",
      favoriteGameIds: data.favoriteGameIds || [],
      streamingChannelUrl: data.streamingChannelUrl || "",
      communityId: data.communityId || null,
      points: data.points || 0,
      wins: data.wins || 0,
      monthlyWins: data.monthlyWins || 0,
      kills: data.kills || 0,
      deaths: data.deaths || 0,
      apnaId: data.apnaId,
      unseenWins: data.unseenWins || [],
    } as UserProfile;
  }
  return null;
};

const isNewDayForBonus = (lastClaimed: Timestamp | undefined): boolean => {
    if (!lastClaimed) return true; // Never claimed before

    const lastClaimDate = lastClaimed.toDate();
    const now = new Date();
    
    // Reset hours, minutes, seconds for accurate date comparison
    lastClaimDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    return now.getTime() > lastClaimDate.getTime();
};

export const isDailyBonusAvailable = async (userId: string): Promise<boolean> => {
    const user = await getUserProfileFromFirestore(userId);
    if (!user) return false;
    return isNewDayForBonus(user.lastBonusClaimedAt);
};

export const claimDailyBonus = async (userId: string): Promise<{ success: boolean, message: string, amount?: number }> => {
    const userRef = doc(db, USERS_COLLECTION, userId);

    try {
        const result = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User not found.");
            }
            const userData = userDoc.data() as UserProfile;

            if (!isNewDayForBonus(userData.lastBonusClaimedAt)) {
                return { success: false, message: "Bonus already claimed today." };
            }

            // Award the bonus
            transaction.update(userRef, {
                points: increment(DAILY_LOGIN_BONUS),
                lastBonusClaimedAt: serverTimestamp()
            });

            // Log the transaction
            const transactionRef = doc(collection(db, USERS_COLLECTION, userId, TRANSACTIONS_COLLECTION));
            transaction.set(transactionRef, {
                amount: DAILY_LOGIN_BONUS,
                type: 'credit',
                reason: 'Daily Bonus Claimed',
                createdAt: serverTimestamp()
            });

            return { success: true, message: "Bonus claimed successfully!", amount: DAILY_LOGIN_BONUS };
        });
        return result;
    } catch (error: any) {
        console.error("Error claiming daily bonus:", error);
        return { success: false, message: error.message || "An unknown error occurred." };
    }
};

export const getUnseenWinsFromFirestore = async (userId: string): Promise<UnseenWin[]> => {
    const user = await getUserProfileFromFirestore(userId);
    return user?.unseenWins || [];
};

export const clearUnseenWinsFromFirestore = async (userId: string, winId: string): Promise<void> => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const user = await getUserProfileFromFirestore(userId);
    if (user && user.unseenWins) {
        const winsToKeep = user.unseenWins.filter(win => win.id !== winId);
        await updateDoc(userRef, { unseenWins: winsToKeep });
    }
};


export const getPointTransactions = async (userId: string): Promise<PointTransaction[]> => {
    const transactionsRef = collection(db, USERS_COLLECTION, userId, TRANSACTIONS_COLLECTION);
    const q = query(transactionsRef, orderBy("createdAt", "desc"), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        userId: userId,
        ...doc.data()
    } as PointTransaction));
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
      isPremium: data.isPremium || false,
      premiumSince: data.premiumSince as Timestamp,
      createdAt: data.createdAt as Timestamp,
      lastBonusClaimedAt: data.lastBonusClaimedAt as Timestamp,
      hasReceivedPremiumBonus: data.hasReceivedPremiumBonus || false,
      bio: data.bio || "",
      favoriteGameIds: data.favoriteGameIds || [],
      streamingChannelUrl: data.streamingChannelUrl || "",
      communityId: data.communityId || null,
      points: data.points || 0,
      wins: data.wins || 0,
      monthlyWins: data.monthlyWins || 0,
      kills: data.kills || 0,
      deaths: data.deaths || 0,
      apnaId: data.apnaId,
    };
  });
};

export const getTopPlayersByMonthlyWins = async (count: number): Promise<(UserProfile & { kda: string })[]> => {
    const q = query(
        collection(db, USERS_COLLECTION),
        where("monthlyWins", ">", 0),
        orderBy("monthlyWins", "desc"),
        limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const kills = data.kills || 0;
        const deaths = data.deaths || 0;
        return {
            uid: doc.id,
            displayName: data.displayName || "Anonymous",
            photoURL: data.photoURL || '',
            apnaId: data.apnaId || 'N/A',
            monthlyWins: data.monthlyWins || 0,
            points: data.points || 0,
            kills: kills,
            deaths: deaths,
            kda: deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2), // Calculate KDA
        } as UserProfile & { kda: string };
    });
};

export const listenToTopPlayersByMonthlyWins = (count: number, callback: (players: (UserProfile & { kda: string })[]) => void): (() => void) => {
    const q = query(
        collection(db, USERS_COLLECTION),
        where("monthlyWins", ">", 0),
        orderBy("monthlyWins", "desc"),
        limit(count)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const players = snapshot.docs.map(doc => {
            const data = doc.data();
            const kills = data.kills || 0;
            const deaths = data.deaths || 0;
            return {
                uid: doc.id,
                displayName: data.displayName || "Anonymous",
                photoURL: data.photoURL || `https://i.pravatar.cc/150?u=${doc.id}`,
                apnaId: data.apnaId || 'N/A',
                monthlyWins: data.monthlyWins || 0,
                points: data.points || 0,
                kills: kills,
                deaths: deaths,
                kda: deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2),
            } as UserProfile & { kda: string };
        });
        callback(players);
    });

    return unsubscribe;
};


export const updateUserAdminStatusInFirestore = async (userId: string, isAdmin: boolean): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, { isAdmin, updatedAt: serverTimestamp() });
};

export const updateUserProfileInFirestore = async (userId: string, profileData: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'favoriteGameIds' | 'streamingChannelUrl' | 'points' | 'communityId' | 'hasSeenPremiumPopup'>>): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const dataToUpdate: any = { ...profileData, updatedAt: serverTimestamp() };
  
  if (profileData.hasOwnProperty('favoriteGameIds') && !Array.isArray(profileData.favoriteGameIds)) {
    dataToUpdate.favoriteGameIds = [];
  }
  if (profileData.hasOwnProperty('communityId') && profileData.communityId === undefined) {
    dataToUpdate.communityId = null;
  }

  await updateDoc(userRef, dataToUpdate);
};

export const adjustUserPoints = async (userId: string, amount: number, type: 'credit' | 'debit', reason: string): Promise<void> => {
    if (amount <= 0) throw new Error("Amount must be positive.");

    return runTransaction(db, async (transaction) => {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const transactionRef = doc(collection(db, USERS_COLLECTION, userId, TRANSACTIONS_COLLECTION));
        
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("User not found.");

        const change = type === 'credit' ? amount : -amount;
        
        transaction.update(userRef, { points: increment(change) });
        transaction.set(transactionRef, {
            amount: amount,
            type: type,
            reason: `From Apna Esport: ${reason}`, // Prefix with Admin for clarity
            createdAt: serverTimestamp()
        });
    });
};

// --- Premium User Functions ---
export const updateUserPremiumStatus = async (identifier: string, isPremium: boolean): Promise<void> => {
    return runTransaction(db, async (transaction) => {
        let userQuery;
        if (identifier.includes('@')) {
            userQuery = query(collection(db, USERS_COLLECTION), where("email", "==", identifier), limit(1));
        } else if (identifier.startsWith('AE')) {
            userQuery = query(collection(db, USERS_COLLECTION), where("apnaId", "==", identifier), limit(1));
        } else {
             userQuery = query(collection(db, USERS_COLLECTION), where("uid", "==", identifier), limit(1));
        }
        
        const querySnapshot = await getDocs(userQuery);
        if (querySnapshot.empty) {
            throw new Error("User not found with that identifier.");
        }
        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userData = userDoc.data() as UserProfile;

        const updateData: any = {
            isPremium: isPremium,
            updatedAt: serverTimestamp(),
        };

        if (isPremium) {
            updateData.premiumSince = serverTimestamp();
            updateData.hasSeenPremiumPopup = false; // Set to false so user sees the popup
            if (!userData.hasReceivedPremiumBonus) {
                updateData.points = increment(PREMIUM_POINT_BONUS);
                updateData.hasReceivedPremiumBonus = true;

                const transactionRef = doc(collection(db, USERS_COLLECTION, userId, TRANSACTIONS_COLLECTION));
                transaction.set(transactionRef, {
                    amount: PREMIUM_POINT_BONUS,
                    type: 'credit',
                    reason: 'One-Time Premium Bonus',
                    createdAt: serverTimestamp()
                });
            }
        }
        transaction.update(userRef, updateData);
    });
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

export const saveSiteSettingsToFirestore = async (settingsData: Partial<SiteSettings>): Promise<void> => {
  const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
  const { id, ...dataToSave } = settingsData;
  await setDoc(docRef, {
    ...dataToSave,
    updatedAt: serverTimestamp(),
  }, { merge: true });
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


// --- Community Functions ---

export const createCommunityInFirestore = async (
    communityData: Pick<Community, 'name' | 'tagline' | 'description' | 'gameName' | 'gameId'>, 
    owner: UserProfile,
    settings: SiteSettings | null
): Promise<string> => {
    if (!owner) throw new Error("An owner is required to create a community.");
    if (owner.communityId) throw new Error("You are already in a community.");

    const batch = writeBatch(db);

    const communityRef = doc(collection(db, COMMUNITIES_COLLECTION));
    const newCommunity: Omit<Community, 'id'> = {
        name: communityData.name,
        tagline: communityData.tagline,
        description: communityData.description,
        ownerId: owner.uid,
        ownerName: owner.displayName || 'Owner',
        gameId: communityData.gameId || null,
        gameName: communityData.gameName || 'Variety',
        logoUrl: settings?.defaultCommunityLogoUrl || `https://placehold.co/100x100.png?text=${communityData.name.substring(0, 2)}`,
        bannerUrl: settings?.defaultCommunityBannerUrl || `https://placehold.co/800x200.png?text=${encodeURIComponent(communityData.name)}`,
        memberCount: 1,
        level: 1,
        points: 0,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
    };
    batch.set(communityRef, newCommunity);

    const ownerMemberRef = doc(db, COMMUNITIES_COLLECTION, communityRef.id, 'members', owner.uid);
    batch.set(ownerMemberRef, {
        uid: owner.uid,
        displayName: owner.displayName,
        avatarUrl: owner.photoURL,
        role: "Owner",
        points: 0,
        joinedAt: serverTimestamp(),
    });

    const userRef = doc(db, USERS_COLLECTION, owner.uid);
    batch.update(userRef, { communityId: communityRef.id });

    await batch.commit();
    return communityRef.id;
};

export const joinCommunity = async (communityId: string, user: UserProfile) => {
    const batch = writeBatch(db);

    // Add user to community's members subcollection
    const memberRef = doc(db, COMMUNITIES_COLLECTION, communityId, 'members', user.uid);
    batch.set(memberRef, {
        uid: user.uid,
        displayName: user.displayName,
        avatarUrl: user.photoURL,
        role: "Member",
        points: 0,
        joinedAt: serverTimestamp(),
    });

    // Update user's profile with communityId
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    batch.update(userRef, { communityId: communityId });

    // Increment member count on community
    const communityRef = doc(db, COMMUNITIES_COLLECTION, communityId);
    batch.update(communityRef, { memberCount: increment(1) });

    await batch.commit();
};

export const leaveCommunity = async (communityId: string, user: UserProfile) => {
    const batch = writeBatch(db);

    // Remove user from community's members subcollection
    const memberRef = doc(db, COMMUNITIES_COLLECTION, communityId, 'members', user.uid);
    batch.delete(memberRef);

    // Remove communityId from user's profile
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    batch.update(userRef, { communityId: null });

    // Decrement member count on community
    const communityRef = doc(db, COMMUNITIES_COLLECTION, communityId);
    batch.update(communityRef, { memberCount: increment(-1) });

    await batch.commit();
};


export const getCommunitiesFromFirestore = async (excludeId?: string): Promise<Community[]> => {
    const q = query(collection(db, COMMUNITIES_COLLECTION), orderBy("createdAt", "desc"));
    const communitiesSnapshot = await getDocs(q);
    
    let communities = communitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
    
    if (excludeId) {
        communities = communities.filter(community => community.id !== excludeId);
    }
    
    return communities;
};


export const getCommunityByIdFromFirestore = async (communityId: string): Promise<Community | null> => {
    if (!communityId) return null;
    const docRef = doc(db, COMMUNITIES_COLLECTION, communityId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt as Timestamp,
            updatedAt: data.updatedAt as Timestamp,
        } as Community;
    }
    return null;
};


export const listenToCommunityById = (
    communityId: string,
    callback: (community: Community | null) => void
): (() => void) => {
  if (!communityId) {
    callback(null);
    return () => {}; 
  }
  const docRef = doc(db, COMMUNITIES_COLLECTION, communityId);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
       const community: Community = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt as Timestamp,
        updatedAt: data.updatedAt as Timestamp,
      } as Community;
       callback(community);
    } else {
      callback(null);
    }
  });

  return unsubscribe; 
};


export const getCommunityMembers = async (communityId: string): Promise<CommunityMember[]> => {
    const membersRef = collection(db, COMMUNITIES_COLLECTION, communityId, 'members');
    const membersSnap = await getDocs(query(membersRef, orderBy("joinedAt", "asc")));
    return membersSnap.docs.map(doc => doc.data() as CommunityMember);
}

export const updateCommunityDetailsInFirestore = async (communityId: string, updates: Partial<Community>): Promise<void> => {
    const communityRef = doc(db, COMMUNITIES_COLLECTION, communityId);
    await updateDoc(communityRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

export const deleteCommunityFromFirestore = async (communityId: string): Promise<void> => {
    const batch = writeBatch(db);
    
    // 1. Get all members to update their user profiles
    const members = await getCommunityMembers(communityId);
    
    // 2. For each member, update their user profile to remove communityId
    for (const member of members) {
        const userRef = doc(db, USERS_COLLECTION, member.uid);
        batch.update(userRef, { communityId: null });
        
        // 3. Delete the member document from the subcollection
        const memberDocRef = doc(db, COMMUNITIES_COLLECTION, communityId, 'members', member.uid);
        batch.delete(memberDocRef);
    }
    
    // 4. Delete the main community document
    const communityRef = doc(db, COMMUNITIES_COLLECTION, communityId);
    batch.delete(communityRef);
    
    // 5. Commit all operations
    await batch.commit();
};


// --- Community Announcement Functions ---

export const listenToAnnouncements = (communityId: string, callback: (announcements: Announcement[]) => void) => {
    const announcementsRef = collection(db, COMMUNITIES_COLLECTION, communityId, 'announcements');
    const q = query(announcementsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const announcements = snapshot.docs.map(doc => ({
            id: doc.id,
            communityId,
            ...doc.data()
        } as Announcement));
        callback(announcements);
    });
};

export const addAnnouncement = async (communityId: string, data: Omit<Announcement, 'id' | 'communityId' | 'createdAt'>) => {
    const announcementsRef = collection(db, COMMUNITIES_COLLECTION, communityId, 'announcements');
    await addDoc(announcementsRef, {
        ...data,
        createdAt: serverTimestamp(),
    });
};

export const updateAnnouncement = async (communityId: string, announcementId: string, data: Partial<Announcement>) => {
    const announcementRef = doc(db, COMMUNITIES_COLLECTION, communityId, 'announcements', announcementId);
    await updateDoc(announcementRef, data);
};

export const deleteAnnouncement = async (communityId: string, announcementId: string) => {
    const announcementRef = doc(db, COMMUNITIES_COLLECTION, communityId, 'announcements', announcementId);
    await deleteDoc(announcementRef);
};

// --- Quick Tournament for Community ---

export const addQuickTournamentToFirestore = async (
    data: { name: string, gameId: string, mapName?: string, teamSize: TeamSize, time: string },
    community: Community,
    owner: UserProfile
): Promise<string> => {
    const game = await getGameByIdFromFirestore(data.gameId);
    if (!game) throw new Error("Selected game not found.");

    const [hours, minutes] = data.time.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    if (startDate < new Date()) {
        throw new Error("Cannot create a tournament for a past time.");
    }

    const newTournamentData: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'prizePool'> = {
        name: data.name,
        gameId: data.gameId,
        gameName: game.name,
        gameIconUrl: game.iconUrl,
        bannerImageUrl: game.bannerUrl,
        description: `A quick tournament for the ${community.name} community.`,
        startDate: startDate,
        maxParticipants: 50,
        entryFee: 10, // Default entry fee for quick tournaments
        matchType: game.matchTypes?.[0] || 'Battle Royale',
        mapName: data.mapName || game.mapNames?.[0] || 'Not specified',
        teamSize: data.teamSize,
        organizer: community.name,
        organizerId: owner.uid,
        participants: [],
        matches: [],
        featured: false,
        rules: "Standard community tournament rules apply. Be respectful.",
        isQuickTournament: true,
        communityId: community.id,
    };

    const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION), {
        ...newTournamentData,
        prizePool: 0,
        startDate: Timestamp.fromDate(startDate),
        status: "Upcoming",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return docRef.id;
}


// --- Creator Functions ---

export const submitCreatorApplicationInFirestore = async (applicationData: Omit<CreatorApplication, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    // Check if user already has a pending or approved application
    const q = query(
        collection(db, CREATOR_APPLICATIONS_COLLECTION),
        where("userId", "==", applicationData.userId),
        where("status", "in", ["Pending", "Approved"])
    );
    const existingApps = await getDocs(q);
    if (!existingApps.empty) {
        throw new Error("You already have an active or approved application.");
    }

    const docRef = await addDoc(collection(db, CREATOR_APPLICATIONS_COLLECTION), {
        ...applicationData,
        status: "Pending",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getCreatorApplicationsFromFirestore = async (): Promise<CreatorApplication[]> => {
    const snapshot = await getDocs(query(collection(db, CREATOR_APPLICATIONS_COLLECTION), orderBy("createdAt", "asc")));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
    } as CreatorApplication));
};

export const getMyApplicationsFromFirestore = async (userId: string): Promise<CreatorApplication[]> => {
    if (!userId) return [];
    const q = query(
        collection(db, CREATOR_APPLICATIONS_COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
    } as CreatorApplication));
};

export const approveCreatorApplicationInFirestore = async (app: CreatorApplication): Promise<void> => {
    const batch = writeBatch(db);
    const community = await getCommunityByIdFromFirestore(app.communityId || '');

    const creatorRef = doc(db, CREATORS_COLLECTION, app.userId);
    const newCreatorData: Omit<Creator, 'id'> = {
        userId: app.userId,
        name: app.creatorName, // Use creator name from application
        avatarUrl: app.logoUrl || app.photoURL, // Use logo from application
        channelUrl: app.channelUrl,
        tags: app.tags,
        followers: "0", 
        votes: 0,
        votedBy: [],
        createdAt: serverTimestamp(),
        communityId: community?.id || null,
        communityName: community?.name || null,
    };
    batch.set(creatorRef, newCreatorData);

    const appRef = doc(db, CREATOR_APPLICATIONS_COLLECTION, app.id);
    batch.update(appRef, { status: 'Approved' });

    await batch.commit();
};

export const rejectCreatorApplicationInFirestore = async (appId: string): Promise<void> => {
    const appRef = doc(db, CREATOR_APPLICATIONS_COLLECTION, appId);
    await updateDoc(appRef, { status: 'Rejected' });
};

export const getCreatorsFromFirestore = async (): Promise<Creator[]> => {
    const snapshot = await getDocs(query(collection(db, CREATORS_COLLECTION), orderBy("votes", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creator));
};

export const getCreatorById = async (creatorId: string): Promise<Creator | null> => {
    if (!creatorId) return null;
    const docRef = doc(db, CREATORS_COLLECTION, creatorId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Creator;
    }
    return null;
}

export const deleteCreatorFromFirestore = async (creatorId: string): Promise<void> => {
    const batch = writeBatch(db);

    // Delete the creator document
    const creatorRef = doc(db, CREATORS_COLLECTION, creatorId);
    batch.delete(creatorRef);
    
    // Find and archive the corresponding 'Approved' application
    const appsQuery = query(
        collection(db, CREATOR_APPLICATIONS_COLLECTION),
        where("userId", "==", creatorId),
        where("status", "==", "Approved"),
        limit(1)
    );
    
    const appSnapshot = await getDocs(appsQuery);
    if (!appSnapshot.empty) {
        const appDoc = appSnapshot.docs[0];
        const appRef = doc(db, CREATOR_APPLICATIONS_COLLECTION, appDoc.id);
        batch.update(appRef, { status: "Archived" });
    }

    await batch.commit();
};

// Real-time listeners for creators
export const listenToCreators = (callback: (data: Creator[]) => void): (() => void) => {
    const q = query(collection(db, CREATORS_COLLECTION), orderBy("votes", "desc"));
    return onSnapshot(q, (snapshot) => {
        const creators = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creator));
        callback(creators);
    });
};

export const listenToTopCreators = (count: number, callback: (data: Creator[]) => void): (() => void) => {
    const q = query(collection(db, CREATORS_COLLECTION), orderBy("votes", "desc"), limit(count));
    return onSnapshot(q, (snapshot) => {
        const creators = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creator));
        callback(creators);
    });
};

export const voteForCreatorInFirestore = async (creatorId: string, userId: string): Promise<void> => {
    const creatorRef = doc(db, CREATORS_COLLECTION, creatorId);

    return runTransaction(db, async (transaction) => {
        const creatorDoc = await transaction.get(creatorRef);
        if (!creatorDoc.exists()) {
            throw new Error("Creator does not exist.");
        }

        const creatorData = creatorDoc.data() as Creator;
        if (creatorData.votedBy?.includes(userId)) {
            throw new Error("You have already voted for this creator.");
        }

        transaction.update(creatorRef, {
            votes: increment(1),
            votedBy: arrayUnion(userId)
        });
    });
};



// Aliases for easier use
export const getGameDetails = getGameByIdFromFirestore;
export const getTournamentsForGame = (gameId: string) => getTournamentsFromFirestore({ gameId });
export const getTournamentDetails = getTournamentByIdFromFirestore;
export const getCommunityDetails = getCommunityByIdFromFirestore;
