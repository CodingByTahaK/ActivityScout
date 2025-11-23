import { Client } from '@googlemaps/google-maps-services-js';

// Simple cache implementation
interface CacheEntry {
  data: GooglePlacesData | null;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export interface GooglePlacesData {
  placeId: string;
  rating: number;
  userRatingsTotal: number;
  mapsUrl: string;
}

const client = new Client({});

export class GooglePlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY not set. Google Places features will be disabled.');
    }
  }

  /**
   * Get cached data if available and not expired
   */
  private getFromCache(cacheKey: string): GooglePlacesData | null | undefined {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      cache.delete(cacheKey);
    }
    return undefined;
  }

  /**
   * Store data in cache
   */
  private setCache(cacheKey: string, data: GooglePlacesData | null): void {
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Search for a place and get its rating data
   */
  async getPlaceRating(
    organizationName: string,
    city: string,
    address?: string
  ): Promise<GooglePlacesData | null> {
    if (!this.apiKey) {
      return null;
    }

    // Create cache key
    const cacheKey = `${organizationName}|${city}|${address || ''}`.toLowerCase();

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // Try primary query: organization + city
      let query = `${organizationName} ${city}`;

      const response = await client.findPlaceFromText({
        params: {
          input: query,
          inputtype: 'textquery' as any,
          fields: ['place_id', 'name', 'rating', 'user_ratings_total'],
          key: this.apiKey,
        },
      });

      if (response.data.candidates && response.data.candidates.length > 0) {
        const place = response.data.candidates[0];

        // Return even if we only have partial rating data
        if (place.rating || place.user_ratings_total) {
          const placeData: GooglePlacesData = {
            placeId: place.place_id || '',
            rating: place.rating || 0,
            userRatingsTotal: place.user_ratings_total || 0,
            mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          };

          this.setCache(cacheKey, placeData);
          return placeData;
        }
      }

      // If no results with rating, try with address if available
      if (address) {
        query = `${organizationName} ${address} ${city}`;

        const response2 = await client.findPlaceFromText({
          params: {
            input: query,
            inputtype: 'textquery' as any,
            fields: ['place_id', 'name', 'rating', 'user_ratings_total'],
            key: this.apiKey,
          },
        });

        if (response2.data.candidates && response2.data.candidates.length > 0) {
          const place = response2.data.candidates[0];

          if (place.rating || place.user_ratings_total) {
            const placeData: GooglePlacesData = {
              placeId: place.place_id || '',
              rating: place.rating || 0,
              userRatingsTotal: place.user_ratings_total || 0,
              mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            };

            this.setCache(cacheKey, placeData);
            return placeData;
          }
        }
      }

      // No rating found - cache null to avoid repeated API calls
      this.setCache(cacheKey, null);
      return null;
    } catch (error: any) {
      if (error?.response?.status === 403) {
        console.error('❌ Google Places API Error 403: API key not authorized');
        console.error('📝 To fix this:');
        console.error('   1. Go to https://console.cloud.google.com/apis/library');
        console.error('   2. Enable "Places API" for your project');
        console.error('   3. Check API key restrictions at https://console.cloud.google.com/apis/credentials');
      } else {
        console.error('Error fetching Google Places data:', error?.message || error);
      }
      // Don't cache errors - allow retry
      return null;
    }
  }

  /**
   * Batch fetch ratings for multiple programs
   */
  async batchGetRatings(
    programs: Array<{
      organization: string;
      location: { city: string; address?: string };
    }>
  ): Promise<(GooglePlacesData | null)[]> {
    // Process in batches of 5 to avoid rate limits
    const batchSize = 5;
    const results: (GooglePlacesData | null)[] = [];

    for (let i = 0; i < programs.length; i += batchSize) {
      const batch = programs.slice(i, i + batchSize);
      const batchPromises = batch.map((program) =>
        this.getPlaceRating(
          program.organization,
          program.location.city,
          program.location.address
        )
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to be respectful of API limits
      if (i + batchSize < programs.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}

// Export singleton instance
export const googlePlacesService = new GooglePlacesService();
