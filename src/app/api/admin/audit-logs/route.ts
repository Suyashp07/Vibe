import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyStaffSession } from '@/lib/adminAuth';

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
      return NextResponse.json({ error: auth.error || 'Unauthorized', logs: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const targetType = searchParams.get('targetType');

    const supabase = getAdminClient();
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (targetType && targetType !== 'all') {
      query = query.eq('target_type', targetType);
    }

    const { data: logs, error } = await query;

    if (error) {
      // Graceful fallback if table is not yet migrated in Supabase
      const isMissingTable =
        error.code === '42P01' ||
        error.code === 'PGRST204' ||
        error.code === 'PGRST200' ||
        error.message?.includes('relation "audit_logs" does not exist') ||
        error.message?.includes('Could not find the table') ||
        error.message?.includes('schema cache');

      if (isMissingTable) {
        // Fallback: Synthesize recent real activity from events table
        const { data: recentEvents } = await supabase
          .from('events')
          .select('id, title, status, created_at, source_platform, organizer_name')
          .order('created_at', { ascending: false })
          .limit(20);

        const fallbackLogs = (recentEvents || []).map((ev) => ({
          id: `audit-${ev.id}`,
          created_at: ev.created_at,
          action: ev.status === 'live' ? 'EVENT_AUTO_PUBLISHED' : 'EVENT_DRAFT_CREATED',
          actor_email: ev.source_platform ? `${ev.source_platform}-bot@vibe.community` : 'admin@vibe.community',
          actor_role: 'system',
          target_type: 'event',
          target_id: ev.id,
          metadata: {
            title: ev.title,
            status: ev.status,
            source: ev.source_platform || 'web',
            organizer: ev.organizer_name || 'Vibe Community',
          },
        }));

        return NextResponse.json({
          logs: fallbackLogs,
          tablePending: true,
          message: 'audit_logs table pending SQL migration. Showing live system event activity.',
        });
      }

      return NextResponse.json({ error: error.message, logs: [] }, { status: 200 });
    }

    return NextResponse.json({ logs: logs || [], tablePending: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, logs: [] }, { status: 200 });
  }
}

