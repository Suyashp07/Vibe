import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchListingPage } from '@/lib/aggregation/crawler';

export const dynamic = 'force-dynamic';

function cleanJson(text: string): string {
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { url, imageBase64, imageMimeType, text } = await req.json();

    if (!url && !imageBase64 && !text) {
      return NextResponse.json(
        { error: 'Please provide an event URL, poster image, or text description.' },
        { status: 400 }
      );
    }

    let scrapedContent = '';
    if (url && typeof url === 'string' && /^https?:\/\//i.test(url.trim())) {
      try {
        scrapedContent = await fetchListingPage(url.trim());
      } catch (err: any) {
        console.warn('Failed to scrape URL with Jina:', err?.message);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      let prompt = `You are a strict, precise event extraction AI.
Extract structured event details from the provided input (poster image, scraped webpage text, or raw text).

TODAY'S DATE REFERENCE: Current year is 2026. If year is missing, assume upcoming in 2026 or 2027.

Return ONLY a valid JSON object matching this schema:
{
  "title": "Clear event name (Capitalized)",
  "tagline": "Short 8-12 word catchphrase or pitch",
  "description": "2-3 paragraph readable description of the event, what happens, who should attend.",
  "date": "YYYY-MM-DD",
  "time": "HH:MM in 24-hour format (e.g. 18:00 or 19:30)",
  "city": "City name in India or global (e.g. Mumbai, Bengaluru, Pune, Delhi, Goa, or Online)",
  "venue_name": "Specific venue name, cafe, auditorium, coworking, or Online Platform",
  "category": "Choose closest from: Tech & AI, Founders & Startups, Design & Creative, Music & Concerts, Comedy & Standup, Nightlife & Parties, Social & Mixers, Food & Drinks, Wellness & Fitness, Culture & Baithak, Gaming & Esports, Art & Exhibitions, Workshops & Masterclasses, Private Salons & Dinners, Sports & Outdoors, Other",
  "price_text": "e.g. Free Entry, or ₹499, ₹999, etc.",
  "external_ticket_url": "Booking URL if present",
  "is_online": false
}

Never invent fake dates if completely unknown. If uncertain of venue, use city or online platform.\n\n`;

      if (url) prompt += `SOURCE EVENT URL: ${url}\n\n`;
      if (scrapedContent) prompt += `WEBPAGE SCRAPED CONTENT:\n${scrapedContent.slice(0, 10000)}\n\n`;
      if (text) prompt += `RAW TEXT NOTES / PROMPT:\n${text}\n\n`;

      const contents: any[] = [{ text: prompt }];

      if (imageBase64) {
        // Strip data URL prefix if present
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        contents.push({
          inlineData: {
            mimeType: imageMimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      try {
        const result = await model.generateContent(contents);
        const responseText = result.response.text();
        const parsed = JSON.parse(cleanJson(responseText));

        return NextResponse.json({
          ok: true,
          event: {
            title: parsed.title || 'Untitled Event',
            tagline: parsed.tagline || '',
            description: parsed.description || '',
            date: parsed.date || new Date().toISOString().split('T')[0],
            time: parsed.time || '18:00',
            city: parsed.city || 'Mumbai',
            venue_name: parsed.venue_name || '',
            category: parsed.category || 'Tech & AI',
            price_text: parsed.price_text || 'Free Entry',
            external_ticket_url: parsed.external_ticket_url || url || '',
            is_online: Boolean(parsed.is_online),
          },
        });
      } catch (aiErr: any) {
        console.warn('Gemini extraction failed, using fallback parser:', aiErr?.message);
      }
    }

    // Heuristic Fallback if Gemini is not available or fails
    const fallbackTitle = url ? url.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || 'New Event' : 'Community Event';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);

    return NextResponse.json({
      ok: true,
      event: {
        title: fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1),
        tagline: 'An intimate gathering of great people and ideas.',
        description: scrapedContent
          ? scrapedContent.slice(0, 400).trim()
          : (text || 'Join us for an unforgettable gathering with insightful conversations, great people, and curated experiences.'),
        date: tomorrow.toISOString().split('T')[0],
        time: '18:00',
        city: 'Mumbai',
        venue_name: 'Subko Coffee / Bandra',
        category: 'Tech & AI',
        price_text: 'Free Entry',
        external_ticket_url: url || '',
        is_online: false,
      },
    });
  } catch (error: any) {
    console.error('AI extract endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Extraction failed' }, { status: 500 });
  }
}
