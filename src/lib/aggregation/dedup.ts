/**
 * Pure, DB-free duplicate-matching helpers ported from the AI Event Aggregator.
 *
 * Dedup rule:
 *   Two events are duplicates when their names/titles are similar
 *   AND neither date nor venue is explicitly different.
 */

const MIN_CONTAIN_LENGTH = 5;
const PLACEHOLDER_NAMES = new Set(['', 'untitled', 'untitled event', 'extracted submission', 'new event']);

export function normalizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isPlaceholderName(str: string | null | undefined): boolean {
  return PLACEHOLDER_NAMES.has(normalizeString(str));
}

export function fieldSimilar(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeString(a);
  const nb = normalizeString(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const [short, long] = na.length <= nb.length ? [na, nb] : [nb, na];
  return short.length >= MIN_CONTAIN_LENGTH && long.includes(short);
}

/** Both sides present and not similar — the only thing that proves uniqueness. */
export function explicitlyDifferent(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && !fieldSimilar(a, b);
}

export interface DedupCandidate {
  id?: string | null;
  name: string | null;
  date: string | null;
  venue?: string | null;
}

export function areDuplicates(a: DedupCandidate, b: DedupCandidate): boolean {
  if (!a.name || !b.name) return false;
  if (isPlaceholderName(a.name) || isPlaceholderName(b.name)) return false;
  const nameMatch = fieldSimilar(a.name, b.name);
  const dateDiff = explicitlyDifferent(a.date ?? null, b.date ?? null);
  const venueDiff = explicitlyDifferent(a.venue ?? null, b.venue ?? null);
  return nameMatch && !dateDiff && !venueDiff;
}

/**
 * Group records into duplicate clusters using the shared rule.
 */
export interface EventCheckData {
  title: string;
  venue_name?: string | null;
  city?: string | null;
  start_at?: string | null;
  ticket_url?: string | null;
  slug?: string | null;
}

/**
 * Checks whether an incoming event is a duplicate of an existing event in Supabase.
 * Returns { isDuplicate: true, existingEvent } if duplicate detected.
 */
export async function checkDuplicateEventInDb(
  supabase: any,
  candidate: EventCheckData
): Promise<{ isDuplicate: boolean; existingEvent?: any }> {
  if (!supabase || !candidate?.title) return { isDuplicate: false };

  try {
    // 1. Check exact ticket URL if external
    const normTicketUrl = candidate.ticket_url?.trim()?.replace(/\/+$/, '');
    if (normTicketUrl && !normTicketUrl.includes('localhost') && normTicketUrl.length > 10) {
      const { data: byUrl } = await supabase
        .from('events')
        .select('id, slug, title, location_name, city, start_at, status, external_ticket_url')
        .or(`external_ticket_url.eq.${normTicketUrl},external_ticket_url.ilike.%${normTicketUrl}%`)
        .limit(1)
        .maybeSingle();

      if (byUrl) {
        return { isDuplicate: true, existingEvent: byUrl };
      }
    }

    // 2. Check exact slug
    if (candidate.slug) {
      const { data: bySlug } = await supabase
        .from('events')
        .select('id, slug, title, location_name, city, start_at, status')
        .ilike('slug', candidate.slug)
        .limit(1)
        .maybeSingle();

      if (bySlug) {
        return { isDuplicate: true, existingEvent: bySlug };
      }
    }

    // 3. Query recent events (last 50 events)
    const { data: recentEvents } = await supabase
      .from('events')
      .select('id, slug, title, location_name, city, start_at, status, created_at')
      .order('created_at', { ascending: false })
      .limit(60);

    if (!recentEvents || recentEvents.length === 0) {
      return { isDuplicate: false };
    }

    const candTitleNorm = normalizeString(candidate.title);
    if (!candTitleNorm || candTitleNorm.length < 3) {
      return { isDuplicate: false };
    }

    for (const ev of recentEvents) {
      const evTitleNorm = normalizeString(ev.title);
      if (!evTitleNorm) continue;

      // Check title similarity
      const isTitleMatch =
        candTitleNorm === evTitleNorm ||
        fieldSimilar(candTitleNorm, evTitleNorm) ||
        (candTitleNorm.length >= 8 && evTitleNorm.includes(candTitleNorm)) ||
        (evTitleNorm.length >= 8 && candTitleNorm.includes(evTitleNorm));

      if (isTitleMatch) {
        // Check date similarity if both dates exist
        let isDateConflict = false;
        if (candidate.start_at && ev.start_at) {
          const t1 = new Date(candidate.start_at).getTime();
          const t2 = new Date(ev.start_at).getTime();
          if (!isNaN(t1) && !isNaN(t2)) {
            const diffHours = Math.abs(t1 - t2) / (1000 * 60 * 60);
            if (diffHours > 36) {
              isDateConflict = true;
            }
          }
        }

        // Check city similarity if both cities exist
        let isCityConflict = false;
        if (candidate.city && ev.city) {
          const c1 = candidate.city.toLowerCase().trim();
          const c2 = ev.city.toLowerCase().trim();
          if (
            c1 &&
            c2 &&
            c1 !== 'all' &&
            c2 !== 'all' &&
            c1 !== 'all india' &&
            c2 !== 'all india' &&
            !c1.includes(c2) &&
            !c2.includes(c1)
          ) {
            isCityConflict = true;
          }
        }

        if (!isDateConflict && !isCityConflict) {
          return { isDuplicate: true, existingEvent: ev };
        }
      }
    }
  } catch (err) {
    console.warn('[Dedup] checkDuplicateEventInDb error:', err);
  }

  return { isDuplicate: false };
}

