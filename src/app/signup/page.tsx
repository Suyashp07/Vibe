'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import {
  signUpWithPassword,
  verifySignupOtp,
  resendSignupOtp,
  signInWithGoogle,
  validateEmailInput,
} from '@/lib/auth';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  // Step 1: Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Step 2: OTP Verification Screen
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const destination = redirectParam || '/dashboard';

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handlePasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);
    setIsExistingUser(false);

    const cleanEmail = email.trim();
    if (!name.trim() || !cleanEmail || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailValidation = validateEmailInput(cleanEmail);
    if (!emailValidation.isValid) {
      const err = emailValidation.error || 'Please enter a valid email address.';
      setError(err);
      setEmailError(err);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await signUpWithPassword(
        cleanEmail,
        password.trim(),
        name.trim(),
        'organizer'
      );

      if (res.error) {
        if (res.error.code === 'USER_EXISTS' || res.error.message?.toLowerCase().includes('already exists')) {
          setIsExistingUser(true);
        }
        if ((res.error as any).suggestion) {
          setEmailSuggestion((res.error as any).suggestion);
        }
        throw res.error;
      }

      if (res.needsOtp) {
        setIsVerifyingOtp(true);
        setResendCooldown(30);
        setError(null);
      } else {
        router.push(destination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter the complete 6-digit verification code sent to your email.');
      return;
    }

    setOtpLoading(true);
    setError(null);

    try {
      const { error: verifyErr } = await verifySignupOtp(email.trim(), cleanCode, 'organizer');
      if (verifyErr) throw verifyErr;

      setOtpSuccess(true);
      setTimeout(() => {
        router.push(destination);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResendMessage(null);

    try {
      const res = await resendSignupOtp(email.trim());
      if (res.error) throw res.error;
      setResendCooldown(45);
      setResendMessage(`New verification code sent to ${email.trim()}`);
      setTimeout(() => setResendMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Could not resend code. Please try again in a few moments.');
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

  return (
    <div className="min-h-screen bg-[#050505] text-[#F3F4F6] flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#0D0D10] rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-8 animate-in fade-in">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white mb-4 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to events</span>
            </Link>

            {isVerifyingOtp ? (
              <>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold mb-2">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Email Verification Required</span>
                </div>
                <h1 className="font-black text-2xl tracking-tight text-white">Verify your email</h1>
                <p className="text-xs text-white/60 mt-1">
                  We sent a verification code to <span className="font-bold text-white">{email}</span>. Enter the code below to complete your registration.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-black text-2xl tracking-tight text-white">Create your account</h1>
                <p className="text-xs text-white/60 mt-1">
                  Join Vibe to host events, manage RSVPs, or discover gatherings.
                </p>
              </>
            )}
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col gap-2 text-xs text-red-400 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
              {isExistingUser && (
                <div className="mt-1 pt-2 border-t border-red-500/20 flex items-center justify-between">
                  <span className="font-medium text-red-300">Ready to log in?</span>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(destination)}`}
                    className="px-3 py-1 bg-[#FF5500] text-white rounded-lg font-bold text-[11px] hover:bg-[#FF661A] transition"
                  >
                    Go to Sign In →
                  </Link>
                </div>
              )}
            </div>
          )}

          {resendMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{resendMessage}</span>
            </div>
          )}

          {/* STEP 2: OTP Verification Screen */}
          {isVerifyingOtp ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5">
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    autoFocus
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••••••"
                    className="w-full text-center tracking-[0.3em] sm:tracking-[0.35em] text-lg font-mono font-bold py-3 bg-[#111114] border-2 border-[#FF5500]/40 focus:border-[#FF5500] rounded-xl text-white placeholder:text-white/20 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[11px] text-white/50 mt-1.5 text-center">
                  Check your spam/junk folder if you do not see the email within 1 minute.
                </p>
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpSuccess || otpCode.trim().length < 6}
                className="w-full py-3 bg-[#FF5500] hover:bg-[#FF661A] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF5500]/20 disabled:opacity-50 cursor-pointer"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying code...</span>
                  </>
                ) : otpSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Verified! Redirecting...</span>
                  </>
                ) : (
                  <span>Verify & Complete Registration</span>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="font-semibold text-white/90 hover:text-white disabled:text-white/30 disabled:no-underline flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyingOtp(false);
                    setError(null);
                  }}
                  className="text-white/60 hover:text-white underline cursor-pointer"
                >
                  Edit email / info
                </button>
              </div>
            </form>
          ) : (
            /* STEP 1: Registration Form */
            <>
              {/* Google One-Click Login */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                type="button"
                className="w-full py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition flex items-center justify-center gap-3 shadow-xs hover:border-white/30 disabled:opacity-50 cursor-pointer"
              >
                {googleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
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
                    <span>Sign up with Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  or sign up with email
                </span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <form onSubmit={handlePasswordSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (isExistingUser) setIsExistingUser(false);
                      }}
                      placeholder="Aarav Sharma"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#111114] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmail(val);
                        if (isExistingUser) setIsExistingUser(false);
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
                      className={`w-full pl-10 pr-4 py-2.5 bg-[#111114] border ${
                        emailError ? 'border-red-500 focus:border-red-400' : 'border-white/10 focus:border-[#FF5500]'
                      } rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none transition-colors`}
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
                      className="mt-1.5 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-colors text-left font-medium"
                    >
                      <span>Did you mean <span className="underline font-bold">{emailSuggestion}</span>? Click to fix.</span>
                    </button>
                  )}
                  {emailError && (
                    <p className="mt-1 text-[11px] text-red-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{emailError}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#111114] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF5500] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full py-3 bg-[#FF5500] hover:bg-[#FF661A] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF5500]/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Create Account & Send Verification Code</span>
                  )}
                </button>
              </form>

              {/* Footer switch to Sign In */}
              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <p className="text-xs text-white/60">
                  Already have an account?{' '}
                  <Link
                    href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
                    className="font-bold text-[#FF5500] hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#FF5500]">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF5500]" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
