import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyStaffSession } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const search = searchParams.get('search')?.toLowerCase();

    const supabase = getAdminClient();
    let query = supabase
      .from('rsvps')
      .select('*, events:event_id(id, title, date, venue_name, city, slug)')
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: rsvps, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered = rsvps || [];
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(search) ||
          r.email?.toLowerCase().includes(search) ||
          r.pass_id?.toLowerCase().includes(search) ||
          r.events?.title?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ rsvps: filtered, total: filtered.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, checked_in } = body;

    if (!id || checked_in === undefined) {
      return NextResponse.json({ error: 'Missing rsvp id or checked_in status' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const updates: Record<string, any> = {
      checked_in: Boolean(checked_in),
      attended_at: checked_in ? new Date().toISOString() : null,
    };

    const { data: updated, error } = await supabase
      .from('rsvps')
      .update(updates)
      .eq('id', id)
      .select('*, events:event_id(title)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: checked_in ? 'RSVP_CHECK_IN' : 'RSVP_UNCHECK_IN',
      targetType: 'rsvp',
      targetId: id,
      metadata: { checked_in, guest: updated?.email, event: updated?.events?.title },
    });

    return NextResponse.json({ success: true, rsvp: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
