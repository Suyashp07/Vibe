import { GoogleGenerativeAI } from '@google/generative-ai';
import { nanoid } from 'nanoid';
import { TemplateType } from '@/types';
import { INDIAN_CITIES } from '@/lib/location';
import { calculateEventSurety } from '@/lib/eventSurety';

export type EventCategory =
  | 'tech'
  | 'music'
  | 'comedy'
  | 'nightlife'
  | 'workshop'
  | 'art'
  | 'fitness'
  | 'wellness'
  | 'culinary'
  | 'poetry'
  | 'festival'
  | 'gaming'
  | 'theatre'
  | 'social';

export interface ExtractedEventData {
  title: string;
  tagline: string;
  description: string;
  venue_name: string;
  location_address: string;
  city: string;
  start_at: string; // ISO 8601
  end_at: string;   // ISO 8601
  ticket_url?: string;
  price_text?: string;
  source_platform: string;
  category?: EventCategory;
  template: TemplateType;
  confidence_score: number;
  cover_image_url?: string;
  faq: Array<{ q: string; a: string }>;
  suggested_slug: string;
  missing_aspects?: string[];
  approval_status?: 'approved' | 'pending';
  requires_admin_approval?: boolean;
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

export function detectCityFromText(text: string): { name: string; state?: string } | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(INDIAN_CITIES)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lower)) {
      return { name: val.name, state: val.state };
    }
  }

  // Micro-location landmarks mapping to major cities
  if (/\b(lalghati|mp nagar|new market|arera|kolar|db mall|bhojpur)\b/i.test(lower)) {
    return { name: 'Bhopal', state: 'Madhya Pradesh' };
  }
  if (/\b(bandra|andheri|juhu|worli|powai|dadar|colaba|lower parel|chembur|navi mumbai|thane)\b/i.test(lower)) {
    return { name: 'Mumbai', state: 'Maharashtra' };
  }
  if (/\b(koramangala|indiranagar|whitefield|hsr|bellandur|jayanagar|mg road)\b/i.test(lower)) {
    return { name: 'Bengaluru', state: 'Karnataka' };
  }
  if (/\b(koregaon park|kothrud|viman nagar|baner|wakad|hinjewadi|shivajinagar)\b/i.test(lower)) {
    return { name: 'Pune', state: 'Maharashtra' };
  }
  if (/\b(cp|connaught place|hauz khas|saket|gurugram|gurgaon|noida|cyber hub)\b/i.test(lower)) {
    return { name: 'Delhi NCR', state: 'Delhi' };
  }

  return null;
}

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

function generateSlug(title: string): string {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `${clean.slice(0, 40)}-${nanoid(6)}`;
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Hand-curated editorial Unsplash photography for Indian & global events by category
 */
export const CATEGORY_COVERS: Record<string, string[]> = {
  tech: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
  ],
  music: [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80',
  ],
  comedy: [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&auto=format&fit=crop&q=80',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
  ],
  workshop: [
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460518451282-72992a605fe6?w=1200&auto=format&fit=crop&q=80',
  ],
  art: [
    'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
  ],
  fitness: [
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
  ],
  wellness: [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&auto=format&fit=crop&q=80',
  ],
  culinary: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
  ],
  poetry: [
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&auto=format&fit=crop&q=80',
  ],
  festival: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop&q=80',
  ],
  gaming: [
    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
  ],
  theatre: [
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&auto=format&fit=crop&q=80',
  ],
  social: [
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
  ],
};

export function detectCategoryFromText(text: string): EventCategory {
  const lower = text.toLowerCase();
  if (lower.match(/\b(yoga|meditation|breathwork|healing|pranayama|mindfulness|pilates)\b/)) return 'wellness';
  if (lower.match(/\b(hackathon|code|coding|developer|ai|pitch|founder|demo day|web3|crypto|software|startup|tech)\b/)) return 'tech';
  if (lower.match(/\b(comedy|standup|stand-up|open mic|comic|laugh|roast)\b/)) return 'comedy';
  if (lower.match(/\b(concert|band|gig|dj|music|acoustic|live music|techno|sufi|singing)\b/)) return 'music';
  if (lower.match(/\b(club|nightclub|party|cocktail|pub crawl|dj night|bar night|afterparty)\b/)) return 'nightlife';
  if (lower.match(/\b(workshop|masterclass|pottery|craft|origami|baking|cooking class|diy)\b/)) return 'workshop';
  if (lower.match(/\b(poetry|shayari|ghazal|spoken word|storytelling|kavi|book club|literature)\b/)) return 'poetry';
  if (lower.match(/\b(art|painting|canvas|gallery|sculpture|sketching|exhibition)\b/)) return 'art';
  if (lower.match(/\b(marathon|run|running|cycl|5k|10k|football|cricket|badminton|fitness|workout)\b/)) return 'fitness';
  if (lower.match(/\b(garba|dandiya|diwali|navratri|holi|festival|carnival|mela)\b/)) return 'festival';
  if (lower.match(/\b(chess|board game|boardgame|catan|poker|trivia|quiz|esports|bgmi)\b/)) return 'gaming';
  if (lower.match(/\b(theatre|theater|play|drama|natak|monologue|acting)\b/)) return 'theatre';
  if (lower.match(/\b(food walk|tasting|supper club|brunch|dining|coffee brewing|cocktail making)\b/)) return 'culinary';
  return 'social';
}

export function getCategoryCover(category?: string, seedText?: string): string {
  let cat = category?.toLowerCase();
  if (!cat || !CATEGORY_COVERS[cat]) {
    cat = seedText ? detectCategoryFromText(seedText) : 'default';
  }
  const list = CATEGORY_COVERS[cat] || CATEGORY_COVERS.default;
  if (!seedText) return list[0];
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % list.length;
  return list[index];
}

/**
 * Deterministically extract ticket pricing from HTML or markdown text
 * Supports District, BookMyShow, Luma, Unstop, Paytm Insider, and raw text
 */
export function extractPriceFromContent(content: string): string | null {
  if (!content) return null;

  const prices: number[] = [];

  // 1. Structured JSON patterns (District, BookMyShow, Luma, Insider, Unstop)
  const jsonPriceRegex =
    /"(?:price|lowPrice|min_price|ticket_price|amount|starting_price|entry_fee|registration_fee)":\s*"?(\d+(?:\.\d+)?)"?/gi;
  let m;
  while ((m = jsonPriceRegex.exec(content)) !== null) {
    const val = Math.round(parseFloat(m[1]));
    // Exclude years (2024-2027) and unreasonable ticket amounts
    if (val >= 25 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 2027 && val < 500000) {
      prices.push(val);
    }
  }

  // 2. Currency symbol patterns (₹, Rs., INR)
  const currencyRegex = /(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+)/gi;
  while ((m = currencyRegex.exec(content)) !== null) {
    const rawNum = m[1].replace(/,/g, '');
    const val = Math.round(parseFloat(rawNum));
    if (val >= 25 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 2027 && val < 500000) {
      prices.push(val);
    }
  }

  if (prices.length > 0) {
    const minPrice = Math.min(...prices);
    return `₹${minPrice} onwards`;
  }

  // 3. Explicit Free indicators
  const freePattern =
    /(?:free\s+entry|free\s+registration|free\s+ticket|free\s+admission|entry\s+is\s+free|tickets?:\s*free|"is_free":\s*true|"price":\s*0\b|"price":\s*"0"|(?:₹|rs\.?|inr)\s*0\b)/i;
  if (freePattern.test(content)) {
    return 'Free Entry';
  }

  return null;
}

/**
 * Scrape OpenGraph and page metadata from an external event URL
 * Uses direct fetch with fallback to Jina Reader proxy for Cloudflare-protected sites (e.g. BookMyShow)
 */
export function parseJsonLdEvent(html: string): any | null {
  if (!html) return null;
  const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed['@type'] === 'Event') return parsed;
      if (Array.isArray(parsed)) {
        const ev = parsed.find((item: any) => item && item['@type'] === 'Event');
        if (ev) return ev;
      }
      if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
        const ev = parsed['@graph'].find((item: any) => item && item['@type'] === 'Event');
        if (ev) return ev;
      }
    } catch {}
  }
  return null;
}

/**
 * Parse human Indian event dates into accurate ISO 8601 strings in Asia/Kolkata (+05:30)
 * Handles: 'Sat 26 Sep 2026', '26 Sep 2026', 'Fri 13 Nov 2026 - Sun 15 Nov 2026', '17 Oct, 5:30 PM'
 */
export function parseIndianDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  const cleanDate = dateStr.split('-')[0].trim();
  const dMatch =
    cleanDate.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i) ||
    cleanDate.match(/(\d{1,2})\s+([A-Za-z]+)/i) ||
    cleanDate.match(/([A-Za-z]+)\s+(\d{1,2})/i);

  if (!dMatch) return null;

  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  let day = 1;
  let monthStr = 'jan';
  let year = new Date().getFullYear();

  if (isNaN(parseInt(dMatch[1]))) {
    monthStr = dMatch[1].toLowerCase();
    day = parseInt(dMatch[2]) || 1;
  } else {
    day = parseInt(dMatch[1]);
    monthStr = dMatch[2].toLowerCase();
    if (dMatch[3]) year = parseInt(dMatch[3]);
  }

  const monthIdx = months.findIndex((m) => monthStr.startsWith(m));
  if (monthIdx === -1) return null;

  let hours = 19;
  let mins = 0;
  if (timeStr) {
    const tMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (tMatch) {
      hours = parseInt(tMatch[1]);
      if (tMatch[3].toLowerCase() === 'pm' && hours < 12) hours += 12;
      if (tMatch[3].toLowerCase() === 'am' && hours === 12) hours = 0;
      if (tMatch[2]) mins = parseInt(tMatch[2]);
    }
  }

  // Return a real Date object in IST
  const d = new Date(year, monthIdx, day, hours, mins, 0);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Validates that an image URL is a real event poster, NOT a UI icon or share button
 */
export function isValidEventPoster(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  const lower = url.toLowerCase();
  return !lower.match(
    /(?:share_v\d|like_icon|interested|common\/icons|synopsis\/share|\.svg\b|hut\.svg|logo\.svg|avatar|favicon|genre\.png|language\.png|navigate_icon\.png|duration\.png|time\.png|calendar\.png|location\.png)/i
  );
}

/**
 * Scrape OpenGraph, Schema.org JSON-LD, and page metadata from an external event URL
 * Uses direct fetch with fallback to Jina Reader proxy for Cloudflare-protected sites (e.g. BookMyShow)
 */
export async function scrapeUrlMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
  bodySnippet?: string;
  price?: string;
  platform: string;
  cleanUrl: string;
  venue_name?: string;
  location_address?: string;
  city?: string;
  start_at?: string;
  end_at?: string;
}> {
  let platform = 'telegram';
  const lower = url.toLowerCase();
  if (lower.includes('district.in')) platform = 'district';
  else if (lower.includes('unstop.com')) platform = 'unstop';
  else if (lower.includes('bookmyshow.com')) platform = 'bookmyshow';
  else if (lower.includes('insider.in') || lower.includes('paytm')) platform = 'insider';
  else if (lower.includes('lu.ma')) platform = 'luma';
  else if (lower.includes('instagram.com')) platform = 'instagram';

  let rawContent = '';
  let usedReaderProxy = false;

  // Step 1: Attempt direct HTTP fetch (except for BookMyShow which always returns 403 Cloudflare blocks)
  if (!lower.includes('bookmyshow.com')) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        rawContent = await res.text();
      } else {
        usedReaderProxy = true;
      }
    } catch (err: any) {
      usedReaderProxy = true;
    }
  } else {
    usedReaderProxy = true;
  }

  // Step 2: Fallback to Jina Reader for protected platforms (e.g. BookMyShow 403)
  if (usedReaderProxy || !rawContent || rawContent.length < 500) {
    try {
      const proxyRes = await fetch(`https://r.jina.ai/${url}`, {
        headers: { Accept: 'text/plain' },
        signal: AbortSignal.timeout(16000),
      });
      if (proxyRes.ok) {
        rawContent = await proxyRes.text();
        usedReaderProxy = true;
      }
    } catch (proxyErr) {
      console.warn('[ScrapeUrl] Reader proxy fetch failed:', proxyErr);
    }
  }

  // Step 3: Extract accurate ticket price deterministically
  let detectedPrice = extractPriceFromContent(rawContent);

  // Step 4: Parse Title, Description, and Images
  let title: string | undefined;
  let description: string | undefined;
  let image: string | undefined;
  let venueName: string | undefined;
  let locationAddress: string | undefined;
  let eventCity: string | undefined;
  let startAt: string | undefined;
  let endAt: string | undefined;

  // Step 4A: Check for Schema.org JSON-LD Event metadata (District, BookMyShow, Luma, etc.)
  const jsonLd = parseJsonLdEvent(rawContent);
  if (jsonLd) {
    if (jsonLd.name && typeof jsonLd.name === 'string') {
      title = jsonLd.name.trim();
    }
    if (jsonLd.description && typeof jsonLd.description === 'string') {
      description = jsonLd.description.trim();
    }
    if (jsonLd.image && isValidEventPoster(typeof jsonLd.image === 'string' ? jsonLd.image : jsonLd.image?.url)) {
      image = typeof jsonLd.image === 'string' ? jsonLd.image : jsonLd.image?.url;
    }
    if (jsonLd.location) {
      if (typeof jsonLd.location === 'string') {
        venueName = jsonLd.location.trim();
      } else if (typeof jsonLd.location === 'object') {
        venueName = jsonLd.location.name?.trim() || undefined;
        if (typeof jsonLd.location.address === 'string') {
          locationAddress = jsonLd.location.address.trim();
        } else if (jsonLd.location.address && typeof jsonLd.location.address === 'object') {
          const addr = jsonLd.location.address;
          locationAddress = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode, addr.addressCountry]
            .filter(Boolean)
            .join(', ');
          if (addr.addressLocality) {
            eventCity = addr.addressLocality.trim();
          }
        }
      }
    }
    if (jsonLd.startDate) {
      try {
        const d = new Date(jsonLd.startDate);
        if (!isNaN(d.getTime())) startAt = d.toISOString();
      } catch {}
    }
    if (jsonLd.endDate) {
      try {
        const d = new Date(jsonLd.endDate);
        if (!isNaN(d.getTime())) endAt = d.toISOString();
      } catch {}
    }
    if (!detectedPrice && jsonLd.offers) {
      const lowPrice = jsonLd.offers.lowPrice ?? jsonLd.offers.price;
      if (lowPrice !== undefined && lowPrice !== null) {
        detectedPrice = Number(lowPrice) === 0 ? 'Free Entry' : `₹${lowPrice} onwards`;
      }
    }
  }

  // Step 4B: Deep Structured Matchers for BookMyShow
  if (lower.includes('bookmyshow.com')) {
    // 1. BMS Title cleanup
    const bmsTitleMatch = rawContent.match(/^Title:\s*(.+)$/m) || rawContent.match(/#\s*\[([^!\]]+)/);
    if (bmsTitleMatch && (!title || title.length < 5)) {
      title = bmsTitleMatch[1]
        .replace(/\s*(?:Music Shows|Plays|Events|Concerts|Event Tickets|Tickets|- BookMyShow).*$/i, '')
        .trim();
    }

    // 2. BMS Date & Time (e.g. calendar.png) Sat 26 Sep 2026, time.png) 7:30 PM)
    const bmsDateMatch = rawContent.match(/calendar\.png\)\s*([^\]\n]+)/i);
    const bmsTimeMatch = rawContent.match(/time\.png\)\s*([^\]\n]+)/i);
    if (bmsDateMatch && bmsDateMatch[1]) {
      const parsedStart = parseIndianDateTime(bmsDateMatch[1].trim(), bmsTimeMatch?.[1]?.trim());
      if (parsedStart && !isNaN(parsedStart.getTime())) {
        startAt = parsedStart.toISOString();
        endAt = new Date(parsedStart.getTime() + 2 * 3600 * 1000).toISOString();
      }
    }

    // 3. BMS Venue & City (e.g. location.png) Shanmukhananda Hall: Mumbai)
    const bmsLocMatch = rawContent.match(/location\.png\)\s*([^!\]\n]+)/i);
    if (bmsLocMatch && bmsLocMatch[1]) {
      const fullLoc = bmsLocMatch[1].trim();
      const parts = fullLoc.split(':');
      if (parts.length > 1) {
        venueName = parts[0].trim();
        eventCity = parts[1].trim();
        locationAddress = `${venueName}, ${eventCity}, Maharashtra, India`;
      } else {
        venueName = fullLoc;
      }
    }

    // 4. BMS Real Desktop Banner (match markdown, HTML, or raw URLs)
    const bmsImages = Array.from(
      rawContent.matchAll(/(https?:\/\/[^\s"'<>()]+bmscdn\.com[^\s"'<>()]+\.(?:jpg|jpeg|png|webp)[^\s"'<>()]*)/gi)
    )
      .map((m) => m[1])
      .filter(isValidEventPoster);
    const banner =
      bmsImages.find(
        (img) =>
          img.includes('events/banner/desktop/') ||
          img.includes('media-desktop-') ||
          img.includes('events/banner/weblisting/')
      ) || bmsImages[0];
    if (banner) {
      image = banner;
    }
  }

  // Step 4C: Deep Structured Matchers for District.in
  if (lower.includes('district.in')) {
    // 1. Heading cleanup (avoid "Get Upcoming Events..." listing page titles)
    const districtHeadingMatch = rawContent.match(/###\s*([^\n\r]+)/);
    if (districtHeadingMatch && (!title || title.toLowerCase().includes('upcoming events') || title.toLowerCase().includes('district'))) {
      title = districtHeadingMatch[1].trim();
    }

    // 2. High-res gallery poster (match any cdn.district.in image URL)
    const districtGallery = Array.from(
      rawContent.matchAll(/(https?:\/\/[^\s"'<>()]*cdn\.district\.in[^\s"'<>()]+\.(?:jpg|jpeg|png|webp)[^\s"'<>()]*)/gi)
    )
      .map((m) => m[1])
      .filter(isValidEventPoster);
    if (districtGallery.length > 0) {
      image = districtGallery[0];
    }
  }

  // Step 4D: General OpenGraph / Markdown tags if still missing
  if (!image) {
    const allImages = Array.from(
      rawContent.matchAll(/(https?:\/\/[^\s"'<>()]+\.(?:jpg|jpeg|png|webp)[^\s"'<>()]*)/gi)
    )
      .map((m) => m[1])
      .filter(isValidEventPoster);
    if (allImages.length > 0) {
      image = allImages[0];
    }
  }

  if (!title) {
    const titleMatch =
      rawContent.match(/<meta property="og:title" content="([^"]+)"/i) ||
      rawContent.match(/<meta name="twitter:title" content="([^"]+)"/i) ||
      rawContent.match(/<title>([^<]+)<\/title>/i);
    title = titleMatch ? titleMatch[1].trim() : undefined;
  }

  if (!description) {
    const descMatch =
      rawContent.match(/<meta property="og:description" content="([^"]+)"/i) ||
      rawContent.match(/<meta name="description" content="([^"]+)"/i) ||
      rawContent.match(/<meta name="twitter:description" content="([^"]+)"/i);
    description = descMatch ? descMatch[1].trim() : undefined;
  }

  // Detect venue from meta tags if not already extracted
  if (!venueName) {
    const venueMatch =
      rawContent.match(/<meta\s+property="(?:event:location|og:locality|place:name)"\s+content="([^"]+)"/i) ||
      rawContent.match(/class=["'][^"']*venue[^"']*["'][^>]*>([^<]+)</i);
    if (venueMatch) venueName = venueMatch[1].trim();
  }

  // Detect city from address, venue, or title
  if (!eventCity) {
    const detectedCityObj = detectCityFromText(`${locationAddress || ''} ${venueName || ''} ${title || ''}`);
    if (detectedCityObj) eventCity = detectedCityObj.name;
  }

  // Fallback title from URL slug if still missing
  if (!title || title.toLowerCase().startsWith('source url:')) {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1] || '';
      const clean = decodeURIComponent(lastPart)
        .replace(/[-_]/g, ' ')
        .replace(/\b(?:buy tickets?|tickets?|et\d+|\d{5,}|venue guide)\b/gi, '')
        .trim();
      if (clean) title = capitalizeWords(clean);
    } catch {}
  }

  // Clean rawContent up to 25,000 characters for rich Gemini reasoning
  const textSnippet = rawContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25000);

  return {
    title,
    description: description || textSnippet.slice(0, 500),
    image,
    bodySnippet: textSnippet,
    price: detectedPrice || undefined,
    platform,
    cleanUrl: url,
    venue_name: venueName,
    location_address: locationAddress,
    city: eventCity,
    start_at: startAt,
    end_at: endAt,
  };
}

function getSystemExtractionPrompt(inputContext: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentDateStr = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `You are Vibe's expert event curator and computer vision OCR extractor for Indian events.
Today's Date: ${currentDateStr} (Year: ${currentYear}, Timezone: Asia/Kolkata, UTC+05:30).

Your task is to analyze the provided event flyer image or text and extract complete, accurate, high-fidelity event data.

CRITICAL EXTRACTION RULES:
1. TITLE: Extract the EXACT main event title printed on the poster or page. Never output generic titles like "Community Gathering" or "Live Experience", and NEVER output a URL or "Source URL: ...".
2. VENUE & CITY: Extract the exact venue name (auditorium, hall, stadium, club, cafe) and exact city. If written as "Shanmukhananda Hall: Mumbai", venue_name is "Shanmukhananda Hall" and city is "Mumbai". NEVER output generic placeholders like "Mumbai Venue" or "City Venue" when a real venue is present!
3. DATE & TIME: Read the exact date and start time. Calculate the exact ISO timestamp with timezone +05:30 (e.g. "2026-09-26T19:30:00+05:30"). If multiple dates are listed, use the first upcoming date.
4. COVER IMAGE: Find the main high-resolution event banner or poster image URL. NEVER select small icons, share buttons (like share_v2.png), like buttons, or SVG icons.
5. PRICE & TICKETS:
   - Extract the EXACT ticket pricing stated in the context or visible on the poster (e.g. "₹399 onwards", "₹799 onwards", "Free Entry").
   - If NO price is mentioned anywhere, set "price_text" to null.
   - NEVER make up or invent placeholder numbers!
6. CATEGORY: Classify into: "tech" | "music" | "comedy" | "nightlife" | "workshop" | "art" | "fitness" | "wellness" | "culinary" | "poetry" | "festival" | "gaming" | "theatre" | "social".
7. Output ONLY valid, raw JSON (no markdown fences, no \`\`\`json, no backticks).

FEW-SHOT IN-CONTEXT EXAMPLES:

Example 1 (BookMyShow listing):
Context:
"Title: Ishqnaama - Love Across Generations Music Shows, Concerts, Events Tickets - BookMyShow
![Image 2: banner](https://assets-in.bmscdn.com/nmcms/events/banner/desktop/media-desktop-ishqnaama-love-across-generations-0-2026-8-21-t-20-34-39.jpg)
calendar.png) Sat 26 Sep 2026
time.png) 7:30 PM
location.png) Shanmukhananda Hall: Mumbai
₹399 onwards"
Output:
{
  "title": "Ishqnaama - Love Across Generations",
  "tagline": "Seven decades of iconic Hindi cinema love songs in a live concert",
  "description": "Ishqnaama is a live musical concert celebrating seven decades of Hindi cinema love songs from the 1960s to the 2020s, curated by Rajeev Goswami and performed by Indian Idol winners.",
  "category": "music",
  "venue_name": "Shanmukhananda Hall",
  "location_address": "Shanmukhananda Hall, Mumbai, Maharashtra",
  "city": "Mumbai",
  "start_at": "2026-09-26T19:30:00+05:30",
  "end_at": "2026-09-26T21:30:00+05:30",
  "price_text": "₹399 onwards",
  "source_platform": "bookmyshow",
  "cover_image_url": "https://assets-in.bmscdn.com/nmcms/events/banner/desktop/media-desktop-ishqnaama-love-across-generations-0-2026-8-21-t-20-34-39.jpg",
  "template": "bloom",
  "confidence_score": 0.95
}

Example 2 (District.in venue/event guide):
Context:
"### Xclusive Superclub Pune
Zero one, Mundhwa Rd, Fatima Nagar, Pingale Wasti, Koregaon Park Annexe, Mundhwa, Pune, Maharashtra 411036
![Image 3: Gallery](https://cdn.district.in/assets/events/publisher/event_gallery/01M31CHEJ9ZSKK8QWYWD6TAVAV.jpg)"
Output:
{
  "title": "Xclusive Superclub Pune",
  "tagline": "The City's Premier Social Address & Nightlife Destination",
  "description": "Experience luxury nightlife, premier DJ sets, and world-class dining at Xclusive Superclub Pune.",
  "category": "nightlife",
  "venue_name": "Xclusive Superclub Pune",
  "location_address": "Zero one, Mundhwa Rd, Fatima Nagar, Koregaon Park Annexe, Pune, Maharashtra 411036",
  "city": "Pune",
  "start_at": "2026-10-01T20:00:00+05:30",
  "end_at": "2026-10-02T01:30:00+05:30",
  "price_text": "Cover charges apply",
  "source_platform": "district",
  "cover_image_url": "https://cdn.district.in/assets/events/publisher/event_gallery/01M31CHEJ9ZSKK8QWYWD6TAVAV.jpg",
  "template": "ember",
  "confidence_score": 0.9
}

JSON Schema:
{
  "title": "Exact event title (Capitalized)",
  "tagline": "Punchy 8-12 word tagline for the event card",
  "description": "2-3 paragraphs describing what attendees can expect, who is performing/speaking, and the vibe.",
  "category": "tech" | "music" | "comedy" | "nightlife" | "workshop" | "art" | "fitness" | "wellness" | "culinary" | "poetry" | "festival" | "gaming" | "theatre" | "social",
  "venue_name": "Exact venue or museum or auditorium name",
  "location_address": "Street / Area, City, State",
  "city": "Exact city name",
  "start_at": "YYYY-MM-DDTHH:mm:ss+05:30",
  "end_at": "YYYY-MM-DDTHH:mm:ss+05:30",
  "ticket_url": null,
  "price_text": null,
  "source_platform": "vibe" | "district" | "unstop" | "bookmyshow" | "insider" | "luma",
  "cover_image_url": "https://...",
  "template": "grove" | "sprint" | "bloom" | "vertex" | "ember",
  "confidence_score": 0.95,
  "faq": [
    { "q": "Are there parking facilities available?", "a": "Valet and parking available near the venue." },
    { "q": "What is the entry gate timing?", "a": "Gates open 30 minutes prior to the scheduled start time." },
    { "q": "What is the age restriction or dress code?", "a": "Open to all attendees, traditional or smart casual attire recommended." }
  ]
}

Input Context:
${inputContext}`;
}

/**
 * Extract event data from an event flyer/poster image buffer
 */
export async function extractEventFromImage(
  imageBuffer: Buffer,
  mimeType: string,
  caption?: string
): Promise<ExtractedEventData> {
  const genAI = getGenAI();
  const prompt = getSystemExtractionPrompt(
    caption ? `Accompanying message / caption: "${caption}"` : 'Event poster flyer image'
  );

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString('base64'),
      mimeType: mimeType || 'image/jpeg',
    },
  };

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, imagePart]);
      const rawText = result.response.text();
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const category = parsed.category || detectCategoryFromText(`${parsed.title || ''} ${parsed.description || ''}`);
      const detectedCityObj = detectCityFromText(caption || `${parsed.title || ''} ${parsed.venue_name || ''} ${parsed.location_address || ''}`);
      const finalCity = detectedCityObj?.name || parsed.city || 'Mumbai';

      const surety = calculateEventSurety({
        title: parsed.title,
        venue_name: parsed.venue_name,
        location_address: parsed.location_address,
        city: finalCity,
        start_at: parsed.start_at,
        end_at: parsed.end_at,
        price_text: parsed.price_text,
        description: parsed.description,
        cover_image_url: 'data:image/jpeg;base64,custom_poster', // custom user poster provided
      });

      return {
        ...parsed,
        city: finalCity,
        category,
        suggested_slug: generateSlug(parsed.title || 'event'),
        confidence_score: surety.score / 100,
        missing_aspects: surety.missingAspects,
        approval_status: surety.approvalStatus,
        requires_admin_approval: !surety.autoApproved,
      };
    } catch (err: any) {
      console.warn(`[AI Extractor Image] Model ${modelName} warning:`, err?.message || err);
      lastError = err;
    }
  }

  // Fallback if all AI models fail
  console.error('[AI Extractor Image] All candidate models failed, using fallback:', lastError);
  const fallbackCategory = detectCategoryFromText(caption || '');
  const detectedCityObj = detectCityFromText(caption || '');
  const fallbackCity = detectedCityObj?.name || 'Mumbai';
  const fallbackAddress = detectedCityObj?.state ? `${fallbackCity}, ${detectedCityObj.state}` : `${fallbackCity}, India`;

  const fallbackSurety = calculateEventSurety({
    title: caption ? caption.slice(0, 50).trim() : 'Live Experience',
    venue_name: 'City Venue',
    location_address: fallbackAddress,
    city: fallbackCity,
    start_at: new Date(Date.now() + 86400000).toISOString(),
    description: caption || '',
  });

  return {
    title: caption ? caption.slice(0, 50).trim() : 'Live Experience',
    tagline: 'Experience the vibe in town',
    description: caption || 'Join this exciting upcoming gathering. Registration and details available via event host.',
    venue_name: 'City Venue',
    location_address: fallbackAddress,
    city: fallbackCity,
    start_at: new Date(Date.now() + 86400000).toISOString(),
    end_at: new Date(Date.now() + 86400000 + 10800000).toISOString(),
    price_text: 'Free Entry',
    source_platform: 'vibe',
    category: fallbackCategory,
    template: 'ember',
    confidence_score: fallbackSurety.score / 100,
    missing_aspects: fallbackSurety.missingAspects,
    approval_status: fallbackSurety.approvalStatus,
    requires_admin_approval: !fallbackSurety.autoApproved,
    faq: [{ q: 'How do I attend?', a: 'Check venue and ticketing instructions.' }],
    suggested_slug: generateSlug(caption || 'community-event'),
  };
}

export function parseEventDeterministic(text: string): {
  title: string;
  venue_name: string;
  location_address: string;
  city: string;
  start_at: string;
  end_at: string;
  category: EventCategory;
} {
  const currentYear = new Date().getFullYear();
  let title = '';
  let venue = '';
  let city = 'Mumbai';
  let state = '';
  let startAt = new Date(Date.now() + 86400000);

  // Clean raw input
  const cleanInput = text.replace(/^source\s+url:\s*/i, '').trim();

  // 1. Extract City from INDIAN_CITIES
  const cityObj = detectCityFromText(cleanInput);
  if (cityObj) {
    city = cityObj.name;
    state = cityObj.state || '';
  }

  // 2. Extract Named Title
  // e.g. "Dosti Milan Samaroh is the event name", "Named Tedxtalk", "called TedX", "title: Startup Meetup"
  const isEventNameMatch =
    cleanInput.match(/^(.+?)\s+is\s+the\s+event(?:\s+name)?\b/i) ||
    cleanInput.match(/event(?:\s+name)?\s+is\s+[:\s]+([^\n\.,]+)/i);
  if (isEventNameMatch && isEventNameMatch[1].trim()) {
    title = isEventNameMatch[1].trim();
  } else {
    const namedMatch =
      cleanInput.match(/(?:named|called|titled|topic)[:\s]+([A-Za-z0-9\s&'-]+?)(?=\s+(?:at|on|in|from|dated|timing|$|\.|\,))/i) ||
      cleanInput.match(/(?:named|called|titled|topic)[:\s]+([^\n\.,]+)/i);
    if (namedMatch && namedMatch[1].trim()) {
      title = namedMatch[1].trim();
    }
  }

  // 3. Extract Venue e.g. "at Lalghati Choupati", "at Subko Cafe", "in Cyber Hub"
  // Prioritize "at <venue>" (excluding time like "at 9 pm"), then "in <venue>" (excluding dates)
  const atVenueMatch = cleanInput.match(/\bat\s+(?!\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)([A-Za-z0-9\s&'-]+?)(?:\s+(?:at|on|in|from|dated|named|called|timing|\.|\,)|$)/i);
  const inVenueMatch = cleanInput.match(/\bin\s+(?!\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b)([A-Za-z0-9\s&'-]+?)(?:\s+(?:at|on|in|from|dated|named|called|timing|\.|\,)|$)/i);

  if (atVenueMatch && atVenueMatch[1].trim()) {
    venue = atVenueMatch[1].trim();
  } else if (inVenueMatch && inVenueMatch[1].trim()) {
    venue = inVenueMatch[1].trim();
  } else {
    venue = `${city} Venue`;
  }

  // 4. Extract Date & Time e.g. "29th September at 10 am", "Sep 29", "tomorrow at 7 pm"
  const dateMatch = cleanInput.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i);
  const timeMatch = cleanInput.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);

  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthStr = dateMatch[2].toLowerCase();
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = months.findIndex((m) => monthStr.startsWith(m));
    if (monthIndex >= 0) {
      let hours = 19;
      let minutes = 0;
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        if (timeMatch[3].toLowerCase() === 'pm' && hours < 12) hours += 12;
        if (timeMatch[3].toLowerCase() === 'am' && hours === 12) hours = 0;
        if (timeMatch[2]) minutes = parseInt(timeMatch[2]);
      }
      startAt = new Date(currentYear, monthIndex, day, hours, minutes);
    }
  } else if (/tomorrow/i.test(cleanInput)) {
    const tm = new Date(Date.now() + 86400000);
    let hours = 19;
    let minutes = 0;
    if (timeMatch) {
      hours = parseInt(timeMatch[1]);
      if (timeMatch[3].toLowerCase() === 'pm' && hours < 12) hours += 12;
      if (timeMatch[3].toLowerCase() === 'am' && hours === 12) hours = 0;
      if (timeMatch[2]) minutes = parseInt(timeMatch[2]);
    }
    tm.setHours(hours, minutes, 0, 0);
    startAt = tm;
  }

  // 5. Clean Fallback Title if not yet found
  if (!title) {
    if (/^https?:\/\//i.test(cleanInput)) {
      try {
        const parsed = new URL(cleanInput);
        const pathParts = parsed.pathname.split('/').filter(Boolean);
        let eventSlugPart = pathParts[pathParts.length - 1] || '';
        if (
          ['venue-guide', 'tickets', 'buy', 'checkout', 'booking'].includes(eventSlugPart.toLowerCase()) &&
          pathParts.length > 1
        ) {
          eventSlugPart = pathParts[pathParts.length - 2];
        } else if (/^(?:et\d+|\d+)$/i.test(eventSlugPart) && pathParts.length > 1) {
          eventSlugPart = pathParts[pathParts.length - 2];
        }
        const cleanSlug = decodeURIComponent(eventSlugPart)
          .replace(/[-_]/g, ' ')
          .replace(/\b(?:buy tickets?|tickets?|et\d+|\d{5,}|venue guide|aug\d*|sep\d*|oct\d*|nov\d*|dec\d*|\d{4})\b/gi, '')
          .trim();
        title = cleanSlug || 'Curated Gathering';
      } catch {
        title = 'Curated Gathering';
      }
    } else {
      let clean = cleanInput
        .replace(/^(?:event|gathering|meetup|live)\s+/i, '')
        .replace(/\s+at\s+[\w\s]+?(?=\s+on|\s+at|$)/gi, '')
        .replace(/\s+on\s+\d{1,2}(?:st|nd|rd|th)?\s+\w+/gi, '')
        .replace(/\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi, '')
        .trim();
      title = clean.length > 5 ? clean.slice(0, 50) : (cleanInput.slice(0, 50).trim() || 'Curated Gathering');
    }
  }

  title = capitalizeWords(title);
  const category = detectCategoryFromText(`${title} ${cleanInput}`);
  const address = state ? `${venue}, ${city}, ${state}` : `${venue}, ${city}, India`;
  const endAt = new Date(startAt.getTime() + 3 * 60 * 60 * 1000);

  return {
    title,
    venue_name: venue,
    location_address: address,
    city,
    start_at: startAt.toISOString(),
    end_at: endAt.toISOString(),
    category,
  };
}

/**
 * Extract event data from text or forwarded link
 */
export async function extractEventFromText(text: string): Promise<ExtractedEventData> {
  const genAI = getGenAI();
  const cleanInputText = text.replace(/^source\s+url:\s*/i, '').trim();
  const deterministicData = parseEventDeterministic(cleanInputText);

  // 1. Check if message contains a URL
  const urlMatch = cleanInputText.match(/(https?:\/\/[^\s]+)/i);
  let scrapedContext = '';
  let extractedCover: string | undefined = undefined;
  let detectedPlatform = 'telegram';
  let targetUrl: string | undefined = undefined;
  let scrapedPrice: string | undefined = undefined;
  let scrapedVenue: string | undefined = undefined;
  let scrapedAddress: string | undefined = undefined;
  let scrapedCity: string | undefined = undefined;
  let scrapedStartAt: string | undefined = undefined;
  let scrapedEndAt: string | undefined = undefined;
  let scrapedTitle: string | undefined = undefined;
  let scrapedDescription: string | undefined = undefined;

  if (urlMatch) {
    const rawUrl = urlMatch[1].trim();
    targetUrl = rawUrl;
    const scraped = await scrapeUrlMetadata(rawUrl);
    detectedPlatform = scraped.platform;
    extractedCover = scraped.image;
    scrapedPrice = scraped.price;
    scrapedVenue = scraped.venue_name;
    scrapedAddress = scraped.location_address;
    scrapedCity = scraped.city;
    scrapedStartAt = scraped.start_at;
    scrapedEndAt = scraped.end_at;
    scrapedTitle = scraped.title;
    scrapedDescription = scraped.description;

    if (scraped.title) deterministicData.title = scraped.title;
    if (scraped.venue_name) deterministicData.venue_name = scraped.venue_name;
    if (scraped.location_address) deterministicData.location_address = scraped.location_address;
    if (scraped.city) deterministicData.city = scraped.city;
    if (scraped.start_at) deterministicData.start_at = scraped.start_at;
    if (scraped.end_at) deterministicData.end_at = scraped.end_at;

    scrapedContext = `
Detected Event URL: ${rawUrl}
Platform: ${scraped.platform.toUpperCase()}
Page Title: ${scraped.title || 'Unknown'}
Detected Real Poster / Banner: ${scraped.image || 'None'}
Detected Venue / Place: ${scraped.venue_name || 'Unknown'}
Detected Address: ${scraped.location_address || 'Unknown'}
Detected City: ${scraped.city || 'Unknown'}
Detected Start Time: ${scraped.start_at || 'Unknown'}
Page Description: ${scraped.description || 'Unknown'}
Detected Ticket Price: ${scraped.price || 'Not mentioned in page metadata'}
Page Content Excerpt: ${scraped.bodySnippet || 'None'}
`;
  }

  const prompt = getSystemExtractionPrompt(
    scrapedContext
      ? `User provided an event link. Here are the scraped page details:\n${scrapedContext}\nUser's message: "${cleanInputText}"\n\nCRITICAL: Extract complete event details for this ${detectedPlatform} listing. Set ticket_url to "${targetUrl}". Set source_platform to "${detectedPlatform}". If "Detected Real Poster / Banner" is provided, set cover_image_url to that EXACT URL. NEVER invent or fabricate a fictional image URL. Output strictly valid JSON.`
      : `Message content:\n${cleanInputText}`
  );

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      const category = parsed.category || deterministicData.category;

      // Validate cover image: Priority 1: Exact scraped banner from the real page
      let finalCover = isValidEventPoster(extractedCover) ? extractedCover : undefined;

      // Priority 2: Parsed cover from AI ONLY IF it actually exists in the scraped page
      if (!finalCover && isValidEventPoster(parsed.cover_image_url)) {
        const urlStr = parsed.cover_image_url.trim();
        const isHallucinated =
          (urlStr.includes('bmscdn.com') || urlStr.includes('district.in')) &&
          (!scrapedContext || !scrapedContext.includes(urlStr));

        if (!isHallucinated) {
          finalCover = urlStr;
        }
      }

      // Priority 3: Fall back to beautiful high-res curated Unsplash category banner
      if (!finalCover) {
        finalCover = getCategoryCover(category, parsed.title || cleanInputText);
      }

      // Title validation: reject generic titles or raw URLs
      const isBadTitle = (t?: string) =>
        !t ||
        t === 'Live Experience' ||
        t === 'Community Gathering' ||
        t === 'Curated Gathering' ||
        t.toLowerCase().startsWith('source url:') ||
        /^https?:\/\//i.test(t);

      const finalTitle = !isBadTitle(parsed.title)
        ? parsed.title
        : (!isBadTitle(scrapedTitle) ? scrapedTitle : deterministicData.title);

      // City validation: prioritize detected city, then parsed, then scraped
      const finalCity = (parsed.city && parsed.city.toLowerCase() !== 'unknown' ? parsed.city : null) ||
        scrapedCity ||
        deterministicData.city ||
        'Mumbai';

      // Venue validation: NEVER allow "City Venue" or "Mumbai Venue" when scrapedVenue exists
      const isPlaceholderVenue = (v?: string) =>
        !v ||
        /^(?:city|mumbai|pune|delhi|bhopal|bangalore|bengaluru)?\s*venue\b/i.test(v) ||
        /venue\s+tba/i.test(v) ||
        /unknown/i.test(v);

      const finalVenue =
        (!isPlaceholderVenue(scrapedVenue) ? scrapedVenue : undefined) ||
        (!isPlaceholderVenue(parsed.venue_name) ? parsed.venue_name : undefined) ||
        (!isPlaceholderVenue(deterministicData.venue_name) ? deterministicData.venue_name : undefined) ||
        `${finalCity} Venue`;

      const finalAddress =
        (scrapedAddress && !scrapedAddress.includes('City Venue') ? scrapedAddress : undefined) ||
        (parsed.location_address && !parsed.location_address.includes('City Venue') ? parsed.location_address : undefined) ||
        deterministicData.location_address;

      // Date & Time validation: prefer exact scraped start_at when available from platform
      const finalStartAt = scrapedStartAt || parsed.start_at || deterministicData.start_at;
      const finalEndAt = scrapedEndAt || parsed.end_at || deterministicData.end_at;

      const surety = calculateEventSurety({
        title: finalTitle,
        venue_name: finalVenue,
        location_address: finalAddress,
        city: finalCity,
        start_at: finalStartAt,
        end_at: finalEndAt,
        ticket_url: targetUrl || parsed.ticket_url,
        price_text: scrapedPrice || parsed.price_text,
        description: parsed.description || scrapedDescription || cleanInputText,
        cover_image_url: finalCover,
        is_external: Boolean(targetUrl),
      });

      return {
        ...parsed,
        title: finalTitle,
        venue_name: finalVenue,
        location_address: finalAddress,
        city: finalCity,
        category,
        start_at: finalStartAt,
        end_at: finalEndAt,
        ticket_url: targetUrl || parsed.ticket_url,
        price_text: scrapedPrice || parsed.price_text || (targetUrl ? 'See booking page' : 'Free Entry'),
        source_platform: detectedPlatform !== 'telegram' ? detectedPlatform : parsed.source_platform || 'vibe',
        cover_image_url: finalCover,
        suggested_slug: generateSlug(finalTitle || 'event'),
        confidence_score: surety.score / 100,
        missing_aspects: surety.missingAspects,
        approval_status: surety.approvalStatus,
        requires_admin_approval: !surety.autoApproved,
      };
    } catch (err: any) {
      console.warn(`[AI Extractor Text] Model ${modelName} warning:`, err?.message || err);
      lastError = err;
    }
  }

  // High-fidelity fallback using deterministic entity parser and scraped metadata
  console.log('[AI Extractor Text] Using deterministic parser fallback for:', cleanInputText);
  const fallbackCover =
    (isValidEventPoster(extractedCover) ? extractedCover : undefined) ||
    getCategoryCover(deterministicData.category, deterministicData.title);

  const fallbackVenue = scrapedVenue || deterministicData.venue_name;
  const fallbackCity = scrapedCity || deterministicData.city;
  const fallbackAddress = scrapedAddress || deterministicData.location_address;
  const fallbackStartAt = scrapedStartAt || deterministicData.start_at;
  const fallbackEndAt = scrapedEndAt || deterministicData.end_at;
  const fallbackTitle = scrapedTitle || deterministicData.title;

  const fallbackSurety = calculateEventSurety({
    title: fallbackTitle,
    venue_name: fallbackVenue,
    location_address: fallbackAddress,
    city: fallbackCity,
    start_at: fallbackStartAt,
    end_at: fallbackEndAt,
    ticket_url: targetUrl,
    price_text: scrapedPrice,
    description: scrapedDescription || cleanInputText,
    cover_image_url: fallbackCover,
    is_external: Boolean(targetUrl),
  });

  return {
    title: fallbackTitle,
    tagline: `Exciting gathering in ${fallbackCity}`,
    description: scrapedDescription || cleanInputText,
    category: deterministicData.category,
    venue_name: fallbackVenue,
    location_address: fallbackAddress,
    city: fallbackCity,
    start_at: fallbackStartAt,
    end_at: fallbackEndAt,
    ticket_url: targetUrl,
    price_text: scrapedPrice || (targetUrl ? 'See booking page' : 'Free Entry'),
    source_platform: detectedPlatform !== 'telegram' ? detectedPlatform : 'vibe',
    cover_image_url: fallbackCover,
    template: 'grove',
    confidence_score: fallbackSurety.score / 100,
    missing_aspects: fallbackSurety.missingAspects,
    approval_status: fallbackSurety.approvalStatus,
    requires_admin_approval: !fallbackSurety.autoApproved,
    faq: [{ q: 'Where do I register?', a: 'Via the official booking link.' }],
    suggested_slug: generateSlug(fallbackTitle),
  };
}
