import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAppUrl(req?: Request): string {
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = req.headers.get('x-forwarded-proto') || 'https';
      return `${proto}://${host}`;
    }
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://vibe.swaniki.com';
}

async function sendWhatsAppAlert(toPhone: string, text: string): Promise<boolean> {
  const bridgeUrl = (
    process.env.WHATSAPP_BRIDGE_URL ||
    'https://vibe-whatsapp-bridge.onrender.com'
  ).replace(/\/$/, '');
  const secret =
    process.env.WHATSAPP_BRIDGE_SECRET ||
    process.env.WHATSAPP_WEBHOOK_SECRET ||
    'vibe_wa_sec_99a8b7c6d5e4f3a2b1';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (secret) {
    headers['Authorization'] = `Bearer ${secret}`;
  }

  try {
    const res = await fetch(`${bridgeUrl}/send-message`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to: toPhone, text }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (err: any) {
    console.warn('[WhatsApp Notify RSVP] Failed to dispatch via bridge:', err.message);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, rsvp, event: incomingEvent } = body;

    if (!eventId && !incomingEvent?.id) {
      return NextResponse.json({ error: 'Missing event identifier' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const idToLookup = eventId || incomingEvent?.id;

    // Fetch full event to guarantee host phone and manage token
    const { data: dbEvent } = await supabase
      .from('events')
      .select('*')
      .eq('id', idToLookup)
      .maybeSingle();

    const event = dbEvent || incomingEvent;
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const hostPhone =
      event.whatsapp_host_phone ||
      event.theme?.whatsapp_host_phone ||
      process.env.WHATSAPP_HOST_PHONE;

    if (!hostPhone) {
      // Not an event with WhatsApp host phone configured
      return NextResponse.json({ ok: true, notice: 'No WhatsApp host phone attached' });
    }

    const appUrl = getAppUrl(req);
    const manageToken = event.theme?.manage_token || event.id;
    const manageUrl = `${appUrl}/manage/${manageToken}`;

    const guestName = rsvp?.name || 'A guest';
    const guestContact = rsvp?.phone || rsvp?.email || 'Vibe Instant user';
    const isWaitlisted = rsvp?.status === 'waitlisted';
    const statusLine = isWaitlisted
      ? '⏳ *Status:* PENDING HOST APPROVAL (Review needed)'
      : '✅ *Status:* CONFIRMED & TICKETED (IN)';

    const capacity = event.capacity || event.theme?.spots_limit;
    const capacityText = capacity ? `/${capacity} spots` : '';

    const text =
      `⚡ *New Guest Joined on Vibe Instant!*\n\n` +
      `📌 *Event:* ${event.title}\n` +
      `👤 *Guest:* ${guestName} (${guestContact})\n` +
      statusLine + `\n\n` +
      `🔒 *Manage Guest List & In/Out Approvals:*\n${manageUrl}\n\n` +
      `_Tap link above to approve, decline, or scan tickets._`;

    const dispatched = await sendWhatsAppAlert(hostPhone, text);

    return NextResponse.json({ ok: true, dispatched, hostPhone });
  } catch (err: any) {
    console.error('[WhatsApp Notify RSVP] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
