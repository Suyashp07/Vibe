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
export function groupDuplicates<T extends DedupCandidate>(records: T[]): T[][] {
  const groups: T[][] = [];
  for (const rec of records) {
    let placed = false;
    for (const group of groups) {
      if (group.some((g) => areDuplicates(g, rec))) {
        group.push(rec);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([rec]);
  }
  return groups;
}
