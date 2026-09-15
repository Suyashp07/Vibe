'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Ticket,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { signInWithPassword, signInWithGoogle, sendEmailOtp } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const roleParam = searchParams.get('role');

  const [role, setRole] = useState<'organizer' | 'guest'>(
    roleParam === 'guest' ? 'guest' : 'organizer'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showMagicLinkFallback, setShowMagicLinkFallback] = useState(false);

  const destination = redirectParam || (role === 'guest' ? '/guest' : '/dashboard');

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: signInErr } = await signInWithPassword(email.trim(), password.trim(), role);
      if (signInErr) throw signInErr;

      router.push(destination);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: googleErr } = await signInWithGoogle(role, destination);
      if (googleErr) throw googleErr;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      setError('Enter your email address first to receive a login link.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: otpErr } = await sendEmailOtp(email.trim(), role);
    setLoading(false);
    if (otpErr) {
      setError(otpErr.message || 'Failed to send login link. Please try password sign in.');
    } else {
      setMessage(`Login link sent to ${email.trim()}. Check your inbox or spam folder.`);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-elevated p-6 sm:p-8 animate-in fade-in">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink mb-4 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to events</span>
            </Link>
            <h1 className="font-sans font-bold text-2xl text-ink">Welcome back</h1>
            <p className="text-xs text-ink-muted mt-1">
              Sign in to manage your events, check RSVPs, or access your tickets.
            </p>
          </div>

          {/* Role Selector Pill */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-3 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRole('organizer')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all ${
                role === 'organizer'
                  ? 'bg-surface shadow-xs text-ink font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <span>Host / Creator</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('guest')}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all ${
                role === 'guest'
                  ? 'bg-surface shadow-xs text-ink font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-accent" />
              <span>Guest / Attendee</span>
            </button>
          </div>

          {/* Google One-Click Login */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            className="w-full py-3 px-4 rounded-xl border border-border bg-surface hover:bg-surface-3 text-ink text-xs font-bold transition flex items-center justify-center gap-3 shadow-xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-border flex-1" />
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-widest">
              or email and password
            </span>
            <div className="h-px bg-border flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-surface border border-border rounded-xl focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-colors text-ink placeholder:text-ink-muted"
                  required
                />
                <Mail className="w-4 h-4 text-ink-muted absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink">Password</label>
                <button
                  type="button"
                  onClick={() => setShowMagicLinkFallback(!showMagicLinkFallback)}
                  className="text-[11px] text-accent hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-surface border border-border rounded-xl focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-colors text-ink placeholder:text-ink-muted"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-ink-muted hover:text-ink p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand hover:bg-brand-mid text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Magic Link Fallback Option */}
          {showMagicLinkFallback && (
            <div className="mt-4 p-3 bg-surface-2 rounded-xl border border-border text-center space-y-2 animate-in fade-in">
              <p className="text-[11px] text-ink-muted">
                Can't remember your password? We can send a secure one-click sign-in link to your email.
              </p>
              <button
                type="button"
                onClick={handleSendMagicLink}
                disabled={loading}
                className="text-xs font-bold text-accent hover:underline disabled:opacity-50"
              >
                Send One-Click Magic Link
              </button>
            </div>
          )}

          {/* Bottom Switcher */}
          <div className="mt-6 pt-4 border-t border-border text-center text-xs text-ink-muted">
            <span>Don't have an account yet? </span>
            <Link
              href={`/signup?role=${role}${redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ''}`}
              className="font-bold text-ink hover:text-accent transition-colors"
            >
              Create an account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-2 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
