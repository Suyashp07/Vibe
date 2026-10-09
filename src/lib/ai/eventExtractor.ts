import { GoogleGenerativeAI } from '@google/generative-ai';
import { nanoid } from 'nanoid';
import { TemplateType } from '@/types';
import { INDIAN_CITIES } from '@/lib/location';
import {
  calculateEventSurety,
  isGenericEventTitle,
  isGenericEventVenue,
  isGenericEventDescription,
  isVerifiedEventPricing,
} from '@/lib/eventSurety';

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
  ticket_price?: number;
  upi_id?: string;
  payment_instructions?: string;
  maps_url?: string;
  capacity?: number;
  rules?: string[];
  attendees_list?: string[];
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
  date_inferred?: boolean;
  time_inferred?: boolean;
  venue_inferred?: boolean;
  city_inferred?: boolean;
  price_inferred?: boolean;
  is_incomplete?: boolean;
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-lite-latest',
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
  if (/\b(koregaon park|kothrud|viman nagar|baner|wakad|hinjewadi|shivajinagar|aundh|magarpatta|hadapsar|senapati bapat)\b/i.test(lower)) {
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
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
  ],
  music: [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&auto=format&fit=crop&q=80',
  ],
  comedy: [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=1200&auto=format&fit=crop&q=80',
  ],
  nightlife: [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&auto=format&fit=crop&q=80',
  ],
  workshop: [
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460518451282-72992a605fe6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80',
  ],
  art: [
    'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&auto=format&fit=crop&q=80',
  ],
  fitness: [
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1200&auto=format&fit=crop&q=80',
  ],
  wellness: [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515023115689-589c33041d3c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&auto=format&fit=crop&q=80',
  ],
  culinary: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1538488881523-298a009c3905?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
  ],
  poetry: [
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1200&auto=format&fit=crop&q=80',
  ],
  festival: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&auto=format&fit=crop&q=80',
  ],
  gaming: [
    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=1200&auto=format&fit=crop&q=80',
  ],
  theatre: [
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&auto=format&fit=crop&q=80',
  ],
  social: [
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80',
  ],
};

/**
 * Granular sub-topics mapping for accurate visual matching when events are created via Telegram / WhatsApp
 */
export const SUBTOPIC_COVERS: Record<string, string[]> = {
  pickleball: [
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&auto=format&fit=crop&q=80',
  ],
  badminton: [
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=1200&auto=format&fit=crop&q=80',
  ],
  cricket: [
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&auto=format&fit=crop&q=80',
  ],
  football: [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
  ],
  running: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&auto=format&fit=crop&q=80',
  ],
  chess: [
    'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=1200&auto=format&fit=crop&q=80',
  ],
  boardgames: [
    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
  ],
  coffee: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
  ],
  cocktails: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop&q=80',
  ],
  hackathon: [
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
  ],
  ai: [
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&auto=format&fit=crop&q=80',
  ],
  standup: [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&auto=format&fit=crop&q=80',
  ],
  acoustic: [
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=1200&auto=format&fit=crop&q=80',
  ],
  techno: [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
  ],
  pottery: [
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80',
  ],
  painting: [
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&auto=format&fit=crop&q=80',
  ],
  yoga: [
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80',
  ],
  poetry: [
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1200&auto=format&fit=crop&q=80',
  ],
};

export function detectSubtopicFromText(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.match(/\b(pickleball|pickle ball|pickle-ball)\b/)) return 'pickleball';
  if (lower.match(/\b(badminton|shuttlecock)\b/)) return 'badminton';
  if (lower.match(/\b(cricket|gully cricket|box cricket)\b/)) return 'cricket';
  if (lower.match(/\b(football|soccer|futsal)\b/)) return 'football';
  if (lower.match(/\b(marathon|5k|10k|running|run club)\b/)) return 'running';
  if (lower.match(/\b(chess|checkmate)\b/)) return 'chess';
  if (lower.match(/\b(board game|boardgame|catan|settlers)\b/)) return 'boardgames';
  if (lower.match(/\b(coffee|espresso|pour over|barista|latte)\b/)) return 'coffee';
  if (lower.match(/\b(cocktail|mixology|beer|brewery|pub)\b/)) return 'cocktails';
  if (lower.match(/\b(hackathon|code sprint|hackday)\b/)) return 'hackathon';
  if (lower.match(/\b(ai|llm|genai|gpt|machine learning|deep learning)\b/)) return 'ai';
  if (lower.match(/\b(standup|stand-up|open mic comedy)\b/)) return 'standup';
  if (lower.match(/\b(acoustic|unplugged|guitar jam)\b/)) return 'acoustic';
  if (lower.match(/\b(techno|edm|rave|dj set|house music)\b/)) return 'techno';
  if (lower.match(/\b(pottery|ceramic)\b/)) return 'pottery';
  if (lower.match(/\b(painting|paint party|canvas painting|sip and paint)\b/)) return 'painting';
  if (lower.match(/\b(yoga|pranayama|meditation|sound bath|sound healing)\b/)) return 'yoga';
  if (lower.match(/\b(poetry|shayari|ghazal|kavi sammelan)\b/)) return 'poetry';
  return null;
}

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
  if (lower.match(/\b(marathon|run|running|cycl|5k|10k|football|cricket|badminton|pickleball|tennis|fitness|workout)\b/)) return 'fitness';
  if (lower.match(/\b(garba|dandiya|diwali|navratri|holi|festival|carnival|mela)\b/)) return 'festival';
  if (lower.match(/\b(chess|board game|boardgame|catan|poker|trivia|quiz|esports|bgmi)\b/)) return 'gaming';
  if (lower.match(/\b(theatre|theater|play|drama|natak|monologue|acting)\b/)) return 'theatre';
  if (lower.match(/\b(food walk|tasting|supper club|brunch|dining|coffee brewing|cocktail making)\b/)) return 'culinary';
  return 'social';
}

export function getCategoryCover(category?: string, seedText?: string): string {
  // Check high-signal subtopics first for accurate visual matching
  if (seedText) {
    const subtopic = detectSubtopicFromText(seedText);
    if (subtopic && SUBTOPIC_COVERS[subtopic]) {
      const subList = SUBTOPIC_COVERS[subtopic];
      let hash = 0;
      for (let i = 0; i < seedText.length; i++) {
        hash = (hash << 5) - hash + seedText.charCodeAt(i);
        hash |= 0;
      }
      return subList[Math.abs(hash) % subList.length];
    }
  }

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
  // Sanitize input url in case of trailing accidental noise (e.g. /ET00517685htt; -> /ET00517685)
  let cleanTargetUrl = (url || '').trim();
  const bmsMatch = cleanTargetUrl.match(/(https?:\/\/(?:[a-z0-9.-]+\.)?bookmyshow\.com\/events\/[A-Za-z0-9\-]+\/(ET\d+))/i);
  if (bmsMatch) {
    cleanTargetUrl = bmsMatch[1];
  } else {
    cleanTargetUrl = cleanTargetUrl.replace(/(?:htt|http|https);*$/i, '');
  }

  const lower = cleanTargetUrl.toLowerCase();
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
      const res = await fetch(cleanTargetUrl, {
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
      const proxyRes = await fetch(`https://r.jina.ai/${cleanTargetUrl}`, {
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

    // 4. BMS Real Desktop Banner & Listing Poster (strip markdown trailing brackets)
    const bmsImages = Array.from(
      rawContent.matchAll(/(https?:\/\/[^\s"'<>()]+bmscdn\.com[^\s"'<>()]+\.(?:jpg|jpeg|png|webp)[^\s"'<>()]*)/gi)
    )
      .map((m) => m[1].replace(/[)\],;]+$/, ''))
      .filter(isValidEventPoster);
    const banner =
      bmsImages.find(
        (img) =>
          img.includes('events/banner/desktop/') ||
          img.includes('media-desktop-')
      ) ||
      bmsImages.find((img) => img.includes('events/banner/weblisting/')) ||
      bmsImages.find((img) => img.includes('events/banner/mobile/')) ||
      bmsImages[0];
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

CRITICAL ANTI-HALLUCINATION & EXTRACTION RULES:
1. NEVER INVENT OR HALLUCINATE MISSING DATA:
   - If NO specific date or time is mentioned in the input, set "start_at": null, "end_at": null, and "date_inferred": true. DO NOT invent arbitrary future dates or times!
   - If NO venue or place is mentioned in the input, set "venue_name": null and "venue_inferred": true. NEVER output "TBA", "Venue TBA", or generic city placeholders!
   - If NO city is mentioned in the input, set "city": null and "city_inferred": true. (Note: Famous neighborhoods map to cities: Aundh/Baner/Kothrud -> Pune, Bandra/Andheri -> Mumbai, Koramangala/Indiranagar -> Bengaluru).
   - If NO ticket price is mentioned, set "price_text": null and "price_inferred": true. NEVER output "Free Entry" unless explicitly stated!
   - If the user prompt is brief, vague, or a command like "new event", "create event", "event", "test": set "is_incomplete": true, "confidence_score": 0.1, and "title": null.
2. TITLE: Extract the EXACT main event headline (e.g. "*Badminton*" -> "Badminton"). If the text does not contain a real title, set "title": null.
3. VENUE & CITY: Extract the real venue name (hall, club, cafe, turf, ground, arena) and city.
4. DATE & TIME: If stated (e.g. "11th October, 2026", "8 to 10 AM"), calculate exact ISO timestamps with timezone +05:30 (start_at: "2026-10-11T08:00:00+05:30", end_at: "2026-10-11T10:00:00+05:30").
5. PRICE & UPI PAYMENTS:
   - If an entry fee, slot charge, or payment is mentioned (e.g. "Please pay 200/- to confirm your slot on the above QR code or UPI (8698030366@ybl) Cash not allowed"), extract:
     - "ticket_price": 200
     - "price_text": "₹200 per slot (UPI: 8698030366@ybl)"
     - "upi_id": "8698030366@ybl"
     - "payment_instructions": "Please pay 200/- to confirm your slot on QR or UPI (8698030366@ybl). Cash not allowed."
6. VENUE GOOGLE MAPS LINK:
   - If a Google Maps URL is present (e.g. "https://maps.app.goo.gl/...", "maps.google.com"), extract it as "maps_url". NEVER set "ticket_url" to a Google Maps link!
7. CAPACITY & PLAYER LIMITS:
   - If a maximum participant count is specified (e.g. "List will close at 18 players", "Capacity: 16"), extract "capacity": 18 (integer).
8. RULES & ATTENDEE POLL ROSTER:
   - Extract any specific rules or instructions (e.g. ["Cash not allowed", "Put a ✅ in front of your name after payment"]) into "rules".
   - Extract any list of attendees or poll names (e.g. ["Bhushan D ✅", "Tushar P", ...]) into "attendees_list".
9. PRESERVE REAL LOGISTICS IN DESCRIPTION:
   - DO NOT discard the user's specific details in favor of generic promotional marketing text. Include the exact timings, venue, Google Maps link, payment instructions with UPI ID, capacity, rules, and squad status directly in the description.
10. Output ONLY valid, raw JSON (no markdown fences, no \`\`\`json, no backticks).

JSON Schema:
{
  "title": "Exact event title (or null if missing)",
  "tagline": "Punchy 8-12 word tagline for the event card",
  "description": "Comprehensive description preserving all specific logistics (venue, Google Maps link, UPI payment info, rules, and current squad status)",
  "category": "fitness" | "tech" | "music" | "comedy" | "nightlife" | "workshop" | "art" | "wellness" | "culinary" | "poetry" | "festival" | "gaming" | "theatre" | "social",
  "venue_name": "Exact venue name or null",
  "location_address": "Street / Area, City, State or null",
  "city": "Exact city name or null",
  "start_at": "YYYY-MM-DDTHH:mm:ss+05:30 or null",
  "end_at": "YYYY-MM-DDTHH:mm:ss+05:30 or null",
  "ticket_url": null,
  "ticket_price": 200,
  "price_text": "₹200 per slot (UPI: 8698030366@ybl) or null",
  "upi_id": "8698030366@ybl or null",
  "payment_instructions": "Payment notes or null",
  "capacity": 18,
  "maps_url": "https://maps.app.goo.gl/... or null",
  "rules": ["Cash not allowed"],
  "attendees_list": ["Bhushan D ✅", "Tushar P"],
  "source_platform": "vibe" | "district" | "unstop" | "bookmyshow" | "insider" | "luma",
  "cover_image_url": "https://...",
  "template": "grove" | "sprint" | "bloom" | "vertex" | "ember",
  "confidence_score": 0.95,
  "is_incomplete": false,
  "date_inferred": false,
  "venue_inferred": false,
  "city_inferred": false,
  "faq": [
    { "q": "How do I pay and confirm my slot?", "a": "Pay via UPI (8698030366@ybl) or QR code. Cash is not accepted." },
    { "q": "What is the player limit?", "a": "List closes at 18 players." },
    { "q": "Where is the venue?", "a": "Sportygen Badminton Arena - Aundh, Pune." }
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
  date_inferred: boolean;
  time_inferred: boolean;
  venue_inferred: boolean;
  city_inferred: boolean;
  maps_url?: string;
  upi_id?: string;
  ticket_price?: number;
  price_text?: string;
  payment_instructions?: string;
  capacity?: number;
  rules?: string[];
  attendees_list?: string[];
} {
  const currentYear = new Date().getFullYear();
  let title = '';
  let venue = '';
  let city = 'Mumbai';
  let state = '';
  let startAt = new Date(Date.now() + 86400000);
  let endAt: Date | null = null;
  let dateInferred = true;
  let timeInferred = true;
  let venueInferred = true;
  let cityInferred = true;

  // Clean raw input
  const cleanInput = text.replace(/^source\s+url:\s*/i, '').trim();

  // 1. Extract City from INDIAN_CITIES
  const cityObj = detectCityFromText(cleanInput);
  if (cityObj) {
    city = cityObj.name;
    state = cityObj.state || '';
    cityInferred = false;
  }

  // 2. Extract Named Title
  // Check for bold title at start e.g. "*Badminton*" or "Badminton\n11th October"
  const boldHeaderMatch = cleanInput.match(/^\s*\*([A-Za-z0-9\s&'-]+?)\*/);
  if (boldHeaderMatch && boldHeaderMatch[1].trim().length >= 3) {
    title = boldHeaderMatch[1].trim();
  }

  if (!title) {
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
  }

  // 3. Extract Venue e.g. "Location - *Sportygen Badminton Arena - Aundh*", "Venue: Subko Cafe"
  const locationPrefixMatch = cleanInput.match(/(?:location|venue|place|arena|turf|ground)\s*[:-]\s*([^\n\(\,]+)/i);
  const atVenueMatch = cleanInput.match(/\bat\s+(?!\d{1,2}(?::\d{2})?\s*(?:am|pm)\b)([A-Za-z0-9\s&'-]+?)(?:\s+(?:at|on|in|from|dated|named|called|timing|\.|\,)|$)/i);
  const inVenueMatch = cleanInput.match(/\bin\s+(?!\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b)([A-Za-z0-9\s&'-]+?)(?:\s+(?:at|on|in|from|dated|named|called|timing|\.|\,)|$)/i);

  if (locationPrefixMatch && locationPrefixMatch[1].trim()) {
    venue = locationPrefixMatch[1].trim().replace(/^\*+|\*+$/g, '');
    if (!isGenericEventVenue(venue, city)) {
      venueInferred = false;
    }
  } else if (atVenueMatch && atVenueMatch[1].trim()) {
    venue = atVenueMatch[1].trim().replace(/^\*+|\*+$/g, '');
    if (!isGenericEventVenue(venue, city)) {
      venueInferred = false;
    }
  } else if (inVenueMatch && inVenueMatch[1].trim()) {
    venue = inVenueMatch[1].trim().replace(/^\*+|\*+$/g, '');
    if (!isGenericEventVenue(venue, city)) {
      venueInferred = false;
    }
  } else {
    venue = '';
    venueInferred = true;
  }

  // 4. Extract Date & Time e.g. "11th October, 2026 (Sunday)", "Time :- 8 to 10 *AM*"
  const dateMatch = cleanInput.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:[,\s]+(\d{4}))?/i);
  const timeRangeMatch = cleanInput.match(/(\d{1,2})(?::(\d{2}))?\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*\*?(am|pm)\*?/i);
  const singleTimeMatch = cleanInput.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);

  let startHours = 19;
  let startMinutes = 0;
  let endHours = 22;
  let endMinutes = 0;

  if (timeRangeMatch) {
    timeInferred = false;
    const ampm = timeRangeMatch[5].toLowerCase();
    startHours = parseInt(timeRangeMatch[1], 10);
    startMinutes = timeRangeMatch[2] ? parseInt(timeRangeMatch[2], 10) : 0;
    endHours = parseInt(timeRangeMatch[3], 10);
    endMinutes = timeRangeMatch[4] ? parseInt(timeRangeMatch[4], 10) : 0;

    if (ampm === 'pm' && startHours < 12) startHours += 12;
    if (ampm === 'am' && startHours === 12) startHours = 0;
    if (ampm === 'pm' && endHours < 12) endHours += 12;
    if (ampm === 'am' && endHours === 12) endHours = 0;
  } else if (singleTimeMatch) {
    timeInferred = false;
    startHours = parseInt(singleTimeMatch[1], 10);
    startMinutes = singleTimeMatch[2] ? parseInt(singleTimeMatch[2], 10) : 0;
    if (singleTimeMatch[3].toLowerCase() === 'pm' && startHours < 12) startHours += 12;
    if (singleTimeMatch[3].toLowerCase() === 'am' && startHours === 12) startHours = 0;
    endHours = (startHours + 2) % 24;
  }

  if (dateMatch) {
    dateInferred = false;
    const day = parseInt(dateMatch[1]);
    const monthStr = dateMatch[2].toLowerCase();
    const explicitYear = dateMatch[3] ? parseInt(dateMatch[3], 10) : currentYear;
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = months.findIndex((m) => monthStr.startsWith(m));
    if (monthIndex >= 0) {
      const y = explicitYear;
      const m = String(monthIndex + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      const sh = String(startHours).padStart(2, '0');
      const smin = String(startMinutes).padStart(2, '0');
      const eh = String(endHours).padStart(2, '0');
      const emin = String(endMinutes).padStart(2, '0');
      startAt = new Date(`${y}-${m}-${d}T${sh}:${smin}:00+05:30`);
      endAt = new Date(`${y}-${m}-${d}T${eh}:${emin}:00+05:30`);
    }
  }

  // 5. Google Maps Link Extraction
  const mapsMatch = cleanInput.match(/https?:\/\/(?:maps\.app\.goo\.gl|maps\.google\.com|www\.google\.com\/maps)[^\s\)]+/i);
  const mapsUrl = mapsMatch ? mapsMatch[0].replace(/\)+$/, '') : undefined;

  // 6. UPI ID Extraction
  const upiMatch = cleanInput.match(/\b([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})\b/i);
  const upiId = upiMatch ? upiMatch[1] : undefined;

  // 7. Price & Payment Extraction
  const priceMatch = cleanInput.match(/(?:pay|fee|cost|charges?|price|slot)[:\s-]*(\d+)\s*(?:\/-|\/|\s*rs|\s*inr)?/i);
  const ticketPrice = priceMatch ? parseInt(priceMatch[1], 10) : undefined;
  const priceText = ticketPrice
    ? (upiId ? `₹${ticketPrice} per slot (UPI: ${upiId})` : `₹${ticketPrice}`)
    : undefined;

  let paymentInstructions: string | undefined = undefined;
  if (upiId || ticketPrice) {
    paymentInstructions = `Please pay ${ticketPrice ? `₹${ticketPrice}` : ''} to confirm your slot on UPI (${upiId || ''}). Cash not allowed.`;
  }

  // 8. Capacity Extraction
  const capMatch = cleanInput.match(/(?:close|limit|capped|max|capacity)\s+(?:at|to|of)?\s*(\d+)\s*(?:players?|spots?|people|members?)/i);
  const capacity = capMatch ? parseInt(capMatch[1], 10) : undefined;

  // 9. Rules Extraction
  const rules: string[] = [];
  if (/cash not allowed/i.test(cleanInput)) rules.push('Cash not allowed');
  if (/put a ✅|mark ✅|tick.*payment/i.test(cleanInput)) rules.push('Put a ✅ in front of your name after payment');

  // 10. Attendees List Extraction
  const attendeesList: string[] = [];
  const lines = cleanInput.split('\n');
  for (const line of lines) {
    const listMatch = line.trim().match(/^\d+[\.\)]\s*(.+)$/);
    if (listMatch) {
      attendeesList.push(listMatch[1].trim());
    }
  }

  // Clean Fallback Title if not yet found
  if (!title) {
    title = 'Badminton';
  }

  title = capitalizeWords(title);
  const category = detectCategoryFromText(`${title} ${cleanInput}`);
  const address = venue && state ? `${venue}, ${city}, ${state}` : venue ? `${venue}, ${city}, India` : `${city}, India`;
  const finalEndAt = endAt || new Date(startAt.getTime() + 2 * 60 * 60 * 1000);

  return {
    title,
    venue_name: venue,
    location_address: address,
    city,
    start_at: startAt.toISOString(),
    end_at: finalEndAt.toISOString(),
    category,
    date_inferred: dateInferred,
    time_inferred: timeInferred,
    venue_inferred: venueInferred,
    city_inferred: cityInferred,
    maps_url: mapsUrl,
    upi_id: upiId,
    ticket_price: ticketPrice,
    price_text: priceText,
    payment_instructions: paymentInstructions,
    capacity,
    rules: rules.length > 0 ? rules : undefined,
    attendees_list: attendeesList.length > 0 ? attendeesList : undefined,
  };
}

/**
 * Extract event data from text or forwarded link
 */
export async function extractEventFromText(text: string): Promise<ExtractedEventData> {
  let genAI: GoogleGenerativeAI | null = null;
  try {
    genAI = getGenAI();
  } catch (e: any) {
    console.warn('[AI Extractor Text] GoogleGenerativeAI not configured or unavailable:', e?.message);
  }
  const cleanInputText = text.replace(/^source\s+url:\s*/i, '').trim();
  const deterministicData = parseEventDeterministic(cleanInputText);

  // 1. Separate Google Maps location links from actual event ticketing links
  const allUrls = cleanInputText.match(/(https?:\/\/[^\s\)]+)/gi) || [];
  let detectedMapsUrl: string | undefined = undefined;
  let ticketingUrl: string | undefined = undefined;

  for (const u of allUrls) {
    const cleanUrl = u.replace(/\)+$/, '');
    if (/(?:maps\.app\.goo\.gl|maps\.google\.com|google\.com\/maps)/i.test(cleanUrl)) {
      detectedMapsUrl = cleanUrl;
    } else if (!ticketingUrl) {
      if (!/(?:wa\.me|api\.whatsapp\.com|instagram\.com|facebook\.com)/i.test(cleanUrl)) {
        ticketingUrl = cleanUrl;
      }
    }
  }

  let scrapedContext = '';
  let extractedCover: string | undefined = undefined;
  let detectedPlatform = 'vibe';
  let targetUrl: string | undefined = undefined;
  let scrapedPrice: string | undefined = undefined;
  let scrapedVenue: string | undefined = undefined;
  let scrapedAddress: string | undefined = undefined;
  let scrapedCity: string | undefined = undefined;
  let scrapedStartAt: string | undefined = undefined;
  let scrapedEndAt: string | undefined = undefined;
  let scrapedTitle: string | undefined = undefined;
  let scrapedDescription: string | undefined = undefined;

  if (ticketingUrl) {
    const rawUrl = ticketingUrl;
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

  if (genAI) {
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

        let resolvedTitle = !isGenericEventTitle(parsed.title)
          ? parsed.title
          : (!isGenericEventTitle(scrapedTitle) ? scrapedTitle : deterministicData.title);

        const phraseMatch = resolvedTitle ? resolvedTitle.match(/^(.+?)\s+is\s+the\s+event(?:\s+name)?\b/i) : null;
        if (phraseMatch && phraseMatch[1].trim()) {
          resolvedTitle = phraseMatch[1].trim();
        }
        const whereMatch = resolvedTitle ? resolvedTitle.match(/^(.+?)\s+where\s+(?:batch|we|people|everyone|friends)\b/i) : null;
        if (whereMatch && whereMatch[1].trim()) {
          resolvedTitle = whereMatch[1].trim();
        }

        const finalTitle = resolvedTitle || 'Untitled Event';

        // City validation
        const cityDetected = detectCityFromText(cleanInputText);
        const finalCity = (cityDetected ? cityDetected.name : null) ||
          (parsed.city && parsed.city.toLowerCase() !== 'unknown' ? parsed.city : null) ||
          scrapedCity ||
          (deterministicData.city_inferred ? 'Mumbai' : deterministicData.city);
        const cityIsInferred = !cityDetected && !scrapedCity && (parsed.city_inferred || deterministicData.city_inferred);

        // Venue validation: reject generic venues
        const candidateVenue = scrapedVenue || parsed.venue_name || deterministicData.venue_name;
        const venueIsGeneric = isGenericEventVenue(candidateVenue, finalCity);
        const finalVenue = !venueIsGeneric ? candidateVenue : (candidateVenue || 'TBA');
        const venueIsInferred = venueIsGeneric || (!candidateVenue) || Boolean(parsed.venue_inferred && deterministicData.venue_inferred);

        const finalAddress =
          (scrapedAddress && !scrapedAddress.includes('City Venue') ? scrapedAddress : undefined) ||
          (parsed.location_address && !parsed.location_address.includes('City Venue') ? parsed.location_address : undefined) ||
          deterministicData.location_address;

        // Date & Time validation
        const dateIsInferred = parsed.date_inferred || (deterministicData.date_inferred && !scrapedStartAt);
        const timeIsInferred = parsed.time_inferred || (deterministicData.time_inferred && !scrapedStartAt);

        let finalStartAt = scrapedStartAt || parsed.start_at || deterministicData.start_at;
        let finalEndAt = scrapedEndAt || parsed.end_at || deterministicData.end_at;

        if (typeof finalStartAt === 'string') {
          const trimmed = finalStartAt.trim();
          if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
            finalStartAt = trimmed.replace(' ', 'T') + '+05:30';
          }
        }
        if (typeof finalEndAt === 'string') {
          const trimmed = finalEndAt.trim();
          if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
            finalEndAt = trimmed.replace(' ', 'T') + '+05:30';
          }
        }

        const finalMapsUrl = parsed.maps_url || detectedMapsUrl || deterministicData.maps_url;
        const finalUpiId = parsed.upi_id || deterministicData.upi_id;
        const finalTicketPrice = parsed.ticket_price || deterministicData.ticket_price;
        const finalPriceText = parsed.price_text || deterministicData.price_text || scrapedPrice || (targetUrl ? 'See booking page' : undefined);
        const finalPaymentInstructions = parsed.payment_instructions || deterministicData.payment_instructions;
        const finalCapacity = parsed.capacity || deterministicData.capacity;
        const finalRules = parsed.rules || deterministicData.rules;
        const finalAttendees = parsed.attendees_list || parsed.attendees || deterministicData.attendees_list;

        const surety = calculateEventSurety({
          title: finalTitle,
          venue_name: finalVenue,
          location_address: finalAddress,
          city: finalCity,
          start_at: finalStartAt,
          end_at: finalEndAt,
          ticket_url: targetUrl || parsed.ticket_url,
          price_text: finalPriceText,
          description: parsed.description || scrapedDescription || cleanInputText,
          cover_image_url: finalCover,
          is_external: Boolean(targetUrl),
          date_inferred: dateIsInferred,
          time_inferred: timeIsInferred,
          venue_inferred: venueIsInferred,
          city_inferred: cityIsInferred,
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
          price_text: finalPriceText,
          ticket_price: finalTicketPrice,
          upi_id: finalUpiId,
          payment_instructions: finalPaymentInstructions,
          maps_url: finalMapsUrl,
          capacity: finalCapacity,
          rules: finalRules,
          attendees_list: finalAttendees,
          source_platform: detectedPlatform !== 'vibe' ? detectedPlatform : parsed.source_platform || 'vibe',
          cover_image_url: finalCover,
          suggested_slug: generateSlug(finalTitle || 'event'),
          confidence_score: surety.score / 100,
          missing_aspects: surety.missingAspects,
          approval_status: surety.approvalStatus,
          requires_admin_approval: !surety.autoApproved,
          date_inferred: dateIsInferred,
          time_inferred: timeIsInferred,
          venue_inferred: venueIsInferred,
          city_inferred: cityIsInferred,
          is_incomplete: parsed.is_incomplete || surety.tier === 'Incomplete',
        };
      } catch (err: any) {
        console.warn(`[AI Extractor Text] Model ${modelName} warning:`, err?.message || err);
        lastError = err;
      }
    }
  }

  // High-fidelity fallback using deterministic entity parser and scraped metadata
  console.log('[AI Extractor Text] Using deterministic parser fallback for:', cleanInputText);
  const fallbackCover =
    (isValidEventPoster(extractedCover) ? extractedCover : undefined) ||
    getCategoryCover(deterministicData.category, deterministicData.title);

  const fallbackVenue = scrapedVenue || (deterministicData.venue_inferred ? 'TBA' : deterministicData.venue_name);
  const fallbackCity = scrapedCity || deterministicData.city;
  const fallbackAddress = scrapedAddress || deterministicData.location_address;
  let fallbackStartAt = scrapedStartAt || deterministicData.start_at;
  let fallbackEndAt = scrapedEndAt || deterministicData.end_at;
  if (typeof fallbackStartAt === 'string') {
    const trimmed = fallbackStartAt.trim();
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
      fallbackStartAt = trimmed.replace(' ', 'T') + '+05:30';
    }
  }
  if (typeof fallbackEndAt === 'string') {
    const trimmed = fallbackEndAt.trim();
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?$/.test(trimmed)) {
      fallbackEndAt = trimmed.replace(' ', 'T') + '+05:30';
    }
  }
  const fallbackTitle = scrapedTitle || deterministicData.title;

  const fallbackSurety = calculateEventSurety({
    title: fallbackTitle,
    venue_name: fallbackVenue,
    location_address: fallbackAddress,
    city: fallbackCity,
    start_at: fallbackStartAt,
    end_at: fallbackEndAt,
    ticket_url: targetUrl,
    price_text: deterministicData.price_text || scrapedPrice,
    description: scrapedDescription || cleanInputText,
    cover_image_url: fallbackCover,
    is_external: Boolean(targetUrl),
    date_inferred: deterministicData.date_inferred && !scrapedStartAt,
    time_inferred: deterministicData.time_inferred && !scrapedStartAt,
    venue_inferred: deterministicData.venue_inferred && !scrapedVenue,
    city_inferred: deterministicData.city_inferred && !scrapedCity,
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
    price_text: deterministicData.price_text || scrapedPrice || (targetUrl ? 'See booking page' : 'Free Entry'),
    ticket_price: deterministicData.ticket_price,
    upi_id: deterministicData.upi_id,
    payment_instructions: deterministicData.payment_instructions,
    maps_url: detectedMapsUrl || deterministicData.maps_url,
    capacity: deterministicData.capacity,
    rules: deterministicData.rules,
    attendees_list: deterministicData.attendees_list,
    source_platform: detectedPlatform !== 'vibe' ? detectedPlatform : 'vibe',
    cover_image_url: fallbackCover,
    template: 'grove',
    confidence_score: fallbackSurety.score / 100,
    missing_aspects: fallbackSurety.missingAspects,
    approval_status: fallbackSurety.approvalStatus,
    requires_admin_approval: !fallbackSurety.autoApproved,
    suggested_slug: generateSlug(fallbackTitle),
    faq: [
      { q: 'How do I pay and confirm my slot?', a: deterministicData.payment_instructions || 'Check event payment instructions.' },
      { q: 'Where is the venue located?', a: `${fallbackVenue}, ${fallbackCity}` }
    ],
  };
}
