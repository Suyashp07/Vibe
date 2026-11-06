import crypto from 'crypto';
import sharp from 'sharp';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'event-posters';
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const DOWNLOAD_TIMEOUT_MS = 10000; // 10s
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export interface ProcessPosterOptions {
  eventId: string;
  sourceUrl: string;
  force?: boolean;
  supabaseClient?: SupabaseClient;
}

export interface ProcessPosterResult {
  success: boolean;
  skipped?: boolean;
  eventId: string;
  sourceUrl: string;
  hash: string;
  heroUrl?: string;
  cardUrl?: string;
  thumbUrl?: string;
  blurDataUrl?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  dominantColor?: string;
  isLowRes?: boolean;
  error?: string;
}

function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function computeSha256(str: string): string {
  return crypto.createHash('sha256').update(str.trim()).digest('hex');
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Downloads image buffer with strict size capping, timeout, and custom Referer/User-Agent.
 */
async function downloadOriginalPoster(sourceUrl: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  let referer = 'https://vibe.swaniki.com';
  try {
    const parsed = new URL(sourceUrl);
    referer = `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    // ignore
  }

  try {
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: referer,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to download poster image: HTTP ${res.status} ${res.statusText}`);
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase().split(';')[0].trim();
    const hasImageExt = /\.(jpe?g|png|webp|gif|avif)($|\?)/i.test(sourceUrl);
    if (
      contentType &&
      !ALLOWED_CONTENT_TYPES.includes(contentType) &&
      !contentType.includes('image') &&
      !(contentType === 'application/octet-stream' && hasImageExt)
    ) {
      throw new Error(`Disallowed content-type for poster: ${contentType}`);
    }

    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image size (${contentLength} bytes) exceeds 15 MB limit`);
    }

    // Stream download with strict byte count guard
    const reader = res.body?.getReader();
    if (!reader) {
      const arrayBuf = await res.arrayBuffer();
      if (arrayBuf.byteLength > MAX_IMAGE_BYTES) {
        throw new Error('Downloaded image exceeded 15 MB limit');
      }
      return Buffer.from(arrayBuf);
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        receivedBytes += value.length;
        if (receivedBytes > MAX_IMAGE_BYTES) {
          controller.abort();
          throw new Error('Downloaded image exceeded 15 MB limit while streaming');
        }
        chunks.push(value);
      }
    }

    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Core poster processor.
 * Never throws an unhandled error; returns result object with success status.
 */
export async function processPoster(options: ProcessPosterOptions): Promise<ProcessPosterResult> {
  const { eventId, sourceUrl, force = false } = options;
  const supabase = options.supabaseClient || getAdminClient();

  if (!sourceUrl || typeof sourceUrl !== 'string' || !sourceUrl.startsWith('http')) {
    return {
      success: false,
      eventId,
      sourceUrl: sourceUrl || '',
      hash: '',
      error: 'Invalid or missing sourceUrl',
    };
  }

  const hash = computeSha256(sourceUrl);

  // 1. Idempotency Check: if hash matches and status is 'processed', skip unless forced
  if (supabase && !force) {
    try {
      const { data: existing } = await supabase
        .from('events')
        .select('id, poster_source_hash, poster_processing_status, poster_hero_url, poster_card_url, poster_thumb_url')
        .eq('id', eventId)
        .maybeSingle();

      if (
        existing &&
        existing.poster_source_hash === hash &&
        existing.poster_processing_status === 'processed' &&
        existing.poster_hero_url
      ) {
        return {
          success: true,
          skipped: true,
          eventId,
          sourceUrl,
          hash,
          heroUrl: existing.poster_hero_url,
          cardUrl: existing.poster_card_url,
          thumbUrl: existing.poster_thumb_url,
        };
      }
    } catch {
      // Continue if query fails
    }
  }

  // 2. Retry loop with exponential backoff (up to 3 attempts)
  let lastError: any = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Step A: Download image
      const originalBuffer = await downloadOriginalPoster(sourceUrl);

      // Step B: Initialize sharp instance
      // Using page: 0 ensures animated GIFs extract the first static frame
      const isGif = sourceUrl.toLowerCase().includes('.gif');
      const pipeline = sharp(originalBuffer, isGif ? { page: 0 } : undefined).rotate();

      // Step C: Metadata & stats
      const metadata = await pipeline.metadata();
      const stats = await pipeline.stats();

      const width = metadata.width || 800;
      const height = metadata.height || 600;
      const aspectRatio = Number((width / height).toFixed(4));
      const isLowRes = Math.min(width, height) < 400;

      const dom = stats.dominant || { r: 7, g: 19, b: 58 };
      const dominantColorHex = rgbToHex(dom.r, dom.g, dom.b);

      // Step D: Generate WebP variants (Fit inside, never upscale)
      // Hero variant: max 1600px width, quality 80
      const heroBuffer = await pipeline
        .clone()
        .resize({ width: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      // Card variant: max 640px width, quality 80
      const cardBuffer = await pipeline
        .clone()
        .resize({ width: 640, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      // Thumb variant: max 320px width, quality 75
      const thumbBuffer = await pipeline
        .clone()
        .resize({ width: 320, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75, effort: 3 })
        .toBuffer();

      // Blur placeholder: 24px wide, blurred, base64 data URL
      const blurBuffer = await pipeline
        .clone()
        .resize({ width: 24, fit: 'inside', withoutEnlargement: true })
        .blur(1.5)
        .webp({ quality: 40 })
        .toBuffer();
      const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`;

      // Step E: Upload variants to Supabase Storage
      let heroUrl = sourceUrl;
      let cardUrl = sourceUrl;
      let thumbUrl = sourceUrl;

      if (supabase) {
        const basePath = `${eventId}/${hash.slice(0, 16)}`;
        const heroPath = `${basePath}/hero.webp`;
        const cardPath = `${basePath}/card.webp`;
        const thumbPath = `${basePath}/thumb.webp`;

        const uploadOpts = {
          contentType: 'image/webp',
          cacheControl: '31536000', // 1 year immutable CDN caching
          upsert: true,
        };

        const [heroUpload, cardUpload, thumbUpload] = await Promise.all([
          supabase.storage.from(BUCKET_NAME).upload(heroPath, heroBuffer, uploadOpts),
          supabase.storage.from(BUCKET_NAME).upload(cardPath, cardBuffer, uploadOpts),
          supabase.storage.from(BUCKET_NAME).upload(thumbPath, thumbBuffer, uploadOpts),
        ]);

        if (heroUpload.error) console.warn('Supabase storage hero upload warning:', heroUpload.error);
        if (cardUpload.error) console.warn('Supabase storage card upload warning:', cardUpload.error);
        if (thumbUpload.error) console.warn('Supabase storage thumb upload warning:', thumbUpload.error);

        heroUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(heroPath).data.publicUrl;
        cardUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(cardPath).data.publicUrl;
        thumbUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(thumbPath).data.publicUrl;
      }

      // Step F: Atomic Update of Event Record
      if (supabase) {
        const updatePayload: Record<string, any> = {
          poster_original_url: sourceUrl,
          poster_width: width,
          poster_height: height,
          poster_aspect_ratio: aspectRatio,
          poster_dominant_color: dominantColorHex,
          poster_is_low_res: isLowRes,
          poster_hero_url: heroUrl,
          poster_card_url: cardUrl,
          poster_thumb_url: thumbUrl,
          poster_blur_data_url: blurDataUrl,
          poster_source_hash: hash,
          poster_processing_status: 'processed',
          poster_processed_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('events')
          .update(updatePayload)
          .eq('id', eventId);

        if (updateError) {
          // If columns do not exist yet in DB, store metadata gracefully inside theme.poster
          console.warn(`Direct poster columns update returned notice (${updateError.message}). Storing in theme fallback.`);
          try {
            const { data: ev } = await supabase.from('events').select('theme').eq('id', eventId).maybeSingle();
            const existingTheme = ev?.theme || {};
            await supabase
              .from('events')
              .update({
                theme: {
                  ...existingTheme,
                  poster: {
                    hero_url: heroUrl,
                    card_url: cardUrl,
                    thumb_url: thumbUrl,
                    blur_data_url: blurDataUrl,
                    width,
                    height,
                    aspect_ratio: aspectRatio,
                    dominant_color: dominantColorHex,
                    is_low_res: isLowRes,
                    source_hash: hash,
                    status: 'processed',
                  },
                },
              })
              .eq('id', eventId);
          } catch {
            // ignore fallback error
          }
        }
      }

      return {
        success: true,
        eventId,
        sourceUrl,
        hash,
        heroUrl,
        cardUrl,
        thumbUrl,
        blurDataUrl,
        width,
        height,
        aspectRatio,
        dominantColor: dominantColorHex,
        isLowRes,
      };
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 200; // 400ms, 800ms
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  // All retries failed: Mark event as 'failed' without breaking ingestion
  const errorMessage = lastError?.message || 'Unknown poster processing error';
  console.error(`[PosterPipeline] Processing failed for event ${eventId} (${sourceUrl}):`, errorMessage);

  if (supabase) {
    try {
      await supabase
        .from('events')
        .update({
          poster_original_url: sourceUrl,
          poster_processing_status: 'failed',
          poster_source_hash: hash,
        })
        .eq('id', eventId);
    } catch {
      // ignore update error
    }
  }

  return {
    success: false,
    eventId,
    sourceUrl,
    hash,
    error: errorMessage,
  };
}

/**
 * Concurrency-limited worker queue for poster processing.
 */
export async function processPostersBatch(
  items: Array<{ eventId: string; sourceUrl: string }>,
  concurrency = 4,
  onProgress?: (index: number, total: number, result: ProcessPosterResult) => void
): Promise<ProcessPosterResult[]> {
  const results: ProcessPosterResult[] = [];
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      const item = items[idx];
      const res = await processPoster({
        eventId: item.eventId,
        sourceUrl: item.sourceUrl,
      });
      results[idx] = res;
      if (onProgress) onProgress(idx + 1, items.length, res);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);

  return results;
}
