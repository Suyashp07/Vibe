import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Capitalize first letter of any text, and capitalize after punctuation / line breaks
function capitalizeText(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  let result = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  result = result.replace(/([.?!]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  result = result.replace(/(\n+\s*)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventName = body.eventName || body.topic || body.title || 'Curated Gathering';
    const location = body.location || body.city || 'India';
    const brief = body.brief || body.text || body.topic || '';
    const field = body.field || 'all';
    const tone = body.tone || 'Warm';

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);

      if (field === 'description') {
        const prompt = `You are a world-class event curator and copywriter.
Write an engaging, magnetic, 2-3 paragraph event description for:
Event Name: ${eventName}
Location: ${location}
Context: ${brief}
Tone: ${tone}

Rules:
1. Every sentence must start with a capital letter.
2. Be inspiring, descriptive, and actionable.
3. Highlight who should attend, the vibe, and what makes it special.
4. Do NOT output markdown code blocks or JSON. Just the clean text description.`;

        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(prompt);
          const text = capitalizeText(result.response.text());
          return NextResponse.json({ result: text, description: text });
        } catch (err: any) {
          console.warn('Gemini 1.5 flash failed, trying fallback model:', err?.message);
        }
      } else {
        const prompt = `You are an expert event copywriter. Generate compelling copy for this event:
Event Name: ${eventName}
Location: ${location}
Brief: ${brief}
Tone: ${tone}

Return ONLY a valid raw JSON object (no backticks, no markdown) with:
{
  "description": "Engaging 2-paragraph event description",
  "tagline": "Catchy 8-12 word tagline",
  "whatsapp_caption": "Short message with emojis for WhatsApp",
  "instagram_caption": "Instagram caption with hashtags",
  "faq": [{"q": "Who is this for?", "a": "Attendee profile."}],
  "rsvp_confirmation": "Warm thank you message for guests after RSVPing"
}`;

        const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];

        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);

            const description = capitalizeText(parsed.description || '');
            const tagline = capitalizeText(parsed.tagline || '');

            return NextResponse.json({
              result: description,
              description,
              tagline,
              whatsapp_caption: capitalizeText(parsed.whatsapp_caption || ''),
              instagram_caption: capitalizeText(parsed.instagram_caption || ''),
              faq: parsed.faq || [],
              rsvp_confirmation: capitalizeText(parsed.rsvp_confirmation || '')
            });
          } catch (err: any) {
            console.warn(`Gemini generate with ${modelName} error:`, err?.message);
          }
        }
      }
    }

    // High quality editorial fallback if API key is not present or rate limited
    const fallbackDesc = capitalizeText(
      `Join us for ${eventName} in ${location}. An intimate, thoughtfully curated gathering bringing together passionate individuals for inspiring conversations, meaningful connections, and unforgettable experiences.\n\nWhether you are looking to learn, network, or simply immerse yourself in great company, this session is designed to offer genuine depth and high-vibe engagement. Space is limited, so secure your spot early!`
    );

    const fallbackTagline = capitalizeText(
      `An extraordinary gathering of curious minds and creators in ${location}.`
    );

    return NextResponse.json({
      result: fallbackDesc,
      description: fallbackDesc,
      tagline: fallbackTagline,
      whatsapp_caption: `Excited to invite you to ${eventName} in ${location}! Spaces are limited. Details & RSVP link here.`,
      instagram_caption: `Bringing something special to ${location}. Join us for ${eventName}! #VibeEvents #CuratedExperiences`,
      faq: [
        { q: 'Who should attend?', a: 'Anyone passionate about connecting and sharing great ideas.' },
        { q: 'Is registration required?', a: 'Yes, please RSVP in advance to secure entry.' }
      ],
      rsvp_confirmation: 'Thank you for registering! We look forward to hosting you.'
    });
  } catch (error: any) {
    console.error('AI Generation fatal error:', error);
    const fallback = 'Join us for a curated, high-vibe gathering. Connect with inspiring people and experience something unique!';
    return NextResponse.json({
      result: fallback,
      description: fallback,
      tagline: 'An intimate gathering of great people.'
    });
  }
}
