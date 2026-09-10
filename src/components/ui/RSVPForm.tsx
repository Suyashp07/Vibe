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
  Clock
} from 'lucide-react';
import { EventItem, RSVPItem } from '@/types';
import { addRSVP, generateGoogleCalendarUrl, downloadICS, getEventRSVPs } from '@/lib/store';
import { sendEmailOtp, verifyEmailOtp, createGuestAccountFromRsvp, getLocalAuthSession } from '@/lib/auth';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRsvp, setSubmittedRsvp] = useState<RSVPItem | null>(null);
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

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await sendEmailOtp(email.trim(), 'guest');

    setIsSubmitting(false);
    if (error) {
      setErrorMessage(error.message || 'Failed to send verification code. Please try again.');
    } else {
      setOtpMessage(`We sent a 6-digit verification code to ${email.trim()}`);
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
    const fullPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const status = isFull && event.rsvp_form_config.waitlist_enabled ? 'waitlisted' : 'confirmed';

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
    router.push('/guest');
  };

  // STEP 3: SUCCESS VIEW
  if (step === 'success' && submittedRsvp) {
    const isWaitlist = submittedRsvp.status === 'waitlisted';

    return (
      <div className={`${cardClass || 'bg-surface text-ink border border-border shadow-elevated'} rounded-2xl p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200`}>
        <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${isWaitlist ? 'bg-amber-100 text-amber-800' : 'bg-success-bg text-success'}`}>
          {isWaitlist ? <Clock className="w-8 h-8 text-amber-700" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>

        <div>
          <span className={`text-xs uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${isWaitlist ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'}`}>
            {isWaitlist ? 'Waitlist Position Reserved' : 'RSVP Confirmed'}
          </span>
          <h3 className={`${headingClass || 'font-display font-black text-2xl mt-2'}`}>
            {isWaitlist ? 'You are on the waitlist' : `See you there, ${submittedRsvp.name.split(' ')[0]}!`}
          </h3>
          <p className={`text-sm mt-1.5 max-w-md mx-auto leading-relaxed ${textSecondary || 'text-ink-secondary'}`}>
            {isWaitlist
              ? `You've been added to the official waitlist for ${event.title}. When the organizer reviews and accepts your request, your confirmed digital pass with active entry QR code will be emailed to ${submittedRsvp.email}.`
              : (event.rsvp_form_config.confirmation_message || `A pass has been registered for ${submittedRsvp.email}. We will ping you on WhatsApp with access details.`)}
          </p>

          <div className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs text-ink-muted bg-surface-2 py-1 px-3 rounded-full border border-border">
            <span>✉️ Digital pass emailed to <strong>{submittedRsvp.email}</strong></span>
          </div>
        </div>

        {/* View Digital Pass or Waitlist Receipt Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowPassModal(true)}
            className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-sm font-bold shadow-md hover-lift transition-all cursor-pointer ${
              isWaitlist ? 'bg-amber-600 hover:bg-amber-700' : 'bg-ink hover:bg-black'
            }`}
          >
            {isWaitlist ? (
              <>
                <Clock className="w-4 h-4 text-amber-200" />
                <span>View Waitlist Queue Receipt ⏳</span>
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4 text-gold" />
                <span>View Digital Admission Pass 🎟️</span>
              </>
            )}
          </button>
        </div>

        {/* Calendar Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <a
            href={generateGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-btn bg-brand hover:bg-brand-mid text-white text-xs font-semibold shadow-sm hover-lift transition-all"
          >
            <Calendar className="w-4 h-4 text-gold" />
            <span>Add to Google Calendar</span>
          </a>
          <button
            onClick={() => downloadICS(event)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-btn bg-surface-3 hover:bg-border text-ink text-xs font-semibold transition-all"
          >
            <span>Download .ICS File</span>
          </button>
        </div>

        {/* Follow Host Community */}
        <div className="p-4 rounded-xl bg-surface-2 border border-border text-left space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-ink block">
                Follow {event.organizer_name}
              </span>
              <span className="text-[11px] text-ink-muted block">
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
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Stay in the loop when {event.organizer_name} drops secret gatherings and tickets.
          </p>
        </div>

        {/* Master Prompt Spec: Soft prompt to create guest account */}
        <div className="p-4 rounded-xl bg-surface-2 border border-border text-left space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span>Save pass to your personal Guest Dashboard</span>
          </div>
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Access your pass anytime, cancel bookings, get directions, and follow {event.organizer_name} for future gatherings.
          </p>
          <button
            type="button"
            onClick={handleActivateGuestAccount}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-accent hover:bg-accent-dark text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Activate Guest Account & Go to Dashboard →</span>
          </button>
        </div>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              setStep('details');
              setSubmittedRsvp(null);
            }}
            className="text-[11px] text-ink-muted hover:text-ink underline transition-colors"
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
      <div className={`${cardClass || 'bg-surface text-ink border border-border shadow-card'} rounded-2xl p-6 space-y-5 animate-in fade-in`}>
        <div className={`border-b ${borderClass || 'border-border'} pb-4`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider" style={{ color: accentColor || '#E8621A' }}>
              Verification Required
            </span>
            <span className={`text-xs font-semibold ${textMuted || 'text-ink-muted'}`}>
              Step 2 of 2
            </span>
          </div>
          <h3 className={`${headingClass || 'font-display font-black text-2xl mt-1'}`}>
            Enter Email OTP
          </h3>
          <p className={`text-xs mt-0.5 ${textMuted || 'text-ink-muted'}`}>
            To ensure genuine RSVPs, please verify your email address.
          </p>
        </div>

        {otpMessage && (
          <div className="p-3 rounded-xl bg-accent-light border border-accent/30 text-accent text-xs font-semibold">
            {otpMessage}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${textSecondary || 'text-ink-secondary'}`}>
              Verification Code *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 opacity-50 absolute left-3 top-3" />
              <input
                type="text"
                required
                maxLength={8}
                value={otpToken}
                onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••••"
                className={`w-full text-center text-xl font-mono tracking-widest pl-9 pr-3.5 py-2.5 rounded-xl border ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-2 text-ink'} focus:border-accent focus:outline-none`}
              />
            </div>
            <div className={`flex items-center justify-between mt-1 text-[11px] ${textMuted || 'text-ink-muted'}`}>
              <span>Code sent to {email}</span>
              <button
                type="button"
                onClick={handleDetailsSubmit}
                disabled={isSubmitting}
                className="hover:underline inline-flex items-center gap-1 font-semibold"
                style={{ color: accentColor || '#E8621A' }}
              >
                <RotateCcw className="w-3 h-3" /> Resend Code
              </button>
            </div>

            <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-left">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="text-[11px] text-amber-900 dark:text-amber-200">
                <span>💡 <strong>Tip:</strong> If the code doesn&apos;t arrive, check your <strong>Spam</strong> or <strong>Promotions</strong> folder.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setStep('details'); setErrorMessage(null); }}
              className={`inline-flex items-center justify-center gap-1 py-3 px-4 rounded-xl border text-xs font-semibold transition-colors ${innerCardClass || 'border-border hover:bg-surface-2 text-ink'}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || otpToken.length < 6}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs shadow-md hover-lift disabled:opacity-50 transition-all ${buttonPrimary || 'bg-accent hover:bg-accent-dark text-white'}`}
            >
              {isSubmitting ? (
                <span>Verifying & Securing Pass...</span>
              ) : (
                <>
                  <span>Verify & Claim Pass</span>
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
    <div className={`${cardClass || 'bg-surface text-ink border border-border shadow-card'} rounded-2xl p-6 space-y-5`}>
      {/* Header */}
      <div className={`border-b ${borderClass || 'border-border'} pb-4`}>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider" style={{ color: accentColor || '#E8621A' }}>
            {isFull ? 'Waitlist Open' : 'Register to Attend'}
          </span>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            Free Admission
          </span>
        </div>
        <h3 className={`${headingClass || 'font-display font-black text-2xl mt-1'}`}>
          {isFull ? 'Join the Guest Waitlist' : 'Claim Your Pass'}
        </h3>
        <p className={`text-xs mt-0.5 ${textMuted || 'text-ink-muted'}`}>
          Email OTP verified • Instant digital admission pass
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleDetailsSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSecondary || 'text-ink-secondary'}`}>
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 opacity-50 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              placeholder="e.g. Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-2 text-ink'} focus:border-accent focus:outline-none transition-colors`}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSecondary || 'text-ink-secondary'}`}>
            Email Address (for OTP Verification) *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 opacity-50 absolute left-3 top-2.5" />
            <input
              type="email"
              required
              placeholder="priya@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-2 text-ink'} focus:border-accent focus:outline-none transition-colors`}
            />
          </div>
          <p className={`text-[11px] mt-1 ${textMuted || 'text-ink-muted'}`}>
            A 6-digit OTP code will be sent to verify your pass.
          </p>
        </div>

        {/* Indian Phone with +91 Prefix */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSecondary || 'text-ink-secondary'}`}>
            WhatsApp Phone Number *
          </label>
          <div className="relative flex">
            <span className={`inline-flex items-center gap-1 px-3 rounded-l-xl border border-r-0 ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-3 text-ink'} text-xs font-semibold`}>
              <span>🇮🇳</span>
              <span>+91</span>
            </span>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="98200 12345"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className={`w-full text-sm px-3.5 py-2.5 rounded-r-xl border ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-2 text-ink'} focus:border-accent focus:outline-none transition-colors`}
            />
          </div>
          <p className={`text-[11px] mt-1 ${textMuted || 'text-ink-muted'}`}>
            Stored unverified in v1 • Used for WhatsApp pass & directions.
          </p>
        </div>

        {/* Plus One Toggle */}
        {event.rsvp_form_config.ask_plus_one && (
          <div className={`pt-2 border-t ${borderClass || 'border-border'}`}>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={hasPlusOne}
                onChange={(e) => setHasPlusOne(e.target.checked)}
                className="w-4 h-4 rounded text-accent focus:ring-accent"
              />
              <span className={textSecondary || 'text-ink'}>Will you be bringing a +1 guest?</span>
            </label>

            {hasPlusOne && (
              <div className="mt-2.5">
                <input
                  type="text"
                  required={hasPlusOne}
                  placeholder="Full name of your +1 guest"
                  value={plusOneName}
                  onChange={(e) => setPlusOneName(e.target.value)}
                  className={`w-full text-sm px-3.5 py-2.5 rounded-xl border ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-2 text-ink'} focus:border-accent focus:outline-none transition-colors`}
                />
              </div>
            )}
          </div>
        )}

        {/* Dietary Preferences */}
        {event.rsvp_form_config.ask_dietary && (
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSecondary || 'text-ink-secondary'}`}>
              Dietary Preference
            </label>
            <select
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              className={`w-full text-sm px-3 py-2.5 rounded-xl border ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-2 text-ink'} focus:border-accent focus:outline-none transition-colors`}
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
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSecondary || 'text-ink-secondary'}`}>
              T-Shirt Size
            </label>
            <select
              value={tshirt}
              onChange={(e) => setTshirt(e.target.value)}
              className={`w-full text-sm px-3 py-2.5 rounded-xl border ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-2 text-ink'} focus:border-accent focus:outline-none transition-colors`}
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
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textSecondary || 'text-ink-secondary'}`}>
              {field.label} {field.required && '*'}
            </label>
            {field.type === 'dropdown' && field.options ? (
              <select
                required={field.required}
                value={customAnswers[field.id] || ''}
                onChange={(e) => setCustomAnswers({ ...customAnswers, [field.id]: e.target.value })}
                className={`w-full text-sm px-3 py-2.5 rounded-xl border ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-2 text-ink'} focus:border-accent focus:outline-none transition-colors`}
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
                className={`w-full text-sm px-3.5 py-2.5 rounded-xl border ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-2 text-ink'} focus:border-accent focus:outline-none transition-colors`}
              />
            )}
          </div>
        ))}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-xs shadow-md hover-lift disabled:opacity-50 transition-all cursor-pointer ${buttonPrimary || 'bg-accent hover:bg-accent-dark text-white'}`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Sending Verification Code...
            </span>
          ) : (
            <>
              <span>{isFull ? 'Verify Email & Join Waitlist' : 'Continue to Email OTP Verification'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
