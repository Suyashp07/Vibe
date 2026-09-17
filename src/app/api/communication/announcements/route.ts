import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendHostAnnouncementEmail } from '@/lib/email';
import { EventItem } from '@/types';

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your-project')) {
    return null;
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

// GET /api/communication/announcements?eventId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ announcements: [] });
    }

    let query = supabase.from('event_announcements').select('*').order('created_at', { ascending: false });
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Could not query announcements from Supabase:', error.message);
      return NextResponse.json({ announcements: [], note: error.message });
    }

    return NextResponse.json({ announcements: data || [] });
  } catch (err: any) {
    console.error('Error in GET /api/communication/announcements:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/communication/announcements
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventId,
      organizerId,
      title,
      message,
      targetAudience = 'all',
      isUrgent = false,
      sendEmail = true,
      event, // optional pre-passed event object
      attendees // optional pre-passed attendee list [{ email, name, status }]
    } = body;

    if (!eventId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, title, message' },
        { status: 400 }
      );
    }

    const appUrl = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com';
    const supabase = getSupabaseServerClient();

    let createdAnnouncement = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event_id: eventId,
      organizer_id: organizerId || null,
      title,
      message,
      target_audience: targetAudience,
      is_urgent: isUrgent,
      send_email: sendEmail,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('event_announcements')
          .insert([{
            event_id: eventId,
            organizer_id: organizerId || null,
            title,
            message,
            target_audience: targetAudience,
            is_urgent: isUrgent,
            send_email: sendEmail
          }])
          .select()
          .single();

        if (!error && data) {
          createdAnnouncement = data;
        } else if (error) {
          console.warn('Supabase announcement insert fallback:', error.message);
        }
      } catch (dbErr) {
        console.warn('Supabase announcement insert exception:', dbErr);
      }
    }

    // 2. Multi-channel delivery: Email blast to attendees if requested
    let emailsSent = 0;
    let emailRecipients: Array<{ email: string; name?: string }> = [];

    if (sendEmail) {
      // Gather recipients from payload or database
      if (attendees && Array.isArray(attendees) && attendees.length > 0) {
        emailRecipients = attendees.filter(a => {
          if (!a.email) return false;
          if (targetAudience === 'confirmed') return a.status === 'confirmed';
          if (targetAudience === 'waitlisted') return a.status === 'waitlisted';
          return a.status !== 'cancelled';
        });
      } else if (supabase) {
        let rsvpQuery = supabase.from('rsvps').select('email, name, status').eq('event_id', eventId);
        if (targetAudience === 'confirmed') {
          rsvpQuery = rsvpQuery.eq('status', 'confirmed');
        } else if (targetAudience === 'waitlisted') {
          rsvpQuery = rsvpQuery.eq('status', 'waitlisted');
        } else {
          rsvpQuery = rsvpQuery.neq('status', 'cancelled');
        }
        const { data: rsvps } = await rsvpQuery;
        if (rsvps && rsvps.length > 0) {
          emailRecipients = rsvps;
        }
      }

      // Deduplicate emails
      const seen = new Set<string>();
      const uniqueRecipients = emailRecipients.filter(r => {
        const lower = (r.email || '').toLowerCase().trim();
        if (!lower || seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });

      // Target event object
      let targetEvent: EventItem = event;
      if (!targetEvent && supabase) {
        const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single();
        if (ev) targetEvent = ev;
      }

      if (targetEvent && uniqueRecipients.length > 0) {
        // Send in batches of 20 to protect against SMTP rate limits
        const batchSize = 20;
        for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
          const batch = uniqueRecipients.slice(i, i + batchSize);
          await Promise.allSettled(
            batch.map(r =>
              sendHostAnnouncementEmail({
                to: r.email,
                guestName: r.name,
                announcement: {
                  title,
                  message,
                  is_urgent: isUrgent,
                  target_audience: targetAudience
                },
                event: targetEvent,
                appUrl
              })
            )
          );
          emailsSent += batch.length;
        }
      }
    }

    return NextResponse.json({
      success: true,
      announcement: createdAnnouncement,
      emailsSent,
      recipientCount: emailRecipients.length
    });
  } catch (err: any) {
    console.error('Error in POST /api/communication/announcements:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
