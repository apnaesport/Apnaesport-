
import type { Tournament, Game, Participant, Match } from './types';

// Placeholder data - replace with actual data fetching
const placeholderGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://placehold.co/40x40.png", bannerUrl: "https://placehold.co/400x300.png?text=LoL+Banner", dataAiHint: "esports game" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://placehold.co/40x40.png", bannerUrl: "https://placehold.co/400x300.png?text=Valorant+Banner", dataAiHint: "fps game" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://placehold.co/40x40.png", bannerUrl: "https://placehold.co/400x300.png?text=CS2+Banner", dataAiHint: "tactical shooter" },
];


const initialTournaments: Tournament[] = [
  {
    id: "t1-lol", name: "LoL Summer Skirmish", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png?text=LoL+Summer+Skirmish", description: "Weekly LoL tournament for cash prizes.",
    status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 5)), participants: Array.from({length: 5}, (_, i) => ({id:`user${i}`, name:`Player ${i+1}`})), maxParticipants: 16, prizePool: "$200", bracketType: "Single Elimination", organizerId: "admin-user", organizer: "Admin"
  },
  {
    id: "t2-valo", name: "Valorant Champions Tour", gameId: "game-valo", gameName: "Valorant", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png?text=Valorant+Champions", description: "Valorant regional qualifier for VCT points.",
    status: "Live", startDate: new Date(new Date().setDate(new Date().getDate() - 2)), participants: Array.from({length: 20}, (_, i) => ({id:`user${i+5}`, name:`Player ${i+6}`})), maxParticipants: 32, prizePool: "$5,000", bracketType: "Double Elimination", organizerId: "admin-user", organizer: "Admin"
  },
  {
    id: "t3-cs", name: "CS:2 Open League", gameId: "game-cs", gameName: "Counter-Strike 2", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png?text=CS2+Open+League", description: "Open CS2 league for aspiring pros.",
    status: "Completed", startDate: new Date(new Date().setDate(new Date().getDate() - 20)), endDate: new Date(new Date().setDate(new Date().getDate() - 15)), participants: Array.from({length: 50}, (_, i) => ({id:`user${i+25}`, name:`Player ${i+26}`})), maxParticipants: 64, prizePool: "$1,000", bracketType: "Round Robin", organizerId: "admin-user", organizer: "Admin"
  },
  {
    id: "t4-lol", name: "LoL Community Cup", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png?text=LoL+Community+Cup", description: "Fun community cup for all skill levels.",
    status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 12)), participants: [], maxParticipants: 32, prizePool: "In-game rewards", bracketType: "Single Elimination", organizerId: "community-user", organizer: "Community Mod"
  },
];

// This is a very simple in-memory store for prototyping.
// For a real app, you'd use a proper state management library or fetch from a backend.
let tournaments: Tournament[] = [...initialTournaments];
let games: Game[] = [...placeholderGames]; 

const listeners: Array<() => void> = [];

export const getTournaments = (): Tournament[] => tournaments;

export const getGames = (): Game[] => games; 

export const addTournament = (tournament: Tournament): void => {
  const existingIndex = tournaments.findIndex(t => t.id === tournament.id);
  if (existingIndex > -1) {
    tournaments[existingIndex] = tournament; // Update existing tournament
  } else {
    tournaments = [tournament, ...tournaments]; // Add new tournament to the beginning
  }
  notifyListeners();
};


export const addGame = (game: Game): void => { 
  // This function assumes it's always a new game, as updates are handled by updateGameInStore
  const existingIndex = games.findIndex(g => g.id === game.id);
  if (existingIndex === -1) { // Only add if it doesn't exist to prevent duplicates from simple calls
      games = [game, ...games];
      notifyListeners();
  } else {
    // Optionally, update if it exists, making it an upsert. For now, let's keep it as add-only.
    // games[existingIndex] = game; // To make it an upsert
    console.warn(`Game with ID ${game.id} already exists. Use updateGameInStore for updates.`);
  }
};

export const updateGameInStore = (updatedGame: Game): void => { 
  games = games.map(g => g.id === updatedGame.id ? updatedGame : g);
  notifyListeners();
};

export const deleteGameFromStore = (gameId: string): void => { 
  games = games.filter(g => g.id !== gameId);
  notifyListeners();
};


export const deleteTournamentFromStore = (tournamentId: string): void => {
    tournaments = tournaments.filter(t => t.id !== tournamentId);
    notifyListeners();
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

const notifyListeners = (): void => {
  listeners.forEach(listener => listener());
};

export const getGameDetails = (gameId: string): Game | undefined => {
  return games.find(g => g.id === gameId);
};

export const getTournamentsForGame = (gameId: string): Tournament[] => {
  return tournaments.filter(t => t.gameId === gameId);
};

export const getTournamentDetails = (tournamentId: string): Tournament | undefined => {
   const currentTournament = tournaments.find(t => t.id === tournamentId);
   if (currentTournament) {
     const participants = currentTournament.participants || [];
     
     // Basic placeholder match generation if none exist and participants are present
     let matches: Match[] = currentTournament.matches || [];
     if (matches.length === 0 && participants.length >= 2) {
        const numMatches = Math.floor(participants.length / 2);
        for(let i = 0; i < numMatches; i++) {
            matches.push({
                id: `m-${tournamentId}-${i+1}`,
                round: 1,
                participants: [participants[i*2] || null, participants[i*2+1] || null],
                status: 'Pending'
            });
        }
     }


     return {
        ...currentTournament,
        participants: participants, 
        matches: matches, 
     }
   }
  return undefined;
};
