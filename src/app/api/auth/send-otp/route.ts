import { NextRequest, NextResponse } from 'next/server';
import { validateEmailInput, normalizeEmail } from '@/lib/emailValidation';
import { issueOtp } from '@/lib/otpService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const purpose = body.purpose || body.type || 'magiclink';
    const name = body.name;

    const validation = validateEmailInput(email);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: { message: validation.error || 'Valid email address is required.' } },
        { status: 400 }
      );
    }

    // Issue 4-Digit Verification Code directly via Resend (events@vibe.swaniki.com)
    const otpRes = await issueOtp({
      email,
      purpose: purpose as any,
      name,
      payload: body.payload,
    });

    if (!otpRes.success) {
      return NextResponse.json(
        { error: { message: otpRes.error || 'Failed to send verification code. Please check your email and try again.' } },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      needsOtp: true,
      email,
      message: `4-digit verification code sent to ${email}`,
    });

    response.cookies.set('vibe_otp_token', otpRes.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Send OTP API error:', err);
    return NextResponse.json(
      { error: { message: err.message || 'Failed to dispatch verification code.' } },
      { status: 500 }
    );
  }
}
