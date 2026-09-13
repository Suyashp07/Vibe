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
    const search = searchParams.get('search')?.toLowerCase();
    const roleFilter = searchParams.get('role');

    const supabase = getAdminClient();

    // Fetch all profiles
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (roleFilter && roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    const { data: profiles, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch counts for events and RSVPs to enrich user profile
    const [eventsRes, rsvpsRes] = await Promise.all([
      supabase.from('events').select('id, organizer_id'),
      supabase.from('rsvps').select('id, email'),
    ]);

    const eventsList = eventsRes.data || [];
    const rsvpsList = rsvpsRes.data || [];

    let enriched = (profiles || []).map((p) => {
      const hostedCount = eventsList.filter((e) => e.organizer_id === p.id).length;
      const rsvpCount = rsvpsList.filter((r) => r.email?.toLowerCase() === p.email?.toLowerCase()).length;
      return {
        ...p,
        hosted_events_count: hostedCount,
        rsvps_count: rsvpCount,
      };
    });

    if (search) {
      enriched = enriched.filter(
        (p) =>
          p.name?.toLowerCase().includes(search) ||
          p.email?.toLowerCase().includes(search) ||
          p.handle?.toLowerCase().includes(search) ||
          p.id?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      users: enriched,
      total: enriched.length,
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

    // Only super admins can modify other user accounts
    if (!auth.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can edit user accounts' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, updates, password } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing user id or updates payload' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Fetch existing user state for audit log
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    const allowedFields = [
      'name',
      'email',
      'role',
      'handle',
      'bio',
      'logo_url',
      'brand_color',
      'brand_font',
      'phone',
      'onboarded',
    ];

    const sanitizedUpdates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    // 1. Update public.profiles
    const { data: updated, error: profileError } = await supabase
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 2. If password or email was changed, update auth.users
    if (password || sanitizedUpdates.email) {
      try {
        const authUpdates: Record<string, any> = {};
        if (password && password.trim().length >= 6) {
          authUpdates.password = password.trim();
        }
        if (sanitizedUpdates.email && sanitizedUpdates.email !== existing?.email) {
          authUpdates.email = sanitizedUpdates.email;
        }
        if (Object.keys(authUpdates).length > 0) {
          await supabase.auth.admin.updateUserById(id, authUpdates);
        }
      } catch (authErr: any) {
        console.warn('[Admin] Auth user update warning:', authErr.message);
      }
    }

    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: 'USER_UPDATE',
      targetType: 'profile',
      targetId: id,
      metadata: {
        target_email: existing?.email,
        before: existing,
        after: sanitizedUpdates,
      },
    });

    return NextResponse.json({ success: true, user: updated });
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

    // Only super admins can delete user accounts
    if (!auth.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can delete user accounts' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing user id parameter' }, { status: 400 });
    }

    // Prevent self-deletion of current admin session
    if (id === auth.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own active super admin account' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Fetch existing profile for audit metadata
    const { data: existing } = await supabase
      .from('profiles')
      .select('email, name, role')
      .eq('id', id)
      .single();

    // 1. Delete from public.profiles
    const { error: profileDeleteErr } = await supabase.from('profiles').delete().eq('id', id);
    if (profileDeleteErr) {
      return NextResponse.json({ error: profileDeleteErr.message }, { status: 500 });
    }

    // 2. Delete from Supabase Auth
    try {
      await supabase.auth.admin.deleteUser(id);
    } catch (authErr: any) {
      console.warn('[Admin] Auth delete user warning:', authErr.message);
    }

    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: 'USER_DELETE',
      targetType: 'profile',
      targetId: id,
      metadata: {
        deleted_email: existing?.email || 'Unknown',
        deleted_name: existing?.name || 'Unknown',
        deleted_role: existing?.role || 'Unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Account for ${existing?.email || id} successfully deleted`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
