'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Clock,
  Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventItem, RSVPItem } from '@/types';
import { useAuth, sendEmailOtp, verifyEmailOtp, validateEmailInput, getLocalAuthSession } from '@/lib/auth';
import { addRSVP } from '@/lib/store';
import { getPassSerialNumber } from '@/lib/ticketSecurity';

interface QuickJoinModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (rsvp: RSVPItem) => void;
  onAskHost?: () => void;
}

export default function QuickJoinModal({ event, isOpen, onClose, onSuccess, onAskHost }: QuickJoinModalProps) {
  const { profile } = useAuth();

  // Check if event requires host curation / approval
  const isApprovalRequired = Boolean(
    (event as any).theme?.require_approval ?? (event as any).rsvp_form_config?.require_approval ?? false
  );

  // Step flow: 'details' -> 'otp' -> 'confirmed'
  const [step, setStep] = useState<'details' | 'otp' | 'confirmed'>('details');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRsvp, setSubmittedRsvp] = useState<RSVPItem | null>(null);

  const wasOpenRef = React.useRef(false);

  // Initialize and preserve form state across tab switches and refocuses
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
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
        setName('');
        setEmail('');
        setPhone('');
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
      setName('');
      setEmail('');
      setPhone('');
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, event.id]);

  const sessionUser = profile || (typeof window !== 'undefined' ? getLocalAuthSession() : null);
  const namePlaceholder = sessionUser?.name ? `e.g. ${sessionUser.name}` : 'Enter your name or nickname';
  const emailPlaceholder = sessionUser?.email ? `e.g. ${sessionUser.email}` : 'you@example.com';
  const phonePlaceholder = sessionUser?.phone ? `e.g. ${sessionUser.phone}` : 'e.g. 9820011223 (optional)';

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  // Finalize reservation and create RSVP
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

      // Check if event requires host curation / approval
      const isApprovalRequired = Boolean(
        (event as any).theme?.require_approval ?? (event as any).rsvp_form_config?.require_approval ?? false
      );
      const targetStatus: 'confirmed' | 'waitlisted' = isApprovalRequired ? 'waitlisted' : 'confirmed';

      // Supabase is single source of truth: writes to DB first, caches record
      const rsvp = await addRSVP({
        event_id: event.id,
        event_slug: event.slug,
        name: name.trim(),
        phone: fullPhone || '+910000000000',
        email: cleanEmail,
        status: targetStatus,
        custom_responses: {
          channel: 'vibe_reels_instant',
          flash_activity: event.flash_activity || 'casual',
          requires_approval: isApprovalRequired,
        },
      });

      // Update spot filled in memory if instantly confirmed
      if (!isApprovalRequired) {
        event.spots_filled = (event.spots_filled || 0) + 1;
      }

      // Send guest confirmation / waitlisted email
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isApprovalRequired ? 'waitlisted' : 'rsvp_confirmed',
          to: cleanEmail,
          guestName: name.trim(),
          rsvp,
          event,
        }),
      }).catch((err) => console.warn('Email dispatch warning:', err));

      // Alert host on WhatsApp in real time so host can approve / track on their Host Sheet
      fetch('/api/whatsapp/notify-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          rsvp,
          event,
        }),
      }).catch((err) => console.warn('WhatsApp host notification warning:', err));

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

  // Step 1: Submit details -> Send Email OTP
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    const emailValidation = validateEmailInput(cleanEmail);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Please enter a valid email address');
      return;
    }
    if (cleanPhone && cleanPhone.length < 8) {
      setError('Please enter a valid phone number or leave blank');
      return;
    }

    // Always require Email OTP verification as expected for spot booking
    setSubmitting(true);
    setError('');

    try {
      const { error: otpErr } = await sendEmailOtp(cleanEmail, 'guest');
      if (otpErr) {
        throw new Error(otpErr.message || 'Failed to send verification code');
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `vibe_pending_otp_${event.id}`,
          JSON.stringify({
            eventId: event.id,
            name: name.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            timestamp: Date.now(),
          })
        );
      }
      setResendCooldown(30);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify OTP and finalize reservation
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpToken.trim();
    if (!token || token.length < 6 || token.length > 8) {
      setError('Please enter the verification code sent to your email (6 to 8 digits)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { error: verifyErr } = await verifyEmailOtp(cleanEmail, token, 'guest');
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
      const { error: otpErr } = await sendEmailOtp(cleanEmail, 'guest');
      if (otpErr) throw new Error(otpErr.message);
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setSubmitting(false);
    }
  };

  const passSerial = submittedRsvp ? getPassSerialNumber(submittedRsvp, event) : '';

  return (
    <div className="dark-dialog fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="dark-dialog-content w-full sm:max-w-md bg-[#12141A] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-[#E8621A]/30 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================= */}
        {/* STEP 1: ENTER DETAILS (NAME, EMAIL, PHONE)                */}
        {/* ========================================================= */}
        {step === 'details' && (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              {isApprovalRequired ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-xs">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Curated Meetup · Host Review</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E8621A] text-white flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>Instant Flash RSVP</span>
                </span>
              )}
              <span className="text-xs text-white/50">
                {event.spots_limit ? `${event.spots_limit - (event.spots_filled || 0)} spots left` : 'Spots open'}
              </span>
            </div>

            <h3 className="text-xl font-black text-white leading-snug mb-1">
              {event.title}
            </h3>

            <div className="flex items-center gap-4 text-xs text-white/60 mb-4">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#E8621A]" />
                {event.location_name}
              </span>
            </div>

            {isApprovalRequired && (
              <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300/90 text-xs flex items-start gap-2 leading-relaxed">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  The host curates attendees for this gathering. Once you submit, your spot request will be reviewed and your entry pass will be unlocked upon approval.
                </span>
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            {sessionUser && (sessionUser.name || sessionUser.email) && !name && !email && (
              <div className="flex items-center justify-between text-xs text-white/70 bg-white/[0.04] border border-white/10 px-3.5 py-2 rounded-xl mb-4">
                <span className="truncate">
                  Signed in as <strong className="text-white">{sessionUser.name || sessionUser.email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (sessionUser.name) setName(sessionUser.name);
                    if (sessionUser.email) setEmail(sessionUser.email);
                    if (sessionUser.phone) setPhone(sessionUser.phone);
                  }}
                  className="text-[#FF8542] hover:text-[#FFA066] font-bold text-xs shrink-0 cursor-pointer transition-colors ml-3 hover:underline"
                >
                  Use my details
                </button>
              </div>
            )}

            <form onSubmit={handleDetailsSubmit} className="space-y-3.5">
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
                    placeholder={namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/35 text-sm focus:outline-none focus:border-[#E8621A] transition-colors"
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
                    placeholder={emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/35 text-sm focus:outline-none focus:border-[#E8621A] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-1">
                  We'll send your digital gate pass and verification code here.
                </p>
              </div>

              {/* WhatsApp / Phone */}
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                  WhatsApp / Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="tel"
                    placeholder={phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/35 text-sm focus:outline-none focus:border-[#E8621A] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-1">
                  Optional — used by the host on WhatsApp to coordinate meetup spot.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#E8621A]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>Sending verification code...</span>
                ) : (
                  <>
                    <span>{isApprovalRequired ? 'Request Spot with Email OTP' : 'Verify & Lock Spot'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: ENTER OTP CODE                                    */}
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
                <span>{isApprovalRequired ? 'Submit Spot Request' : 'Confirm Spot'}</span>
              </span>
            </div>

            <h3 className="text-xl font-black text-white leading-snug mb-1">
              Check your email
            </h3>
            <p className="text-xs text-white/60 mb-5 leading-relaxed">
              We sent a verification code to{' '}
              <strong className="text-white font-semibold">{cleanEmail}</strong>.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                  Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E8621A]" />
                  <input
                    type="text"
                    required
                    maxLength={8}
                    autoFocus
                    placeholder="••••••••"
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
                  <span>{isApprovalRequired ? 'Submitting request...' : 'Verifying & confirming spot...'}</span>
                ) : (
                  <>
                    <span>{isApprovalRequired ? 'Verify & Submit Request' : 'Verify & Confirm Spot'}</span>
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
            {submittedRsvp?.status === 'waitlisted' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 stroke-[2.5]" />
                </div>

                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block mb-2">
                  ⏳ Request Received · Awaiting Host Review
                </span>

                <h3 className="text-2xl font-black text-white mb-2">
                  You're on the list, {name.split(' ')[0]}!
                </h3>

                <p className="text-xs text-white/70 max-w-xs mx-auto mb-4">
                  The host for <strong className="text-white">{event.title}</strong> is curating attendees. Your spot request has been sent, and you'll receive your confirmed entry pass as soon as the host approves!
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>

                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mb-2">
                  🎉 Spot Verified & Confirmed!
                </span>

                <h3 className="text-2xl font-black text-white mb-2">
                  You're in, {name.split(' ')[0]}!
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
              </>
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
  );
}
