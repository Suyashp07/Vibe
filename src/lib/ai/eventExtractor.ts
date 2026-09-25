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
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
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
export async function scrapeUrlMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
  bodySnippet?: string;
  price?: string;
  platform: string;
  cleanUrl: string;
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

  // Step 1: Attempt direct HTTP fetch (3.5s timeout)
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
      console.warn(`[ScrapeUrl] Direct fetch returned HTTP ${res.status}, trying reader proxy...`);
      usedReaderProxy = true;
    }
  } catch (err: any) {
    console.warn('[ScrapeUrl] Direct fetch failed/timed out, trying reader proxy:', err?.message || err);
    usedReaderProxy = true;
  }

  // Step 2: Fallback to Jina Reader for protected platforms (e.g. BookMyShow 403)
  if (usedReaderProxy || !rawContent || rawContent.length < 500) {
    try {
      const proxyRes = await fetch(`https://r.jina.ai/${url}`, {
        headers: { Accept: 'text/plain' },
        signal: AbortSignal.timeout(5000),
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
  const detectedPrice = extractPriceFromContent(rawContent);

  // Step 4: Parse Title, Description, and Images
  let title: string | undefined;
  let description: string | undefined;
  let image: string | undefined;

  if (usedReaderProxy) {
    // Parse from reader markdown
    const titleMatch = rawContent.match(/^Title:\s*(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1]
        .replace(/\s*(?:Music Shows|Plays|Events|Concerts|Event Tickets|Tickets|- BookMyShow).*$/i, '')
        .trim();
    }
    const imgMatch =
      rawContent.match(/!\[.*?\]\((https?:\/\/[^\s\)]+bmscdn\.com[^\s\)]+)\)/i) ||
      rawContent.match(/!\[.*?\]\((https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|webp)[^\s\)]*)\)/i);
    if (imgMatch) {
      image = imgMatch[1];
    }
    description = rawContent.slice(0, 1500).trim();
  } else {
    // Parse from raw HTML
    const titleMatch =
      rawContent.match(/<meta property="og:title" content="([^"]+)"/i) ||
      rawContent.match(/<meta name="twitter:title" content="([^"]+)"/i) ||
      rawContent.match(/<title>([^<]+)<\/title>/i);

    const descMatch =
      rawContent.match(/<meta property="og:description" content="([^"]+)"/i) ||
      rawContent.match(/<meta name="description" content="([^"]+)"/i) ||
      rawContent.match(/<meta name="twitter:description" content="([^"]+)"/i);

    const imageMatch =
      rawContent.match(/<meta property="og:image" content="([^"]+)"/i) ||
      rawContent.match(/<meta name="twitter:image" content="([^"]+)"/i);

    title = titleMatch ? titleMatch[1].trim() : undefined;
    description = descMatch ? descMatch[1].trim() : undefined;
    image = imageMatch ? imageMatch[1].trim() : undefined;
  }

  // Fallback title from URL slug if still missing
  if (!title) {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1] || '';
      const clean = decodeURIComponent(lastPart)
        .replace(/[-_]/g, ' ')
        .replace(/\d{5,}/g, '')
        .trim();
      if (clean) title = capitalizeWords(clean);
    } catch {}
  }

  const textSnippet = rawContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);

  return {
    title,
    description: description || textSnippet.slice(0, 300),
    image,
    bodySnippet: textSnippet,
    price: detectedPrice || undefined,
    platform,
    cleanUrl: url,
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
1. TITLE: Extract the EXACT main event title printed on the poster or page. Never output generic titles like "Community Gathering" or "Live Experience".
2. VENUE & CITY: Extract the exact venue name (auditorium, museum, stadium, park, club, cafe) and exact city (e.g. "Kiran Nadar Museum of Art", "New Delhi" or "One7 Sports Park", "Gurugram" or "The Studio Theatre and Cube (NMACC)", "Mumbai").
3. DATE & TIME: Read the exact date and start time. Calculate the exact ISO timestamp with timezone +05:30 (e.g. "${currentYear}-09-26T15:00:00+05:30").
4. PRICE & TICKETS (STRICT ACCURACY - NEVER HALLUCINATE):
   - Extract the EXACT ticket pricing stated in the context or visible on the poster (e.g. "Free", "Free Entry", "₹0 onwards", "₹450 onwards", "₹699 onwards").
   - If NO price or entry fee is mentioned anywhere in the context or image, set "price_text" to null.
   - NEVER make up, guess, or invent numbers! Do not output placeholder numbers.
5. CATEGORY: Classify the event into one of: "tech", "music", "comedy", "nightlife", "workshop", "art", "fitness", "wellness", "culinary", "poetry", "festival", "gaming", "theatre", "social".
6. PERFORMERS & HIGHLIGHTS: In the description, clearly highlight all featured artists, panelists, DJs, and activities.
7. TICKETING & PLATFORM (STRICT ANTI-HALLUCINATION RULE):
   - "ticket_url": MUST BE null unless an actual "http://" or "https://" URL is visibly printed on the flyer or explicitly provided in the message. NEVER invent or guess a fake URL!
   - "source_platform": MUST BE "vibe" unless an external ticketing service (District, Unstop, BookMyShow, Luma, Paytm Insider) is explicitly mentioned. Events created via posters or WhatsApp messages are created directly for Vibe!
8. Output ONLY valid, raw JSON (no markdown fences, no \`\`\`json, no backticks).

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

  // 1. Extract City from INDIAN_CITIES
  const cityObj = detectCityFromText(text);
  if (cityObj) {
    city = cityObj.name;
    state = cityObj.state || '';
  }

  // 2. Extract Named Title e.g. "Named Tedxtalk", "called TedX", "title: Startup Meetup"
  const namedMatch = text.match(/(?:named|called|titled|topic)[:\s]+([A-Za-z0-9\s&'-]+?)(?=\s+(?:at|on|in|from|dated|timing|$|\.|\,))/i) ||
                     text.match(/(?:named|called|titled|topic)[:\s]+([^\n\.,]+)/i);
  if (namedMatch && namedMatch[1].trim()) {
    title = namedMatch[1].trim();
  }

  // 3. Extract Venue e.g. "at RGPV Bhopal", "at Subko Cafe", "in Cyber Hub"
  const venueMatch = text.match(/\b(?:at|in)\s+([A-Za-z0-9\s&'-]+?)(?=\s+(?:at|on|in|from|dated|named|called|timing|$|\.|\,))/i);
  if (venueMatch && venueMatch[1].trim()) {
    venue = venueMatch[1].trim();
  } else {
    venue = `${city} Venue`;
  }

  // 4. Extract Date & Time e.g. "29th September at 10 am", "Sep 29", "tomorrow at 7 pm"
  const dateMatch = text.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i);
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);

  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthStr = dateMatch[2].toLowerCase();
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = months.findIndex((m) => monthStr.startsWith(m));
    if (monthIndex >= 0) {
      let hours = 10;
      let minutes = 0;
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        if (timeMatch[3].toLowerCase() === 'pm' && hours < 12) hours += 12;
        if (timeMatch[3].toLowerCase() === 'am' && hours === 12) hours = 0;
        if (timeMatch[2]) minutes = parseInt(timeMatch[2]);
      }
      startAt = new Date(currentYear, monthIndex, day, hours, minutes);
    }
  } else if (/tomorrow/i.test(text)) {
    const tm = new Date(Date.now() + 86400000);
    let hours = 18;
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
    let clean = text
      .replace(/^(?:event|gathering|meetup|live)\s+/i, '')
      .replace(/\s+at\s+[\w\s]+?(?=\s+on|\s+at|$)/gi, '')
      .replace(/\s+on\s+\d{1,2}(?:st|nd|rd|th)?\s+\w+/gi, '')
      .replace(/\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi, '')
      .trim();
    title = clean.length > 5 ? clean.slice(0, 50) : (text.slice(0, 50).trim() || 'Curated Gathering');
  }

  title = capitalizeWords(title);
  const category = detectCategoryFromText(`${title} ${text}`);
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
  const deterministicData = parseEventDeterministic(text);

  // 1. Check if message contains a URL
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
  let scrapedContext = '';
  let extractedCover: string | undefined = undefined;
  let detectedPlatform = 'telegram';
  let targetUrl: string | undefined = undefined;
  let scrapedPrice: string | undefined = undefined;

  if (urlMatch) {
    const rawUrl = urlMatch[1].trim();
    targetUrl = rawUrl;
    const scraped = await scrapeUrlMetadata(rawUrl);
    detectedPlatform = scraped.platform;
    extractedCover = scraped.image;
    scrapedPrice = scraped.price;

    scrapedContext = `
Detected Event URL: ${rawUrl}
Platform: ${scraped.platform.toUpperCase()}
Page Title: ${scraped.title || 'Unknown'}
Page Description: ${scraped.description || 'Unknown'}
Detected Ticket Price: ${scraped.price || 'Not mentioned in page metadata'}
Page Content Excerpt: ${scraped.bodySnippet || 'None'}
`;
  }

  const prompt = getSystemExtractionPrompt(
    scrapedContext
      ? `User provided an event link. Here are the scraped page details:\n${scrapedContext}\nUser's message: "${text}"\n\nCRITICAL: Extract complete event details for this ${detectedPlatform} listing. Set ticket_url to "${targetUrl}". Set source_platform to "${detectedPlatform}". Output strictly valid JSON.`
      : `Message content:\n${text}`
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
      const finalCover =
        extractedCover ||
        parsed.cover_image_url ||
        getCategoryCover(category, parsed.title || text);

      const finalTitle = parsed.title && parsed.title !== 'Live Experience' && parsed.title !== 'Community Gathering'
        ? parsed.title
        : deterministicData.title;

      const finalCity = parsed.city && parsed.city !== 'Pune'
        ? parsed.city
        : deterministicData.city;

      const finalVenue = parsed.venue_name && parsed.venue_name !== 'City Venue'
        ? parsed.venue_name
        : deterministicData.venue_name;

      const surety = calculateEventSurety({
        title: finalTitle,
        venue_name: finalVenue,
        location_address: parsed.location_address || deterministicData.location_address,
        city: finalCity,
        start_at: parsed.start_at || deterministicData.start_at,
        end_at: parsed.end_at || deterministicData.end_at,
        ticket_url: targetUrl || parsed.ticket_url,
        price_text: scrapedPrice || parsed.price_text,
        description: parsed.description || text,
        cover_image_url: finalCover,
        is_external: Boolean(targetUrl),
      });

      return {
        ...parsed,
        title: finalTitle,
        venue_name: finalVenue,
        location_address: parsed.location_address || deterministicData.location_address,
        city: finalCity,
        category,
        start_at: parsed.start_at || deterministicData.start_at,
        end_at: parsed.end_at || deterministicData.end_at,
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

  // High-fidelity fallback using deterministic entity parser
  console.log('[AI Extractor Text] Using deterministic parser fallback for:', text);
  const fallbackCover = extractedCover || getCategoryCover(deterministicData.category, deterministicData.title);

  const fallbackSurety = calculateEventSurety({
    title: deterministicData.title,
    venue_name: deterministicData.venue_name,
    location_address: deterministicData.location_address,
    city: deterministicData.city,
    start_at: deterministicData.start_at,
    end_at: deterministicData.end_at,
    ticket_url: targetUrl,
    price_text: scrapedPrice,
    description: text,
    cover_image_url: fallbackCover,
    is_external: Boolean(targetUrl),
  });

  return {
    title: deterministicData.title,
    tagline: `Exciting gathering in ${deterministicData.city}`,
    description: text,
    category: deterministicData.category,
    venue_name: deterministicData.venue_name,
    location_address: deterministicData.location_address,
    city: deterministicData.city,
    start_at: deterministicData.start_at,
    end_at: deterministicData.end_at,
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
    suggested_slug: generateSlug(deterministicData.title),
  };
}
