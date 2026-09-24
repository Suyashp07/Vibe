'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import {
  signInWithPassword,
  signUpWithPassword,
  verifySignupOtp,
  resendSignupOtp,
  signInWithGoogle,
  getSupabaseClient,
  useAuth,
  validateEmailInput
} from '@/lib/auth';

type AuthMode = 'signin' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
  onAuthenticated?: () => void;
  redirectUrl?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'signin',
  onAuthenticated,
  redirectUrl,
}: AuthModalProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  // OTP Verification Mode
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const destination = redirectUrl || '/dashboard';

  // Synchronize defaultMode on prop change
  useEffect(() => {
    setMode(defaultMode);
    setIsVerifyingOtp(false);
    setError('');
    setMessage('');
    setIsExistingUser(false);
  }, [defaultMode, isOpen]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // If already logged in when modal is mounted or state changes, automatically close
  useEffect(() => {
    if (isLoggedIn && isOpen) {
      onClose();
      if (onAuthenticated) onAuthenticated();
    }
  }, [isLoggedIn, isOpen, onClose, onAuthenticated]);

  // Listen to Supabase auth state change: close modal immediately when sign-in completes
  useEffect(() => {
    if (!isOpen) return;
    const client = getSupabaseClient();
    if (!client) return;

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setEmailLoading(false);
        setGoogleLoading(false);
        onClose();
        if (onAuthenticated) onAuthenticated();
        router.push(destination);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [isOpen, destination, onClose, onAuthenticated, router]);

  if (!isOpen) return null;

  async function handleEmailAuth(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsExistingUser(false);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    const emailValidation = validateEmailInput(cleanEmail);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setEmailLoading(true);
    try {
      if (mode === 'signup') {
        const res = await signUpWithPassword(
          email.trim(),
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
          setMessage(`We sent a 6-digit verification code to ${email.trim()}`);
        } else {
          if (onAuthenticated) onAuthenticated();
          onClose();
          router.push(destination);
        }
      } else {
        const res = await signInWithPassword(
          email.trim(),
          password.trim(),
          'organizer'
        );

        if (res.error) {
          if (res.needsConfirmation) {
            setIsVerifyingOtp(true);
            setResendCooldown(30);
            setMessage('Your email is unconfirmed. We have sent a verification code to your email.');
            return;
          }
          throw res.error;
        }

        if (onAuthenticated) onAuthenticated();
        onClose();
        router.push(destination);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const { error: verifyErr } = await verifySignupOtp(email.trim(), cleanCode, 'organizer');
      if (verifyErr) throw verifyErr;

      setOtpSuccess(true);
      setTimeout(() => {
        if (onAuthenticated) onAuthenticated();
        onClose();
        router.push(destination);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setError('');
    setMessage('');

    try {
      const res = await resendSignupOtp(email.trim());
      if (res.error) throw res.error;
      setResendCooldown(45);
      setMessage(`New verification code sent to ${email.trim()}`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Could not resend code. Please try again.');
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    try {
      const { error: googleErr } = await signInWithGoogle('organizer', destination);
      if (googleErr) throw googleErr;

      setTimeout(() => {
        setGoogleLoading(false);
      }, 8000);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  const inputCls =
    'w-full px-3.5 py-2.5 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-gray-400 text-gray-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-10 animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close auth dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {isVerifyingOtp ? (
          /* OTP Screen inside Modal */
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsVerifyingOtp(false);
                  setError('');
                }}
                className="p-1 -ml-1 text-gray-400 hover:text-gray-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="font-bold text-base text-gray-900">Verify your email</h2>
                <p className="text-[11px] text-gray-500">
                  Enter the 6-digit code sent to <span className="font-semibold text-gray-800">{email}</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  autoFocus
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.4em] text-lg font-mono font-bold py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-gray-900 focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpSuccess || otpCode.trim().length < 6}
                className="w-full py-2.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying code...</span>
                  </>
                ) : otpSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span>Verified! Logging in...</span>
                  </>
                ) : (
                  <span>Verify & Complete</span>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="text-gray-900 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyingOtp(false);
                    setError('');
                  }}
                  className="text-gray-500 hover:text-gray-900 underline"
                >
                  Edit details
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Normal Auth Form */
          <>
            {/* Title */}
            <h2 className="font-bold text-lg text-gray-900 mb-1">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Host gatherings, manage RSVPs, or discover experiences.
            </p>

            {/* Mode Selector (Log in vs Sign up) */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
              {(['signin', 'signup'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError('');
                    setMessage('');
                    setIsExistingUser(false);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    mode === m ? 'bg-white shadow-xs text-gray-900 font-bold' : 'text-gray-500'
                  }`}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Auth Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (isExistingUser) setIsExistingUser(false);
                      }}
                      placeholder="e.g. Alex Morgan"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmail(val);
                      if (isExistingUser) setIsExistingUser(false);
                      if (error) setError('');
                      const check = validateEmailInput(val.trim());
                      if (check.suggestion) {
                        setEmailSuggestion(check.suggestion.suggestedEmail);
                      } else {
                        setEmailSuggestion(null);
                      }
                    }}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>
                {emailSuggestion && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(emailSuggestion);
                      setEmailSuggestion(null);
                    }}
                    className="mt-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-colors text-left font-medium"
                  >
                    <span>Did you mean <span className="underline font-bold">{emailSuggestion}</span>? Click to fix.</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex flex-col gap-1.5 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                  {isExistingUser && (
                    <div className="pt-1.5 border-t border-red-200/60 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-red-800">Account exists</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signin');
                          setError('');
                          setIsExistingUser(false);
                        }}
                        className="px-2.5 py-0.5 bg-red-600 text-white rounded font-bold text-[10px] hover:bg-red-700 transition"
                      >
                        Switch to Sign In →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {message && (
                <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={emailLoading || googleLoading}
                className="w-full py-2.5 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {emailLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{mode === 'signin' ? 'Signing in...' : 'Sending code...'}</span>
                  </>
                ) : (
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account & Send Code'}</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-gray-400 font-semibold tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || emailLoading}
              type="button"
              className="w-full py-2.5 px-3 border border-[#E2E8F0] hover:bg-gray-50 text-xs font-semibold text-gray-800 rounded-xl transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  <span>Connecting to Google...</span>
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
                  <span>Google</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
