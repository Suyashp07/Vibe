import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { normalizeEmail } from '@/lib/emailValidation';

export interface OtpRecord {
  code: string;
  email: string;
  purpose: 'signup' | 'signin' | 'rsvp' | 'magiclink';
  payload?: any;
  expiresAt: number; // epoch ms
  attempts: number;
}

// Global server memory store (persists across hot reloads in dev and warm lambda lifecycles)
const globalOtpStore = (global as any).__vibeOtpStore || new Map<string, OtpRecord>();
(global as any).__vibeOtpStore = globalOtpStore;

// Clean up expired OTPs periodically
function cleanupExpired() {
  const now = Date.now();
  for (const [key, record] of globalOtpStore.entries()) {
    if (record.expiresAt < now) {
      globalOtpStore.delete(key);
    }
  }
}

const OTP_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'vibe-secret-otp-salt-2026';
const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes validity

/**
 * Generate a cryptographically signed verification token
 * Enables stateless verification across serverless lambdas
 */
export function generateSignedToken(email: string, code: string, expiresAt: number, purpose: string): string {
  const cleanEmail = normalizeEmail(email);
  const data = `${cleanEmail}:${code}:${expiresAt}:${purpose}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');
  const payload = JSON.stringify({ email: cleanEmail, expiresAt, purpose, hmac });
  return Buffer.from(payload).toString('base64url');
}

/**
 * Verify HMAC of signed token with candidate code
 */
export function verifySignedToken(token: string, candidateCode: string): { valid: boolean; email?: string; purpose?: string; error?: string } {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    const { email, expiresAt, purpose, hmac } = JSON.parse(raw);

    if (!email || !expiresAt || !purpose || !hmac) {
      return { valid: false, error: 'Malformed verification token.' };
    }

    if (Date.now() > expiresAt) {
      return { valid: false, error: 'Verification code has expired. Please request a new code.' };
    }

    const expectedHmac = crypto
      .createHmac('sha256', OTP_SECRET)
      .update(`${email}:${candidateCode}:${expiresAt}:${purpose}`)
      .digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(hmac))) {
      return { valid: true, email, purpose };
    }

    return { valid: false, error: 'Incorrect verification code. Please check your email and try again.' };
  } catch (err: any) {
    return { valid: false, error: 'Invalid verification token.' };
  }
}

/**
 * Create a new 4-digit numeric OTP (1000 to 9999)
 */
export function create4DigitOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Issue and store a 4-digit OTP for an email address
 */
export async function issueOtp({
  email,
  purpose,
  payload,
  name,
}: {
  email: string;
  purpose: 'signup' | 'signin' | 'rsvp' | 'magiclink';
  payload?: any;
  name?: string;
}): Promise<{ success: boolean; token: string; code: string; error?: string }> {
  cleanupExpired();

  const cleanEmail = normalizeEmail(email);
  const code = create4DigitOtp();
  const expiresAt = Date.now() + OTP_TTL_MS;

  // 1. Store in memory map
  const storeKey = `${cleanEmail}:${purpose}`;
  globalOtpStore.set(storeKey, {
    code,
    email: cleanEmail,
    purpose,
    payload,
    expiresAt,
    attempts: 0,
  });

  // 2. Generate signed token
  const token = generateSignedToken(cleanEmail, code, expiresAt, purpose);

  // 3. Dispatch Email via Resend directly from verified events@vibe.swaniki.com
  const formattedCode = code.split('').join(' ');
  const greeting = name ? `Hi ${name},` : 'Hello,';
  let purposeDescription = 'Enter the 4-digit verification code below to verify your email on Vibe:';

  if (purpose === 'signup') {
    purposeDescription = 'Welcome to Vibe! Enter the 4-digit verification code below to complete your registration:';
  } else if (purpose === 'signin') {
    purposeDescription = 'Enter the 4-digit verification code below to securely sign in to your Vibe account:';
  } else if (purpose === 'rsvp') {
    purposeDescription = 'Enter the 4-digit verification code below to confirm your spot:';
  }

  const emailRes = await sendEmail({
    to: cleanEmail,
    subject: `Your Vibe Verification Code: ${code} 🎟️`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; margin: 0; padding: 24px 12px; }
    .card { max-width: 480px; margin: 0 auto; background: #121214; border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; padding: 36px 28px; text-align: center; }
    .brand { font-size: 26px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px; }
    .dot { color: #FF5500; }
    .subhead { color: #94A3B8; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; margin-bottom: 24px; }
    .title { font-size: 22px; font-weight: 900; color: #FFFFFF; margin: 0 0 10px 0; }
    .desc { color: #CBD5E1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
    .otp-box { background: rgba(255, 85, 0, 0.08); border: 2px dashed rgba(255, 85, 0, 0.45); border-radius: 16px; padding: 20px 24px; margin: 24px 0; display: inline-block; min-width: 220px; }
    .otp-code { font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #FF5500; padding-left: 12px; }
    .notice { font-size: 13px; color: #94A3B8; margin-top: 10px; }
    .footer { font-size: 12px; color: #64748B; margin-top: 28px; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">vibe<span class="dot">.</span></div>
    <div class="subhead">BY SWANIKI</div>
    <h1 class="title">Verification Code</h1>
    <p class="desc">${greeting} ${purposeDescription}</p>
    <div class="otp-box">
      <div class="otp-code">${code}</div>
    </div>
    <p class="notice">This code is valid for <strong>15 minutes</strong>.</p>
    <p class="footer">If you did not request this code, you can safely ignore this email.</p>
  </div>
</body>
</html>
    `,
  });

  if (!emailRes.success && !emailRes.simulated) {
    return {
      success: false,
      token,
      code,
      error: emailRes.error || 'Failed to dispatch verification email. Please check your email address.',
    };
  }

  return { success: true, token, code };
}

/**
 * Validate candidate 4-digit code
 * Checks both in-memory store and cryptographically signed token
 */
export function validateOtpCode({
  email,
  code,
  purpose,
  token,
}: {
  email: string;
  code: string;
  purpose: 'signup' | 'signin' | 'rsvp' | 'magiclink';
  token?: string;
}): { valid: boolean; payload?: any; error?: string } {
  cleanupExpired();

  const cleanEmail = normalizeEmail(email);
  const cleanCode = (code || '').trim().replace(/\D/g, '');

  if (cleanCode.length !== 4) {
    return { valid: false, error: 'Please enter the complete 4-digit verification code.' };
  }

  // 1. Try memory store first
  const storeKey = `${cleanEmail}:${purpose}`;
  const record = globalOtpStore.get(storeKey);

  if (record) {
    if (Date.now() > record.expiresAt) {
      globalOtpStore.delete(storeKey);
      return { valid: false, error: 'Verification code has expired. Please request a new code.' };
    }

    if (record.attempts >= 5) {
      globalOtpStore.delete(storeKey);
      return { valid: false, error: 'Too many incorrect attempts. Please request a new code.' };
    }

    if (record.code === cleanCode) {
      const payload = record.payload;
      globalOtpStore.delete(storeKey);
      return { valid: true, payload };
    } else {
      record.attempts += 1;
      return { valid: false, error: 'Incorrect verification code. Please check your email and try again.' };
    }
  }

  // 2. Fallback to signed token verification
  if (token) {
    const tokenResult = verifySignedToken(token, cleanCode);
    if (tokenResult.valid) {
      return { valid: true };
    }
    return { valid: false, error: tokenResult.error || 'Invalid or expired verification code.' };
  }

  return { valid: false, error: 'Verification code has expired or is invalid. Please request a new code.' };
}

