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
    const { data: curators, error } = await supabase
      .from('telegram_curators')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table does not exist yet before schema run, return friendly fallback
      if (error.code === '42P01') {
        return NextResponse.json({
          curators: [],
          tablePending: true,
          message: 'telegram_curators table pending schema migration',
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (curators || []).map((c) => ({
      ...c,
      chat_id: String(c.telegram_user_id || c.chat_id || ''),
    }));

    return NextResponse.json({ curators: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    if (!auth.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can manage curator access' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { chat_id, username, name, role = 'curator', notes } = body;

    if (!chat_id || isNaN(Number(chat_id))) {
      return NextResponse.json({ error: 'Valid numeric Telegram chat_id required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: inserted, error } = await supabase
      .from('telegram_curators')
      .upsert(
        {
          telegram_user_id: Number(chat_id),
          username: username ? username.replace('@', '').trim() : null,
          name: name ? name.trim() : 'Curator',
          role,
          is_active: true,
          notes: notes ? notes.trim() : null,
          added_by: auth.user.email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'telegram_user_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: 'CURATOR_ADD',
      targetType: 'curator',
      targetId: String(chat_id),
      metadata: { username, name, role, notes },
    });

    return NextResponse.json({
      success: true,
      curator: { ...inserted, chat_id: String(inserted?.telegram_user_id) },
    });
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

    if (!auth.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can revoke curator access' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chat_id');

    if (!chatId) {
      return NextResponse.json({ error: 'Missing chat_id parameter' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const numId = Number(chatId);
    let query = supabase.from('telegram_curators').delete();
    if (!isNaN(numId)) {
      query = query.eq('telegram_user_id', numId);
    } else {
      query = query.eq('id', chatId);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: 'CURATOR_REVOKE',
      targetType: 'curator',
      targetId: chatId,
    });

    return NextResponse.json({ success: true, message: 'Curator access revoked' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
