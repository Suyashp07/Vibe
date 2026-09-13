import { GoogleGenerativeAI } from '@google/generative-ai';
import { nanoid } from 'nanoid';
import { TemplateType } from '@/types';

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
  template: TemplateType;
  confidence_score: number;
  cover_image_url?: string;
  faq: Array<{ q: string; a: string }>;
  suggested_slug: string;
}

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];

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
 * Scrape OpenGraph metadata from an external event URL with strict timeout
 */
export async function scrapeUrlMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
  bodySnippet?: string;
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

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(3000), // 3s max timeout to prevent Vercel 10s gateway timeout
    });

    if (res.ok) {
      const html = await res.text();
      const titleMatch =
        html.match(/<meta property="og:title" content="([^"]+)"/i) ||
        html.match(/<meta name="twitter:title" content="([^"]+)"/i) ||
        html.match(/<title>([^<]+)<\/title>/i);

      const descMatch =
        html.match(/<meta property="og:description" content="([^"]+)"/i) ||
        html.match(/<meta name="description" content="([^"]+)"/i) ||
        html.match(/<meta name="twitter:description" content="([^"]+)"/i);

      const imageMatch =
        html.match(/<meta property="og:image" content="([^"]+)"/i) ||
        html.match(/<meta name="twitter:image" content="([^"]+)"/i);

      const textSnippet = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1500);

      return {
        title: titleMatch ? titleMatch[1].trim() : undefined,
        description: descMatch ? descMatch[1].trim() : undefined,
        image: imageMatch ? imageMatch[1].trim() : undefined,
        bodySnippet: textSnippet,
        platform,
        cleanUrl: url,
      };
    }
  } catch (err) {
    console.warn('[ScrapeUrl] HTTP fetch failed or timed out, parsing URL path:', err);
  }

  // Fallback: extract title from URL path slug
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';
    const clean = decodeURIComponent(lastPart)
      .replace(/[-_]/g, ' ')
      .replace(/\d{5,}/g, '')
      .trim();

    return {
      title: clean ? capitalizeWords(clean) : undefined,
      platform,
      cleanUrl: url,
    };
  } catch {
    return { platform, cleanUrl: url };
  }
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
1. TITLE: Extract the EXACT main event title printed on the poster (e.g. "The Language of Belonging: Sign Language, Culture & Inclusion", "Garba Ni Raat 2.0"). Never output generic titles like "Community Gathering" or "Live Experience".
2. VENUE & CITY: Extract the exact venue name (auditorium, museum, stadium, park, club, cafe) and exact city (e.g. "Kiran Nadar Museum of Art", "New Delhi" or "One7 Sports Park", "Gurugram" or "Bal Gandharva", "Pune").
3. DATE & TIME: Read the exact date (e.g. "Sat, 26 Sept", "17 Oct") and start time (e.g. "3:00 PM", "5:30 PM"). Calculate the exact ISO timestamp with timezone +05:30 (e.g. "${currentYear}-09-26T15:00:00+05:30").
4. PRICE: Extract exact ticket pricing stated on the flyer (e.g. "₹0 onwards", "Free", "₹199 onwards", "₹499 per head").
5. PERFORMERS & HIGHLIGHTS: In the description, clearly highlight all featured artists, panelists, DJs, and activities visible on the poster.
6. TICKETING & PLATFORM (STRICT ANTI-HALLUCINATION RULE):
   - "ticket_url": MUST BE null unless an actual "http://" or "https://" URL is visibly printed on the flyer or explicitly written in the message. NEVER invent or guess a fake URL!
   - "source_platform": MUST BE "vibe" unless an external ticketing service (District, Unstop, BookMyShow, Luma, Insider) is explicitly mentioned. Events created via posters or WhatsApp messages are created directly for Vibe!
7. Output ONLY valid, raw JSON (no markdown fences, no \`\`\`json, no backticks).

JSON Schema:
{
  "title": "Exact event title printed on the poster (Capitalized)",
  "tagline": "Punchy 8-12 word tagline for the event card",
  "description": "2-3 paragraphs describing what attendees can expect, who is performing/speaking, and the vibe.",
  "venue_name": "Exact venue or museum or auditorium name from poster",
  "location_address": "Street / Area, City, State",
  "city": "Exact city name from poster",
  "start_at": "YYYY-MM-DDTHH:mm:ss+05:30",
  "end_at": "YYYY-MM-DDTHH:mm:ss+05:30",
  "ticket_url": null,
  "price_text": "e.g. Free, ₹299 onwards, ₹500 entry, etc.",
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

      return {
        ...parsed,
        suggested_slug: generateSlug(parsed.title || 'event'),
        confidence_score: parsed.confidence_score || 0.95,
      };
    } catch (err: any) {
      console.warn(`[AI Extractor Image] Model ${modelName} warning:`, err?.message || err);
      lastError = err;
    }
  }

  // Fallback if all AI models fail
  console.error('[AI Extractor Image] All candidate models failed, using fallback:', lastError);
  return {
    title: caption ? caption.slice(0, 50) : 'Live Experience',
    tagline: 'Experience the vibe in town',
    description: caption || 'Join this exciting upcoming gathering. Registration and details available via event host.',
    venue_name: 'City Venue',
    location_address: 'City Center',
    city: 'Pune',
    start_at: new Date(Date.now() + 86400000).toISOString(),
    end_at: new Date(Date.now() + 86400000 + 10800000).toISOString(),
    price_text: 'Free / Host Pricing',
    source_platform: 'telegram',
    template: 'ember',
    confidence_score: 0.7,
    faq: [{ q: 'How do I attend?', a: 'Check venue and ticketing instructions.' }],
    suggested_slug: generateSlug(caption || 'community-event'),
  };
}

/**
 * Extract event data from text or forwarded link
 */
export async function extractEventFromText(text: string): Promise<ExtractedEventData> {
  const genAI = getGenAI();

  // 1. Check if message contains a URL
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
  let scrapedContext = '';
  let extractedCover: string | undefined = undefined;
  let detectedPlatform = 'telegram';
  let targetUrl: string | undefined = undefined;

  if (urlMatch) {
    const rawUrl = urlMatch[1].trim();
    targetUrl = rawUrl;
    const scraped = await scrapeUrlMetadata(rawUrl);
    detectedPlatform = scraped.platform;
    extractedCover = scraped.image;

    scrapedContext = `
Detected Event URL: ${rawUrl}
Platform: ${scraped.platform.toUpperCase()}
Page Title: ${scraped.title || 'Unknown'}
Page Description: ${scraped.description || 'Unknown'}
Page Content Excerpt: ${scraped.bodySnippet || 'None'}
`;
  }

  const prompt = getSystemExtractionPrompt(
    scrapedContext
      ? `User provided an event link. Here are the scraped page details:\n${scrapedContext}\nUser's message: "${text}"\n\nCRITICAL: You MUST extract or synthesize the complete event details for this ${detectedPlatform} listing. Set ticket_url to "${targetUrl}". Set source_platform to "${detectedPlatform}". Output strictly valid JSON.`
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

      return {
        ...parsed,
        ticket_url: targetUrl || parsed.ticket_url,
        source_platform: detectedPlatform !== 'telegram' ? detectedPlatform : parsed.source_platform || 'telegram',
        cover_image_url: extractedCover,
        suggested_slug: generateSlug(parsed.title || 'event'),
        confidence_score: parsed.confidence_score || 0.90,
      };
    } catch (err: any) {
      console.warn(`[AI Extractor Text] Model ${modelName} warning:`, err?.message || err);
      lastError = err;
    }
  }

  // Fallback if all AI models fail
  console.error('[AI Extractor Text] All candidate models failed, using fallback:', lastError);
  const fallbackTitle = text.slice(0, 50).trim() || 'Curated Gathering';
  return {
    title: fallbackTitle,
    tagline: 'Exciting weekend plan',
    description: text,
    venue_name: 'City Venue',
    location_address: 'City Center',
    city: 'Pune',
    start_at: new Date(Date.now() + 86400000).toISOString(),
    end_at: new Date(Date.now() + 86400000 + 10800000).toISOString(),
    ticket_url: targetUrl,
    price_text: 'See ticketing page',
    source_platform: detectedPlatform,
    cover_image_url: extractedCover,
    template: 'grove',
    confidence_score: 0.75,
    faq: [{ q: 'Where do I register?', a: 'Via the official booking link.' }],
    suggested_slug: generateSlug(fallbackTitle),
  };
}
