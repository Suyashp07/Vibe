import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeEmail, validateEmailInput } from '@/lib/emailValidation';
import { validateOtpCode } from '@/lib/otpService';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = [
  'suyashpandey@gmail.com',
  'pandeysuyash100@gmail.com',
  'swanikitechnologiesllm@gmail.com',
  'admin@swaniki.com',
  'admin@vibe.swaniki.com',
];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const code = (body.code || '').trim();
    const purpose = body.purpose || body.type || 'signup';
    const token = body.token || req.cookies.get('vibe_otp_token')?.value;

    const validation = validateEmailInput(email);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: { message: validation.error || 'Valid email address is required.' } },
        { status: 400 }
      );
    }

    if (!code || code.length !== 4) {
      return NextResponse.json(
        { error: { message: 'Please enter the complete 4-digit verification code.' } },
        { status: 400 }
      );
    }

    // 1. Validate the 4-digit code using OTP service
    const otpResult = validateOtpCode({
      email,
      code,
      purpose: purpose as any,
      token,
    });

    if (!otpResult.valid) {
      return NextResponse.json(
        { error: { message: otpResult.error || 'Invalid or expired verification code.' } },
        { status: 400 }
      );
    }

    const payload = otpResult.payload || {};
    const name = body.name || payload.name || email.split('@')[0];
    const password = body.password || payload.password;
    const role = body.role || payload.role || 'organizer';
    const isSuper = ADMIN_EMAILS.includes(email);
    const effectiveRole = isSuper ? 'super_admin' : role;
    const handle = (body.handle || payload.handle || name.toLowerCase().replace(/[^a-z0-9_]/g, '_')).slice(0, 30);

    const supabase = getAdminClient();

    // 2. Resolve or create user in Supabase Auth
    let userId: string | null = null;
    let authUser: any = null;

    try {
      const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      authUser = usersData?.users?.find(
        (u) => (u.email || '').toLowerCase() === email
      );

      if (authUser && authUser.id) {
        userId = authUser.id;
        // User exists: confirm email and update password if provided
        const updatePayload: any = {
          email_confirm: true,
          user_metadata: {
            ...authUser.user_metadata,
            name,
            role: effectiveRole,
            handle,
          },
        };
        if (password) {
          updatePayload.password = password;
        }
        await supabase.auth.admin.updateUserById(authUser.id, updatePayload);
      } else {
        // Create new user in Supabase with pre-confirmed email
        const tempPassword = password || `VibeSecure_${Date.now()}_!`;
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            name,
            role: effectiveRole,
            handle,
          },
        });

        if (createErr) {
          console.error('Supabase admin createUser error:', createErr);
        } else if (newUser?.user) {
          userId = newUser.user.id;
          authUser = newUser.user;
        }
      }
    } catch (authErr) {
      console.warn('Supabase auth operation warning:', authErr);
    }

    // Fallback ID if Supabase Auth table is offline
    if (!userId) {
      userId = `usr-${Date.now()}`;
    }

    // 3. Upsert profile in `profiles` table
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        email,
        name,
        role: effectiveRole,
        handle,
        brand_color: '#0A0A0A',
        brand_font: 'Inter',
        onboarded: true,
      });
    } catch (profErr) {
      console.warn('Profiles table upsert warning:', profErr);
    }

    // 4. Generate direct sign-in link / magic link data so client can instantly sign in
    let actionLink: string | null = null;
    try {
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });
      actionLink = linkData?.properties?.action_link || null;
    } catch {}

    const response = NextResponse.json({
      success: true,
      verified: true,
      user: {
        id: userId,
        email,
        name,
        role: effectiveRole,
        handle,
      },
      profile: {
        id: userId,
        email,
        name,
        role: effectiveRole,
        handle,
        brand_color: '#0A0A0A',
        brand_font: 'Inter',
        onboarded: true,
      },
      actionLink,
    });

    // Clear OTP cookie
    response.cookies.delete('vibe_otp_token');

    return response;
  } catch (error: any) {
    console.error('Verify OTP API Error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Internal server error while verifying code.' } },
      { status: 500 }
    );
  }
}
