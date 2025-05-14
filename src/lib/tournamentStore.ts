
import type { Tournament, Game } from './types';

// Placeholder data - replace with actual data fetching
const placeholderGames: Game[] = [
  { id: "game-lol", name: "League of Legends", iconUrl: "https://placehold.co/40x40.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-valo", name: "Valorant", iconUrl: "https://placehold.co/40x40.png", bannerUrl: "https://placehold.co/400x300.png" },
  { id: "game-cs", name: "Counter-Strike 2", iconUrl: "https://placehold.co/40x40.png", bannerUrl: "https://placehold.co/400x300.png" },
];


const initialTournaments: Tournament[] = [
  {
    id: "t1-lol", name: "LoL Summer Skirmish", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png", description: "Weekly LoL tournament for cash prizes.",
    status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 5)), participants: Array(5).fill({id:'', name:''}), maxParticipants: 16, prizePool: "$200", bracketType: "Single Elimination", organizerId: "admin-user"
  },
  {
    id: "t2-valo", name: "Valorant Champions Tour", gameId: "game-valo", gameName: "Valorant", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png", description: "Valorant regional qualifier for VCT points.",
    status: "Live", startDate: new Date(new Date().setDate(new Date().getDate() - 2)), participants: Array(20).fill({id:'', name:''}), maxParticipants: 32, prizePool: "$5,000", bracketType: "Double Elimination", organizerId: "admin-user"
  },
  {
    id: "t3-cs", name: "CS:2 Open League", gameId: "game-cs", gameName: "Counter-Strike 2", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png", description: "Open CS2 league for aspiring pros.",
    status: "Completed", startDate: new Date(new Date().setDate(new Date().getDate() - 20)), endDate: new Date(new Date().setDate(new Date().getDate() - 15)), participants: Array(50).fill({id:'', name:''}), maxParticipants: 64, prizePool: "$1,000", bracketType: "Round Robin", organizerId: "admin-user"
  },
  {
    id: "t4-lol", name: "LoL Community Cup", gameId: "game-lol", gameName: "League of Legends", gameIconUrl: "https://placehold.co/40x40.png",
    bannerImageUrl: "https://placehold.co/800x400.png", description: "Fun community cup for all skill levels.",
    status: "Upcoming", startDate: new Date(new Date().setDate(new Date().getDate() + 12)), participants: [], maxParticipants: 32, prizePool: "In-game rewards", bracketType: "Single Elimination", organizerId: "community-user"
  },
];

// This is a very simple in-memory store for prototyping.
// For a real app, you'd use a proper state management library or fetch from a backend.
let tournaments: Tournament[] = [...initialTournaments];
let games: Game[] = [...placeholderGames]; // Add games store

const listeners: Array<() => void> = [];

export const getTournaments = (): Tournament[] => tournaments;

export const getGames = (): Game[] => games; // Function to get games

export const addTournament = (tournament: Tournament): void => {
  tournaments = [tournament, ...tournaments]; // Add to the beginning of the array
  notifyListeners();
};

export const addGame = (game: Game): void => { // Function to add a game
  games = [game, ...games];
  notifyListeners();
}

export const updateGameInStore = (updatedGame: Game): void => { // Function to update a game
  games = games.map(g => g.id === updatedGame.id ? updatedGame : g);
  notifyListeners();
}

export const deleteGameFromStore = (gameId: string): void => { // Function to delete a game
  games = games.filter(g => g.id !== gameId);
  notifyListeners();
}


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
  const sampleParticipants: Participant[] = Array.from({ length: 12 }, (_, i) => ({
    id: `p${i}`, name: `Team Player ${i + 1}`, avatarUrl: `https://placehold.co/40x40.png`
  }));
   const currentTournament = tournaments.find(t => t.id === tournamentId);
   if (currentTournament) {
     // Ensure participants are an array, even if empty
     const participants = currentTournament.participants && currentTournament.participants.length > 0 
                            ? currentTournament.participants 
                            : [];
     // Ensure matches are an array, possibly empty
      const matches = currentTournament.matches && currentTournament.matches.length > 0 
                            ? currentTournament.matches
                            : [
                                { id: 'm-placeholder-1', round: 1, participants: [participants[0] || null, participants[1] || null], status: 'Pending' },
                                { id: 'm-placeholder-2', round: 1, participants: [participants[2] || null, participants[3] || null], status: 'Pending' },
                              ];


     return {
        ...currentTournament,
        participants: participants, // Use existing or empty
        matches: matches, // Use existing or generated placeholder
     }
   }
  return undefined;
};
