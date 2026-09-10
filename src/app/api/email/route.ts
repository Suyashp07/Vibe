import { NextRequest, NextResponse } from 'next/server';
import {
  sendEventCreatedEmail,
  sendRsvpConfirmedEmail,
  sendWaitlistedEmail,
  sendEventReminderEmail,
  sendEventUpdatedEmail,
  sendEventCancelledEmail
} from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
      to,
      organizerName,
      guestName,
      rsvp,
      event,
      organizer,
      position,
      timing,
      changes,
      reason
    } = body;

    if (!to || !type) {
      return NextResponse.json({ error: 'Missing required parameters (to, type)' }, { status: 400 });
    }

    // Determine current base application URL
    const appUrl = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com';

    // 1. Organizer Event Creation Confirmation
    if (type === 'event_created') {
      if (!event) {
        return NextResponse.json({ error: 'Missing event payload for event_created email' }, { status: 400 });
      }

      const result = await sendEventCreatedEmail({
        to,
        organizerName: organizerName || event.organizer_name || 'Event Host',
        event,
        organizer: organizer || {
          name: event.organizer_name,
          brand_color: event.organizer_brand_color,
          logo_url: event.organizer_logo,
          handle: event.organizer_handle
        },
        appUrl
      });

      return NextResponse.json(result);
    }

    // 2. Guest RSVP Confirmation with Digital Pass
    if (type === 'rsvp_confirmed') {
      if (!event) {
        return NextResponse.json({ error: 'Missing event payload for rsvp_confirmed email' }, { status: 400 });
      }

      const result = await sendRsvpConfirmedEmail({
        to,
        guestName: guestName || rsvp?.name || 'Valued Guest',
        rsvp,
        event,
        organizer: organizer || {
          name: event.organizer_name,
          brand_color: event.organizer_brand_color,
          logo_url: event.organizer_logo,
          handle: event.organizer_handle
        },
        appUrl
      });

      return NextResponse.json(result);
    }

    // 3. Guest Waitlisted Notice
    if (type === 'waitlisted') {
      if (!event) {
        return NextResponse.json({ error: 'Missing event payload for waitlisted email' }, { status: 400 });
      }

      const result = await sendWaitlistedEmail({
        to,
        guestName: guestName || rsvp?.name || 'Valued Guest',
        position: position || 1,
        event,
        organizer: organizer || {
          name: event.organizer_name,
          brand_color: event.organizer_brand_color,
          logo_url: event.organizer_logo,
          handle: event.organizer_handle
        },
        appUrl
      });

      return NextResponse.json(result);
    }

    // 4. Event Reminder
    if (type === 'reminder') {
      const result = await sendEventReminderEmail({
        to,
        guestName: guestName || 'Valued Guest',
        timing: timing || '24h',
        event,
        organizer: organizer || {
          name: event.organizer_name,
          brand_color: event.organizer_brand_color,
          logo_url: event.organizer_logo,
          handle: event.organizer_handle
        }
      });
      return NextResponse.json(result);
    }

    // 5. Event Updated
    if (type === 'event_updated') {
      const result = await sendEventUpdatedEmail({
        to,
        guestName: guestName || 'Valued Guest',
        changes: changes || 'Details have been updated by the organizer.',
        event,
        organizer: organizer || {
          name: event.organizer_name,
          brand_color: event.organizer_brand_color,
          logo_url: event.organizer_logo,
          handle: event.organizer_handle
        }
      });
      return NextResponse.json(result);
    }

    // 6. Event Cancelled
    if (type === 'event_cancelled') {
      const result = await sendEventCancelledEmail({
        to,
        guestName: guestName || 'Valued Guest',
        reason,
        event,
        organizer: organizer || {
          name: event.organizer_name,
          brand_color: event.organizer_brand_color,
          logo_url: event.organizer_logo,
          handle: event.organizer_handle
        }
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: true, note: `Unknown type: ${type}` });
  } catch (err: any) {
    console.error('Email API route error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
