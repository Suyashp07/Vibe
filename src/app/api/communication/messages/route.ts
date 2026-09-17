import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDirectMessageNotificationEmail } from '@/lib/email';
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

// GET /api/communication/messages?eventId=...&email=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const email = searchParams.get('email')?.toLowerCase().trim();

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ messages: [] });
    }

    let query = supabase.from('event_messages').select('*').order('created_at', { ascending: true });
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    if (email) {
      query = query.or(`sender_email.eq.${email},recipient_email.eq.${email}`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Could not query messages from Supabase:', error.message);
      return NextResponse.json({ messages: [], note: error.message });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err: any) {
    console.error('Error in GET /api/communication/messages:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/communication/messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventId,
      senderRole,
      senderName,
      senderEmail,
      recipientEmail,
      recipientName,
      rsvpId,
      subject,
      message,
      parentId,
      event, // optional event payload
      notifyEmail = true
    } = body;

    if (!eventId || !senderRole || !senderName || !senderEmail || !recipientEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required message parameters' },
        { status: 400 }
      );
    }

    const appUrl = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com';
    const supabase = getSupabaseServerClient();

    let createdMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event_id: eventId,
      sender_role: senderRole,
      sender_name: senderName,
      sender_email: senderEmail.toLowerCase().trim(),
      recipient_email: recipientEmail.toLowerCase().trim(),
      rsvp_id: rsvpId || null,
      subject: subject || null,
      message,
      is_read: false,
      parent_id: parentId || null,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('event_messages')
          .insert([{
            event_id: eventId,
            sender_role: senderRole,
            sender_name: senderName,
            sender_email: senderEmail.toLowerCase().trim(),
            recipient_email: recipientEmail.toLowerCase().trim(),
            rsvp_id: rsvpId || null,
            subject: subject || null,
            message,
            is_read: false,
            parent_id: parentId || null
          }])
          .select()
          .single();

        if (!error && data) {
          createdMessage = data;
        } else if (error) {
          console.warn('Supabase message insert fallback:', error.message);
        }
      } catch (dbErr) {
        console.warn('Supabase message insert exception:', dbErr);
      }
    }

    // Trigger email alert to recipient
    let emailSent = false;
    if (notifyEmail) {
      let targetEvent: EventItem = event;
      if (!targetEvent && supabase) {
        const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single();
        if (ev) targetEvent = ev;
      }

      if (targetEvent) {
        try {
          const emailRes = await sendDirectMessageNotificationEmail({
            to: recipientEmail,
            recipientName,
            senderName,
            senderRole,
            message,
            subject,
            event: targetEvent,
            appUrl
          });
          emailSent = !!emailRes?.success;
        } catch (mailErr) {
          console.warn('Direct message email notification warning:', mailErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: createdMessage,
      emailSent
    });
  } catch (err: any) {
    console.error('Error in POST /api/communication/messages:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
