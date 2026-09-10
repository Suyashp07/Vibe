import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Capitalize first letter of any text, and capitalize after punctuation / line breaks
function capitalizeText(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  // Capitalize first character
  let result = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  // Capitalize after sentence-ending punctuation (. ? !) followed by whitespace
  result = result.replace(/([.?!]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  // Capitalize after newlines
  result = result.replace(/(\n+\s*)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
  return result;
}

function sanitizeAiResponse(data: any) {
  return {
    description: capitalizeText(data.description || ''),
    tagline: capitalizeText(data.tagline || ''),
    whatsapp_caption: capitalizeText(data.whatsapp_caption || ''),
    instagram_caption: capitalizeText(data.instagram_caption || ''),
    faq: Array.isArray(data.faq)
      ? data.faq.map((item: any) => ({
          q: capitalizeText(item.q || ''),
          a: capitalizeText(item.a || '')
        }))
      : [],
    rsvp_confirmation: capitalizeText(data.rsvp_confirmation || '')
  };
}

export async function POST(req: NextRequest) {
  try {
    const { eventName, eventType, location, brief, tone } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const prompt = `You are an expert event copywriter and brand curator. Generate compelling, conversion-optimized copy for this event:
Event Name: ${eventName || 'Community Gathering'}
Event Type: ${eventType || 'in-person'}
Location: ${location || 'Mumbai, India'}
Organizer Brief: ${brief || 'A gathering of passionate creators and founders'}
Tone: ${tone || 'Warm'} (Professional, Casual, Exciting, or Warm)

CRITICAL CAPITALIZATION RULES:
1. Every answer, sentence, description, tagline, caption, FAQ question, and FAQ answer MUST strictly start with a CAPITAL letter. Never start any field, sentence, or answer with a lowercase letter.
2. Maintain perfect grammar, punctuation, and capitalization throughout.

Return ONLY a valid raw JSON object (without markdown code fences or backticks) with these exact keys:
{
  "description": "150-200 word event description, 2-3 punchy paragraphs explaining what makes this gathering unmissable.",
  "tagline": "8-12 word tagline that captures the essence in poetic or sharp phrasing",
  "whatsapp_caption": "50-word WhatsApp broadcast message with emojis, personal warm tone, and urgency",
  "instagram_caption": "60-word Instagram caption with line breaks and 5 relevant hashtags at the end",
  "faq": [
    {"q": "Who should attend this event?", "a": "Clear answer on attendee profile."},
    {"q": "What is included in the entry pass?", "a": "Answer on beverages, perks, access."},
    {"q": "Can I bring a +1?", "a": "Instructions on guests."}
  ],
  "rsvp_confirmation": "40-word warm confirmation message the guest sees after RSVPing with gate instructions"
}`;

      const modelsToTry = ['gemini-flash-lite-latest', 'gemini-flash-latest'];

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleaned);
          return NextResponse.json(sanitizeAiResponse(parsed));
        } catch (err: any) {
          console.warn(`Model ${modelName} returned:`, err?.status || err?.message);
        }
      }
    }

    // Fallback Mock Generator with Indian context and tailored tone
    const fallback = generateTailoredCopy(eventName, eventType, location, brief, tone);
    return NextResponse.json(sanitizeAiResponse(fallback));
  } catch (error: any) {
    console.error('AI Generation error:', error);
    // Graceful fallback
    return NextResponse.json(sanitizeAiResponse(generateTailoredCopy('Event', 'in-person', 'Mumbai', 'Community meet', 'Warm')));
  }
}

function generateTailoredCopy(name: string, type: string, location: string, brief: string, tone: string) {
  const toneVoice = (tone || 'Warm').toLowerCase();
  const city = location || 'Mumbai';

  const toneTaglines: Record<string, string> = {
    professional: `Elevate your craft, benchmark operational excellence, and scale with India's vanguard in ${city}.`,
    casual: `Good conversations, fresh brews, and zero boring presentations this weekend in ${city}.`,
    exciting: `High adrenaline, unfiltered speed, and bold momentum. Join the movement in ${city}!`,
    warm: `Soulful connections, candlelight reflections, and honest stories under the ${city} sky.`
  };

  return {
    description: `Step into an immersive gathering designed from the ground up for true connection. ${brief || 'We are bringing together individuals who care deeply about craft and community.'}\n\nOver the course of the evening, expect high-density peer exchanges, unfiltered perspectives on what is working in ${city}, and an atmosphere stripped of conventional corporate stiffness.\n\nWhether you are arriving solo or bringing a collaborator, you will leave with renewed clarity, genuine friendships, and tangible ideas to build on.`,
    tagline: toneTaglines[toneVoice] || toneTaglines.warm,
    whatsapp_caption: `✨ ${name || 'Our upcoming gathering'} is officially open for RSVPs! Taking place in ${city}. Spots are limited to keep it intimate. Grab your free pass before we hit full capacity:`,
    instagram_caption: `Where craft meets community in ${city}. Join us for ${name || 'a special gathering'}. Limited passes now live via link in bio.\n\n#VibeBySwaniki #${city.replace(/\s+/g, '')}Events #IndianCreators #FounderMeetup #CommunityFirst`,
    faq: [
      {
        q: 'Is this event free to attend?',
        a: 'Yes! Passes are 100% complimentary thanks to our host community. Pre-registration via RSVP is strictly required for venue entry.'
      },
      {
        q: 'What should I carry or prepare?',
        a: 'Just bring your curiosity and open mind. Digital entry passes will be sent directly to your registered WhatsApp number.'
      },
      {
        q: 'Are +1 guests allowed?',
        a: 'Yes, if selected during RSVP. Please ensure you submit your guest’s full name so security can grant access.'
      }
    ],
    rsvp_confirmation: `Your pass for ${name} is reserved! We have saved your spot on the guest list. Look out for a WhatsApp message with final venue entry details and parking directions.`
  };
}
