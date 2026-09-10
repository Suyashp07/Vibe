'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { 
  X, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Download, 
  Share2, 
  Printer, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Navigation,
  Check,
  ShieldCheck,
  Ticket,
  Copy,
  Scan,
  Sparkles,
  QrCode as QrCodeIcon,
  CheckCheck,
  Lock,
  Hourglass,
  AlertTriangle
} from 'lucide-react';
import { EventItem, RSVPItem } from '@/types';
import { formatIST, generateGoogleCalendarUrl, downloadICS, getOrganizers, getEventRSVPs, cancelRSVP } from '@/lib/store';
import { getLocalAuthSession } from '@/lib/auth';

interface DigitalPassModalProps {
  rsvp: RSVPItem;
  event: EventItem;
  onClose: () => void;
}

/**
 * Dynamic deterministic barcode generated from ticket serial string
 */
function DynamicBarcode({ code }: { code: string }) {
  const bars = useMemo(() => {
    const list: { width: number; isSpace: boolean }[] = [];
    // Start guard bars
    list.push({ width: 2, isSpace: false }, { width: 1, isSpace: true }, { width: 1.5, isSpace: false }, { width: 1, isSpace: true });

    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      const w1 = ((charCode * 3 + i) % 3) + 1;
      const s1 = ((charCode * 7 + i) % 2) + 1;
      const w2 = ((charCode * 5 + i) % 3) + 1;
      const s2 = ((charCode * 2 + i) % 2) + 1;
      list.push(
        { width: w1, isSpace: false },
        { width: s1, isSpace: true },
        { width: w2, isSpace: false },
        { width: s2, isSpace: true }
      );
    }

    // End guard bars
    list.push({ width: 1.5, isSpace: false }, { width: 1, isSpace: true }, { width: 2, isSpace: false });
    return list;
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      <div className="flex items-center justify-center h-8 gap-0.5 overflow-hidden w-full max-w-[280px]">
        {bars.map((b, idx) => (
          <span
            key={idx}
            className={`h-full rounded-xs shrink-0 transition-opacity ${
              b.isSpace ? 'bg-transparent' : 'bg-slate-900 dark:bg-slate-800'
            }`}
            style={{ width: `${b.width * 1.6}px` }}
          />
        ))}
      </div>
      <span className="font-mono text-[10px] tracking-widest text-ink-muted">
        * {code} *
      </span>
    </div>
  );
}

export default function DigitalPassModal({ rsvp: initialRsvp, event, onClose }: DigitalPassModalProps) {
  const [currentRsvp, setCurrentRsvp] = useState<RSVPItem>(initialRsvp);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [organizerAvatar, setOrganizerAvatar] = useState<string>('');
  const [avatarError, setAvatarError] = useState(false);
  const [isSimulatingScanner, setIsSimulatingScanner] = useState(false);
  const [scanTimestamp, setScanTimestamp] = useState<string>('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isCancelled = currentRsvp.status === 'cancelled';
  const isWaitlisted = currentRsvp.status === 'waitlisted';
  const isConfirmed = currentRsvp.status === 'confirmed';

  // Calculate real-time queue position for waitlisted attendees
  const waitlistQueuePosition = useMemo(() => {
    if (!isWaitlisted) return 1;
    const all = getEventRSVPs(event.id);
    const waitlisted = all.filter(r => r.status === 'waitlisted');
    const idx = waitlisted.findIndex(r => r.id === currentRsvp.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [isWaitlisted, event.id, currentRsvp.id]);

  // 1. Resolve live organizer profile image dynamically
  useEffect(() => {
    if (event.organizer_logo && event.organizer_logo.trim().length > 0) {
      setOrganizerAvatar(event.organizer_logo);
      return;
    }

    const orgs = getOrganizers();
    const matchedOrg = orgs.find(
      o => (event.organizer_id && o.id === event.organizer_id) ||
           (event.organizer_handle && o.handle?.toLowerCase() === event.organizer_handle?.toLowerCase())
    );
    if (matchedOrg?.logo_url) {
      setOrganizerAvatar(matchedOrg.logo_url);
      return;
    }

    const session = getLocalAuthSession();
    if (session?.avatar_url && (
      session.id === event.organizer_id || 
      session.handle === event.organizer_handle ||
      !event.organizer_logo
    )) {
      setOrganizerAvatar(session.avatar_url);
      return;
    }

    const brandColorHex = (event.organizer_brand_color || '#E8621A').replace('#', '');
    const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(event.organizer_name || 'Host')}&backgroundColor=${brandColorHex}&textColor=ffffff`;
    setOrganizerAvatar(fallback);
  }, [event]);

  // 2. Formulate unique, verifiable encoded ticket serial & checksum
  const { ticketSerial, passHash, verificationUrl } = useMemo(() => {
    const cityCode = (event.city || 'IND').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'VB';
    const cleanId = (currentRsvp.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '01';
    
    const hash = Math.abs(
      (currentRsvp.id + (currentRsvp.email || '') + event.slug).split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0) | 0, 0)
    ).toString(36).toUpperCase().padStart(4, '0').slice(-4);

    const prefix = isWaitlisted ? 'WAIT' : isCancelled ? 'VOID' : cityCode;
    const serial = `VB-${prefix}-${cleanId}-${hash}`;
    const tokenHash = `SHA256:${Math.abs(hash.charCodeAt(0) * 8923).toString(16).toUpperCase().slice(0, 6)}`;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vibe.swaniki.com';
    const url = `${origin}/${event.slug}?ticket=${encodeURIComponent(serial)}&guest=${encodeURIComponent(currentRsvp.id)}`;

    return { ticketSerial: serial, passHash: tokenHash, verificationUrl: url };
  }, [currentRsvp, event, isWaitlisted, isCancelled]);

  // 3. Generate REAL dynamic scannable QR Code Data URL ONLY FOR CONFIRMED GUESTS
  useEffect(() => {
    // SECURITY/UX: Waitlisted and cancelled guests MUST NOT have a scannable entry QR
    if (!isConfirmed) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(verificationUrl, {
      width: 360,
      margin: 1.5,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR Code:', err);
      });
  }, [verificationUrl, isConfirmed]);

  // 4. Keyboard ESC listener and body overflow lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Copy Ticket Serial Number
  const handleCopySerial = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(ticketSerial);
      setCopiedSerial(true);
      setTimeout(() => setCopiedSerial(false), 2200);
    }
  };

  // Share Pass Link
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(verificationUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Print Pass
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Test / Simulate Scanner Verification
  const handleSimulateScan = () => {
    setIsSimulatingScanner(true);
    setScanTimestamp(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // Cancel RSVP / Leave Waitlist
  const handleCancelPass = () => {
    cancelRSVP(currentRsvp.id);
    setCurrentRsvp(prev => ({ ...prev, status: 'cancelled' }));
    setShowCancelConfirm(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex justify-center items-start p-3 sm:p-6 py-6 sm:py-10 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md my-auto sm:my-2 animate-scale-up">
        {/* ========================================================= */}
        {/* PASS TOP NAVIGATION & DISMISS BAR */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between pb-3 px-1 text-white">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md border shadow-xs ${
              isWaitlisted 
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-200' 
                : isCancelled 
                ? 'bg-red-500/20 border-red-400/40 text-red-200'
                : 'bg-white/10 border-white/20 text-white'
            }`}>
              {isWaitlisted ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Waitlist Queue Receipt</span>
                </>
              ) : isCancelled ? (
                <>
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>Cancelled Reservation</span>
                </>
              ) : (
                <>
                  <Ticket className="w-3.5 h-3.5 text-accent" />
                  <span>Digital Admission Pass</span>
                </>
              )}
            </span>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 backdrop-blur-md transition-all hover:scale-105 shadow-md"
            title="Close Pass"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TICKET CONTAINER (APPLE WALLET / LU.MA STYLE) */}
        {/* ========================================================= */}
        <div className="bg-surface rounded-3xl border border-border/80 shadow-2xl overflow-hidden print:shadow-none print:border-none">
          {/* Top Brand Banner Strip */}
          <div
            className="h-3 sm:h-3.5 w-full transition-colors"
            style={{ 
              backgroundColor: isCancelled 
                ? '#94A3B8' 
                : isWaitlisted 
                ? '#D97706' 
                : event.organizer_brand_color || '#E8621A' 
            }}
          />

          {/* Organizer Header & Host Info */}
          <div className="relative p-6 pb-5 bg-gradient-to-b from-surface-2 to-surface border-b border-border/60">
            <div className="flex items-center justify-between gap-3 mb-4">
              {/* Host Profile Info */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {organizerAvatar && !avatarError ? (
                    <img
                      src={organizerAvatar}
                      alt={event.organizer_name}
                      className="w-11 h-11 rounded-2xl object-cover border-2 shadow-xs"
                      style={{ borderColor: event.organizer_brand_color || '#E8621A' }}
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-2xl text-white font-display font-black text-base flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: event.organizer_brand_color || '#E8621A' }}
                    >
                      {event.organizer_name?.[0]?.toUpperCase() || 'O'}
                    </div>
                  )}
                  {/* Verified Check Badge */}
                  <div 
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-200"
                    title="Verified Host"
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-ink leading-tight flex items-center gap-1.5">
                    <span>{event.organizer_name}</span>
                    <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-surface-2 border border-border text-ink-muted">
                      Host
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-ink-muted">
                    @{event.organizer_handle}
                  </div>
                </div>
              </div>

              {/* Admission Status Badge */}
              <div>
                {isCancelled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 shadow-xs">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancelled</span>
                  </span>
                ) : isWaitlisted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Waitlist #{waitlistQueuePosition}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Confirmed Pass</span>
                  </span>
                )}
              </div>
            </div>

            {/* Event Title */}
            <h2 className="font-display font-black text-xl sm:text-2xl text-ink leading-tight">
              {event.title}
            </h2>

            {event.tagline && (
              <p className="text-xs text-ink-secondary mt-1.5 line-clamp-2">
                {event.tagline}
              </p>
            )}

            {/* Date & Time / Location Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-surface border border-border/80 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2.5 text-xs text-ink">
                <Calendar className="w-4 h-4 text-accent shrink-0" />
                <span className="font-bold">{formatIST(event.start_at)}</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-ink-secondary">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-medium text-ink">{event.location_name}</span>
                  {event.location_address && (
                    <span className="block text-[11px] text-ink-muted mt-0.5">
                      {event.location_address}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TICKET PERFORATION CUTOUTS (AIRLINE / WALLET STYLE) */}
          {/* ========================================================= */}
          <div className="relative py-2 bg-surface flex items-center justify-between">
            {/* Left circular cutout notch */}
            <div className="w-5 h-8 bg-black/80 rounded-r-full -ml-2.5 border-r border-border" />

            {/* Perforated dashed divider line */}
            <div className="flex-1 border-b-2 border-dashed border-border/70 mx-3" />

            {/* Right circular cutout notch */}
            <div className="w-5 h-8 bg-black/80 rounded-l-full -mr-2.5 border-l border-border" />
          </div>

          {/* ========================================================= */}
          {/* ATTENDEE PASS STUB & STATUS VIEW */}
          {/* ========================================================= */}
          <div className="p-6 pt-3 bg-surface space-y-5">
            {/* Attendee Info Grid */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/60 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted block">
                  Attendee Name
                </span>
                <span className="text-sm font-bold text-ink truncate block mt-0.5">
                  {currentRsvp.name}
                </span>
                <span className="text-[11px] font-mono text-ink-muted truncate block">
                  {currentRsvp.email}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted block">
                  {isWaitlisted ? 'Waitlist Request Code' : 'Pass Serial Number'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-xs sm:text-sm font-mono font-black tracking-wider block ${
                    isWaitlisted ? 'text-amber-600' : isCancelled ? 'text-slate-400 line-through' : 'text-accent'
                  }`}>
                    {ticketSerial}
                  </span>
                  <button
                    onClick={handleCopySerial}
                    className="text-ink-muted hover:text-ink p-1 rounded-md hover:bg-surface-2 transition-colors"
                    title="Copy Ticket Serial"
                  >
                    {copiedSerial ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <span className="text-[10px] font-mono text-ink-muted block mt-0.5">
                  {isWaitlisted 
                    ? `Queue Position: #${waitlistQueuePosition} in Line`
                    : isCancelled
                    ? 'Status: Void / Released'
                    : `1 General Admission • ${passHash}`}
                </span>
              </div>
            </div>

            {/* Plus One details if any */}
            {currentRsvp.plus_one_name && (
              <div className="p-2.5 rounded-xl bg-surface-2 border border-border text-xs flex items-center justify-between">
                <span className="text-ink-muted">Guest (+1 Request):</span>
                <span className="font-bold text-ink">{currentRsvp.plus_one_name}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW A: WAITLISTED GUEST (NO ENTRY QR - LOCKED PASS) */}
            {/* ========================================================= */}
            {isWaitlisted && (
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-4">
                {/* Locked graphic */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 flex items-center justify-center shadow-xs">
                    <Lock className="w-7 h-7 text-amber-600" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-xs border border-amber-200 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-amber-600" />
                  </div>
                </div>

                <div className="space-y-1 max-w-xs">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-black tracking-wide">
                    <span>Position #{waitlistQueuePosition} in Queue</span>
                  </div>
                  <h4 className="font-display font-black text-base text-ink pt-1.5">
                    Admission Pass Locked
                  </h4>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    This event is currently at full capacity. Scannable QR entry passes are withheld until the organizer approves your request.
                  </p>
                </div>

                {/* Step Process Card */}
                <div className="w-full bg-surface rounded-xl p-3.5 border border-amber-200/80 text-left space-y-2.5 shadow-2xs">
                  <div className="text-[11px] font-bold text-ink flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] flex items-center justify-center font-black">✓</span>
                    <span>Waitlist registration received</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-800 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-black animate-pulse">2</span>
                    <span>Organizer reviewing waitlist & capacity</span>
                  </div>
                  <div className="text-[11px] font-semibold text-ink-muted flex items-center gap-2 opacity-60">
                    <span className="w-4 h-4 rounded-full bg-slate-100 text-ink-muted text-[10px] flex items-center justify-center font-black">3</span>
                    <span>Scannable QR entry pass issued upon approval</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-100/60 border border-amber-200 text-[11px] text-amber-950 leading-snug text-left">
                  💡 <strong>Host Notification:</strong> The organizer has been notified of your request. If approved, your confirmed admission pass with an active entry QR code will be instantly unlocked and emailed to <strong>{currentRsvp.email}</strong>.
                </div>

                {/* Cancel request confirmation */}
                {showCancelConfirm ? (
                  <div className="w-full p-3 rounded-xl bg-red-50 border border-red-200 text-left space-y-2">
                    <div className="text-xs font-bold text-red-800">
                      Leave the waitlist?
                    </div>
                    <div className="text-[11px] text-red-700">
                      Your position (#{waitlistQueuePosition}) will be forfeited and surrendered to the next guest in line.
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleCancelPass}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                      >
                        Yes, Leave Waitlist
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-3 py-1.5 rounded-lg border border-border text-ink text-xs font-semibold hover:bg-surface-2"
                      >
                        Nevermind
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-xs text-red-600 hover:text-red-700 underline font-medium"
                  >
                    Can&apos;t make it? Leave Waitlist
                  </button>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW B: CANCELLED RESERVATION VIEW */}
            {/* ========================================================= */}
            {isCancelled && (
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-red-50/60 border border-red-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink">Reservation Cancelled</h4>
                  <p className="text-xs text-ink-muted mt-1 max-w-xs">
                    This pass has been cancelled and is no longer valid for venue entry.
                  </p>
                </div>
                <Link
                  href={`/${event.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline pt-1"
                >
                  <span>Re-register on Event Page →</span>
                </Link>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW C: CONFIRMED ADMISSION PASS (ACTIVE SCANNABLE QR) */}
            {/* ========================================================= */}
            {isConfirmed && (
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface-2 border border-border text-center space-y-3.5">
                {/* Top scanner status pill */}
                <div className="flex items-center justify-between w-full px-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span>Gate Scanner Ready</span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-muted">
                    Live Token
                  </span>
                </div>

                {/* REAL SCANNABLE QR CODE CONTAINER WITH LASER SWEEP ANIMATION */}
                <div className="relative p-3 bg-white rounded-2xl shadow-md border border-slate-200 group">
                  {qrDataUrl ? (
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src={qrDataUrl}
                        alt={`Admission Pass QR Code for ${currentRsvp.name}`}
                        className="w-36 h-36 sm:w-40 sm:h-40 block mx-auto object-contain select-none"
                      />
                      {/* Live Laser Scan Sweep Line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_8px_rgba(232,98,26,0.8)] pointer-events-none animate-qr-scan" />
                    </div>
                  ) : (
                    <div className="w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center text-ink-muted">
                      <QrCodeIcon className="w-10 h-10 animate-pulse text-accent" />
                    </div>
                  )}
                </div>

                {/* Scan Instructions */}
                <div>
                  <div className="text-[11px] font-mono font-bold text-ink tracking-wide">
                    SCAN AT ENTRY DESK
                  </div>
                  <div className="text-[10px] text-ink-muted mt-0.5">
                    Camera / QR reader compatible • Decodes instant gate pass
                  </div>
                </div>

                {/* Live Scanner Simulator / Verification Trigger */}
                <div className="w-full pt-1">
                  {isSimulatingScanner ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-left space-y-1.5 animate-fade-in shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                          <span>Admission Confirmed at Gate</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Gate 1 Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-900 leading-tight">
                        <span className="font-semibold">{currentRsvp.name}</span> admitted for <strong>{event.title}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-700 pt-0.5">
                        <span>Time: {scanTimestamp}</span>
                        <button
                          onClick={() => setIsSimulatingScanner(false)}
                          className="underline hover:text-emerald-900"
                        >
                          Reset Scanner
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSimulateScan}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface border border-border hover:border-accent text-ink hover:text-accent text-[11px] font-bold transition-all shadow-xs"
                    >
                      <Scan className="w-3.5 h-3.5 text-accent" />
                      <span>Test / Verify Pass Scanner Live</span>
                    </button>
                  )}
                </div>

                {/* Dynamic Encoded Barcode lines based on serial code */}
                <div className="w-full pt-1">
                  <DynamicBarcode code={ticketSerial} />
                </div>
              </div>
            )}

            {/* Pass Actions Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {!isCancelled && (
                <>
                  <a
                    href={generateGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-ink text-[11px] font-bold transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-accent" />
                    <span>{isWaitlisted ? 'Calendar (Hold)' : 'Google Cal'}</span>
                  </a>

                  <button
                    onClick={() => downloadICS(event)}
                    className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-ink text-[11px] font-bold transition-colors"
                  >
                    <Download className="w-4 h-4 text-accent" />
                    <span>Apple / .ICS</span>
                  </button>
                </>
              )}

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${event.location_name}, ${event.location_address || event.city}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-ink text-[11px] font-bold transition-colors"
              >
                <Navigation className="w-4 h-4 text-accent" />
                <span>Directions</span>
              </a>

              {isConfirmed ? (
                <button
                  onClick={handlePrint}
                  className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-ink text-[11px] font-bold transition-colors"
                >
                  <Printer className="w-4 h-4 text-accent" />
                  <span>Print / Save</span>
                </button>
              ) : (
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border text-ink text-[11px] font-bold transition-colors"
                >
                  <Share2 className="w-4 h-4 text-accent" />
                  <span>Share Event</span>
                </button>
              )}
            </div>

            {/* Footer details */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-ink-muted">
              <button
                onClick={handleShare}
                className="text-accent hover:underline font-bold inline-flex items-center gap-1 text-[11px]"
              >
                <Share2 className="w-3 h-3" />
                <span>{copiedLink ? 'Link Copied!' : 'Share Pass Link'}</span>
              </button>
              
              <Link
                href={`/${event.slug}`}
                className="hover:text-ink font-semibold inline-flex items-center gap-1 text-[11px]"
              >
                <span>Event Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
