import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateEmailInput, normalizeEmail } from '@/lib/emailValidation';
import { sendEmail } from '@/lib/email';

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

    // 3. Generate Link with 6-Digit OTP via Supabase Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: {
          name,
          role,
          handle,
        },
      },
    });

    if (linkError) {
      if (
        linkError.message?.toLowerCase().includes('already registered') ||
        linkError.message?.toLowerCase().includes('already exists')
      ) {
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
      return NextResponse.json(
        {
          error: { message: linkError.message || 'Failed to initialize account registration.' },
        },
        { status: 500 }
      );
    }

    const otpCode = linkData?.properties?.email_otp;
    if (!otpCode) {
      return NextResponse.json(
        {
          error: { message: 'Could not generate verification code. Please try again.' },
        },
        { status: 500 }
      );
    }

    // 4. Send the 6-Digit OTP Verification Email directly via Resend (verified events@vibe.swaniki.com)
    await sendEmail({
      to: email,
      subject: `Your Vibe Verification Code: ${otpCode} 🎟️`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; margin: 0; padding: 24px 12px; }
    .card { max-width: 500px; margin: 0 auto; background: #121214; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 36px 28px; text-align: center; }
    .brand { font-size: 26px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px; }
    .dot { color: #FF5500; }
    .subhead { color: #94A3B8; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; margin-bottom: 24px; }
    .title { font-size: 22px; font-weight: 900; color: #FFFFFF; margin: 0 0 10px 0; }
    .desc { color: #CBD5E1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
    .otp-box { background: rgba(255, 85, 0, 0.08); border: 2px dashed rgba(255, 85, 0, 0.4); border-radius: 14px; padding: 18px 24px; margin: 24px 0; display: inline-block; }
    .otp-code { font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #FF5500; }
    .footer { font-size: 12px; color: #64748B; margin-top: 24px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">vibe<span class="dot">.</span></div>
    <div class="subhead">BY SWANIKI</div>
    <h1 class="title">Verification Code</h1>
    <p class="desc">Hi ${name}, welcome to Vibe! Enter the 6-digit verification code below to complete your registration:</p>
    <div class="otp-box">
      <div class="otp-code">${otpCode}</div>
    </div>
    <p class="desc" style="font-size: 13px; color: #94A3B8;">This code is valid for 15 minutes.</p>
    <p class="footer">If you did not request this verification, you can safely ignore this email.</p>
  </div>
</body>
</html>
      `,
    });

    return NextResponse.json({
      success: true,
      needsOtp: true,
      email,
    });
  } catch (err: any) {
    console.error('Signup API error:', err);
    return NextResponse.json(
      {
        error: { message: err.message || 'Internal server error during registration.' },
      },
      { status: 500 }
    );
  }
}

