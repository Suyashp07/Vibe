/**
 * Multi-Platform Event Crawling & URL Ingestion Engine
 * Handles BookMyShow, District, Eventbrite, Luma, and generic listing extraction.
 * Uses Jina Reader proxy fallback (https://r.jina.ai/) to bypass 403 anti-scraping blocks.
 */

export const BOOKMYSHOW_RE = /(https:\/\/(?:[a-z0-9.-]+\.)?bookmyshow\.com\/events\/[A-Za-z0-9\-]+\/[A-Za-z0-9]+)/gi;
export const EVENTBRITE_RE = /(https:\/\/(?:[a-z0-9.-]+\.)?eventbrite\.[a-z.]{2,}\/e\/[A-Za-z0-9\-]+)/gi;
export const DISTRICT_RE = /(https:\/\/(?:[a-z0-9.-]+\.)?district\.in\/events\/[A-Za-z0-9\-]+)/gi;
export const LUMA_RE = /(https:\/\/lu\.ma\/[A-Za-z0-9\-]+)/gi;

const LISTING_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

/**
 * Fetches page content as raw text.
 * Tries direct fetch first with modern User-Agent; falls back to Jina Reader proxy
 * which bypasses BookMyShow Cloudflare / 403 anti-bot blocks cleanly.
 */
export async function fetchListingPage(listingUrl: string): Promise<string> {
  const candidateUrls = [listingUrl, `https://r.jina.ai/${listingUrl}`];

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000);

      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': LISTING_UA,
          Accept: 'text/html,application/xhtml+xml,text/plain,*/*;q=0.8',
        },
      });

      clearTimeout(timeout);

      if (!res.ok) continue;

      const text = await res.text();
      if (text && text.trim().length > 250) {
        return text;
      }
    } catch {
      // Try Jina proxy fallback
    }
  }

  throw new Error(`Could not fetch listing page: ${listingUrl}`);
}

/**
 * Extracts unique, clean event deep-links from raw HTML or markdown text
 */
export function extractEventLinks(content: string): string[] {
  const seen = new Set<string>();
  const links: string[] = [];

  const patterns = [BOOKMYSHOW_RE, EVENTBRITE_RE, DISTRICT_RE, LUMA_RE];

  for (const pattern of patterns) {
    const matches = content.match(pattern) ?? [];
    for (const raw of matches) {
      const cleaned = raw.replace(/[)\]'"\s]+$/, '');
      if (cleaned && !seen.has(cleaned)) {
        seen.add(cleaned);
        links.push(cleaned);
      }
    }
  }

  return links;
}

export function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('bookmyshow.com')) return 'BookMyShow';
  if (lower.includes('eventbrite.')) return 'Eventbrite';
  if (lower.includes('district.in')) return 'District';
  if (lower.includes('lu.ma')) return 'Luma';
  if (lower.includes('insider.in') || lower.includes('paytm.com')) return 'Paytm Insider';
  return 'Partner Site';
}
