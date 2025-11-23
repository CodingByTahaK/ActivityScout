// TypeScript interfaces for the Kids Programs Finder app

export interface LocationData {
  formatted_address: string;
  place_id: string;
  lat: number;
  lng: number;
  radius?: number; // Search radius in km
}

export interface SearchQuery {
  query: string;
  location: LocationData;
  ageRange?: {
    min: number;
    max: number;
  };
  maxPrice?: number;
  startDate?: string;
  // Equity/Affordability Filters (Track 2)
  showFinancialAidOnly?: boolean;
  freeOnly?: boolean;
  subsidizedOnly?: boolean;
}

export interface Program {
  id: string;
  name: string;
  organization: string;
  ageRange: {
    min: number;
    max: number;
  };
  cost: {
    amount: number;
    currency: string;
    frequency: string; // e.g., "per session", "per month", "one-time"
    note?: string; // e.g., "financial assistance available"
  };
  schedule: {
    days: string[];
    times: string;
    duration?: string;
    startDate?: string;
    endDate?: string;
  };
  location: {
    address: string;
    city: string;
    neighborhood?: string;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  description?: string;
  category?: string; // e.g., "swimming", "arts", "sports"
}

export interface SearchResponse {
  programs: Program[];
  searchMetadata: {
    query: string;
    location: string; // Keep as string for backwards compatibility with Claude
    timestamp: string;
    resultsCount: number;
  };
}

export interface StreamChunk {
  type: 'thinking' | 'result' | 'error' | 'done';
  content?: string;
  data?: SearchResponse;
  error?: string;
}

export interface CacheEntry {
  data: SearchResponse;
  timestamp: number;
}

export interface CacheStore {
  [key: string]: CacheEntry;
}

// Child Profile for personalized matching (Track 2 & 3)
export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  interests: string[]; // e.g., ["sports", "arts", "music", "stem"]
  strengths: string[]; // e.g., ["teamwork", "creativity", "leadership"]
  needs: string[]; // e.g., ["special-needs-support", "beginner-friendly", "scholarship"]
  goals: string; // Parent's goals for the child
  maxPrice?: number; // Budget constraint
}

// Program Values Analysis (Track 3 - core differentiator)
export interface ProgramValues {
  diversity: number; // 0-100 score
  leadership: number;
  creativity: number;
  academicExcellence: number;
  communityService: number;
  athleticism: number;
  innovation: number;
  teamwork: number;
  independence: number;
  analysis: string; // AI explanation of what the program values
}

// Google Places data for ratings
export interface GooglePlacesData {
  placeId: string;
  rating: number;
  userRatingsTotal: number;
  mapsUrl: string;
}

// Enhanced Program with values and match score
export interface EnhancedProgram extends Program {
  values?: ProgramValues;
  matchScore?: number; // 0-100 fit score with child profile
  matchReasons?: string[]; // Why this is a good match
  applicationUrl?: string; // Direct application link if available
  hasFinancialAid?: boolean;
  googlePlaces?: GooglePlacesData; // Google ratings and review data
  distance?: number; // Distance from user's location in km
}
