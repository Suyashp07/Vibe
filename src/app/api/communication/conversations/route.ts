import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/lib/communication/conversationService';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your-project')) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

// POST /api/communication/conversations
// Find or create conversation for an event + guest
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, guestId, hostId, guestName, guestEmail } = body;

    if (!eventId || !guestId) {
      return NextResponse.json(
        { error: 'Missing required parameters: eventId, guestId' },
        { status: 400 }
      );
    }

    // Resolve event and host to ensure validity and prevent IDOR
    let resolvedHostId = hostId;
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: eventData } = await supabase
        .from('events')
        .select('id, organizer_id, organizer_handle, title')
        .eq('id', eventId)
        .maybeSingle();

      if (eventData) {
        resolvedHostId = eventData.organizer_id || eventData.organizer_handle || hostId || 'swaniki';
      }
    }

    if (!resolvedHostId) {
      resolvedHostId = 'swaniki';
    }

    const conversation = await conversationService.findOrCreateConversation({
      eventId,
      guestId,
      hostId: resolvedHostId,
      guestName,
      guestEmail,
      guestChannel: 'WEB',
      hostChannel: 'TELEGRAM',
    });

    return NextResponse.json({
      success: true,
      conversation,
    });
  } catch (err: any) {
    console.error('Error in POST /api/communication/conversations:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/communication/conversations?userId=...&role=guest|host
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = (searchParams.get('role') || 'guest') as 'guest' | 'host';

    if (!userId) {
      return NextResponse.json({ error: 'Missing required userId' }, { status: 400 });
    }

    const conversations = await conversationService.getConversationsForUser(userId, role);
    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error('Error in GET /api/communication/conversations:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
