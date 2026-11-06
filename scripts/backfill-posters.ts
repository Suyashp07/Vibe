#!/usr/bin/env tsx
/**
 * scripts/backfill-posters.ts
 *
 * Backfills processed poster variants (hero, card, thumb, blur) for all events.
 *
 * Usage:
 *   npx tsx scripts/backfill-posters.ts
 *   npx tsx scripts/backfill-posters.ts --limit 10
 *   npx tsx scripts/backfill-posters.ts --dry-run
 *   npx tsx scripts/backfill-posters.ts --retry-failed
 *   npx tsx scripts/backfill-posters.ts --concurrency 5
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { processPostersBatch, ProcessPosterResult } from '../src/lib/posters/processPoster';

// Load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('[Error] Supabase URL or Service Key missing in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// CLI Argument parsing
const args = process.argv.slice(2);
function getArgValue(flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  const prefix = `${flag}=`;
  const found = args.find((a) => a.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  return null;
}

const isDryRun = args.includes('--dry-run');
const retryFailed = args.includes('--retry-failed');
const limitArg = getArgValue('--limit');
const concurrencyArg = getArgValue('--concurrency');

const maxLimit = limitArg ? parseInt(limitArg, 10) : 500;
const concurrency = concurrencyArg ? parseInt(concurrencyArg, 10) : 4;

async function runBackfill() {
  console.log('='.repeat(70));
  console.log('🖼️  VIBE POSTER PROCESSING BACKFILL PIPELINE');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (No uploads/writes)' : 'LIVE PROCESSING'}`);
  console.log(`Concurrency: ${concurrency} | Max Limit: ${maxLimit} | Retry Failed: ${retryFailed}`);
  console.log('='.repeat(70));

  // 1. Fetch events from Supabase in batches of 50
  const BATCH_SIZE = 50;
  let allEvents: any[] = [];
  let from = 0;

  while (allEvents.length < maxLimit) {
    const to = from + BATCH_SIZE - 1;
    // Attempt query with poster columns; fall back gracefully if migration not applied yet
    let { data, error } = await supabase
      .from('events')
      .select('id, title, cover_image_url, poster_original_url, poster_processing_status, poster_hero_url, poster_source_hash, theme')
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error && error.message.includes('column events.poster_')) {
      const fallback = await supabase
        .from('events')
        .select('id, title, cover_image_url, theme')
        .order('created_at', { ascending: true })
        .range(from, to);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('Error fetching events batch:', error.message);
      break;
    }
    if (!data || data.length === 0) break;

    allEvents.push(...data);
    if (data.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }

  // 2. Filter candidates needing processing
  const candidates = allEvents.filter((ev) => {
    const coverUrl = (ev.poster_original_url || ev.cover_image_url || '').trim();
    if (!coverUrl || !coverUrl.startsWith('http')) return false;

    const status = ev.poster_processing_status;
    const hasHero = Boolean(ev.poster_hero_url || ev.theme?.poster?.hero_url);

    if (retryFailed && status === 'failed') return true;
    if (!hasHero) return true;
    if (status === 'pending' || !status) return true;

    return false;
  }).slice(0, maxLimit);

  console.log(`Found ${allEvents.length} total events. Identified ${candidates.length} candidates needing poster processing.`);

  if (candidates.length === 0) {
    console.log('✅ All events already have processed poster variants!');
    return;
  }

  if (isDryRun) {
    console.log('\n[Dry Run] Candidates that would be processed:');
    candidates.forEach((c, idx) => {
      console.log(` ${idx + 1}. [${c.id}] "${c.title}" -> ${c.cover_image_url?.slice(0, 70)}`);
    });
    console.log(`\n[Dry Run Completed] ${candidates.length} events inspected. Zero changes made.`);
    return;
  }

  // 3. Process candidates in batches
  console.log(`\nStarting processing with concurrency of ${concurrency}...`);
  const startTime = Date.now();

  let processedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const failureReasons: Array<{ title: string; url: string; error: string }> = [];

  const items = candidates.map((ev) => ({
    eventId: ev.id,
    sourceUrl: (ev.poster_original_url || ev.cover_image_url).trim(),
  }));

  await processPostersBatch(items, concurrency, (current, total, result: ProcessPosterResult) => {
    if (result.success) {
      if (result.skipped) {
        skippedCount++;
        console.log(`[${current}/${total}] ⏩ Skipped (already cached): "${result.eventId}"`);
      } else {
        processedCount++;
        console.log(
          `[${current}/${total}] ✅ Processed: "${result.eventId}" -> ${result.width}x${result.height} (ratio ${result.aspectRatio}, dominant ${result.dominantColor})`
        );
      }
    } else {
      failedCount++;
      failureReasons.push({
        title: result.eventId,
        url: result.sourceUrl,
        error: result.error || 'Unknown error',
      });
      console.error(`[${current}/${total}] ❌ Failed: "${result.eventId}" - ${result.error}`);
    }
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // 4. Print Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 BACKFILL PROCESSING SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Candidates: ${candidates.length}`);
  console.log(`Successfully Processed: ${processedCount}`);
  console.log(`Skipped (Idempotent):   ${skippedCount}`);
  console.log(`Failed:                 ${failedCount}`);
  console.log(`Duration:               ${durationSec}s`);

  if (failureReasons.length > 0) {
    console.log('\nFailure Details:');
    failureReasons.forEach((f, i) => {
      console.log(` ${i + 1}. [${f.title}] ${f.url}\n    Reason: ${f.error}`);
    });
  }
  console.log('='.repeat(70));
}

runBackfill().catch((err) => {
  console.error('Fatal backfill error:', err);
  process.exit(1);
});
