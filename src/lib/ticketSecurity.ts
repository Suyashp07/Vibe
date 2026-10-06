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
