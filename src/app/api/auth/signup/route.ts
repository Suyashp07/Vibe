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

    // 3. Create user via Supabase Admin API with email_confirm: true
    // This directly creates and confirms the user in auth.users, eliminating Supabase's failing/rate-limited built-in SMTP!
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        handle,
      },
    });

    if (createError) {
      if (
        createError.message?.toLowerCase().includes('already registered') ||
        createError.message?.toLowerCase().includes('already exists')
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
          error: { message: createError.message || 'Failed to create user account.' },
        },
        { status: 500 }
      );
    }

    const newUser = userData?.user;
    if (!newUser) {
      return NextResponse.json(
        {
          error: { message: 'User could not be created.' },
        },
        { status: 500 }
      );
    }

    // 4. Ensure profile row exists in public.profiles
    const isSuper = ADMIN_EMAILS.includes(email);

    try {
      await supabase.from('profiles').upsert({
        id: newUser.id,
        email,
        name,
        role: isSuper ? 'super_admin' : role,
        handle,
        brand_color: '#0A0A0A',
        brand_font: 'Inter',
        onboarded: role === 'guest',
      });
    } catch (upsertErr) {
      console.warn('Profile upsert warning:', upsertErr);
    }

    // 5. Dispatch welcome email in the background via Resend / SMTP (identical to pass delivery)
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/+$/, '');
    sendEmail({
      to: email,
      subject: `Welcome to Vibe, ${name}! 🎉`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; margin: 0; padding: 24px; }
    .card { max-width: 540px; margin: 0 auto; background: #121214; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 36px 32px; }
    .brand { font-size: 26px; font-weight: 900; color: #FFFFFF; }
    .dot { color: #FF5500; }
    .btn { display: inline-block; background-color: #FF5500; color: #FFFFFF !important; padding: 12px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">vibe<span class="dot">.</span></div>
    <p style="color: #94A3B8; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">BY SWANIKI</p>
    <h2 style="color: #FFFFFF; margin-top: 24px;">Welcome, ${name}!</h2>
    <p style="color: #CBD5E1; line-height: 1.6; font-size: 14px;">Your Vibe account is ready. You can now host gatherings, collect RSVPs, and discover exclusive boutique events across India.</p>
    <a href="${appUrl}/dashboard" class="btn">Go to Host Dashboard</a>
  </div>
</body>
</html>
      `,
    }).catch((emailErr) => console.warn('[Signup Resend Email Warning]:', emailErr));

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name,
          role: isSuper ? 'super_admin' : role,
          handle,
        },
      },
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

