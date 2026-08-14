/**
 * Geocoding and geographic calculation utilities for LifeLine
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  confidence?: number;
}

/**
 * Approximate Coordinates for common districts and medical centers in Ho Chi Minh City
 */
const KNOWN_HCMC_LOCATIONS: Record<string, [number, number]> = {
  'quan 1': [10.7769, 106.7009],
  'quan 3': [10.7844, 106.6844],
  'quan 5': [10.7554, 106.6666],
  'quan 10': [10.7746, 106.6669],
  'tan binh': [10.8014, 106.6528],
  'tan phu': [10.7925, 106.6283],
  'binh thanh': [10.8105, 106.7091],
  'cho ray': [10.7578, 106.6595],
  'truyen mau huyet hoc': [10.7818, 106.6896],
  'tu du': [10.7675, 106.6872],
  'bach mai': [21.0031, 105.8427],
};

/**
 * Geocode a textual address to [longitude, latitude] or null
 */
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  if (!address || typeof address !== 'string') return null;

  const normalized = address.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  for (const [key, coords] of Object.entries(KNOWN_HCMC_LOCATIONS)) {
    if (normalized.includes(key)) {
      return coords;
    }
  }

  // Default fallback to central HCMC
  return [10.7769, 106.7009];
}

/**
 * Calculate distance between two coordinate points in kilometers using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
