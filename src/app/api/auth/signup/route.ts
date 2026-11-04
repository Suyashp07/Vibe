import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateEmailInput, normalizeEmail } from '@/lib/emailValidation';
import { issueOtp } from '@/lib/otpService';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const password = (body.password || '').trim();
    const name = (body.name || '').trim();
    const role = body.role || 'organizer';
    const handle = (body.handle || name.toLowerCase().replace(/[^a-z0-9_]/g, '_')).slice(0, 30);

    // 1. Validation
    const validation = validateEmailInput(email);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: {
            message: validation.error || 'Valid email is required',
            suggestion: validation.suggestion?.suggestedEmail,
          },
        },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          error: { message: 'Password must be at least 6 characters long.' },
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: { message: 'Please enter your full name.' },
        },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // 2. Pre-check if email already exists in profiles or auth.users
    try {
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', email)
        .limit(1);

      if (existingProfiles && existingProfiles.length > 0) {
        return NextResponse.json(
          {
            error: {
              message: 'An account with this email already exists. Please sign in instead.',
              code: 'USER_EXISTS',
            },
          },
          { status: 409 }
        );
      }

      const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const matched = usersData?.users?.find(
        (u) => (u.email || '').toLowerCase() === email
      );

      if (matched) {
        return NextResponse.json(
          {
            error: {
              message: 'An account with this email already exists. Please sign in instead.',
              code: 'USER_EXISTS',
            },
          },
          { status: 409 }
        );
      }
    } catch (checkErr) {
      console.warn('Pre-signup check error:', checkErr);
    }

    // 3. Issue 4-Digit Verification Code directly via Resend (events@vibe.swaniki.com)
    const otpRes = await issueOtp({
      email,
      purpose: 'signup',
      name,
      payload: {
        password,
        name,
        role,
        handle,
      },
    });

    if (!otpRes.success) {
      return NextResponse.json(
        {
          error: { message: otpRes.error || 'Failed to dispatch verification email. Please check your email and try again.' },
        },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      needsOtp: true,
      email,
      message: `4-digit verification code sent to ${email}`,
    });

    // Store signed token in HTTP-only cookie for verification fallback
    response.cookies.set('vibe_otp_token', otpRes.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 mins
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Signup API error:', err);
    return NextResponse.json(
      {
        error: { message: err.message || 'Internal server error while processing signup.' },
      },
      { status: 500 }
    );
  }
}
