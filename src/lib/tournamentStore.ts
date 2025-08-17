


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
import { db } from "./firebase";
import type { Tournament, Game, Participant, Match, NotificationMessage, NotificationFormData, NotificationTarget, SiteSettings, UserProfile, TournamentStatus, SponsorshipRequest, Community, CommunityMember, Creator, CreatorApplication } from './types';

const GAMES_COLLECTION = "games";
const TOURNAMENTS_COLLECTION = "tournaments";
const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";
const SETTINGS_COLLECTION = "settings";
const GLOBAL_SETTINGS_ID = "global";
const SPONSORSHIPS_COLLECTION = "sponsorships";
const COMMUNITIES_COLLECTION = "communities";
const CREATORS_COLLECTION = "creators";
const CREATOR_APPLICATIONS_COLLECTION = "creatorApplications";


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
  let qConstraints: QueryConstraint[] = [];
  
  if (!queryParams || Object.keys(queryParams).length === 0) {
      qConstraints.push(orderBy("startDate", "desc"));
  } else {
      qConstraints.push(orderBy("startDate", "desc"));
  }

  if (queryParams?.status) {
    qConstraints.push(where("status", "==", queryParams.status));
  }
  
  if (queryParams?.gameId) {
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

  const now = new Date();
  const batch = writeBatch(db);
  const tournaments = tournamentsSnapshot.docs.map(docSnapshot => {
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

    const currentStatus = tournament.status;
    const newStatus = getTournamentStatus(tournament);
    
    if (currentStatus !== newStatus && currentStatus !== "Cancelled") {
        tournament.status = newStatus;
        const tournamentRef = doc(db, TOURNAMENTS_COLLECTION, tournament.id);
        batch.update(tournamentRef, { status: newStatus, updatedAt: serverTimestamp() });
    }
    
    return tournament;
  });

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
      communityId: data.communityId || null,
      points: data.points || 0,
      wins: data.wins || 0,
      kills: data.kills || 0,
      deaths: data.deaths || 0,
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
      communityId: data.communityId || null,
      points: data.points || 0,
      wins: data.wins || 0,
      kills: data.kills || 0,
      deaths: data.deaths || 0,
    };
  });
};

export const updateUserAdminStatusInFirestore = async (userId: string, isAdmin: boolean): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, { isAdmin, updatedAt: serverTimestamp() });
};

export const updateUserProfileInFirestore = async (userId: string, profileData: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'favoriteGameIds' | 'streamingChannelUrl' | 'points' | 'communityId'>>): Promise<void> => {
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
  await setDoc(docRef, {
    ...settingsData,
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


export const getCommunitiesFromFirestore = async (): Promise<Community[]> => {
    const communitiesSnapshot = await getDocs(query(collection(db, COMMUNITIES_COLLECTION), orderBy("createdAt", "desc")));
    return communitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
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


// --- Creator Functions ---

export const submitCreatorApplicationInFirestore = async (applicationData: Omit<CreatorApplication, 'id' | 'createdAt'>): Promise<string> => {
    const docRef = await addDoc(collection(db, CREATOR_APPLICATIONS_COLLECTION), {
        ...applicationData,
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

export const approveCreatorApplicationInFirestore = async (app: CreatorApplication): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Create the new creator document
    const creatorRef = doc(db, CREATORS_COLLECTION, app.userId);
    const newCreatorData: Omit<Creator, 'id'> = {
        userId: app.userId,
        name: app.name,
        avatarUrl: app.photoURL,
        channelUrl: app.channelUrl,
        tags: app.tags,
        followers: "0", // Default value
        votes: 0,
        votedBy: [],
        createdAt: serverTimestamp(),
    };
    batch.set(creatorRef, newCreatorData);

    // 2. Delete the application document
    const appRef = doc(db, CREATOR_APPLICATIONS_COLLECTION, app.id);
    batch.delete(appRef);

    await batch.commit();
};

export const rejectCreatorApplicationInFirestore = async (appId: string): Promise<void> => {
    await deleteDoc(doc(db, CREATOR_APPLICATIONS_COLLECTION, appId));
};

export const getCreatorsFromFirestore = async (): Promise<Creator[]> => {
    const snapshot = await getDocs(query(collection(db, CREATORS_COLLECTION), orderBy("votes", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creator));
};

export const deleteCreatorFromFirestore = async (creatorId: string): Promise<void> => {
    await deleteDoc(doc(db, CREATORS_COLLECTION, creatorId));
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

    
