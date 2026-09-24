'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  User,
  Mail,
  Phone,
  Plus,
  Sparkles,
  Calendar,
  ArrowRight,
  KeyRound,
  RotateCcw,
  ArrowLeft,
  AlertCircle,
  Ticket,
  Clock,
  Users,
  Utensils,
  Shirt,
  HelpCircle
} from 'lucide-react';
import { EventItem, RSVPItem } from '@/types';
import { addRSVP, generateGoogleCalendarUrl, downloadICS, getEventRSVPs } from '@/lib/store';
import { sendEmailOtp, verifyEmailOtp, createGuestAccountFromRsvp, getLocalAuthSession, validateEmailInput } from '@/lib/auth';
import DigitalPassModal from '@/components/ui/DigitalPassModal';
import FollowButton from '@/components/ui/FollowButton';

interface RSVPFormProps {
  event: EventItem;
  onSuccess?: (rsvp: RSVPItem) => void;
  cardClass?: string;
  innerCardClass?: string;
  borderClass?: string;
  headingClass?: string;
  textSecondary?: string;
  textMuted?: string;
  accentColor?: string;
  buttonPrimary?: string;
}

export default function RSVPForm({
  event,
  onSuccess,
  cardClass,
  innerCardClass,
  borderClass,
  headingClass,
  textSecondary,
  textMuted,
  accentColor,
  buttonPrimary
}: RSVPFormProps) {
  const router = useRouter();
  const currentCount = getEventRSVPs(event.id).length;
  const isFull = event.capacity ? currentCount >= event.capacity : false;

  // Step flow: 'details' -> 'otp' -> 'success'
  const [step, setStep] = useState<'details' | 'otp' | 'success'>('details');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hasPlusOne, setHasPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [dietary, setDietary] = useState('none');
  const [tshirt, setTshirt] = useState('M');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  // OTP State
  const [otpToken, setOtpToken] = useState('');
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRsvp, setSubmittedRsvp] = useState<RSVPItem | null>(null);

  // Strict Rule: RSVPs can ONLY be created for Vibe-specific native events
  if (event.source_type === 'external') {
    return (
      <div className={`p-6 rounded-2xl border ${borderClass || 'border-border'} ${cardClass || 'bg-surface'} text-center space-y-4`}>
        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent">
          {event.source_platform ? `🎟️ ${event.source_platform.toUpperCase()}` : 'External Event'}
        </span>
        <h3 className={`text-lg font-bold ${headingClass || 'text-ink'}`}>
          RSVPs Handled on Partner Platform
        </h3>
        <p className={`text-xs ${textSecondary || 'text-ink-secondary'} leading-relaxed`}>
          Registrations for this experience are exclusively managed on{' '}
          <span className="font-semibold text-ink">
            {event.source_platform ? event.source_platform.toUpperCase() : 'the official platform'}
          </span>.
        </p>
        {event.external_ticket_url && (
          <a
            href={event.external_ticket_url.startsWith('http') ? event.external_ticket_url : `https://${event.external_ticket_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm w-full shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${buttonPrimary || 'bg-accent text-white'}`}
          >
            <span>Book on {event.source_platform ? event.source_platform.toUpperCase() : 'Official Site'} ↗</span>
          </a>
        )}
      </div>
    );
  }
  const [showPassModal, setShowPassModal] = useState(false);

  // Pre-fill user details and check for existing RSVP
  useEffect(() => {
    const session = getLocalAuthSession();
    if (session) {
      if (session.name && !name) setName(session.name);
      if (session.email && !email) setEmail(session.email);
      if (session.phone && !phone) setPhone(session.phone);

      const rsvps = getEventRSVPs(event.id);
      const existing = rsvps.find(r => r.email?.toLowerCase() === session.email?.toLowerCase());
      if (existing) {
        setSubmittedRsvp(existing);
        setStep('success');
      }
    }
  }, [event.id]);

  // 1. Details submission -> send Email OTP
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;

    const cleanEmail = email.trim();
    const emailValidation = validateEmailInput(cleanEmail);
    if (!emailValidation.isValid) {
      setErrorMessage(emailValidation.error || 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await sendEmailOtp(cleanEmail, 'guest');

    setIsSubmitting(false);
    if (error) {
      setErrorMessage(error.message || 'Failed to send verification code. Please try again.');
    } else {
      setOtpMessage(`We sent a 6-digit verification code to ${cleanEmail}`);
      setStep('otp');
    }
  };

  // 2. OTP Verification & RSVP Confirmation
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken.trim() || otpToken.length < 6) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await verifyEmailOtp(email.trim(), otpToken.trim(), 'guest');

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(error.message || 'Invalid or expired verification code.');
      return;
    }

    // OTP Verified! Finalize RSVP
    const fullPhone = phone ? (phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`) : '';
    const isApprovalRequired = Boolean(event.rsvp_form_config?.approval_required);
    const status = isApprovalRequired
      ? 'waitlisted'
      : (isFull && event.rsvp_form_config.waitlist_enabled ? 'waitlisted' : 'confirmed');

    const rsvp = addRSVP({
      event_id: event.id,
      event_slug: event.slug,
      name: name.trim(),
      email: email.trim(),
      phone: fullPhone,
      status,
      plus_one_name: hasPlusOne ? plusOneName.trim() : undefined,
      custom_responses: {
        ...(event.rsvp_form_config.ask_dietary ? { dietary } : {}),
        ...(event.rsvp_form_config.ask_tshirt ? { tshirt } : {}),
        ...customAnswers
      }
    });

    // Confetti celebration if confirmed
    if (status === 'confirmed') {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#E8621A', '#C9A84C', '#1A1A2E', '#1A7A4A']
      });
    }

    // Dispatch background whitelabeled email notification with digital pass
    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: status === 'waitlisted' ? 'waitlisted' : 'rsvp_confirmed',
        to: email.trim(),
        guestName: name.trim(),
        rsvp,
        event,
        organizer: {
          name: event.organizer_name,
          brand_color: event.organizer_brand_color,
          logo_url: event.organizer_logo,
          handle: event.organizer_handle
        }
      })
    }).catch(err => console.warn('Email notification note:', err));

    setSubmittedRsvp(rsvp);
    setIsSubmitting(false);
    setStep('success');
    if (onSuccess) onSuccess(rsvp);
  };

  // 3. Soft Prompt: Activate Guest Account
  const handleActivateGuestAccount = () => {
    if (!submittedRsvp) return;
    createGuestAccountFromRsvp(submittedRsvp.email, submittedRsvp.name, submittedRsvp.phone);
    router.push('/passes');
  };

  // STEP 3: SUCCESS VIEW
  if (step === 'success' && submittedRsvp) {
    const isWaitlist = submittedRsvp.status === 'waitlisted';

    return (
      <div className={`${cardClass ? `${cardClass} space-y-5` : 'bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xl rounded-2xl p-6 sm:p-8 space-y-5'} text-center animate-in fade-in zoom-in-95 duration-200`}>
        <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${isWaitlist ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
          {isWaitlist ? <Clock className="w-7 h-7 text-amber-700" /> : <CheckCircle2 className="w-7 h-7 text-emerald-600" />}
        </div>

        <div>
          <span className={`text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full ${isWaitlist ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
            {isWaitlist ? (event.rsvp_form_config?.approval_required ? 'Request Under Host Review' : 'Waitlist Position Reserved') : 'RSVP Confirmed'}
          </span>
          <h3 className="font-display font-black text-2xl mt-2 text-[#0F172A] tracking-tight">
            {isWaitlist ? (event.rsvp_form_config?.approval_required ? 'Invite Request Received' : 'You are on the waitlist') : `See you there, ${submittedRsvp.name.split(' ')[0]}!`}
          </h3>
          <p className="text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed text-[#64748B]">
            {isWaitlist
              ? (event.rsvp_form_config?.approval_required
                  ? `Your invite request for ${event.title} has been submitted. The host will inspect and confirm attendees personally. Once approved, your confirmed pass with entry pass will be emailed to ${submittedRsvp.email}.`
                  : `You've been added to the official waitlist for ${event.title}. When the organizer reviews and accepts your request, your confirmed digital pass with active entry QR code will be emailed to ${submittedRsvp.email}.`)
              : (event.rsvp_form_config.confirmation_message || `A pass has been registered for ${submittedRsvp.email}. We will ping you on WhatsApp with access details.`)}
          </p>

          <div className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs text-[#475569] bg-[#F8FAFC] py-1.5 px-3.5 rounded-full border border-[#E2E8F0]">
            <Mail className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            <span>Digital pass emailed to <strong className="text-[#0F172A]">{submittedRsvp.email}</strong></span>
          </div>
        </div>

        {/* View Digital Pass or Waitlist Receipt Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowPassModal(true)}
            className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white text-xs font-bold shadow-sm hover-lift transition-all cursor-pointer ${
              isWaitlist ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0F172A] hover:bg-black'
            }`}
          >
            {isWaitlist ? (
              <>
                <Clock className="w-4 h-4 text-amber-200" />
                <span>View Waitlist Queue Receipt</span>
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4 text-[#E8621A]" />
                <span>View Digital Admission Pass</span>
              </>
            )}
          </button>
        </div>

        {/* Calendar Buttons */}
        <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <a
            href={generateGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-[#0F172A] text-xs font-semibold shadow-xs transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-[#E8621A]" />
            <span>Add to Google Calendar</span>
          </a>
          <button
            onClick={() => downloadICS(event)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-[#0F172A] text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Download .ICS File</span>
          </button>
        </div>

        {/* Follow Host Community */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-left space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#0F172A] block">
                Follow {event.organizer_name}
              </span>
              <span className="text-[11px] text-[#64748B] block">
                @{event.organizer_handle}
              </span>
            </div>
            <FollowButton
              organizerId={event.organizer_id}
              organizerHandle={event.organizer_handle}
              organizerName={event.organizer_name}
              variant="pill"
            />
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Stay in the loop when {event.organizer_name} drops secret gatherings and tickets.
          </p>
        </div>

        {/* Soft prompt to create guest account */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-left space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
            <Sparkles className="w-4 h-4 text-[#E8621A] shrink-0" />
            <span>Save pass to your personal Pass Wallet</span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Access your pass anytime, cancel bookings, get directions, and follow {event.organizer_name} for future gatherings.
          </p>
          <button
            type="button"
            onClick={handleActivateGuestAccount}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>View Digital Pass &amp; Bookings →</span>
          </button>
        </div>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              setStep('details');
              setSubmittedRsvp(null);
            }}
            className="text-[11px] text-[#64748B] hover:text-[#0F172A] underline transition-colors cursor-pointer"
          >
            RSVP another guest or edit details
          </button>
        </div>

        {/* Digital Admission Pass Modal */}
        {showPassModal && (
          <DigitalPassModal
            rsvp={submittedRsvp}
            event={event}
            onClose={() => setShowPassModal(false)}
          />
        )}
      </div>
    );
  }

  // STEP 2: EMAIL OTP VERIFICATION VIEW
  if (step === 'otp') {
    return (
      <div className={`${cardClass ? `${cardClass} space-y-5` : 'bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xl rounded-2xl p-6 space-y-5'} animate-in fade-in`}>
        {/* Header */}
        <div className="border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#E8621A]">
              Verification
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              Step 2 of 2
            </span>
          </div>
          <h3 className="font-display font-black text-2xl text-[#0F172A] tracking-tight">
            Enter Verification Code
          </h3>
          <p className="text-xs mt-1 text-[#64748B] leading-relaxed">
            We sent a 6-digit verification code to{' '}
            <strong className="text-[#0F172A] font-semibold">{email}</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleOtpSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#475569]">
              Verification Code *
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={6}
              value={otpToken}
              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-2xl font-mono font-bold tracking-[0.35em] py-3.5 px-4 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-none transition-all placeholder:text-[#94A3B8]"
            />

            <div className="flex items-center justify-between mt-2.5 text-xs text-[#64748B]">
              <span>Didn&apos;t receive code?</span>
              <button
                type="button"
                onClick={handleDetailsSubmit}
                disabled={isSubmitting}
                className="hover:underline inline-flex items-center gap-1 font-bold text-[#E8621A] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            </div>

            <p className="mt-3 text-[11px] text-[#94A3B8] text-center leading-relaxed">
              💡 Tip: Check your <strong>Spam</strong> or <strong>Promotions</strong> folder if the code doesn&apos;t arrive immediately.
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setErrorMessage(null);
              }}
              className="py-3 px-4 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || otpToken.length < 6}
              className="flex-1 py-3.5 px-4 rounded-xl bg-[#0F172A] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Verifying Pass...</span>
                </span>
              ) : (
                <>
                  <span>Verify &amp; Claim Pass</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // STEP 1: GUEST DETAILS VIEW
  return (
    <div className={`${cardClass ? `${cardClass} space-y-5` : 'bg-white text-[#0F172A] border border-[#E2E8F0] shadow-xl rounded-2xl p-6 space-y-5'}`}>
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#E8621A]">
            {isFull ? 'Waitlist Open' : 'Register to Attend'}
          </span>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            {event.external_price_text || 'Free Admission'}
          </span>
        </div>
        <h3 className="font-display font-black text-2xl text-[#0F172A] tracking-tight">
          {isFull ? 'Join the Guest Waitlist' : 'Claim Your Pass'}
        </h3>
        <p className="text-xs mt-0.5 text-[#64748B]">
          Email OTP verified · Instant digital admission pass
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleDetailsSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#475569]">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
            <input
              type="text"
              required
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-none transition-colors placeholder:text-[#94A3B8]"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#475569]">
            Email Address (for OTP Verification) *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3" />
            <input
              type="email"
              required
              placeholder="priya@example.com"
              value={email}
              onChange={(e) => {
                const val = e.target.value;
                setEmail(val);
                if (errorMessage) setErrorMessage(null);
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
              className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-none transition-colors placeholder:text-[#94A3B8]"
            />
          </div>
          {emailSuggestion && (
            <button
              type="button"
              onClick={() => {
                setEmail(emailSuggestion);
                setEmailSuggestion(null);
                setErrorMessage(null);
              }}
              className="mt-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-colors text-left font-medium"
            >
              <span>Did you mean <span className="underline font-bold">{emailSuggestion}</span>? Click to fix.</span>
            </button>
          )}
          <p className="text-[11px] mt-1 text-[#64748B]">
            A 6-digit OTP code will be sent to verify your pass.
          </p>
        </div>

        {/* Indian Phone with +91 Prefix */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#475569]">
            <Phone className="w-3 h-3 inline mr-1 text-[#94A3B8]" />
            WhatsApp Phone Number {event.rsvp_form_config.ask_phone === false ? '(Optional)' : '*'}
          </label>
          <div className="relative flex">
            <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-[#CBD5E1] bg-[#F1F5F9] text-xs font-bold text-[#475569]">
              +91
            </span>
            <input
              type="tel"
              required={event.rsvp_form_config.ask_phone !== false}
              maxLength={10}
              placeholder="98200 12345"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full text-sm px-3.5 py-2.5 rounded-r-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-none transition-colors placeholder:text-[#94A3B8]"
            />
          </div>
          <p className="text-[11px] mt-1 text-[#64748B]">
            Used for WhatsApp pass &amp; directions.
          </p>
        </div>

        {/* Plus One Toggle */}
        {event.rsvp_form_config.ask_plus_one && (
          <div className="pt-2 border-t border-[#E2E8F0]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#0F172A]">
              <input
                type="checkbox"
                checked={hasPlusOne}
                onChange={(e) => setHasPlusOne(e.target.checked)}
                className="w-4 h-4 rounded text-[#0F172A] focus:ring-[#0F172A]"
              />
              <span>
                <Users className="w-3.5 h-3.5 inline mr-1 text-[#64748B]" />
                Will you be bringing a +1 guest?
              </span>
            </label>

            {hasPlusOne && (
              <div className="mt-2.5">
                <input
                  type="text"
                  required={hasPlusOne}
                  placeholder="Full name of your +1 guest"
                  value={plusOneName}
                  onChange={(e) => setPlusOneName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-none transition-colors"
                />
              </div>
            )}
          </div>
        )}

        {/* Dietary Preferences */}
        {event.rsvp_form_config.ask_dietary && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#475569]">
              <Utensils className="w-3 h-3 inline mr-1 text-[#64748B]" />
              Dietary Preference
            </label>
            <select
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-none transition-colors"
            >
              <option value="vegetarian">Vegetarian / Jain friendly</option>
              <option value="vegan">Vegan</option>
              <option value="non-veg">Non-Vegetarian</option>
              <option value="none">No dietary preferences</option>
            </select>
          </div>
        )}

        {/* T-Shirt Size */}
        {event.rsvp_form_config.ask_tshirt && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#475569]">
              <Shirt className="w-3 h-3 inline mr-1 text-[#64748B]" />
              T-Shirt Size
            </label>
            <select
              value={tshirt}
              onChange={(e) => setTshirt(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-none transition-colors"
            >
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>
        )}

        {/* Custom Form Fields */}
        {event.rsvp_form_config.custom_fields?.map((field) => (
          <div key={field.id}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#475569]">
              <HelpCircle className="w-3 h-3 inline mr-1 text-[#64748B]" />
              {field.label} {field.required && '*'}
            </label>
            {field.type === 'dropdown' && field.options ? (
              <select
                required={field.required}
                value={customAnswers[field.id] || ''}
                onChange={(e) => setCustomAnswers({ ...customAnswers, [field.id]: e.target.value })}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-none transition-colors"
              >
                <option value="">Select an option</option>
                {field.options.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required={field.required}
                placeholder="Your answer"
                value={customAnswers[field.id] || ''}
                onChange={(e) => setCustomAnswers({ ...customAnswers, [field.id]: e.target.value })}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-none transition-colors"
              />
            )}
          </div>
        ))}

        {/* Host Custom Questions */}
        {event.rsvp_form_config.custom_questions?.map((question, qIdx) => (
          <div key={`cq-${qIdx}`}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[#475569]">
              <HelpCircle className="w-3 h-3 inline mr-1 text-[#E8621A]" />
              {question} *
            </label>
            <input
              type="text"
              required
              placeholder="Your answer"
              value={customAnswers[question] || ''}
              onChange={(e) => setCustomAnswers({ ...customAnswers, [question]: e.target.value })}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A] focus:bg-white focus:border-[#0F172A] focus:outline-none transition-colors"
            />
          </div>
        ))}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs bg-[#0F172A] hover:bg-black text-white shadow-sm disabled:opacity-50 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Sending Verification Code...
            </span>
          ) : (
            <>
              <span>
                {event.rsvp_form_config?.approval_required
                  ? 'Request Invite & Verify Email'
                  : (isFull ? 'Verify Email & Join Waitlist' : 'Continue to Verification')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
