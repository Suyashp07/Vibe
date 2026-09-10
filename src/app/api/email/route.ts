import { NextRequest, NextResponse } from 'next/server';
import { sendRsvpConfirmedEmail, sendWaitlistedEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { type, to, guestName, event, organizer, position } = await req.json();

    if (type === 'rsvp_confirmed') {
      const result = await sendRsvpConfirmedEmail({
        to,
        guestName,
        event,
        organizer: organizer || {
          name: event.organizer_name,
          brand_color: event.organizer_brand_color,
          logo_url: event.organizer_logo,
          handle: event.organizer_handle
        }
      });
      return NextResponse.json(result);
    } else if (type === 'waitlisted') {
      const result = await sendWaitlistedEmail({
        to,
        guestName,
        position: position || 1,
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

    return NextResponse.json({ success: true, note: 'Handled' });
  } catch (err: any) {
    console.error('Email API route error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
