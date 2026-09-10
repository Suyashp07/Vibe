'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Building2,
  Ticket,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AtSign,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import {
  signUpWithEmailOtp,
  verifyEmailOtp,
  signUpWithPassword,
  useAuth
} from '@/lib/auth';
import { isSupabaseConfigured, getSupabaseClient } from '@/lib/supabase';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const redirectParam = searchParams.get('redirect');
  const modeParam = searchParams.get('mode');

  const { isLoggedIn, profile } = useAuth();

  const [authMode, setAuthMode] = useState<'password' | 'otp'>(
    modeParam === 'otp' ? 'otp' : 'password'
  );
  const [role, setRole] = useState<'organizer' | 'guest'>(
    roleParam === 'guest' ? 'guest' : 'organizer'
  );

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [handle, setHandle] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isConnected = isSupabaseConfigured();

  // Auto handle suggestion based on name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!handle || handle === name.toLowerCase().replace(/[^a-z0-9_]/g, '_')) {
      setHandle(val.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24));
    }
  };

  // Method 1: Password Sign Up
  const handlePasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Pre-check if handle is already taken by another organizer
    if (role === 'organizer' && handle.trim()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: existingProf } = await client
            .from('profiles')
            .select('email')
            .eq('handle', handle.trim().toLowerCase())
            .maybeSingle();

          if (existingProf && existingProf.email !== email.trim().toLowerCase()) {
            setLoading(false);
            setErrorMessage(`The handle "@${handle.trim()}" is already claimed by another organizer. Please choose a different handle.`);
            return;
          }
        } catch {}
      }
    }

    const { data, error } = await signUpWithPassword(
      email.trim(),
      password,
      name.trim(),
      role,
      role === 'organizer' ? handle.trim() : undefined
    );

    setLoading(false);
    if (error) {
      if (error.message?.includes('User already registered')) {
        setErrorMessage('An account with this email already exists. Please sign in with your password or use Email OTP.');
      } else {
        setErrorMessage(error.message || 'Failed to create account. Please try again.');
      }
    } else {
      if (role === 'organizer') {
        router.push('/onboarding');
      } else {
        router.push(redirectParam || '/guest');
      }
    }
  };

  // Method 2: Step 1 - Send OTP for signup
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Pre-check if handle is already taken by another organizer
    if (role === 'organizer' && handle.trim()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data: existingProf } = await client
            .from('profiles')
            .select('email')
            .eq('handle', handle.trim().toLowerCase())
            .maybeSingle();

          if (existingProf && existingProf.email !== email.trim().toLowerCase()) {
            setLoading(false);
            setErrorMessage(`The handle "@${handle.trim()}" is already claimed by another organizer. Please choose a different handle (e.g. @${handle.trim()}_2).`);
            return;
          }
        } catch {}
      }
    }

    const { error } = await signUpWithEmailOtp(
      email.trim(),
      name.trim(),
      role,
      role === 'organizer' ? handle.trim() : undefined
    );

    setLoading(false);
    if (error) {
      if (error.message?.includes('Database error saving new user')) {
        setErrorMessage(`The handle "@${handle.trim()}" is already claimed by another organizer. Please choose a different handle (e.g. @${handle.trim()}_2).`);
      } else if (error.message?.includes('Error sending confirmation email')) {
        setErrorMessage('Failed to send confirmation email: If using Resend with onboarding@resend.dev, Resend only allows sending to your account email (pandeysuyash100@gmail.com). To send to other emails, verify a domain in Resend or use Gmail SMTP in Supabase.');
      } else {
        setErrorMessage(error.message || 'Failed to initiate signup. Please check your email.');
      }
    } else {
      setStep('otp');
      setOtpToken('');
      setSuccessMessage(`We sent a verification code to ${email.trim()}`);
    }
  };

  // Method 2: Step 2 - Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    const { error } = await verifyEmailOtp(email.trim(), otpToken.trim(), role);

    setLoading(false);
    if (error) {
      setErrorMessage(error.message || 'Invalid or expired verification code. Please check your email and try again.');
    } else {
      if (role === 'organizer') {
        router.push('/onboarding');
      } else {
        router.push(redirectParam || '/guest');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />

      <main className="flex-1 max-w-md mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center w-full">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand text-gold mx-auto flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-ink">
            Create Your Account
          </h1>
          <p className="text-xs text-ink-secondary max-w-sm mx-auto">
            India-first whitelabel event platform. 100% free to host in v1.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-elevated space-y-6">
          {/* Auth Method Selector Tabs: Password vs Email OTP */}
          <div className="grid grid-cols-2 gap-1 bg-surface-2 p-1 rounded-xl border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'password'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Password Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authMode === 'otp'
                  ? 'bg-brand text-white shadow-xs'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Email OTP (Passwordless)
            </button>
          </div>

          {/* Role Switcher */}
          {(authMode === 'password' || step === 'details') && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-2 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setRole('organizer')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  role === 'organizer'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-3'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Host / Organizer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('guest')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  role === 'guest'
                    ? 'bg-accent text-white shadow-xs'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-3'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Guest / Attendee</span>
              </button>
            </div>
          )}

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: PASSWORD SIGN UP FORM */}
          {/* ========================================================= */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  {role === 'organizer' ? 'Organizer / Brand Name *' : 'Full Name *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={role === 'organizer' ? 'e.g. Koramangala Tech Club' : 'e.g. Aarav Mehta'}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-input border border-border bg-surface focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {role === 'organizer' && (
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">
                    Your Profile URL Handle *
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="e.g. techclub"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-input border border-border bg-surface font-mono focus:outline-none focus:border-accent"
                    />
                  </div>
                  <p className="text-[10px] text-ink-muted mt-1">
                    Your public page will be: <span className="text-accent font-mono font-semibold">/{handle || 'handle'}</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-input border border-border bg-surface focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">
                  Set Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-input border border-border bg-surface focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-ink-muted mt-1">
                  Minimum 6 characters. You will use this password to sign in later.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim() || !email.trim() || password.length < 6}
                className="w-full py-2.5 px-4 rounded-btn bg-brand hover:bg-brand-mid text-white font-bold text-xs shadow-xs hover-lift transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Set Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: EMAIL OTP (PASSWORDLESS) FLOW */}
          {/* ========================================================= */}
          {authMode === 'otp' && (
            <>
              {step === 'details' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1">
                      {role === 'organizer' ? 'Organizer / Brand Name *' : 'Full Name *'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder={role === 'organizer' ? 'e.g. Koramangala Tech Club' : 'e.g. Aarav Mehta'}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-input border border-border bg-surface focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  {role === 'organizer' && (
                    <div>
                      <label className="block text-xs font-semibold text-ink-secondary mb-1">
                        Your Profile URL Handle *
                      </label>
                      <div className="relative">
                        <AtSign className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={handle}
                          onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          placeholder="e.g. techclub"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-input border border-border bg-surface font-mono focus:outline-none focus:border-accent"
                        />
                      </div>
                      <p className="text-[10px] text-ink-muted mt-1">
                        Your public page will be: <span className="text-accent font-mono font-semibold">/{handle || 'handle'}</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-input border border-border bg-surface focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !name.trim() || !email.trim()}
                    className="w-full py-2.5 px-4 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-xs hover-lift transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send 6-Digit Verification Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* STEP 2: Email Verification */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-ink-secondary">
                        Enter Verification Code
                      </label>
                      <span className="text-[10px] text-accent font-mono font-bold">
                        Code sent to {email}
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 text-center tracking-[0.35em] font-mono text-base font-bold rounded-input border border-border bg-surface focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                      <span>Enter the code from your email (6–8 digits)</span>
                    </div>
                  </div>

                  {/* Spam Folder Alert Hint */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-left">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-900 leading-relaxed">
                      <span className="font-bold block text-amber-950">Can&apos;t find the verification email?</span>
                      Please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder — OTP emails sometimes land there.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-center space-y-1">
                    <p className="text-xs font-semibold text-ink">
                      ⚡ 1-Click Sign In Also Available
                    </p>
                    <p className="text-[11px] text-ink-secondary">
                      You can also click the <strong>Sign-in link</strong> in the email sent to <span className="font-semibold text-ink">{email}</span>!
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpToken.length < 6}
                    className="w-full py-2.5 px-4 rounded-btn bg-brand hover:bg-brand-mid text-white font-bold text-xs shadow-xs hover-lift transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Verify & Continue {role === 'organizer' ? 'to Brand Setup →' : '→'}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('details');
                        setErrorMessage(null);
                      }}
                      className="text-[11px] text-ink-muted hover:text-ink font-semibold"
                    >
                      ← Change Email
                    </button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-[11px] text-accent hover:underline font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend Code</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <div className="text-center pt-2">
            <span className="text-[11px] text-ink-muted">
              By signing up, you agree to Vibe by Swaniki&apos;s community guidelines.
            </span>
          </div>
        </div>

        {/* Footer switch to login */}
        <p className="text-center text-xs text-ink-muted mt-6">
          Already have an account?{' '}
          <Link
            href={`/login?role=${role}&mode=${authMode}${redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ''}`}
            className="text-accent font-bold hover:underline"
          >
            Sign In {authMode === 'password' ? 'with Password' : 'with Email OTP'} →
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-2">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
