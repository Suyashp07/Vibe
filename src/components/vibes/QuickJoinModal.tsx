'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  KeyRound,
  RotateCcw,
  Ticket,
  MessageCircle,
  ShieldCheck,
  Zap,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventItem, RSVPItem } from '@/types';
import {
  useAuth,
  sendEmailOtp,
  verifyEmailOtp,
  validateEmailInput,
  getLocalAuthSession,
  signInWithGoogle,
  getInitials,
} from '@/lib/auth';
import { addRSVP } from '@/lib/store';
import { getPassSerialNumber } from '@/lib/ticketSecurity';

function GoogleIcon({ className = 'w-5 h-5 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
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
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface QuickJoinModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (rsvp: RSVPItem) => void;
  onAskHost?: () => void;
}

export default function QuickJoinModal({ event, isOpen, onClose, onSuccess, onAskHost }: QuickJoinModalProps) {
  const { profile, isLoggedIn } = useAuth();
  const session = getLocalAuthSession();

  // Active verified user information if available
  const verifiedUser = profile || session;
  const isUserVerified = Boolean(isLoggedIn || verifiedUser?.email);

  // Step flow: 'details' -> 'otp' -> 'confirmed'
  const [step, setStep] = useState<'details' | 'otp' | 'confirmed'>('details');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [error, setError] = useState('');
  const [submittedRsvp, setSubmittedRsvp] = useState<RSVPItem | null>(null);

  const wasOpenRef = useRef(false);

  // Auto-fill details from verified profile whenever available
  useEffect(() => {
    if (verifiedUser?.email) {
      if (verifiedUser.name && !name) setName(verifiedUser.name);
      setEmail(verifiedUser.email);
      if (verifiedUser.phone && !phone) setPhone(verifiedUser.phone);
    }
  }, [verifiedUser, name, phone]);

  // Initialize and preserve form state across tab switches and refocuses
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const activeSession = profile || getLocalAuthSession();
      if (activeSession?.email) {
        if (activeSession.name) setName(activeSession.name);
        setEmail(activeSession.email);
        if (activeSession.phone) setPhone(activeSession.phone);
        setStep('details');
        setOtpToken('');
        setError('');
        setSubmittedRsvp(null);
        wasOpenRef.current = isOpen;
        return;
      }

      // Check if there is an active pending OTP session for this event in sessionStorage
      let restoredOtp = false;
      try {
        const rawPending = typeof window !== 'undefined' ? sessionStorage.getItem(`vibe_pending_otp_${event.id}`) : null;
        if (rawPending) {
          const pending = JSON.parse(rawPending);
          if (pending && pending.email && Date.now() - pending.timestamp < 15 * 60 * 1000) {
            setName(pending.name || '');
            setEmail(pending.email || '');
            setPhone(pending.phone || '');
            setStep('otp');
            setError('');
            restoredOtp = true;
          }
        }
      } catch {}

      if (!restoredOtp) {
        setStep('details');
        setOtpToken('');
        setError('');
        setSubmittedRsvp(null);
      }
    } else if (!isOpen) {
      setStep('details');
      setOtpToken('');
      setError('');
      setSubmittedRsvp(null);
      setGoogleLoading(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, event.id, profile]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const effectiveEmail = (email || verifiedUser?.email || '').trim().toLowerCase();
  const effectiveName = (name || verifiedUser?.name || 'Guest').trim();
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  // 1-Click Google Sign In for Guests:
  // Saves current event slug to restore state seamlessly, launches Google OAuth
  const handleGoogleJoin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('vibe_pending_join_slug', event.slug || event.id);
      }
      const nextUrl = `/vibes?event=${encodeURIComponent(event.slug || event.id)}&autoJoin=1`;
      const { error: gErr } = await signInWithGoogle('guest', nextUrl);
      if (gErr) {
        throw new Error(gErr.message || 'Google sign-in could not be started');
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in could not be started. You can enter details manually.');
      setGoogleLoading(false);
    }
  };

  // Finalize reservation and create RSVP directly
  const finalizeRsvp = async () => {
    setSubmitting(true);
    setError('');

    try {
      const fullPhone = cleanPhone
        ? cleanPhone.startsWith('+91')
          ? cleanPhone
          : cleanPhone.startsWith('91') && cleanPhone.length > 10
          ? `+${cleanPhone}`
          : `+91${cleanPhone}`
        : '';

      const rsvp = await addRSVP({
        event_id: event.id,
        event_slug: event.slug,
        name: effectiveName,
        phone: fullPhone || '+910000000000',
        email: effectiveEmail,
        status: 'confirmed',
        custom_responses: {
          channel: 'vibe_reels_instant',
          flash_activity: event.flash_activity || 'casual',
          verified_by: isUserVerified ? 'google' : 'email_otp',
        },
      });

      // Update spots filled in memory
      event.spots_filled = (event.spots_filled || 0) + 1;

      // Send confirmation email with pass details
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rsvp_confirmed',
          to: effectiveEmail,
          guestName: effectiveName,
          rsvp,
          event,
        }),
      }).catch((err) => console.warn('Email dispatch warning:', err));

      // Trigger celebratory confetti burst
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#F97316', '#EC4899', '#10B981', '#3B82F6', '#FBBF24'],
        });
      } catch {}

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`vibe_pending_otp_${event.id}`);
        sessionStorage.removeItem('vibe_pending_join_slug');
      }
      setSubmittedRsvp(rsvp);
      setStep('confirmed');
      if (onSuccess) onSuccess(rsvp);
    } catch (err: any) {
      setError(err.message || 'Could not confirm spot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Form submit for Verified Users (Direct 1-tap confirmation with NO OTP)
  const handleVerifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveName) {
      setError('Please provide your name');
      return;
    }
    if (!effectiveEmail) {
      setError('Email address is missing from your account profile');
      return;
    }
    if (cleanPhone && cleanPhone.length < 8) {
      setError('Please enter a valid phone number or leave it blank');
      return;
    }
    await finalizeRsvp();
  };

  // Step 1 Fallback: Submit manual details -> Send Email OTP (Only for users who choose manual email)
  const handleManualDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    const emailValidation = validateEmailInput(effectiveEmail);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Please enter a valid email address');
      return;
    }
    if (cleanPhone && cleanPhone.length < 8) {
      setError('Please enter a valid phone number or leave blank');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { error: otpErr } = await sendEmailOtp(effectiveEmail, 'guest');
      if (otpErr) {
        throw new Error(otpErr.message || 'Failed to send verification code');
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `vibe_pending_otp_${event.id}`,
          JSON.stringify({
            eventId: event.id,
            name: name.trim(),
            email: effectiveEmail,
            phone: cleanPhone,
            timestamp: Date.now(),
          })
        );
      }
      setResendCooldown(30);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email. Please try again or join with Google.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify OTP and finalize reservation (manual fallback only)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpToken.trim();
    if (!token || token.length < 6) {
      setError('Please enter the 6-digit code sent to your email');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { error: verifyErr } = await verifyEmailOtp(effectiveEmail, token, 'guest');
      if (verifyErr) {
        throw new Error(verifyErr.message || 'Invalid or expired verification code');
      }

      await finalizeRsvp();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
      setSubmitting(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const { error: otpErr } = await sendEmailOtp(effectiveEmail, 'guest');
      if (otpErr) throw new Error(otpErr.message);
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setSubmitting(false);
    }
  };

  const passSerial = submittedRsvp ? getPassSerialNumber(submittedRsvp, event) : '';
  const spotsLeft = event.spots_limit ? Math.max(0, event.spots_limit - (event.spots_filled || 0)) : null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="dark-dialog fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="dark-dialog-content w-full sm:max-w-md bg-[#12141A] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl text-white relative max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-[#E8621A]/30 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile drag handle & top bar with Close Button */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0 relative z-20">
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto sm:hidden absolute top-2 left-1/2 -translate-x-1/2" />
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E8621A] text-white flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3" />
              <span>Instant Flash RSVP</span>
            </span>
            <span className="text-xs text-white/50">
              {spotsLeft !== null ? `${spotsLeft} spots left` : 'Spots open'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inner Scrollable Body */}
        <div
          className="overflow-y-auto overscroll-contain flex-1 px-6 pb-6 pt-2 no-vibe-scroll"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
        >
          {/* ========================================================= */}
          {/* STEP 1: DETAILS & CONFIRMATION                            */}
          {/* ========================================================= */}
          {step === 'details' && (
            <div>
              <h3 className="text-xl font-black text-white leading-snug mb-1">
                {event.title}
              </h3>

              <div className="flex items-center gap-4 text-xs text-white/60 mb-5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#E8621A]" />
                  {event.location_name}
                </span>
              </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW A: USER IS LOGGED IN / GOOGLE VERIFIED                   */}
            {/* NO OTP NEEDED! Pre-filled details + optional phone + 1-tap   */}
            {/* ------------------------------------------------------------- */}
            {isUserVerified && !showManualForm ? (
              <form onSubmit={handleVerifiedSubmit} className="space-y-4">
                {/* Google Verified Profile Card */}
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-emerald-500/30 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Google Verified Account</span>
                    </div>
                    <span className="text-[10px] text-white/40">No OTP required</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    {verifiedUser?.avatar_url ? (
                      <div className="w-11 h-11 rounded-full overflow-hidden border border-white/20 shrink-0 relative">
                        <Image
                          src={verifiedUser.avatar_url}
                          alt={effectiveName}
                          width={44}
                          height={44}
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#E8621A] to-[#FF8C42] text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
                        {getInitials(effectiveName || 'G')}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                        <span>{effectiveName}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                      <div className="text-xs text-white/60 truncate font-mono">
                        {effectiveEmail}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Name adjustment (if needed) */}
                <div>
                  <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                    Your Name on Guest List
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#E8621A] transition-colors"
                    />
                  </div>
                </div>

                {/* WhatsApp / Phone (OPTIONAL) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider">
                      WhatsApp / Phone Number
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="tel"
                      placeholder="e.g. 9820011223 (optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#E8621A] transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">
                    Used by the host on WhatsApp to coordinate meetup details.
                  </p>
                </div>

                {/* Direct 1-Tap Confirmation Button - NO OTP! */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#E8621A] hover:brightness-110 active:scale-[0.98] text-white font-bold text-sm shadow-xl shadow-[#FF5500]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Locking your spot...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white text-white" />
                      <span>Confirm & Lock Spot</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(true)}
                    className="text-[11px] text-white/40 hover:text-white/70 transition-colors underline cursor-pointer"
                  >
                    Use a different email address
                  </button>
                </div>
              </form>
            ) : null}

            {/* ------------------------------------------------------------- */}
            {/* VIEW B: USER IS NOT LOGGED IN                                */}
            {/* Prominent Google Join button + fallback manual email form     */}
            {/* ------------------------------------------------------------- */}
            {!isUserVerified || showManualForm ? (
              <div className="space-y-4">
                {/* Primary: 1-Tap Google Join */}
                {!showManualForm && (
                  <div>
                    <button
                      type="button"
                      onClick={handleGoogleJoin}
                      disabled={googleLoading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm shadow-xl shadow-white/10 flex items-center justify-center gap-3 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75"
                    >
                      {googleLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-neutral-700" />
                          <span>Connecting with Google...</span>
                        </>
                      ) : (
                        <>
                          <GoogleIcon className="w-5 h-5" />
                          <span>Join with Google</span>
                          <span className="ml-auto text-[10px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                            No OTP needed
                          </span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-white/50 mt-2">
                      Instant 1-tap spot confirmation with your verified Google profile
                    </p>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="h-px bg-white/10 flex-1" />
                      <span className="text-[10px] text-white/40 uppercase font-semibold tracking-wider">
                        or enter email manually
                      </span>
                      <div className="h-px bg-white/10 flex-1" />
                    </div>
                  </div>
                )}

                {/* Back to Google option if manual form was toggled by a verified user */}
                {isUserVerified && showManualForm && (
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white mb-2 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Google account</span>
                  </button>
                )}

                {/* Manual Form (requires Email OTP verification) */}
                <form onSubmit={handleManualDetailsSubmit} className="space-y-3.5">
                  {/* Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your name or nickname"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#E8621A] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#E8621A] transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-white/40 mt-1">
                      We'll send a 6-digit verification code to confirm this email.
                    </p>
                  </div>

                  {/* WhatsApp / Phone (Optional) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider">
                        WhatsApp / Phone Number
                      </label>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Optional
                      </span>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="tel"
                        placeholder="e.g. 9820011223 (optional)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#E8621A] transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-white/40 mt-1">
                      Optional — used by the host on WhatsApp to coordinate meetup details.
                    </p>
                  </div>

                  {/* Submit Button for Manual OTP */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-3 py-3 rounded-2xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#E8621A]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sending verification code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify with Email OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: ENTER OTP CODE (MANUAL EMAIL FLOW ONLY)           */}
        {/* ========================================================= */}
        {step === 'otp' && (
          <div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem(`vibe_pending_otp_${event.id}`);
                }
                setStep('details');
                setError('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to details</span>
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E8621A] text-white flex items-center gap-1 shadow-xs">
                <KeyRound className="w-3 h-3" />
                <span>Verification Code</span>
              </span>
            </div>

            <h3 className="text-xl font-black text-white leading-snug mb-1">
              Check your email
            </h3>
            <p className="text-xs text-white/60 mb-5 leading-relaxed">
              We sent a 6-digit confirmation code to{' '}
              <strong className="text-white font-semibold">{effectiveEmail}</strong>.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E8621A]" />
                  <input
                    type="text"
                    required
                    maxLength={8}
                    autoFocus
                    placeholder="123456"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-lg font-mono tracking-widest text-center focus:outline-none focus:border-[#E8621A] transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-white/50">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || submitting}
                  className="font-bold text-[#FF8C42] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || otpToken.length < 6}
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#E8621A]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying & confirming spot...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Confirm Spot</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: CONFIRMED RESERVATION SCREEN                      */}
        {/* ========================================================= */}
        {step === 'confirmed' && (
          <div className="text-center py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mb-2">
              🎉 Spot Verified & Confirmed!
            </span>

            <h3 className="text-2xl font-black text-white mb-2">
              You're in, {effectiveName.split(' ')[0]}!
            </h3>

            <p className="text-xs text-white/70 max-w-xs mx-auto mb-3">
              Your spot is verified and locked for <strong className="text-white">{event.title}</strong> at {event.location_name}.
            </p>

            {passSerial && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#FF8C42] mb-4">
                <Ticket className="w-3.5 h-3.5" />
                <span>Pass: {passSerial}</span>
              </div>
            )}

            <p className="text-[10px] text-white/50 max-w-xs mx-auto mb-6">
              💬 Direct host messaging will be available soon — stay tuned for updates!
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onAskHost) {
                    onAskHost();
                  }
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#E8621A] hover:brightness-110 active:scale-[0.98] text-white font-black text-sm transition-all cursor-pointer shadow-lg shadow-[#FF5500]/30 flex items-center justify-center gap-2"
                title="Contact with host"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Contact with host</span>
              </button>

              <Link
                href="/passes"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Ticket className="w-3.5 h-3.5 text-[#E8621A]" />
                <span>View My Passes</span>
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl text-white/40 hover:text-white/70 text-xs font-medium transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>,
    document.body
  );
}
