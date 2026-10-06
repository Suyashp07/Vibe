'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  QrCode,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Search,
  Volume2,
  VolumeX,
  Users,
  Clock,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Zap,
  Check,
  ShieldCheck,
  UserCheck,
  UserX,
  FlipHorizontal,
  Flame
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { getEvents, getRSVPs, syncEventsWithSupabase, syncRSVPsWithSupabase } from '@/lib/store';
import { EventItem, RSVPItem } from '@/types';
import { useAuth } from '@/lib/auth';

interface VerificationResult {
  valid: boolean;
  status: 'success' | 'already_attended' | 'cancelled' | 'waitlisted' | 'not_found' | 'invalid_hash' | 'error';
  message: string;
  already_attended?: boolean;
  attended_at?: string;
  rsvp?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    plus_one_name?: string;
    status: string;
    event_title?: string;
    event_date?: string;
    event_location?: string;
  };
}

function OrganizerCheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<VerificationResult | null>(null);
  const [scanHistory, setScanHistory] = useState<{ result: VerificationResult; timestamp: Date }[]>([]);

  // Manual search fallback state
  const [manualQuery, setManualQuery] = useState('');
  const [manualSearchOpen, setManualSearchOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load local data and sync
  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([syncEventsWithSupabase(), syncRSVPsWithSupabase()]);
      } catch (e) {
        console.warn('Sync failed, using cache:', e);
      } finally {
        setEvents(getEvents());
        setRsvps(getRSVPs());
      }
    };
    load();

    const urlEvent = searchParams.get('eventId');
    if (urlEvent) setSelectedEventId(urlEvent);
  }, [searchParams]);

  // Sound Synthesizer (Zero asset dependency)
  const playSound = useCallback((type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        // High upbeat dual chime
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'warning') {
        // Double pulse alert
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        // Low error buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio not permitted or supported
    }
  }, [soundEnabled]);

  // Haptic feedback
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }, []);

  // Submit scan to verification endpoint
  const handleVerifyScan = useCallback(async (scannedText: string) => {
    if (isVerifying) return;
    setIsVerifying(true);

    try {
      // Pause scanner while showing modal
      if (scannerRef.current) {
        try {
          await scannerRef.current.pause(true);
        } catch {
          // ignore
        }
      }

      const res = await fetch('/api/rsvps/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawScan: scannedText,
          eventId: selectedEventId !== 'all' ? selectedEventId : undefined,
        }),
      });

      const data: VerificationResult = await res.json();
      setLastScanResult(data);
      setScanHistory(prev => [{ result: data, timestamp: new Date() }, ...prev.slice(0, 49)]);

      if (data.valid && !data.already_attended) {
        playSound('success');
        triggerHaptic([100, 50, 100]);
        // Update local list
        if (data.rsvp?.id) {
          setRsvps(prev =>
            prev.map(r => (r.id === data.rsvp!.id ? { ...r, status: 'confirmed', custom_responses: { ...r.custom_responses, attended: true } } : r))
          );
        }
      } else if (data.already_attended) {
        playSound('warning');
        triggerHaptic([200, 100, 200]);
      } else {
        playSound('error');
        triggerHaptic([300]);
      }

      // Auto-resume after 3.5s for fast queue check-in
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = setTimeout(() => {
        handleResumeScanning();
      }, 3500);

    } catch (err: any) {
      console.error('Scan processing error:', err);
      const errResult: VerificationResult = {
        valid: false,
        status: 'error',
        message: err?.message || 'Network error verifying ticket',
      };
      setLastScanResult(errResult);
      playSound('error');
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, selectedEventId, playSound, triggerHaptic]);

  // Resume camera scanning
  const handleResumeScanning = useCallback(async () => {
    if (autoResumeTimerRef.current) {
      clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = null;
    }
    setLastScanResult(null);

    if (scannerRef.current) {
      try {
        await scannerRef.current.resume();
      } catch (err) {
        // If resume fails, restart
        startScanner();
      }
    }
  }, []);

  // Initialize camera scanner
  const startScanner = useCallback(async () => {
    setScannerError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode },
        config,
        (decodedText) => {
          handleVerifyScan(decodedText);
        },
        () => {
          // parse error / scanning in progress (silent)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start camera scanner:', err);
      setScannerError(
        err?.message?.includes('NotAllowedError') || err?.message?.includes('Permission')
          ? 'Camera permission denied. Please allow camera access in your browser settings to scan passes.'
          : 'Unable to start camera. Please ensure camera is not currently used by another application.'
      );
      setIsScanning(false);
    }
  }, [facingMode, handleVerifyScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch {
        // ignore
      }
    }
  }, [isScanning]);

  // Start scanner on mount
  useEffect(() => {
    startScanner();
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch {
          // ignore
        }
      }
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    };
  }, [facingMode]);

  // Toggle front/back camera
  const handleFlipCamera = async () => {
    await stopScanner();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Filtered RSVPs for selected event
  const currentEventRSVPs = rsvps.filter(r =>
    selectedEventId === 'all' ? true : r.event_id === selectedEventId
  );
  const attendedCount = currentEventRSVPs.filter(
    r => r.custom_responses?.attended === true || r.status === 'confirmed' && (r as any).attended
  ).length;
  const totalCount = currentEventRSVPs.length;
  const attendanceRate = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

  // Manual guest lookup results
  const manualFiltered = manualQuery.trim()
    ? currentEventRSVPs.filter(r => {
        const q = manualQuery.toLowerCase().trim();
        return (
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.phone && r.phone.includes(q)) ||
          r.id.toLowerCase().includes(q)
        );
      }).slice(0, 10)
    : [];

  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col font-sans select-none">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & NAVIGATION */}
      {/* ========================================================= */}
      <header className="px-4 py-3 border-b border-white/10 bg-[#090D16]/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white"
            title="Back to Admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <h1 className="font-display font-black text-sm sm:text-base tracking-wide">
                Live Gate Scanner
              </h1>
            </div>
            <p className="text-[10px] text-white/50 font-mono">
              HTML5 Dynamic PWA Check-In
            </p>
          </div>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              soundEnabled ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-300'
            }`}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleFlipCamera}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            title="Flip Camera"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={() => setManualSearchOpen(prev => !prev)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              manualSearchOpen ? 'bg-accent text-white' : 'bg-white/10 text-white'
            }`}
            title="Search Guests Manually"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. EVENT SELECTOR & LIVE ADMISSION STATS BAR */}
      {/* ========================================================= */}
      <section className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[200px]">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-[#131B2E] border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent"
          >
            <option value="all">⚡ All Events ({events.length})</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.city})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <UserCheck className="w-3.5 h-3.5" />
            <span className="font-bold">{attendedCount}</span>
            <span className="text-white/40">/</span>
            <span className="text-white/70">{totalCount} Admitted</span>
          </div>
          <div className="text-white/40">•</div>
          <div className="text-accent font-bold">
            {attendanceRate}%
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. MAIN SCANNER VIEWPORT */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Error State */}
        {scannerError ? (
          <div className="max-w-md w-full bg-red-950/40 border border-red-500/30 rounded-2xl p-6 text-center space-y-4">
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <div>
              <h3 className="font-bold text-base text-red-200">Camera Scanner Offline</h3>
              <p className="text-xs text-red-300/80 mt-1.5 leading-relaxed">
                {scannerError}
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={startScanner}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
              <button
                onClick={() => setManualSearchOpen(true)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Manual Check-In</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center">
            {/* Camera Viewfinder Card */}
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-black border-2 border-white/20 shadow-2xl">
              {/* HTML5 QR Code Mount Element */}
              <div id="qr-reader" className="w-full h-full object-cover" />

              {/* Viewfinder Target Framing Overlays */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* 4 Corner brackets */}
                <div className="w-64 h-64 relative border-2 border-dashed border-white/30 rounded-2xl">
                  {/* Top-Left */}
                  <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-accent rounded-tl-xl shadow-[0_0_12px_rgba(232,98,26,0.6)]" />
                  {/* Top-Right */}
                  <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-accent rounded-tr-xl shadow-[0_0_12px_rgba(232,98,26,0.6)]" />
                  {/* Bottom-Left */}
                  <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-accent rounded-bl-xl shadow-[0_0_12px_rgba(232,98,26,0.6)]" />
                  {/* Bottom-Right */}
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-accent rounded-br-xl shadow-[0_0_12px_rgba(232,98,26,0.6)]" />

                  {/* Animated Laser Scanning Line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_12px_rgba(232,98,26,0.9)] animate-qr-scan" />
                </div>
              </div>

              {/* Live Scanner Badge */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>30s Dynamic TOTP Ready</span>
              </div>
            </div>

            <p className="text-[11px] text-white/50 text-center mt-3 font-mono">
              Align guest digital pass inside target box • Auto-verifies instantly
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. OPTIMISTIC FEEDBACK POPUP MODAL (INSTANT REACTION)    */}
        {/* ========================================================= */}
        {lastScanResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className={`max-w-md w-full rounded-3xl p-6 sm:p-7 space-y-5 text-center shadow-2xl border ${
              lastScanResult.valid && !lastScanResult.already_attended
                ? 'bg-gradient-to-b from-[#0F2D1F] to-[#0A1A12] border-emerald-500/50'
                : lastScanResult.already_attended
                ? 'bg-gradient-to-b from-[#382806] to-[#1C1402] border-amber-500/50'
                : 'bg-gradient-to-b from-[#3B1111] to-[#1F0707] border-red-500/50'
            }`}>
              {/* Status Icon */}
              <div className="mx-auto">
                {lastScanResult.valid && !lastScanResult.already_attended ? (
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.5)] animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : lastScanResult.already_attended ? (
                  <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(239,68,68,0.5)]">
                    <XCircle className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Title & Message */}
              <div>
                <span className={`text-[11px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${
                  lastScanResult.valid && !lastScanResult.already_attended
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : lastScanResult.already_attended
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    : 'bg-red-500/20 text-red-300 border-red-400/30'
                }`}>
                  {lastScanResult.valid && !lastScanResult.already_attended
                    ? 'ADMITTED • VERIFIED'
                    : lastScanResult.already_attended
                    ? 'ALREADY CHECKED IN'
                    : 'ADMISSION DENIED'}
                </span>

                <h2 className="font-display font-black text-2xl text-white mt-3">
                  {lastScanResult.rsvp?.name || (lastScanResult.valid ? 'Guest Admitted' : 'Invalid Ticket')}
                </h2>
                <p className="text-xs text-white/70 mt-1 max-w-xs mx-auto">
                  {lastScanResult.message}
                </p>
              </div>

              {/* Attendee Details Card */}
              {lastScanResult.rsvp && (
                <div className="bg-black/40 rounded-2xl p-4 text-left font-mono text-xs space-y-2 border border-white/10">
                  <div className="flex justify-between">
                    <span className="text-white/50">Email:</span>
                    <span className="text-white font-bold truncate max-w-[200px]">{lastScanResult.rsvp.email}</span>
                  </div>
                  {lastScanResult.rsvp.plus_one_name && (
                    <div className="flex justify-between text-amber-300">
                      <span>+1 Guest:</span>
                      <span className="font-bold">{lastScanResult.rsvp.plus_one_name}</span>
                    </div>
                  )}
                  {lastScanResult.rsvp.event_title && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Event:</span>
                      <span className="text-white truncate max-w-[200px]">{lastScanResult.rsvp.event_title}</span>
                    </div>
                  )}
                  {lastScanResult.attended_at && (
                    <div className="flex justify-between text-emerald-400 pt-1 border-t border-white/10">
                      <span>Check-In Time:</span>
                      <span>{new Date(lastScanResult.attended_at).toLocaleTimeString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={handleResumeScanning}
                  className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-200 text-[#090D16] font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 text-accent" />
                  <span>Scan Next Guest (Auto in 3s)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. MANUAL SEARCH MODAL FALLBACK                          */}
        {/* ========================================================= */}
        {manualSearchOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="max-w-lg w-full bg-[#131B2E] border border-white/15 rounded-3xl p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-base text-white">Manual Guest Check-In</h3>
                </div>
                <button
                  onClick={() => setManualSearchOpen(false)}
                  className="text-white/50 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Type name, email, phone or serial..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-accent"
                  autoFocus
                />
              </div>

              {/* Results list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {manualFiltered.length === 0 ? (
                  <p className="text-xs text-white/40 text-center py-6">
                    {manualQuery.trim() ? 'No guests found matching query' : 'Start typing to find attendee record'}
                  </p>
                ) : (
                  manualFiltered.map((r) => {
                    const isAttended = r.custom_responses?.attended === true;
                    return (
                      <div
                        key={r.id}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors"
                      >
                        <div className="text-left text-xs space-y-0.5">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{r.name}</span>
                            {isAttended && (
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                Checked In
                              </span>
                            )}
                          </div>
                          <div className="text-white/60 font-mono text-[11px]">{r.email}</div>
                          {r.phone && <div className="text-white/40 font-mono text-[10px]">{r.phone}</div>}
                        </div>

                        <button
                          onClick={() => handleVerifyScan(r.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isAttended
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md'
                          }`}
                        >
                          {isAttended ? 'Re-verify' : 'Check In'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 6. BOTTOM HISTORY & SUMMARY DRAWER                       */}
      {/* ========================================================= */}
      <footer className="px-4 py-2 bg-[#090D16] border-t border-white/10 text-xs text-white/50 flex items-center justify-between">
        <span className="font-mono text-[10px]">
          Session Scans: {scanHistory.length}
        </span>
        <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>Vibe Gate Security Active</span>
        </span>
      </footer>
    </div>
  );
}

export default function OrganizerCheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-white/60 font-mono">Loading Vibe Gate Scanner...</p>
          </div>
        </div>
      }
    >
      <OrganizerCheckInContent />
    </Suspense>
  );
}
