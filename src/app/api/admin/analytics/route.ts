import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyStaffSession } from '@/lib/adminAuth';
import { ADMIN_EMAILS } from '@/lib/adminConstants';
import { getTelemetrySummary } from '@/lib/telemetry';
import { getLiveSuperadminRegistry } from '@/lib/superadminManager';

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
    const startTime = performance.now();

    // 1. Measure live Supabase latency & fetch table metrics in parallel
    const [
      profilesRes,
      eventsRes,
      rsvpsRes,
      commentsRes,
      auditLogsRes,
      pollsRes,
      curatorsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id, email, name, role, created_at, avatar_url, handle').order('created_at', { ascending: false }),
      supabase.from('events').select('id, title, status, created_at, organizer_id'),
      supabase.from('rsvps').select('id, event_id, email, status, checked_in, created_at'),
      supabase.from('event_comments').select('id, created_at', { count: 'exact' }),
      supabase.from('audit_logs').select('id, created_at', { count: 'exact' }),
      supabase.from('date_polls').select('id, created_at', { count: 'exact' }),
      supabase.from('telegram_curators').select('id, role', { count: 'exact' }),
    ]);

    const pingLatencyMs = Math.round(performance.now() - startTime);

    const profilesList = profilesRes.data || [];
    const eventsList = eventsRes.data || [];
    const rsvpsList = rsvpsRes.data || [];

    // 2. User Metrics (Numbers of User of Vibe / signed up IDs)
    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    const totalUsersCount = profilesList.length;
    const usersToday = profilesList.filter((p) => p.created_at && p.created_at >= oneDayAgo).length;
    const usersThisWeek = profilesList.filter((p) => p.created_at && p.created_at >= oneWeekAgo).length;
    const usersThisMonth = profilesList.filter((p) => p.created_at && p.created_at >= oneMonthAgo).length;

    // Role Distribution
    const roleCounts = {
      super_admin: profilesList.filter((p) => p.role === 'super_admin').length,
      curator: profilesList.filter((p) => p.role === 'curator').length,
      organizer: profilesList.filter((p) => p.role === 'organizer').length,
      guest: profilesList.filter((p) => p.role === 'guest' || !p.role).length,
    };

    // 3. Superadmin Access Accounts Directory
    // Reconstruct live registry from audit_logs + profiles + dynamic grants, excluding revoked emails
    const { superAdminsList, grantedEmails, revokedEmails } = await getLiveSuperadminRegistry(
      supabase,
      profilesList
    );

    // Enrich registered IDs list with activity metrics
    const signedUpUsers = profilesList.map((p) => {
      const cleanEmail = (p.email || '').toLowerCase().trim();
      const isSuper =
        !revokedEmails.has(cleanEmail) &&
        (p.role === 'super_admin' || ADMIN_EMAILS.includes(cleanEmail) || grantedEmails.has(cleanEmail));

      const hostedEvents = eventsList.filter((e) => e.organizer_id === p.id).length;
      const passBookings = rsvpsList.filter((r) => r.email?.toLowerCase() === p.email?.toLowerCase()).length;
      return {
        id: p.id,
        email: p.email,
        name: p.name || 'Anonymous User',
        handle: p.handle || null,
        avatar_url: p.avatar_url || null,
        role: isSuper ? 'super_admin' : (p.role || 'guest'),
        created_at: p.created_at,
        hosted_events_count: hostedEvents,
        rsvps_count: passBookings,
        is_super_admin: isSuper,
      };
    });

    // 4. Supabase Database Utilization
    const eventsBreakdown = {
      total: eventsList.length,
      live: eventsList.filter((e) => ['live', 'published'].includes((e.status || '').toLowerCase())).length,
      draft: eventsList.filter((e) => (e.status || '').toLowerCase() === 'draft').length,
      review: eventsList.filter((e) => (e.status || '').toLowerCase() === 'review').length,
      cancelled: eventsList.filter((e) => ['cancelled', 'rejected'].includes((e.status || '').toLowerCase())).length,
    };

    const rsvpsBreakdown = {
      total: rsvpsList.length,
      confirmed: rsvpsList.filter((r) => r.status === 'confirmed').length,
      checked_in: rsvpsList.filter((r) => r.checked_in).length,
      today: rsvpsList.filter((r) => r.created_at && r.created_at >= oneDayAgo).length,
    };

    const tableRows = {
      profiles: profilesList.length,
      events: eventsList.length,
      rsvps: rsvpsList.length,
      event_comments: commentsRes.count ?? (commentsRes.data?.length || 0),
      audit_logs: auditLogsRes.count ?? (auditLogsRes.data?.length || 0),
      date_polls: pollsRes.count ?? (pollsRes.data?.length || 0),
      telegram_curators: curatorsRes.count ?? (curatorsRes.data?.length || 1),
    };

    const totalTrackedRows = Object.values(tableRows).reduce((a, b) => a + b, 0);

    const dbUtilization = {
      pingLatencyMs,
      status: pingLatencyMs < 120 ? 'Optimal' : pingLatencyMs < 350 ? 'Moderate' : 'High Latency',
      totalTrackedRows,
      tableRows,
      eventsBreakdown,
      rsvpsBreakdown,
      supabaseHost: (process.env.NEXT_PUBLIC_SUPABASE_URL || 'supabase.co').replace(/^https?:\/\//, '').split('/')[0],
      serviceRoleActive: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      writesLast24h: {
        events: eventsList.filter((e) => e.created_at && e.created_at >= oneDayAgo).length,
        rsvps: rsvpsBreakdown.today,
        users: usersToday,
      },
    };

    // 5. Actual Time Spent by All Users (Telemetry Engine)
    const telemetry = getTelemetrySummary();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      caller: {
        email: auth.user.email,
        role: auth.role,
        isSuperAdmin: auth.isSuperAdmin,
      },
      usersOverview: {
        totalSignedUp: totalUsersCount,
        usersToday,
        usersThisWeek,
        usersThisMonth,
        roleCounts,
        signedUpUsers,
      },
      superadmins: {
        count: superAdminsList.length,
        list: superAdminsList,
      },
      databaseUtilization: dbUtilization,
      platformEngagement: {
        cumulativeSeconds: telemetry.cumulativeSeconds,
        totalMinutes: telemetry.totalMinutes,
        totalHours: telemetry.totalHours,
        todayMinutes: telemetry.todayMinutes,
        activeVisitorsNow: telemetry.activeVisitors,
        avgSessionMinutes: telemetry.avgSessionMinutes,
        topPages: telemetry.topPages,
        hourlyData: telemetry.hourlyData,
        lastHeartbeatAt: telemetry.lastHeartbeatAt,
      },
    });
  } catch (err: any) {
    console.error('[Admin Analytics API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
