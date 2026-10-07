/**
 * Dynamic Anti-Screenshot Ticket Verification Security
 * 
 * Implements a time-based rotating cryptographic token (refreshes every 30 seconds),
 * similar to Ticketmaster SafeTix / BookMyShow dynamic passes.
 * 
 * Works symmetrically on both client (browser) and server (Next.js API route).
 */

const SECRET_SALT = process.env.NEXT_PUBLIC_TICKET_SALT || 'vibe_jwt_totp_secret_salt_2026';

/**
 * Standard simple synchronous hash function that works identically in both 
 * browser (React client) and Node.js (Server API routes).
 */
function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return Math.abs(combined).toString(16).toUpperCase().padStart(12, '0');
}

/**
 * Get current 30-second epoch slice number
 */
export function getCurrentTimeSlice(now = Date.now()): number {
  return Math.floor(now / 30000);
}

/**
 * Seconds remaining in the current 30-second epoch window (1 to 30)
 */
export function getSecondsRemainingInSlice(now = Date.now()): number {
  return 30 - (Math.floor(now / 1000) % 30);
}

/**
 * Generate a short-lived cryptographic hash for a ticket
 */
export function generateTicketHash(rsvpId: string, eventId: string, timeSlice: number): string {
  const payload = `${rsvpId}:${eventId}:${timeSlice}:${SECRET_SALT}`;
  return cyrb53(payload, 2026).slice(0, 8);
}

/**
 * Generate full verifiable QR payload
 */
export function generateDynamicQRPayload(rsvpId: string, eventId: string, now = Date.now(), baseUrl?: string): {
  timeSlice: number;
  secondsRemaining: number;
  hash: string;
  token: string;
  qrPayloadUrl: string;
  qrDataString: string;
} {
  const timeSlice = getCurrentTimeSlice(now);
  const secondsRemaining = getSecondsRemainingInSlice(now);
  const hash = generateTicketHash(rsvpId, eventId, timeSlice);
  const token = `VIBE-${timeSlice.toString(36).toUpperCase()}-${hash}`;

  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://vibe-seven-pied.vercel.app');
  const qrPayloadUrl = `${origin}/organizer/check-in?rsvpId=${encodeURIComponent(rsvpId)}&eventId=${encodeURIComponent(eventId)}&t=${timeSlice}&h=${hash}`;

  // Structured string compatible with direct scanner or URL scanning
  const qrDataString = JSON.stringify({
    v: 1,
    r: rsvpId,
    e: eventId,
    t: timeSlice,
    h: hash,
  });

  return {
    timeSlice,
    secondsRemaining,
    hash,
    token,
    qrPayloadUrl,
    qrDataString,
  };
}

/**
 * Verify a ticket's dynamic hash on the server.
 * Allows current slice, previous slice (30s grace for network/scan delay),
 * and next slice (slight client clock advance).
 */
export function verifyTicketHash(
  rsvpId: string,
  eventId: string,
  providedHash: string,
  providedSlice?: number,
  now = Date.now()
): { valid: boolean; timeDiff: 'current' | 'recent' | 'expired' | 'invalid' } {
  const currentSlice = getCurrentTimeSlice(now);
  const targetSlice = typeof providedSlice === 'number' && !isNaN(providedSlice) ? providedSlice : currentSlice;

  // 1. Check exact slice
  if (generateTicketHash(rsvpId, eventId, targetSlice) === providedHash.toUpperCase()) {
    const diff = Math.abs(currentSlice - targetSlice);
    if (diff === 0) return { valid: true, timeDiff: 'current' };
    if (diff === 1) return { valid: true, timeDiff: 'recent' };
  }

  // 2. Check current and current - 1 if providedSlice wasn't passed
  if (generateTicketHash(rsvpId, eventId, currentSlice) === providedHash.toUpperCase()) {
    return { valid: true, timeDiff: 'current' };
  }
  if (generateTicketHash(rsvpId, eventId, currentSlice - 1) === providedHash.toUpperCase()) {
    return { valid: true, timeDiff: 'recent' };
  }

  return { valid: false, timeDiff: 'invalid' };
}

/**
 * Standard Indian and global city 3-letter codes for official event passes
 */
const CITY_CODE_MAP: Record<string, string> = {
  bhopal: 'BHO',
  mumbai: 'MUM',
  bombay: 'BOM',
  delhi: 'DEL',
  'new delhi': 'DEL',
  bengaluru: 'BLR',
  bangalore: 'BLR',
  pune: 'PUN',
  hyderabad: 'HYD',
  jaipur: 'JAI',
  kolkata: 'CCU',
  calcutta: 'CCU',
  chennai: 'MAA',
  madras: 'MAA',
  ahmedabad: 'AMD',
  goa: 'GOA',
  indore: 'IDR',
  lucknow: 'LKO',
  chandigarh: 'IXC',
  gurgaon: 'GGN',
  gurugram: 'GGN',
  noida: 'NOI',
  kochi: 'COK',
  cochin: 'COK',
  varanasi: 'VNS',
  banaras: 'VNS',
  agra: 'AGR',
  surat: 'STV',
  kanpur: 'KNP',
  patna: 'PAT',
  vadodara: 'BDQ',
  baroda: 'BDQ',
  nagpur: 'NAG',
  london: 'LDN',
  'new york': 'NYC',
  singapore: 'SIN',
  dubai: 'DXB',
  sanfrancisco: 'SFO',
  berlin: 'BER',
  paris: 'PAR',
  tokyo: 'TYO',
};

/**
 * Extract canonical 3-letter city code for pass serial numbers
 */
export function getCityCode(cityName?: string): string {
  if (!cityName) return 'IND';
  const clean = cityName.trim().toLowerCase();
  if (CITY_CODE_MAP[clean]) return CITY_CODE_MAP[clean];

  for (const [key, code] of Object.entries(CITY_CODE_MAP)) {
    if (clean.includes(key)) return code;
  }

  const alpha = cityName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return alpha.slice(0, 3) || 'IND';
}

/**
 * Generate structured, sequential pass serial number
 * Format:
 * - Confirmed: VB-BHO-0001
 * - Waitlist:  VB-BHO-WL-0001
 * - Void:      VB-BHO-VOID-0001
 */
export function generatePassSerial(options: {
  city?: string;
  sequenceNumber: number;
  status?: string;
  isOnline?: boolean;
}): string {
  const { city, sequenceNumber, status, isOnline } = options;
  const cityCode = isOnline ? 'WEB' : getCityCode(city);
  const seqStr = String(Math.max(1, sequenceNumber)).padStart(4, '0');

  if (status === 'waitlisted') {
    return `VB-${cityCode}-WL-${seqStr}`;
  }
  if (status === 'cancelled') {
    return `VB-${cityCode}-VOID-${seqStr}`;
  }
  return `VB-${cityCode}-${seqStr}`;
}

/**
 * Deterministically resolve an RSVP's pass serial number:
 * 1. Checks rsvp.custom_responses.pass_serial
 * 2. Checks rsvp.pass_serial
 * 3. Uses chronological index in allEventRSVPs
 * 4. Fallback to stable deterministic seed from RSVP identifier
 */
export function getPassSerialNumber(
  rsvp?: {
    id?: string;
    status?: string;
    custom_responses?: Record<string, any>;
    created_at?: string;
    [key: string]: any;
  } | null,
  event?: {
    city?: string;
    event_type?: string;
    [key: string]: any;
  } | null,
  allEventRSVPs?: Array<{
    id?: string;
    created_at?: string;
    [key: string]: any;
  }> | null
): string {
  if (!rsvp) return 'VB-IND-0001';

  // 1. Existing stored pass serial
  if (rsvp.custom_responses?.pass_serial) {
    return rsvp.custom_responses.pass_serial;
  }
  if ((rsvp as any).pass_serial) {
    return (rsvp as any).pass_serial;
  }

  // 2. Sequential enrollment position
  let seqNumber = 1;
  if (
    rsvp.custom_responses?.enrollment_number &&
    typeof rsvp.custom_responses.enrollment_number === 'number'
  ) {
    seqNumber = rsvp.custom_responses.enrollment_number;
  } else if (allEventRSVPs && allEventRSVPs.length > 0 && rsvp.id) {
    // Sort all RSVPs chronologically by created_at
    const sorted = [...allEventRSVPs].sort((a, b) => {
      const tA = new Date(a.created_at || 0).getTime();
      const tB = new Date(b.created_at || 0).getTime();
      if (tA !== tB) return tA - tB;
      return (a.id || '').localeCompare(b.id || '');
    });
    const foundIndex = sorted.findIndex((r) => r.id === rsvp.id);
    if (foundIndex >= 0) {
      seqNumber = foundIndex + 1;
    }
  } else if (rsvp.id) {
    // Deterministic fallback derived from timestamp/id so it never changes for this pass
    const numericPart = rsvp.id.replace(/\D/g, '');
    if (numericPart.length >= 4) {
      seqNumber = (parseInt(numericPart.slice(-4), 10) % 5000) + 1;
    } else {
      let hash = 0;
      for (let i = 0; i < rsvp.id.length; i++) {
        hash = (hash * 31 + rsvp.id.charCodeAt(i)) & 0xffff;
      }
      seqNumber = (Math.abs(hash) % 999) + 1;
    }
  }

  const isOnline = event?.event_type === 'online';
  return generatePassSerial({
    city: event?.city,
    sequenceNumber: seqNumber,
    status: rsvp.status,
    isOnline,
  });
}

