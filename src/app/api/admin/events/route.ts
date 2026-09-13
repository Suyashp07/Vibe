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

    const supabase = getAdminClient();
    const { data: events, error } = await supabase
      .from('events')
      .select('*, profiles:organizer_id(id, name, handle, logo_url, email)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Compute high-level metrics
    const allEvents = events || [];
    const drafts = allEvents.filter((e) => e.status === 'draft');
    const published = allEvents.filter((e) => e.status === 'published');
    const external = allEvents.filter((e) => e.is_external);

    return NextResponse.json({
      events: allEvents,
      metrics: {
        total: allEvents.length,
        draftsCount: drafts.length,
        publishedCount: published.length,
        externalCount: external.length,
      },
    });
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
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing event id or updates payload' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Fetch existing state for audit log comparison
    const { data: existing } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    const allowedFields = [
      'title',
      'tagline',
      'description',
      'date',
      'time',
      'end_date',
      'end_time',
      'venue_name',
      'venue_address',
      'city',
      'cover_image',
      'category',
      'status',
      'price_inr',
      'price',
      'ticket_type',
      'tickets',
      'is_external',
      'platform',
      'ticket_link',
      'external_url',
    ];

    const sanitizedUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }
    sanitizedUpdates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('events')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Determine audit action name
    let actionName = 'EVENT_UPDATE';
    if (sanitizedUpdates.status === 'published' && existing?.status === 'draft') {
      actionName = 'EVENT_PUBLISH';
    } else if (sanitizedUpdates.status === 'draft' && existing?.status === 'published') {
      actionName = 'EVENT_UNPUBLISH';
    }

    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: actionName,
      targetType: 'event',
      targetId: id,
      metadata: {
        before: { status: existing?.status, title: existing?.title, price_inr: existing?.price_inr },
        after: sanitizedUpdates,
      },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing event id parameter' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Fetch event title for audit trail
    const { data: existing } = await supabase
      .from('events')
      .select('title, slug')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: 'EVENT_DELETE',
      targetType: 'event',
      targetId: id,
      metadata: {
        title: existing?.title || 'Unknown',
        slug: existing?.slug || 'Unknown',
      },
    });

    return NextResponse.json({ success: true, message: 'Event permanently deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
