export interface AdminEvent {
  id: string;
  title: string;
  name?: string;
  tagline?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  date?: string;
  time?: string;
  city?: string;
  location_name?: string;
  venue_name?: string;
  location_address?: string;
  venue_address?: string;
  cover_image?: string;
  cover_image_url?: string;
  image_url?: string;
  status: string;
  is_public?: boolean;
  is_external?: boolean;
  source_platform?: string;
  source_type?: string;
  external_ticket_url?: string;
  ticket_link?: string;
  price_inr?: number;
  external_price_text?: string;
  price_text?: string;
  category?: string;
  slug?: string;
  created_at?: string;
  profiles?: {
    id: string;
    name?: string;
    email?: string;
    handle?: string;
    logo_url?: string;
  } | null;
}

export const CATEGORIES = [
  'Tech & AI',
  'Music & Concerts',
  'Comedy & Standup',
  'Social & Mixers',
  'Design & Creative',
  'Wellness & Fitness',
  'Culture & Baithak',
  'Food & Drinks',
  'Other'
] as const;

export function isIngestedEvent(ev: AdminEvent): boolean {
  if (ev.is_external || ev.source_type === 'external' || Boolean(ev.external_ticket_url)) {
    return true;
  }
  const platform = (ev.source_platform || '').toLowerCase().trim();
  if (platform && platform !== 'vibe' && platform !== 'internal' && platform !== 'native') {
    return true;
  }
  return false;
}

export function toDateInputValue(val?: string | null, startAt?: string | null): string {
  if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (startAt) {
    try {
      const d = new Date(startAt);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch {}
  }
  if (val) {
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch {}
  }
  return '';
}

export function toTimeInputValue(val?: string | null, startAt?: string | null): string {
  if (val && /^\d{2}:\d{2}$/.test(val)) return val;
  if (startAt) {
    try {
      const d = new Date(startAt);
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      }
    } catch {}
  }
  if (val) {
    try {
      const d = new Date(`1970-01-01 ${val}`);
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      }
    } catch {}
  }
  return '';
}

export function getCategoryValue(cat?: string | null): string {
  if (!cat) return 'Tech & AI';
  const match = CATEGORIES.find(
    (c) => c.toLowerCase() === cat.toLowerCase() || cat.toLowerCase().includes(c.toLowerCase())
  );
  if (match) return match;
  if (/music|concert|dj|band|singer|live/i.test(cat)) return 'Music & Concerts';
  if (/tech|ai|code|hackathon|developer|crypto/i.test(cat)) return 'Tech & AI';
  if (/comedy|standup|laugh/i.test(cat)) return 'Comedy & Standup';
  if (/party|nightlife|mixer|social/i.test(cat)) return 'Social & Mixers';
  if (/art|design|creative|photo/i.test(cat)) return 'Design & Creative';
  if (/yoga|fitness|wellness|run|marathon|badminton|sports/i.test(cat)) return 'Wellness & Fitness';
  if (/food|drink|chai|coffee|dinner/i.test(cat)) return 'Food & Drinks';
  return 'Other';
}
