/**
 * Location & Proximity Engine for Vibe
 * Handles Indian city coordinates, Haversine distance calculations,
 * GPS reverse-geocoding, and user location preferences.
 */

export interface CityLocation {
  name: string;
  state: string;
  lat: number;
  lng: number;
  popular?: boolean;
}

export const INDIAN_CITIES: Record<string, CityLocation> = {
  mumbai: { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, popular: true },
  delhi: { name: 'Delhi NCR', state: 'Delhi NCR', lat: 28.6139, lng: 77.2090, popular: true },
  'delhi ncr': { name: 'Delhi NCR', state: 'Delhi NCR', lat: 28.6139, lng: 77.2090, popular: true },
  bengaluru: { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, popular: true },
  bangalore: { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, popular: true },
  pune: { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, popular: true },
  hyderabad: { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, popular: true },
  goa: { name: 'Goa', state: 'Goa', lat: 15.2993, lng: 74.1240, popular: true },
  jaipur: { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, popular: true },
  kolkata: { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, popular: true },
  chennai: { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, popular: true },
  ahmedabad: { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, popular: true },
  chandigarh: { name: 'Chandigarh', state: 'Punjab / Haryana', lat: 30.7333, lng: 76.7794, popular: true },
  gurugram: { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  gurgaon: { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  noida: { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910 },
  bhopal: { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126 },
  indore: { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  satna: { name: 'Satna', state: 'Madhya Pradesh', lat: 24.5826, lng: 80.8290 },
  kochi: { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
  lucknow: { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  surat: { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  nagpur: { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882 },
  patna: { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376 },
};

export const POPULAR_CITIES: CityLocation[] = Object.values(INDIAN_CITIES).filter(
  (c, index, self) => c.popular && self.findIndex((s) => s.name === c.name) === index
);

/**
 * Calculates straight-line distance in kilometers using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Resolves city coordinates from a city name string
 */
export function getCityCoordinates(cityName?: string): { lat: number; lng: number } | null {
  if (!cityName) return null;
  const normalized = cityName.toLowerCase().trim();
  const match = INDIAN_CITIES[normalized];
  if (match) return { lat: match.lat, lng: match.lng };

  // Substring search
  for (const [key, val] of Object.entries(INDIAN_CITIES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { lat: val.lat, lng: val.lng };
    }
  }
  return null;
}

/**
 * Finds the nearest known Indian hub to a set of GPS coordinates
 */
export function findNearestCity(
  lat: number,
  lng: number
): { city: CityLocation; distanceKm: number } {
  let nearest = INDIAN_CITIES['mumbai'];
  let minDistance = Infinity;

  for (const city of Object.values(INDIAN_CITIES)) {
    const dist = calculateDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  return { city: nearest, distanceKm: minDistance };
}

/**
 * Reverse-geocodes GPS coordinates via OpenStreetMap Nominatim with nearest-hub fallback
 */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<{ cityName: string; state?: string; lat: number; lng: number }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'VibeEvents/1.0',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const rawCity =
        addr.city ||
        addr.state_district ||
        addr.town ||
        addr.suburb ||
        addr.county ||
        addr.state;

      if (rawCity) {
        // Try matching with normalized registry
        const lower = rawCity.toLowerCase().trim();
        for (const [key, val] of Object.entries(INDIAN_CITIES)) {
          if (lower.includes(key) || key.includes(lower)) {
            return { cityName: val.name, state: val.state, lat, lng };
          }
        }
        return { cityName: rawCity, state: addr.state, lat, lng };
      }
    }
  } catch (err) {
    console.warn('[Location] Geocoding network error, falling back to proximity:', err);
  }

  // Fallback to nearest city by coordinates
  const nearest = findNearestCity(lat, lng);
  return { cityName: nearest.city.name, state: nearest.city.state, lat, lng };
}

// -------------------------------------------------------------
// Client Storage & State Synchronization
// -------------------------------------------------------------

export function getUserCity(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vibe_user_city');
}

export function getUserCoords(): { lat: number; lng: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vibe_user_coords');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export function setUserLocation(
  city: string,
  coords?: { lat: number; lng: number } | null
): void {
  if (typeof window === 'undefined') return;
  if (city === 'all' || city === 'All India') {
    localStorage.setItem('vibe_user_city', 'All India');
    localStorage.removeItem('vibe_user_coords');
  } else {
    localStorage.setItem('vibe_user_city', city);
    if (coords) {
      localStorage.setItem('vibe_user_coords', JSON.stringify(coords));
    } else {
      const cityCoords = getCityCoordinates(city);
      if (cityCoords) {
        localStorage.setItem('vibe_user_coords', JSON.stringify(cityCoords));
      }
    }
  }

  window.dispatchEvent(
    new CustomEvent('vibe:location_changed', {
      detail: { city, coords },
    })
  );
}

export function isFirstTimeLocationVisitor(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('vibe_user_city') === null;
}
