'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { signInWithPassword, signInWithGoogle, sendEmailOtp, verifyEmailOtp, validateEmailInput } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // 6-digit OTP verification flow (zero magic link)
  const [showOtpFlow, setShowOtpFlow] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const destination = redirectParam || '/dashboard';

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    const emailValidation = validateEmailInput(cleanEmail);
    if (!emailValidation.isValid) {
      const err = emailValidation.error || 'Please enter a valid email address.';
      setError(err);
      setEmailError(err);
      return;
    }

    setLoading(true);
    setError(null);
    setEmailError(null);
    setMessage(null);

    try {
      const res = await signInWithPassword(cleanEmail, password.trim(), 'organizer');
      if (res.error) {
        if (res.needsConfirmation) {
          setShowOtpFlow(true);
          setOtpSent(true);
          setMessage('Your email is not verified yet. We have sent a 6-digit verification code to your email. Enter it below to sign in:');
          return;
        }
        throw res.error;
      }

      router.push(destination);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error: googleErr } = await signInWithGoogle('organizer', destination);
      if (googleErr) throw googleErr;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleSendOtpCode = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address to receive a verification code.');
      return;
    }

    const emailValidation = validateEmailInput(cleanEmail);
    if (!emailValidation.isValid) {
      const err = emailValidation.error || 'Please enter a valid email address.';
      setError(err);
      setEmailError(err);
      return;
    }

    setOtpLoading(true);
    setError(null);
    setEmailError(null);
    setMessage(null);

    const { error: otpErr } = await sendEmailOtp(cleanEmail, 'organizer');
    setOtpLoading(false);
    if (otpErr) {
      setError(otpErr.message || 'Failed to send verification code. Please try password sign-in.');
    } else {
      setOtpSent(true);
      setMessage(`6-digit verification code sent to ${cleanEmail}. Enter it below to sign in:`);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the complete 6-digit verification code from your email.');
      return;
    }

    setOtpLoading(true);
    setError(null);
    const { error: verifyErr } = await verifyEmailOtp(email.trim(), otpCode.trim(), 'organizer');
    setOtpLoading(false);

    if (verifyErr) {
      setError(verifyErr.message || 'Invalid or expired code. Please check your email and try again.');
    } else {
      router.push(destination);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 animate-in fade-in">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0A0A0A] mb-4 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to events</span>
            </Link>
            <h1 className="font-black text-2xl tracking-tight text-[#0A0A0A]">Welcome back</h1>
            <p className="text-xs text-[#64748B] mt-1">
              Sign in to manage your events, check RSVPs, or create new gatherings.
            </p>
          </div>

          {/* Google One-Click Login */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            type="button"
            className="w-full py-3 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0A0A0A] text-xs font-bold transition flex items-center justify-center gap-3 shadow-xs hover:border-[#0A0A0A] disabled:opacity-50"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
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
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-[#E2E8F0] flex-1" />
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">
              or email and password
            </span>
            <div className="h-px bg-[#E2E8F0] flex-1" />
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 flex items-start gap-2 text-xs text-green-700 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
              <span>{message}</span>
            </div>
          )}

          {/* Standard Email/Password Form */}
          <form onSubmit={handlePasswordSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    if (error) setError(null);
                    if (emailError) setEmailError(null);
                    if (val.trim()) {
                      const check = validateEmailInput(val.trim());
                      if (check.suggestion) {
                        setEmailSuggestion(check.suggestion.suggestedEmail);
                      } else {
                        setEmailSuggestion(null);
                      }
                    } else {
                      setEmailSuggestion(null);
                    }
                  }}
                  onBlur={() => {
                    if (email.trim()) {
                      const check = validateEmailInput(email.trim());
                      if (!check.isValid) {
                        setEmailError(check.error || 'Please enter a valid email address.');
                      } else {
                        setEmailError(null);
                      }
                    }
                  }}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border ${
                    emailError ? 'border-red-400 focus:border-red-500' : 'border-[#E2E8F0] focus:border-[#0A0A0A]'
                  } rounded-xl text-xs text-[#0A0A0A] placeholder:text-[#94A3B8] focus:outline-none transition-colors`}
                />
              </div>
              {emailSuggestion && (
                <button
                  type="button"
                  onClick={() => {
                    setEmail(emailSuggestion);
                    setEmailSuggestion(null);
                    setEmailError(null);
                  }}
                  className="mt-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-colors text-left font-medium"
                >
                  <span>Did you mean <span className="underline font-bold">{emailSuggestion}</span>? Click to fix.</span>
                </button>
              )}
              {emailError && (
                <p className="mt-1 text-[11px] text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#475569]">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpFlow((p) => !p);
                    setOtpSent(false);
                    setOtpCode('');
                    setError(null);
                  }}
                  className="text-[11px] font-medium text-[#64748B] hover:text-[#0A0A0A] transition-colors"
                >
                  {showOtpFlow ? 'Use password instead' : 'Sign in with 6-digit code?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!showOtpFlow}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0A0A0A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0A0A0A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0A0A0A]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!showOtpFlow && (
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 bg-[#0A0A0A] hover:bg-[#262626] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            )}
          </form>

          {/* 6-Digit Verification Code (OTP) Flow — NO MAGIC LINK */}
          {showOtpFlow && (
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-3 animate-in fade-in">
              {!otpSent ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-[#64748B]">
                    Enter your email above to receive a secure 6-digit verification code. No magic link or password needed.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendOtpCode}
                    disabled={otpLoading || loading || googleLoading}
                    className="w-full py-2.5 px-3 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0A0A0A] text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <span>Send 6-Digit Code to Email</span>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#0F172A] block mb-1">
                      Enter 6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      autoFocus
                      className="w-full text-center tracking-[8px] font-mono text-xl py-2.5 bg-white border-2 border-[#0F172A] rounded-xl text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length < 6}
                    className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Verify & Sign In</span>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSendOtpCode}
                      disabled={otpLoading}
                      className="text-[11px] text-[#64748B] hover:text-[#0F172A] underline transition-colors"
                    >
                      Didn&apos;t get code? Resend
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Footer switch to Sign Up */}
          <div className="mt-6 pt-6 border-t border-[#E2E8F0] text-center">
            <p className="text-xs text-[#64748B]">
              Don&apos;t have an account yet?{' '}
              <Link
                href={redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : '/signup'}
                className="font-bold text-[#0A0A0A] hover:underline"
              >
                Create an account
              </Link>
            </p>
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
        <div className="min-h-screen flex items-center justify-center bg-white text-[#0A0A0A]">
          <Loader2 className="w-6 h-6 animate-spin text-[#0A0A0A]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
