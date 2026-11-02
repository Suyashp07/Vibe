import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateEmailInput, normalizeEmail } from '@/lib/emailValidation';
import { sendEmail } from '@/lib/email';

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
    const type = body.type || 'magiclink'; // 'signup' | 'magiclink' | 'recovery'
    const password = body.password || 'VibeTempPass123!';

    const validation = validateEmailInput(email);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: { message: validation.error || 'Valid email address is required.' } },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    let otpCode: string | null = null;

    // Try generating the link matching the requested type
    if (type === 'signup') {
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
      });

      if (!linkErr && linkData?.properties?.email_otp) {
        otpCode = linkData.properties.email_otp;
      } else {
        // Fall back to magiclink if user is already in the system
        const { data: mlData, error: mlErr } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email,
        });
        if (!mlErr && mlData?.properties?.email_otp) {
          otpCode = mlData.properties.email_otp;
        }
      }
    } else {
      const { data: mlData, error: mlErr } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });
      if (!mlErr && mlData?.properties?.email_otp) {
        otpCode = mlData.properties.email_otp;
      }
    }

    if (!otpCode) {
      return NextResponse.json(
        { error: { message: 'Could not generate verification code. Please check your email or try password sign-in.' } },
        { status: 500 }
      );
    }

    // Send the OTP via Resend
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
    <p class="desc">Enter the verification code below to verify your email on Vibe:</p>
    <div class="otp-box">
      <div class="otp-code">${otpCode}</div>
    </div>
    <p class="desc" style="font-size: 13px; color: #94A3B8;">This code is valid for 15 minutes.</p>
    <p class="footer">If you did not request this verification code, you can safely ignore this email.</p>
  </div>
</body>
</html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
    });
  } catch (err: any) {
    console.error('[send-otp error]:', err);
    return NextResponse.json(
      { error: { message: err.message || 'Failed to send verification code.' } },
      { status: 500 }
    );
  }
}

