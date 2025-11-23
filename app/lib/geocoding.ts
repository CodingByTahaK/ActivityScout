import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two coordinates using the Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Geocode an address to coordinates
 */
export async function geocodeAddress(
  address: string,
  apiKey: string
): Promise<Coordinates | null> {
  if (!apiKey) {
    console.warn('Google API key not available for geocoding');
    return null;
  }

  try {
    const response = await client.geocode({
      params: {
        address,
        key: apiKey,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Batch geocode multiple addresses
 */
export async function batchGeocodeAddresses(
  addresses: string[],
  apiKey: string
): Promise<(Coordinates | null)[]> {
  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  const results: (Coordinates | null)[] = [];

  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const batchPromises = batch.map((address) => geocodeAddress(address, apiKey));

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to be respectful of API limits
    if (i + batchSize < addresses.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Filter and sort programs by distance from a reference point
 */
export function filterAndSortByDistance<T extends { location: { address: string; city: string } }>(
  programs: T[],
  programCoordinates: (Coordinates | null)[],
  userLocation: Coordinates,
  radiusKm?: number
): Array<T & { distance?: number }> {
  // Attach distances to programs
  const programsWithDistance = programs.map((program, index) => {
    const coords = programCoordinates[index];
    const distance = coords ? calculateDistance(userLocation, coords) : undefined;

    return {
      ...program,
      distance,
    };
  });

  // Filter by radius if specified
  let filtered = programsWithDistance;
  if (radiusKm && radiusKm > 0) {
    filtered = programsWithDistance.filter((program) => {
      if (program.distance === undefined) return true; // Keep programs we couldn't geocode
      return program.distance <= radiusKm;
    });
  }

  // Sort by distance (nearest first, programs without distance at the end)
  filtered.sort((a, b) => {
    if (a.distance === undefined && b.distance === undefined) return 0;
    if (a.distance === undefined) return 1;
    if (b.distance === undefined) return -1;
    return a.distance - b.distance;
  });

  return filtered;
}
