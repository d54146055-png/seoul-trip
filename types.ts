// Itinerary Types
export interface ItineraryItem {
  id: string;
  time: string;
  activity: string;
  location: string;
  lat?: number; // Latitude
  lng?: number; // Longitude
  note?: string;
  completed: boolean;
}

export interface WeatherInfo {
  temp: number;
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Snow';
  icon: string;
}

export interface DayItinerary {
  id: string;
  date: string; // YYYY-MM-DD
  items: ItineraryItem[];
  weather?: WeatherInfo;
}

// Expense Types
export interface Member {
  id: string;
  name: string;
  avatarColor?: string;
}

export interface Expense {
  id: string;
  payerId: string;
  amount: number; // Stored in KRW
  description: string;
  date: string;
  involvedMemberIds: string[];
}

export interface Balance {
  memberId: string;
  amount: number; // Positive = owed to them, Negative = they owe
}

// Chat/AI Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  mapLinks?: Array<{
    title: string;
    uri: string;
  }>;
}

export enum Tab {
  ITINERARY = 'ITINERARY',
  EXPENSES = 'EXPENSES',
  AI_GUIDE = 'AI_GUIDE',
}