

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
  type Query,
  increment,
  runTransaction
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./firebase";
import type { Tournament, Game, Participant, Match, NotificationMessage, NotificationFormData, NotificationTarget, SiteSettings, UserProfile, TournamentStatus, SponsorshipRequest, Community, CommunityMember, Creator, CreatorApplication, Winner, Announcement, TeamSize, PointTransaction, UnseenWin, PremiumRequest, PrizeDistribution, TournamentFormDataUI, Team, TeamMember, TeamInvite } from './types';

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
const PREMIUM_REQUESTS_COLLECTION = "premiumRequests";
const TEAMS_COLLECTION = "teams";
const INVITES_COLLECTION = "invites";

const TOURNAMENT_CREATION_FEE = 40;
const TOURNAMENT_DELETION_PENALTY = 5;
const PLATFORM_FEE_PERCENTAGE = 0.20; // 20%
const DAILY_LOGIN_BONUS = 20;
const PREMIUM_POINT_BONUS = 200;
const CAPTAIN_BONUS_PERCENTAGE = 0.10; // 10% of platform fee

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
    
    if (now.getTime() > twoHoursAfterStart && (tournament.status === 'Live' || 'Ongoing')) {
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
    tournamentUiData: TournamentFormDataUI, 
    user: UserProfile,
): Promise<string> => {
  
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const isMock = tournamentUiData.isMock || false;

  return runTransaction(db, async (transaction) => {
    if (!isMock) {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists() || (userDoc.data().points || 0) < TOURNAMENT_CREATION_FEE) {
            throw new Error(`You need at least ${TOURNAMENT_CREATION_FEE} AE Points to create a tournament.`);
        }
    }

    const game = await getGameByIdFromFirestore(tournamentUiData.gameId);
    if (!game) throw new Error("Selected game not found.");

    const newTournamentDocRef = doc(collection(db, TOURNAMENTS_COLLECTION));
    
    let mockParticipants: Participant[] = [];
    if (isMock && tournamentUiData.mockParticipantCount && tournamentUiData.mockParticipantCount > 0) {
        for (let i = 0; i < tournamentUiData.mockParticipantCount; i++) {
            mockParticipants.push({
                id: `mock_user_${i}`,
                name: `Player ${1000 + i}`,
                avatarUrl: `https://i.pravatar.cc/150?u=player${i}`,
                gameUsername: `player${1000 + i}`,
                inGameId: `123456789${i}`,
            });
        }
    }
    
    const prizeDistribution = tournamentUiData.prizeDistribution || { first: 0, second: 0, third: 0 };
    
    let winners: Winner[] = [];
    if(isMock && tournamentUiData.status === 'Completed' && mockParticipants.length >= 3) {
        winners = [
            { rank: 1, participant: mockParticipants[0], prize: prizeDistribution.first },
            { rank: 2, participant: mockParticipants[1], prize: prizeDistribution.second },
            { rank: 3, participant: mockParticipants[2], prize: prizeDistribution.third },
        ];
    }

    // Omit undefined optional fields
    const cleanSponsorName = tournamentUiData.sponsorName || '';
    const cleanSponsorLogoUrl = tournamentUiData.sponsorLogoUrl || '';

    const newTournamentData: Omit<Tournament, 'id'> = {
      name: tournamentUiData.name,
      gameId: tournamentUiData.gameId,
      gameName: game.name,
      gameIconUrl: game.iconUrl,
      bannerImageUrl: tournamentUiData.bannerImageUrl || game.bannerUrl || `https://placehold.co/1200x400.png?text=${encodeURIComponent(tournamentUiData.name)}`,
      description: tournamentUiData.description,
      startDate: Timestamp.fromDate(tournamentUiData.startDate), 
      status: tournamentUiData.status,
      maxParticipants: tournamentUiData.maxParticipants,
      entryFee: isMock ? 0 : tournamentUiData.entryFee,
      prizePool: 0, // Prize pool is calculated from entry fees, not set at creation
      prizeDistribution,
      matchType: tournamentUiData.matchType,
      mapName: tournamentUiData.mapName === "any" ? "" : tournamentUiData.mapName,
      teamSize: tournamentUiData.teamSize,
      rules: tournamentUiData.rules,
      registrationInstructions: tournamentUiData.registrationInstructions,
      organizerId: user.uid,
      organizer: user.displayName || user.email || "Unknown Organizer",
      participants: isMock ? mockParticipants : [], 
      matches: [], 
      featured: tournamentUiData.featured || false,
      sponsorName: cleanSponsorName,
      sponsorLogoUrl: cleanSponsorLogoUrl,
      isMock: tournamentUiData.isMock,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      winners: isMock ? winners : [],
    };

    transaction.set(newTournamentDocRef, newTournamentData);
    
    if (!isMock) {
        transaction.update(userRef, { points: increment(-TOURNAMENT_CREATION_FEE) });
        
        const transactionRef = doc(collection(db, USERS_COLLECTION, user.uid, TRANSACTIONS_COLLECTION));
        transaction.set(transactionRef, { 
            amount: TOURNAMENT_CREATION_FEE, 
            type: 'debit', 
            reason: `Fee for creating tournament: ${tournamentUiData.name}`,
            tournamentId: newTournamentDocRef.id,
            createdAt: serverTimestamp() 
        });
    }

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
        let status = data.status;
        const startDate = (data.startDate as Timestamp).toDate();
        const now = new Date();

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
            id: docSnap.id,
            ...data,
            status,
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

export const addTeamToTournamentFirestore = async (tournament: Tournament, team: Team, captain: UserProfile): Promise<void> => {
    const requiredTeamSize = tournament.teamSize === 'Duo' ? 2 : tournament.teamSize === 'Squad' ? 4 : 1;
    if (team.members.length < requiredTeamSize) {
        throw new Error(`Your team has ${team.members.length} members but this is a ${tournament.teamSize} tournament.`);
    }

    return runTransaction(db, async (transaction) => {
        const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournament.id);
        const tournamentDoc = await transaction.get(tournamentRef);
        if (!tournamentDoc.exists()) throw new Error("Tournament not found.");
        const tournamentData = tournamentDoc.data() as Tournament;

        const feePerPlayer = tournamentData.entryFee || 0;
        if (feePerPlayer <= 0) { // If it's a free tournament, just add everyone.
            const newParticipants = team.members.map(member => ({
                id: member.uid, name: member.name, avatarUrl: member.avatarUrl,
                gameUsername: member.name, inGameId: 'N/A', teamId: team.id, teamName: team.name
            }));
            transaction.update(tournamentRef, { participants: arrayUnion(...newParticipants) });
            return;
        }

        const participantIds = new Set(tournamentData.participants.map(p => p.id));
        const memberRefs = team.members.map(m => doc(db, USERS_COLLECTION, m.uid));
        const memberDocs = await Promise.all(memberRefs.map(ref => transaction.get(ref)));

        for (const memberDoc of memberDocs) {
            if (!memberDoc.exists()) throw new Error(`Team member ${memberDoc.id} not found.`);
            const memberData = memberDoc.data() as UserProfile;
            if (participantIds.has(memberData.uid)) throw new Error(`${memberData.displayName} is already registered.`);
            if ((memberData.points || 0) < feePerPlayer) throw new Error(`${memberData.displayName} has insufficient AE Points.`);
        }

        if (tournamentData.participants.length + team.members.length > tournamentData.maxParticipants) {
            throw new Error("Not enough slots available in the tournament for your team.");
        }
        
        let totalFeeCollected = 0;
        for (const memberDoc of memberDocs) {
            const memberData = memberDoc.data() as UserProfile;
            transaction.update(memberDoc.ref, { points: increment(-feePerPlayer) });
            
            const feeTransactionRef = doc(collection(db, USERS_COLLECTION, memberData.uid, TRANSACTIONS_COLLECTION));
            transaction.set(feeTransactionRef, {
                amount: feePerPlayer, type: 'debit',
                reason: `Team entry fee for: ${tournament.name}`,
                tournamentId: tournament.id, createdAt: serverTimestamp()
            });
            totalFeeCollected += feePerPlayer;
        }

        const newParticipants: Participant[] = team.members.map(member => ({
            id: member.uid, name: member.name, avatarUrl: member.avatarUrl,
            gameUsername: member.name, inGameId: 'N/A', teamId: team.id, teamName: team.name,
        }));
        
        transaction.update(tournamentRef, {
            participants: arrayUnion(...newParticipants),
            prizePool: increment(totalFeeCollected),
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
        
        const isTeamEvent = tournamentData.teamSize !== 'Solo';

        if (tournamentData.winners && tournamentData.winners.length > 0) {
            throw new Error("Winners have already been declared for this tournament.");
        }

        const totalEntryFees = tournamentData.prizePool;
        const platformFee = totalEntryFees * PLATFORM_FEE_PERCENTAGE;
        const organizerPayout = platformFee; // 50% of the fee goes to organizer
        const prizePoolAfterFees = totalEntryFees - platformFee;

        const prizeDistribution = tournamentData.prizeDistribution && (tournamentData.prizeDistribution.first + tournamentData.prizeDistribution.second + tournamentData.prizeDistribution.third > 0)
            ? tournamentData.prizeDistribution
            : {
                first: Math.floor(prizePoolAfterFees * 0.5),
                second: Math.floor(prizePoolAfterFees * 0.3),
                third: Math.floor(prizePoolAfterFees * 0.2)
            };

        const finalWinners: Winner[] = [];

        if (organizerPayout > 0 && tournamentData.organizerId) {
            const organizerRef = doc(db, USERS_COLLECTION, tournamentData.organizerId);
            transaction.update(organizerRef, { points: increment(organizerPayout) });
            const organizerTxRef = doc(collection(db, USERS_COLLECTION, tournamentData.organizerId, TRANSACTIONS_COLLECTION));
            transaction.set(organizerTxRef, {
                amount: organizerPayout, type: 'credit', reason: `Organizer payout for: ${tournamentData.name}`,
                tournamentId: tournamentId, createdAt: serverTimestamp()
            });
            
             if (isTeamEvent) {
                // Captain's bonus
                const captainBonus = platformFee * CAPTAIN_BONUS_PERCENTAGE;
                if(captainBonus > 0) {
                    transaction.update(organizerRef, { points: increment(captainBonus) });
                     const captainTxRef = doc(collection(db, USERS_COLLECTION, tournamentData.organizerId, TRANSACTIONS_COLLECTION));
                     transaction.set(captainTxRef, {
                        amount: captainBonus, type: 'credit', reason: `Captain's bonus for: ${tournamentData.name}`,
                        tournamentId: tournamentId, createdAt: serverTimestamp()
                    });
                }
            }
        }
        
        const processWinner = async (winnerData: Winner, rank: 1 | 2 | 3, totalPrize: number) => {
            const teamId = winnerData.participant.teamId;
            if (isTeamEvent && teamId) {
                const team = (await getDoc(doc(db, TEAMS_COLLECTION, teamId))).data() as Team;
                const members = team.members;
                const prizePerMember = Math.floor(totalPrize / members.length);
                
                for (const member of members) {
                     const winnerRef = doc(db, USERS_COLLECTION, member.uid);
                     transaction.update(winnerRef, { points: increment(prizePerMember) });
                     
                     const prizeTxRef = doc(collection(db, USERS_COLLECTION, member.uid, TRANSACTIONS_COLLECTION));
                     transaction.set(prizeTxRef, {
                         amount: prizePerMember, type: 'credit', 
                         reason: `Team prize for ${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} place in ${tournamentData.name}`,
                         tournamentId, createdAt: serverTimestamp()
                     });
                }
                 finalWinners.push({ ...winnerData, prize: totalPrize, rank, teamId: team.id, teamName: team.name });

            } else { // Solo winner
                const { participant } = winnerData;
                const winnerRef = doc(db, USERS_COLLECTION, participant.id);
                const updatePayload: any = { monthlyWins: increment(1) };
                if (totalPrize > 0) {
                    updatePayload.points = increment(totalPrize);
                    const prizeTxRef = doc(collection(db, USERS_COLLECTION, participant.id, TRANSACTIONS_COLLECTION));
                    transaction.set(prizeTxRef, {
                        amount: totalPrize, type: 'credit', reason: `Prize for ${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} place in ${tournamentData.name}`,
                        tournamentId, createdAt: serverTimestamp()
                    });
                }
                transaction.update(winnerRef, updatePayload);
                finalWinners.push({ ...winnerData, prize: totalPrize, rank });
            }
        };
        
        await processWinner(winners.first, 1, prizeDistribution.first);
        await processWinner(winners.second, 2, prizeDistribution.second);
        await processWinner(winners.third, 3, prizeDistribution.third);
        
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
  let q: Query;
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

const formatUserProfile = (doc: any): UserProfile => {
    const data = doc.data();
    return {
        uid: doc.id,
        displayName: data.displayName || "Unknown User",
        email: data.email || null,
        photoURL: data.photoURL || `https://placehold.co/40x40.png?text=${(data.displayName || "U").substring(0,2)}`,
        premiumPhotoURL: data.premiumPhotoURL || null,
        isAdmin: data.isAdmin || false,
        isPremium: data.isPremium || false,
        premiumSince: data.premiumSince as Timestamp,
        premiumFeatures: data.premiumFeatures || {},
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

export const getUserProfileFromFirestore = async (identifier: string): Promise<UserProfile | null> => {
  if (!identifier) return null;

  // 1. Try to get by UID directly
  const userRef = doc(db, USERS_COLLECTION, identifier);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return formatUserProfile(docSnap);
  }

  // 2. If not found by UID, try to find by email
  let q = query(collection(db, USERS_COLLECTION), where("email", "==", identifier));
  let querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return formatUserProfile(querySnapshot.docs[0]);
  }

  // 3. If not found by email, try to find by ApnaId
  q = query(collection(db, USERS_COLLECTION), where("apnaId", "==", identifier));
  querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return formatUserProfile(querySnapshot.docs[0]);
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
      premiumPhotoURL: data.premiumPhotoURL || null,
      isAdmin: data.isAdmin || false,
      isPremium: data.isPremium || false,
      premiumSince: data.premiumSince as Timestamp,
      premiumFeatures: data.premiumFeatures || {},
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
        const user = formatUserProfile(doc);
        const kills = user.kills || 0;
        const deaths = user.deaths || 0;
        return {
            ...user,
            kda: deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2), // Calculate KDA
        };
    });
};

export const listenToTopPlayersByMonthlyWins = (count: number, callback: (players: (UserProfile & { kda: string })[]) => void): (() => void) => {
    const q = query(
        collection(db, USERS_COLLECTION),
        orderBy("monthlyWins", "desc"),
        limit(count)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const players = snapshot.docs.map(doc => {
            const user = formatUserProfile(doc);
            const kills = user.kills || 0;
            const deaths = user.deaths || 0;
            return {
                ...user,
                kda: deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2),
            };
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
export const updateUserPremiumStatus = async (userId: string, features: Partial<UserProfile['premiumFeatures']>, premiumPhotoURL?: string | null): Promise<void> => {
    return runTransaction(db, async (transaction) => {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);

        const [userDoc, settingsDoc] = await Promise.all([
            transaction.get(userRef),
            transaction.get(settingsRef)
        ]);
        
        if (!userDoc.exists()) {
            throw new Error("User not found.");
        }
        
        const userData = userDoc.data() as UserProfile;
        const settingsData = settingsDoc.exists() ? settingsDoc.data() as SiteSettings : null;
        
        const isCurrentlyPremium = userData.isPremium;
        const isBecomingPremium = Object.values(features).some(v => v === true);

        const updateData: any = {
            premiumFeatures: features,
            isPremium: isBecomingPremium,
            updatedAt: serverTimestamp(),
        };

        if (isBecomingPremium) {
            if (!isCurrentlyPremium) { // User is being newly promoted
                updateData.premiumSince = serverTimestamp();
                updateData.hasSeenPremiumPopup = false; 

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
             // Set or update the premium photo URL
            if (premiumPhotoURL) {
                updateData.premiumPhotoURL = premiumPhotoURL;
            } else if (premiumPhotoURL === null) {
                 updateData.premiumPhotoURL = null;
            } else if (!userData.premiumPhotoURL) {
                // If no URL is provided and none exists, set the default
                updateData.premiumPhotoURL = settingsData?.defaultPremiumAvatarUrl || null;
            }

        } else { // Premium is being revoked
            updateData.premiumPhotoURL = null; // Remove premium avatar
        }

        transaction.update(userRef, updateData);
    });
};

// --- Premium Request Functions ---

export const addPremiumRequestToFirestore = async (requestData: Omit<PremiumRequest, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    const q = query(
        collection(db, PREMIUM_REQUESTS_COLLECTION),
        where("userId", "==", requestData.userId),
        where("status", "==", "Pending")
    );
    const existingRequests = await getDocs(q);
    if (!existingRequests.empty) {
        throw new Error("You already have a pending premium request.");
    }
    
    const docRef = await addDoc(collection(db, PREMIUM_REQUESTS_COLLECTION), {
        ...requestData,
        status: "Pending",
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const getPremiumRequestsFromFirestore = async (): Promise<PremiumRequest[]> => {
    const snapshot = await getDocs(query(collection(db, PREMIUM_REQUESTS_COLLECTION), orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
    } as PremiumRequest));
};

export const updatePremiumRequestStatusInFirestore = async (requestId: string, status: PremiumRequest['status']): Promise<void> => {
    const requestRef = doc(db, PREMIUM_REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, { status });
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


// --- Creator Hub Functions ---

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

// --- Team Functions ---
export const createTeamInFirestore = async (teamName: string, owner: UserProfile): Promise<string> => {
    const userTeams = await getUserTeams(owner.uid);
    if (userTeams.length >= 2) {
        throw new Error("You can only create a maximum of two teams.");
    }

    const docRef = await addDoc(collection(db, TEAMS_COLLECTION), {
        name: teamName,
        ownerId: owner.uid,
        members: [{
            uid: owner.uid,
            name: owner.displayName,
            avatarUrl: owner.photoURL,
            role: "Owner",
        }],
        createdAt: serverTimestamp(),
    });

    return docRef.id;
};

export const getUserTeams = async (userId: string): Promise<Team[]> => {
    if (!userId) return [];
    
    const allTeamsSnap = await getDocs(query(collection(db, TEAMS_COLLECTION), orderBy("createdAt", "desc")));
    
    const userTeams: Team[] = [];
    allTeamsSnap.forEach(doc => {
        const team = { id: doc.id, ...doc.data() } as Team;
        if (team.members && Array.isArray(team.members) && team.members.some(member => member && member.uid === userId)) {
            userTeams.push(team);
        }
    });

    return userTeams;
};

export const sendTeamInvite = async (team: Team, inviteeApnaId: string, owner: UserProfile): Promise<void> => {
    const inviteeProfile = await getUserProfileFromFirestore(inviteeApnaId);
    if (!inviteeProfile) {
        throw new Error(`User with Apna ID "${inviteeApnaId}" not found.`);
    }

    if (team.members.some(m => m.uid === inviteeProfile.uid)) {
        throw new Error(`${inviteeProfile.displayName} is already in this team.`);
    }

    if (team.members.length >= 4) {
        throw new Error("This team is already full.");
    }
    
    const inviteRef = collection(db, INVITES_COLLECTION);
    await addDoc(inviteRef, {
        teamId: team.id,
        teamName: team.name,
        fromId: owner.uid,
        fromName: owner.displayName,
        toId: inviteeProfile.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
};

export const getUserTeamInvites = async (userId: string): Promise<TeamInvite[]> => {
    if (!userId) return [];
    const q = query(collection(db, INVITES_COLLECTION), where("toId", "==", userId), where("status", "==", "pending"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamInvite));
};

export const respondToTeamInvite = async (inviteId: string, response: 'accepted' | 'declined', user: UserProfile): Promise<void> => {
    const inviteRef = doc(db, INVITES_COLLECTION, inviteId);
    
    if (response === 'accepted') {
        const inviteSnap = await getDoc(inviteRef);
        if (!inviteSnap.exists()) throw new Error("Invite not found or has been revoked.");
        
        const inviteData = inviteSnap.data() as TeamInvite;
        const teamRef = doc(db, TEAMS_COLLECTION, inviteData.teamId);

        await runTransaction(db, async (transaction) => {
            const teamDoc = await transaction.get(teamRef);
            if (!teamDoc.exists()) throw new Error("The team no longer exists.");

            const teamData = teamDoc.data() as Team;
            if (teamData.members.length >= 4) throw new Error("This team is now full.");

            const newMember: TeamMember = {
                uid: user.uid,
                name: user.displayName || 'New Member',
                avatarUrl: user.photoURL || `https://placehold.co/40x40.png?text=${(user.displayName || "P").substring(0,2)}`,
                role: 'Member'
            };

            transaction.update(teamRef, {
                members: arrayUnion(newMember)
            });
            transaction.delete(inviteRef); // Delete invite after handling
        });

    } else {
        await deleteDoc(inviteRef); // Just delete if declined
    }
};

export const removePlayerFromTeam = async (teamId: string, player: UserProfile): Promise<void> => {
    const teamRef = doc(db, TEAMS_COLLECTION, teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) throw new Error("Team not found.");

    const teamData = teamSnap.data() as Team;
    const memberToRemove = teamData.members.find(m => m.uid === player.uid);
    if (!memberToRemove) throw new Error("Player not found in team.");

    await updateDoc(teamRef, {
        members: arrayRemove(memberToRemove)
    });
};

export const updateTeamNameInFirestore = async (teamId: string, newName: string): Promise<void> => {
    if (!newName.trim()) throw new Error("Team name cannot be empty.");
    const teamRef = doc(db, TEAMS_COLLECTION, teamId);
    await updateDoc(teamRef, { name: newName });
};

export const deleteTeamFromFirestore = async (teamId: string): Promise<void> => {
    const teamRef = doc(db, TEAMS_COLLECTION, teamId);
    await deleteDoc(teamRef);
    // Optional: also delete all pending invites for this team
};


// Aliases for easier use
export const getGameDetails = getGameByIdFromFirestore;
export const getTournamentsForGame = (gameId: string) => getTournamentsFromFirestore({ gameId });
export const getTournamentDetails = getTournamentByIdFromFirestore;
export const getCommunityDetails = getCommunityByIdFromFirestore;
