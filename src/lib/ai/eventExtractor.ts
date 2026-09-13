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
  faq: Array<{ q: string; a: string }>;
  suggested_slug: string;
}

const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
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

function getSystemExtractionPrompt(inputContext: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentDateStr = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `You are Vibe's expert event curator and OCR extractor for Pune and Indian metro events.
Today's Date: ${currentDateStr} (Year: ${currentYear}, Timezone: Asia/Kolkata, UTC+05:30).

Your task is to analyze the provided event flyer image or text and extract clean, structured event data.

CRITICAL INSTRUCTIONS:
1. Always calculate dates relative to today (${currentDateStr}). If an event says "Sat, 28th Sep" or "This Sunday", calculate the exact ISO timestamp with timezone +05:30 (e.g. "${currentYear}-09-28T19:00:00+05:30"). Never output past years unless explicitly specified.
2. If end time is not stated, assume 3 hours after start time.
3. Determine the best matching template:
   - 'ember' for nightlife, DJ gigs, stand-up comedy, bar events
   - 'vertex' for tech conferences, hackathons, AI mixers, startup demos
   - 'bloom' for live music, acoustic fests, art exhibitions, poetry
   - 'sprint' for sports, marathons, fitness, esports
   - 'grove' for workshops, reading clubs, breakfast runs, culinary, community meets
4. Detect the ticketing platform if mentioned or visible (e.g. 'district', 'unstop', 'bookmyshow', 'insider', 'luma', 'instagram').
5. Output ONLY valid, raw JSON (no markdown fences, no \`\`\`json, no backticks).

JSON Schema:
{
  "title": "Clear concise event title (Capitalized)",
  "tagline": "Punchy 8-12 word tagline for the event card",
  "description": "2-3 well-written, engaging paragraphs describing what attendees can expect, who is performing/speaking, and the vibe.",
  "venue_name": "Specific venue or auditorium or cafe name",
  "location_address": "Street / Area, Pune, Maharashtra",
  "city": "Pune",
  "start_at": "YYYY-MM-DDTHH:mm:ss+05:30",
  "end_at": "YYYY-MM-DDTHH:mm:ss+05:30",
  "ticket_url": "Direct ticketing / registration URL if found or null",
  "price_text": "e.g. Free, ₹299 onwards, ₹500 entry, etc.",
  "source_platform": "district" | "unstop" | "bookmyshow" | "insider" | "luma" | "instagram" | "telegram",
  "template": "grove" | "sprint" | "bloom" | "vertex" | "ember",
  "confidence_score": 0.95,
  "faq": [
    { "q": "Are there parking facilities available?", "a": "Valet and on-street parking available near the venue." },
    { "q": "What is the entry gate timing?", "a": "Gates open 30 minutes prior to the scheduled start time." },
    { "q": "What is the age restriction or dress code?", "a": "Open to all attendees, casual smart attire recommended." }
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
        confidence_score: parsed.confidence_score || 0.92,
      };
    } catch (err: any) {
      console.warn(`[AI Extractor Image] Model ${modelName} warning:`, err?.message || err);
      lastError = err;
    }
  }

  // Fallback if all AI models fail
  console.error('[AI Extractor Image] All candidate models failed, using fallback:', lastError);
  return {
    title: 'Pune Community Experience',
    tagline: 'An exciting upcoming event in Pune',
    description: 'Join this gathering in Pune. Registration and details available via event host.',
    venue_name: 'Pune Venue',
    location_address: 'Koregaon Park / FC Road, Pune',
    city: 'Pune',
    start_at: new Date(Date.now() + 86400000).toISOString(),
    end_at: new Date(Date.now() + 86400000 + 10800000).toISOString(),
    price_text: 'Free / Venue Pricing',
    source_platform: 'telegram',
    template: 'ember',
    confidence_score: 0.7,
    faq: [{ q: 'How do I attend?', a: 'Check venue and ticketing instructions.' }],
    suggested_slug: generateSlug('pune-community-event'),
  };
}

/**
 * Extract event data from text or forwarded link
 */
export async function extractEventFromText(text: string): Promise<ExtractedEventData> {
  const genAI = getGenAI();
  const prompt = getSystemExtractionPrompt(`Message content / URL:\n${text}`);

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
  return {
    title: text.slice(0, 50).trim() || 'Curated Pune Gathering',
    tagline: 'Exciting weekend plan in Pune',
    description: text,
    venue_name: 'Pune',
    location_address: 'Pune, Maharashtra',
    city: 'Pune',
    start_at: new Date(Date.now() + 86400000).toISOString(),
    end_at: new Date(Date.now() + 86400000 + 10800000).toISOString(),
    price_text: 'See ticketing page',
    source_platform: text.includes('unstop.com')
      ? 'unstop'
      : text.includes('district.in')
      ? 'district'
      : text.includes('bookmyshow')
      ? 'bookmyshow'
      : text.includes('lu.ma')
      ? 'luma'
      : 'telegram',
    template: 'grove',
    confidence_score: 0.75,
    faq: [{ q: 'Where do I register?', a: 'Via the official booking link.' }],
    suggested_slug: generateSlug(text.slice(0, 30)),
  };
}
