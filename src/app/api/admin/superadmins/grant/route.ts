import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyStaffSession } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { ADMIN_EMAILS, PRIMARY_FOUNDERS, getImmutableAdmin, DEPRECATED_ADMIN_EMAILS } from '@/lib/adminConstants';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

// In-memory registry of dynamically granted superadmins
declare global {
  var __vibeDynamicSuperAdmins: Set<string> | undefined;
}

if (!global.__vibeDynamicSuperAdmins) {
  global.__vibeDynamicSuperAdmins = new Set<string>();
}

const dynamicSuperAdmins = global.__vibeDynamicSuperAdmins;

/**
 * POST /api/admin/superadmins/grant
 * Elevates an email address to Super Admin
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    if (!auth.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Administrators can grant superadmin privileges' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const email = body.email ? String(body.email).toLowerCase().trim() : '';
    const notes = body.notes ? String(body.notes).trim() : 'Granted via Vibe Admin Analytics Module';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    if (DEPRECATED_ADMIN_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: 'Forbidden: This account has been deprecated and cannot be granted administrative privileges' },
        { status: 403 }
      );
    }

    const supabase = getAdminClient();

    let updatedInDb = false;
    let existingProfile: any = null;

    // 1. Update or create profile in Supabase profiles table
    try {
      const { data: foundProfile } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .eq('email', email)
        .maybeSingle();

      existingProfile = foundProfile;

      if (existingProfile) {
        // Elevate existing profile to super_admin (Note: profiles has no updated_at column)
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ role: 'super_admin' })
          .eq('id', existingProfile.id);

        if (!updateErr) updatedInDb = true;
      } else {
        // Pre-create profile as super_admin so on first login they are immediately recognized
        const { error: insertErr } = await supabase
          .from('profiles')
          .insert({
            id: `usr_${Date.now()}`,
            email,
            name: email.split('@')[0],
            role: 'super_admin',
            onboarded: true,
            brand_color: '#0A0A0A',
            brand_font: 'Inter',
          });
        if (!insertErr) updatedInDb = true;
      }
    } catch (profErr) {
      console.warn('[Grant Superadmin] Profile update warning:', profErr);
    }

    // 2. Synchronize Supabase auth.users metadata if user already registered
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const matchedUser = usersData?.users?.find(
        (u) => (u.email || '').toLowerCase() === email
      );
      if (matchedUser) {
        await supabase.auth.admin.updateUserById(matchedUser.id, {
          user_metadata: {
            ...matchedUser.user_metadata,
            role: 'super_admin',
          },
        });
      }
    } catch (authSyncErr) {
      console.warn('[Grant Superadmin] Auth user metadata sync warning:', authSyncErr);
    }

    // 2. Add to dynamic in-memory registry
    dynamicSuperAdmins.add(email);

    // 3. Persist grant to superadmin_grants table if available
    try {
      await supabase.from('superadmin_grants').upsert({
        email,
        granted_by: auth.user.email,
        notes,
        created_at: new Date().toISOString(),
      }, { onConflict: 'email' });
    } catch {
      // Table may not exist yet, handled gracefully
    }

    // 4. Log immutable security audit event
    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: 'grant_superadmin',
      targetType: 'profile',
      targetId: existingProfile?.id || email,
      metadata: {
        targetEmail: email,
        notes,
        updatedInDb,
        grantedBy: auth.user.email,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Superadmin privileges successfully granted to ${email}`,
      email,
      updatedInDb,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/superadmins/grant
 * Revokes superadmin privileges for an email address
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    if (!auth.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Administrators can revoke superadmin privileges' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Protection rule: Cannot revoke immutable administrator accounts (Developer Admin / Owner Admin)
    if (PRIMARY_FOUNDERS.includes(email) || getImmutableAdmin(email)) {
      return NextResponse.json(
        { error: 'Protected Account: Immutable administrators (Developer Admin / Owner Admin) cannot be revoked' },
        { status: 403 }
      );
    }

    // Prevent self-revocation
    if (email === auth.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'Action Denied: You cannot revoke your own superadmin privileges' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // 1. Downgrade in profiles table to organizer (Note: profiles has no updated_at column)
    await supabase
      .from('profiles')
      .update({ role: 'organizer' })
      .eq('email', email);

    // 2. Synchronize auth.users metadata if registered
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const matchedUser = usersData?.users?.find(
        (u) => (u.email || '').toLowerCase() === email
      );
      if (matchedUser) {
        await supabase.auth.admin.updateUserById(matchedUser.id, {
          user_metadata: {
            ...matchedUser.user_metadata,
            role: 'organizer',
          },
        });
      }
    } catch {}

    // 2. Remove from dynamic in-memory set
    dynamicSuperAdmins.delete(email);

    // 3. Remove from superadmin_grants if exists
    try {
      await supabase.from('superadmin_grants').delete().eq('email', email);
    } catch {}

    // 4. Log audit event
    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: 'revoke_superadmin',
      targetType: 'profile',
      targetId: email,
      metadata: {
        targetEmail: email,
        revokedBy: auth.user.email,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Superadmin privileges revoked for ${email}`,
      email,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
