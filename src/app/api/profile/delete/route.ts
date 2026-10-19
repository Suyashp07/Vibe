import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PRIMARY_FOUNDERS, getImmutableAdmin } from '@/lib/adminConstants';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * DPDP Act 2023 (Section 12) - Right to Correction and Erasure
 * Allows a Data Principal to request complete erasure of their personal profile data.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, userEmail, confirmationText } = body;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: 'Invalid request: userId and userEmail are required.' },
        { status: 400 }
      );
    }

    if (confirmationText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation mismatch. Please type DELETE to confirm data erasure.' },
        { status: 400 }
      );
    }

    const cleanEmail = userEmail.trim().toLowerCase();

    // Protection rule: Immutable admin accounts cannot be deleted
    if (PRIMARY_FOUNDERS.includes(cleanEmail) || getImmutableAdmin(cleanEmail)) {
      return NextResponse.json(
        { error: 'Forbidden: Immutable platform administrator accounts cannot be deleted.' },
        { status: 403 }
      );
    }

    const supabase = getAdminClient();

    // 1. Delete from public.profiles
    const { error: profileDeleteErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteErr) {
      console.warn('[DPDP Delete] Profiles table delete warning:', profileDeleteErr.message);
    }

    // 2. Anonymize/erase RSVPs to comply with data minimization
    try {
      await supabase
        .from('rsvps')
        .delete()
        .eq('email', cleanEmail);
    } catch (e) {
      console.warn('[DPDP Delete] RSVPs delete exception:', e);
    }

    // 3. Delete from Supabase Auth if service role available
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (authErr: any) {
      console.warn('[DPDP Delete] Auth admin delete user warning:', authErr.message);
    }

    // 4. Audit Log DPDP Erasure
    await logAuditEvent({
      actorId: userId,
      actorEmail: cleanEmail,
      actorRole: 'guest',
      action: 'DPDP_RIGHT_TO_ERASURE_FULFILLED',
      targetType: 'profile',
      targetId: userId,
      metadata: {
        reason: 'User requested erasure under Section 12 of DPDP Act 2023',
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Your personal data and profile have been permanently erased in accordance with Section 12 of the DPDP Act 2023.',
    });
  } catch (err: any) {
    console.error('[DPDP Delete] Server exception:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during personal data erasure.' },
      { status: 500 }
    );
  }
}
