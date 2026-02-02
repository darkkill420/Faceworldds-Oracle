
// Fix: Augment the global NodeJS namespace to include the API_KEY environment variable.
// This approach avoids redeclaring the 'process' variable and ensures type compatibility
// with existing environment definitions in most modern frontend build systems.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
}

export enum AppView {
  DASHBOARD = 'dashboard',
  JOURNAL = 'journal',
  COACH = 'coach',
  VISION_BOARD = 'vision_board',
  PULSE = 'pulse',
  TEMPLE = 'temple'
}

export type AIPersonality = 
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' 
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio' 
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export interface PlanetPosition {
  planet: string;
  sign: string;
  house?: string;
}

export interface AstroProfile {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  birthDate?: string;
  birthTime?: string; 
  birthLocation?: string;
  aiPersonality?: AIPersonality;
  planets?: PlanetPosition[];
  aspects?: string[];
  communicationLabel?: string;
}

export interface UserStats {
  firstOpened: number;
  totalActiveMinutes: number;
  oracleInteractions: number;
  journalEntries: number;
  visionCreations: number;
  experiencePoints: number;
  level: number;
  streak: number;
  lastCheckIn?: string;
  unlockedVibes: string[]; 
  creatorLinks?: {
    soundcloud?: string;
  };
}

export interface CosmicMarker {
  id: string;
  label: string;
  timestamp: number;
  type: 'count-up' | 'count-down';
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  aiFeedback?: string;
  mood?: string;
}

export interface TranscriptionItem {
  text: string;
  sender: 'user' | 'model';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}
