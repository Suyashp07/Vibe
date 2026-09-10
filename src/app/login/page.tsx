'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Ticket,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import {
  sendEmailOtp,
  verifyEmailOtp,
  signInWithPassword,
  signUpWithPassword,
  useAuth
} from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const roleParam = searchParams.get('role');
  const modeParam = searchParams.get('mode');

  const { isLoggedIn, isOrganizer } = useAuth();

  const [authMode, setAuthMode] = useState<'otp' | 'password'>(
    modeParam === 'password' ? 'password' : 'otp'
  );
  const [role, setRole] = useState<'organizer' | 'guest'>(
    roleParam === 'guest' ? 'guest' : 'organizer'
  );
  const [isSignUp, setIsSignUp] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isConnected = isSupabaseConfigured();

  const destination = redirectParam || (role === 'organizer' ? '/dashboard' : '/guest');

  // 1. Send OTP / Magic Link
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await sendEmailOtp(email.trim(), role);

    setLoading(false);
    if (error) {
      if (error.message?.includes('Error sending confirmation email')) {
        setErrorMessage('Failed to send verification email: If using Resend with onboarding@resend.dev, Resend only allows sending to your account email (pandeysuyash100@gmail.com). To send to other emails, verify a domain in Resend or use Gmail SMTP in Supabase.');
      } else {
        setErrorMessage(error.message || 'Failed to send verification code. Please check your email.');
      }
    } else {
      setOtpSent(true);
      setOtpToken('');
      setSuccessMessage(`We sent a 6-digit verification code to ${email.trim()}. If you don't see it in your inbox, please check your Spam or Junk folder!`);
    }
  };

  // 2. Verify OTP
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
      router.push(destination);
    }
  };

  // 3. Password Sign In / Up
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    if (isSignUp) {
      const { error } = await signUpWithPassword(
        email.trim(),
        password,
        name.trim() || email.split('@')[0],
        role
      );
      setLoading(false);
      if (error) {
        setErrorMessage(error.message);
      } else {
        router.push(destination);
      }
    } else {
      const { error } = await signInWithPassword(email.trim(), password);
      setLoading(false);
      if (error) {
        setErrorMessage(error.message);
      } else {
        router.push(destination);
      }
    }
  };

  return (
    <div className="max-w-md w-full bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-elevated space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-brand text-gold mx-auto flex items-center justify-center shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="font-display font-black text-2xl text-ink">
          {redirectParam === '/create' ? 'Host Sign In Required' : 'Welcome to Vibe'}
        </h1>
        <p className="text-xs text-ink-muted">
          {redirectParam === '/create'
            ? 'Please sign in with your organizer account to create and publish events.'
            : 'Whitelabel event platform for Indian creators, founders, and curators.'}
        </p>

        {/* Supabase Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-border text-[11px] text-ink-secondary">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{isConnected ? 'Supabase Auth Connected' : 'Supabase Auth Ready'}</span>
        </div>
      </div>

      {/* Auth Method Tabs */}
      <div className="grid grid-cols-2 gap-1 bg-surface-2 p-1 rounded-xl border border-border text-xs font-semibold">
        <button
          type="button"
          onClick={() => { setAuthMode('otp'); setErrorMessage(null); }}
          className={`py-2 rounded-lg transition-all ${
            authMode === 'otp'
              ? 'bg-brand text-white shadow-xs'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          Email OTP
        </button>
        <button
          type="button"
          onClick={() => { setAuthMode('password'); setErrorMessage(null); }}
          className={`py-2 rounded-lg transition-all ${
            authMode === 'password'
              ? 'bg-brand text-white shadow-xs'
              : 'text-ink-secondary hover:text-ink'
          }`}
        >
          Password
        </button>
      </div>

      {/* Role Selector (for OTP and Password) */}
      <div className="grid grid-cols-2 gap-2 bg-surface-2 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setRole('organizer')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              role === 'organizer'
                ? 'bg-surface text-accent shadow-xs border border-border'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Host / Organizer</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('guest')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              role === 'guest'
                ? 'bg-surface text-accent shadow-xs border border-border'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Guest Attendee</span>
          </button>
        </div>

      {/* Error / Success Messages */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. EMAIL OTP WORKFLOW (Master Prompt Specification) */}
      {authMode === 'otp' && (
        <div>
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'organizer' ? 'organizer@yourbrand.com' : 'guest@example.com'}
                    className="w-full text-xs font-medium pl-9 pr-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-ink-muted mt-1">
                  We will send a 6-digit verification code to your inbox. No password needed.
                </p>
                <div className="mt-2.5 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-900 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>💡 <strong>Quick Note:</strong> The OTP email might land in your <strong>Spam</strong> or <strong>Promotions</strong> folder.</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-sm hover-lift disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span>Sending 6-Digit Code...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-ink-muted block text-[10px] uppercase font-bold">Sent To</span>
                  <span className="font-semibold text-ink">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpToken(''); setErrorMessage(null); }}
                  className="text-accent text-xs font-semibold hover:underline"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                  Enter Verification Code *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••••"
                    className="w-full text-center text-lg font-mono tracking-[0.35em] pl-9 pr-3.5 py-2 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-ink-muted">
                  <span>Enter the code from your email (6–8 digits)</span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="text-accent hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" /> Resend Code
                  </button>
                </div>
              </div>

              {/* Spam Folder Alert Hint */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-left">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-900 leading-relaxed">
                  <span className="font-bold block text-amber-950">Can&apos;t find the verification email?</span>
                  Please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder — OTP verification emails often get filtered there by mail providers.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-center space-y-1">
                <p className="text-xs font-semibold text-ink">
                  ⚡ 1-Click Sign In Also Available
                </p>
                <p className="text-[11px] text-ink-secondary">
                  You can also simply click the <strong>Sign-in link</strong> in the email sent to <span className="font-semibold text-ink">{email}</span> to sign in immediately!
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otpToken.length < 6}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-sm hover-lift disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <span>Verify Code & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 2. PASSWORD VIEW */}
      {authMode === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Singhania"
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full text-xs font-medium pl-9 pr-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1.5">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs font-medium pl-9 pr-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-sm hover-lift disabled:opacity-50 transition-all"
          >
            {loading ? (
              <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Vibe Account' : 'Sign In with Password'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-accent hover:underline font-semibold"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up free'}
            </button>
          </div>
        </form>
      )}

      {/* Sign Up Alternative */}
      <div className="pt-4 border-t border-border text-center space-y-3">
        <p className="text-xs text-ink-muted">
          Don&apos;t have an account yet?{' '}
          <Link
            href={`/signup?role=${role}&mode=${authMode}${redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ''}`}
            className="text-accent font-bold hover:underline"
          >
            Create new account {authMode === 'password' ? 'with password' : ''} & onboard your brand →
          </Link>
        </p>

        <div className="flex items-center justify-center gap-4 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            Supabase Auth
          </span>
          <span>·</span>
          <span>India-First Platform</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <Suspense fallback={<div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />}>
          <LoginContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
