'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
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
  Flame,
  Printer,
  Download,
  FileText,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Filter,
  ImageIcon,
  LogIn,
  ArrowRight
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { getEvents, getRSVPs, syncEventsWithSupabase, syncRSVPsWithSupabase, markRSVPAttended, formatIST, getPassSerialNumber } from '@/lib/store';
import { EventItem, RSVPItem } from '@/types';
import { useAuth, signInWithGoogle, getLocalAuthSession } from '@/lib/auth';

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
  const { profile, loading, isLoggedIn } = useAuth();
  const [localSession, setLocalSession] = useState<any>(null);

  useEffect(() => {
    setLocalSession(getLocalAuthSession());
  }, []);

  const isAuth = isLoggedIn || Boolean(localSession) || Boolean(profile);

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
  const [recentlyAdmittedId, setRecentlyAdmittedId] = useState<string | null>(null);

  // Active view tab on mobile/tablet (Scanner vs Live Sheet)
  const [mobileTab, setMobileTab] = useState<'scanner' | 'sheet'>('scanner');

  // Live Sheet filters & search
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetStatusFilter, setSheetStatusFilter] = useState<'all' | 'entered' | 'pending' | 'waitlisted'>('all');

  // Manual search fallback drawer
  const [manualQuery, setManualQuery] = useState('');
  const [manualSearchOpen, setManualSearchOpen] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const autoResumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isRetryingCamera, setIsRetryingCamera] = useState(false);

  // Load local data and sync (including private events hosted by organizer)
  const loadData = useCallback(async () => {
    const session = getLocalAuthSession();
    const activeProfile = profile || session;
    if (!activeProfile && !isLoggedIn) {
      setEvents([]);
      setRsvps([]);
      return;
    }

    try {
      const syncOpts = activeProfile?.id
        ? { organizerId: activeProfile.id, includePrivate: true }
        : { includePrivate: true };
      await Promise.all([syncEventsWithSupabase(syncOpts), syncRSVPsWithSupabase()]);
    } catch (e) {
      console.warn('Sync failed, using cache:', e);
    } finally {
      const allEvents = getEvents();
      const allRsvps = getRSVPs();

      if (activeProfile?.role === 'super_admin') {
        setEvents(allEvents);
        setRsvps(allRsvps);
      } else {
        const myEvents = allEvents.filter(
          (e) =>
            e.organizer_id === activeProfile?.id ||
            e.organizer_email === activeProfile?.email ||
            (activeProfile?.handle && e.organizer_handle === activeProfile?.handle)
        );
        const myEventIds = new Set(myEvents.map((e) => e.id));
        setEvents(myEvents);
        setRsvps(allRsvps.filter((r) => myEventIds.has(r.event_id)));
      }
    }
  }, [profile, isLoggedIn]);

  useEffect(() => {
    loadData();
    const urlEvent = searchParams.get('eventId');
    if (urlEvent) {
      setSelectedEventId(urlEvent);
    }
  }, [searchParams, loadData]);

  // Selected event object
  const currentEvent = useMemo(() => {
    if (selectedEventId === 'all') return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // RSVPs for selected event
  const eventRSVPs = useMemo(() => {
    return rsvps.filter((r) => {
      if (selectedEventId === 'all') return true;
      return r.event_id === selectedEventId;
    });
  }, [rsvps, selectedEventId]);

  // Computed admission metrics
  const admittedCount = useMemo(() => {
    return eventRSVPs.filter(
      (r) => r.custom_responses?.attended === true || (r as any).status === 'attended'
    ).length;
  }, [eventRSVPs]);

  const confirmedCount = useMemo(() => {
    return eventRSVPs.filter((r) => r.status === 'confirmed').length;
  }, [eventRSVPs]);

  const pendingCount = useMemo(() => {
    return Math.max(0, confirmedCount - admittedCount);
  }, [confirmedCount, admittedCount]);

  const waitlistCount = useMemo(() => {
    return eventRSVPs.filter((r) => r.status === 'waitlisted').length;
  }, [eventRSVPs]);

  // Filtered rows for the Live Admission Sheet
  const filteredSheetRSVPs = useMemo(() => {
    const q = sheetSearch.toLowerCase().trim();

    return eventRSVPs.filter((r) => {
      const isEntered = r.custom_responses?.attended === true || (r as any).status === 'attended';

      // 1. Status Filter Tab
      if (sheetStatusFilter === 'entered' && !isEntered) return false;
      if (sheetStatusFilter === 'pending' && (isEntered || r.status !== 'confirmed')) return false;
      if (sheetStatusFilter === 'waitlisted' && r.status !== 'waitlisted') return false;

      // 2. Search query match (name, email, phone, plus one, or structured pass serial)
      if (q) {
        const passSerial = getPassSerialNumber(r, currentEvent, eventRSVPs);
        const text = `${r.name || ''} ${r.email || ''} ${r.phone || ''} ${r.id || ''} ${r.plus_one_name || ''} ${passSerial}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioritize recently admitted first, then pending arrivals
      const aEntered = a.custom_responses?.attended === true ? 1 : 0;
      const bEntered = b.custom_responses?.attended === true ? 1 : 0;
      if (aEntered !== bEntered) return bEntered - aEntered;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [eventRSVPs, sheetSearch, sheetStatusFilter]);

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
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
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

      if (data.valid && !data.already_attended) {
        playSound('success');
        triggerHaptic([100, 50, 100]);

        if (data.rsvp?.id) {
          const rsvpId = data.rsvp.id;
          setRecentlyAdmittedId(rsvpId);
          setTimeout(() => setRecentlyAdmittedId(null), 4000);

          // Update local store and sheet
          markRSVPAttended(rsvpId, true, data.attended_at || new Date().toISOString());
          setRsvps((prev) =>
            prev.map((r) =>
              r.id === rsvpId
                ? {
                    ...r,
                    status: 'confirmed',
                    custom_responses: {
                      ...r.custom_responses,
                      attended: true,
                      attended_at: data.attended_at || new Date().toISOString(),
                    },
                  }
                : r
            )
          );
        }
      } else if (data.already_attended) {
        playSound('warning');
        // No vibration on rescan
      } else {
        playSound('error');
        triggerHaptic([300]);
      }

      // Auto-resume after 3.2s for high-speed queue handling
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
      autoResumeTimerRef.current = setTimeout(() => {
        handleResumeScanning();
      }, 3200);

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

  // Stop camera scanner cleanly
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  }, []);

  // Initialize camera scanner with multi-tier hardware fallback
  const startScanner = useCallback(async (isUserInitiated = false) => {
    setScannerError(null);
    if (isUserInitiated) setIsRetryingCamera(true);

    if (typeof window === 'undefined') return;

    // Check mediaDevices support
    if (!navigator?.mediaDevices || !navigator?.mediaDevices.getUserMedia) {
      setIsScanning(false);
      setIsRetryingCamera(false);
      setScannerError('Camera access requires a secure connection (HTTPS) or a modern browser like Chrome or Safari.');
      return;
    }

    try {
      // 1. Explicit pre-flight check on user action to trigger native browser prompt
      if (isUserInitiated) {
        try {
          const warmupStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode } },
          });
          warmupStream.getTracks().forEach((t) => t.stop());
        } catch (permErr: any) {
          console.warn('Explicit getUserMedia preflight:', permErr);
          if (permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError') {
            setIsScanning(false);
            setIsRetryingCamera(false);
            setScannerError('Camera permission is blocked. Tap the 🔒 lock icon in your browser address bar → Site Settings → Set Camera to "Allow", then tap Retry.');
            return;
          }
        }
      }

      // 2. Ensure existing scanner instance is completely stopped & cleared
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {
          // ignore
        }
        scannerRef.current = null;
      }

      // 3. Ensure DOM mount point exists
      const container = document.getElementById('qr-reader');
      if (!container) {
        console.warn('qr-reader container not found in DOM');
        setIsRetryingCamera(false);
        return;
      }

      const html5Qr = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5Qr;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const onSuccess = (decodedText: string) => {
        handleVerifyScan(decodedText);
      };

      const onError = () => {
        // Normal frame-by-frame lookup failure
      };

      // 4. Try starting with facingMode
      try {
        await html5Qr.start({ facingMode: facingMode }, config, onSuccess, onError);
        setIsScanning(true);
        setScannerError(null);
      } catch (modeErr) {
        console.warn('FacingMode start failed, trying deviceId fallback:', modeErr);
        // Fallback: list all video input cameras and choose back camera
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCam =
            cameras.find(
              (c) =>
                c.label.toLowerCase().includes('back') ||
                c.label.toLowerCase().includes('rear') ||
                c.label.toLowerCase().includes('environment')
            ) || cameras[0];

          await html5Qr.start(backCam.id, config, onSuccess, onError);
          setIsScanning(true);
          setScannerError(null);
        } else {
          throw modeErr;
        }
      }
    } catch (err: any) {
      console.warn('Failed to start Html5Qrcode camera:', err);
      setIsScanning(false);
      const msg = err?.message || '';
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setScannerError('Camera permission was denied. Tap the 🔒 lock icon in your browser address bar → Site Settings → Set Camera to "Allow", then tap Retry.');
      } else if (msg.includes('NotFoundError') || msg.includes('device not found')) {
        setScannerError('No camera found on this device. You can scan pass photos below or search guests manually.');
      } else {
        setScannerError('Camera unavailable or in use by another app. Please check browser settings or scan a pass photo.');
      }
    } finally {
      setIsRetryingCamera(false);
    }
  }, [facingMode, handleVerifyScan]);

  // Resume camera scanning after a successful scan
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
        startScanner();
      }
    }
  }, [startScanner]);

  // Scan QR code from uploaded image or pass screenshot
  const handleScanFromFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsVerifying(true);
      try {
        let qrScanner = scannerRef.current;
        if (!qrScanner) {
          qrScanner = new Html5Qrcode('qr-reader', {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          });
          scannerRef.current = qrScanner;
        }

        const decodedText = await qrScanner.scanFile(file, true);
        handleVerifyScan(decodedText);
      } catch (fileErr: any) {
        console.warn('Failed to scan QR from file:', fileErr);
        playSound('error');
        setLastScanResult({
          valid: false,
          status: 'error',
          message: 'Could not detect a QR code in this image. Please ensure the QR is clear and well-lit, or search manually.',
        });
      } finally {
        setIsVerifying(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [handleVerifyScan, playSound]
  );

  // Start scanner on mount
  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
      if (autoResumeTimerRef.current) clearTimeout(autoResumeTimerRef.current);
    };
  }, [startScanner, stopScanner]);

  // Manual Check-In Override from the sheet
  const handleToggleEntry = useCallback((rsvpId: string, currentAttended: boolean) => {
    const newAttended = !currentAttended;
    const nowIso = new Date().toISOString();

    markRSVPAttended(rsvpId, newAttended, nowIso);
    setRsvps((prev) =>
      prev.map((r) =>
        r.id === rsvpId
          ? {
              ...r,
              custom_responses: {
                ...(r.custom_responses || {}),
                attended: newAttended,
                attended_at: newAttended ? nowIso : '',
              },
            }
          : r
      )
    );

    if (newAttended) {
      playSound('success');
      setRecentlyAdmittedId(rsvpId);
      setTimeout(() => setRecentlyAdmittedId(null), 3000);
    }
  }, [playSound]);

  // Export Admission Sheet as CSV Document
  const handleExportCSV = useCallback(() => {
    const headers = [
      'Pass_Serial',
      'Guest_Name',
      'Email',
      'Phone',
      'RSVP_Status',
      'Admission_Status',
      'Entered_At_IST',
      'Plus_One_Name',
      'Event_Title',
    ];

    const rows = eventRSVPs.map((r) => {
      const isEntered = r.custom_responses?.attended === true || (r as any).status === 'attended';
      const enteredAt = r.custom_responses?.attended_at
        ? new Date(r.custom_responses.attended_at as string).toLocaleString('en-IN')
        : 'N/A';
      const passSerial = getPassSerialNumber(r, currentEvent, eventRSVPs);

      return [
        `"${passSerial}"`,
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${r.status}"`,
        `"${isEntered ? 'ADMITTED' : 'NOT ENTERED'}"`,
        `"${enteredAt}"`,
        `"${(r.plus_one_name || '').replace(/"/g, '""')}"`,
        `"${(currentEvent?.title || 'Vibe Gathering').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (currentEvent?.slug || 'event').slice(0, 30);
    link.download = `${safeTitle}-guest-admission-sheet.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [eventRSVPs, currentEvent]);

  // Print Roster Document
  const handlePrintRoster = useCallback(() => {
    window.print();
  }, []);

  if (loading && !localSession && !profile) {
    return (
      <div className="min-h-screen bg-[#070A12] text-white flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[#E8621A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuth && !loading) {
    return (
      <div className="min-h-screen bg-[#070A12] text-white flex flex-col font-sans selection:bg-[#E8621A] selection:text-white">
        <header className="px-4 py-3 sm:px-6 sm:py-4 bg-[#0B0F19] border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-semibold">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-mono uppercase text-amber-300 font-bold">Authentication Required</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#0D121F] border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E8621A]/10 border border-[#E8621A]/20 flex items-center justify-center text-[#E8621A] shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#E8621A]">
                Gate Access Restricted
              </span>
              <h2 className="text-2xl font-bold font-display text-white mt-1">
                Organizer Verification Required
              </h2>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                Live attendee check-in and door verification require host authentication. Please sign in to scan tickets and manage admissions.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => signInWithGoogle()}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-neutral-100 text-neutral-900 font-bold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login?redirect=/organizer/check-in"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-white/60" />
                  <span>Host Sign In</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition-colors"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/60" />
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A12] text-white flex flex-col font-sans selection:bg-[#E8621A] selection:text-white">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & EVENT SELECTOR COMMAND BAR                */}
      {/* ========================================================= */}
      <header className="px-4 py-3 sm:px-6 sm:py-4 bg-[#0B0F19] border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Brand, Event Badge, Back Link */}
          <div className="flex items-center gap-3">
            <Link
              href={currentEvent ? `/${currentEvent.slug}` : '/dashboard'}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 transition-colors"
              title="Return to event"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-base sm:text-lg text-white tracking-tight flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>GATE COMMAND CENTER</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                  Live Admission
                </span>
              </div>

              {currentEvent ? (
                <p className="text-xs text-white/60 truncate max-w-sm sm:max-w-md">
                  {currentEvent.title} · {currentEvent.city}
                </p>
              ) : (
                <p className="text-xs text-white/40">All Hosted Events Roster</p>
              )}
            </div>
          </div>

          {/* Right: Event Switcher & Document Control Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Event Dropdown */}
            {events.length > 0 && (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-[#E8621A] transition-colors cursor-pointer max-w-[200px] truncate"
              >
                <option value="all" className="bg-[#0B0F19]">
                  All Events Combined
                </option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id} className="bg-[#0B0F19]">
                    {ev.title}
                  </option>
                ))}
              </select>
            )}

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
              title={soundEnabled ? 'Chime sound enabled' : 'Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Export CSV Sheet */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download Admission Sheet (.CSV)"
            >
              <Download className="w-3.5 h-3.5 text-[#E8621A]" />
              <span className="hidden sm:inline">Export Sheet</span>
            </button>

            {/* Print Roster Document */}
            <button
              type="button"
              onClick={handlePrintRoster}
              className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-200 text-[#090D16] text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Print Official Admission Ledger"
            >
              <Printer className="w-3.5 h-3.5 text-[#E8621A]" />
              <span>Print Roster</span>
            </button>
          </div>
        </div>

        {/* Live Admission KPI Progress Bar */}
        <div className="max-w-7xl mx-auto mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs gap-4">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap font-mono">
            <span className="text-white/70">
              Admitted:{' '}
              <strong className="text-emerald-400 font-bold text-sm">
                {admittedCount}
              </strong>{' '}
              / {confirmedCount || eventRSVPs.length}
            </span>
            <span className="text-white/40">|</span>
            <span className="text-white/70">
              Awaiting:{' '}
              <strong className="text-amber-400 font-bold text-sm">
                {pendingCount}
              </strong>
            </span>
            {waitlistCount > 0 && (
              <>
                <span className="text-white/40">|</span>
                <span className="text-white/70">
                  Waitlist:{' '}
                  <strong className="text-purple-400 font-bold text-sm">
                    {waitlistCount}
                  </strong>
                </span>
              </>
            )}
          </div>

          {/* Progress Percent Bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                style={{
                  width: `${
                    confirmedCount > 0
                      ? Math.min(100, Math.round((admittedCount / confirmedCount) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-400">
              {confirmedCount > 0
                ? Math.round((admittedCount / confirmedCount) * 100)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* Mobile Tab Selector (Visible on small screens) */}
        <div className="flex sm:hidden mt-2 pt-2 border-t border-white/5 gap-2">
          <button
            type="button"
            onClick={() => setMobileTab('scanner')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mobileTab === 'scanner'
                ? 'bg-[#E8621A] text-white shadow-xs'
                : 'bg-white/5 text-white/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Gate Scanner</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('sheet')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mobileTab === 'sheet'
                ? 'bg-[#E8621A] text-white shadow-xs'
                : 'bg-white/5 text-white/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Admission Sheet ({admittedCount}/{confirmedCount})</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. PRINT-ONLY OFFICIAL HEADER (FOR PDF / PHYSICAL AUDIT)  */}
      {/* ========================================================= */}
      <div className="hidden print:block p-8 bg-white text-black font-sans">
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                VIBE GUEST ADMISSION ROSTER
              </h1>
              <p className="text-sm font-bold text-slate-700 mt-1">
                {currentEvent?.title || 'Official Event Attendance Ledger'}
              </p>
              <p className="text-xs text-slate-500">
                {currentEvent?.location_name || currentEvent?.city} ·{' '}
                {currentEvent?.start_at ? formatIST(currentEvent.start_at) : 'Date TBA'}
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <p>Generated: {new Date().toLocaleString('en-IN')}</p>
              <p>Doc ID: #ADM-{(currentEvent?.id || 'GLOBAL').slice(-8).toUpperCase()}</p>
            </div>
          </div>

          <div className="flex gap-6 mt-4 text-xs font-mono font-bold bg-slate-100 p-2.5 rounded-lg">
            <span>Total Registered: {eventRSVPs.length}</span>
            <span>Admitted / Entered: {admittedCount}</span>
            <span>Pending Arrivals: {pendingCount}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TWO-COLUMN MAIN WORKSPACE (SCANNER + LIVE SHEET)      */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:p-0">
        {/* ======================================================= */}
        {/* LEFT COLUMN: CAMERA VIEWFINDER & INSTANT FEEDBACK      */}
        {/* ======================================================= */}
        <section
          className={`lg:col-span-5 flex flex-col space-y-4 print:hidden ${
            mobileTab === 'sheet' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Viewfinder Card */}
          <div className="bg-[#0D121F] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Camera Controls Bar */}
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#E8621A]" />
                <span>QR Viewfinder</span>
              </span>

              <div className="flex items-center gap-2">
                {/* Flip camera */}
                <button
                  type="button"
                  onClick={() => {
                    stopScanner().then(() => {
                      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                    });
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Switch Front / Rear Camera"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>

                {/* Restart camera */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Scan Pass from Photo / File"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopScanner().then(() => startScanner(true));
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Restart Camera"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Hidden File Input for scanning QR from photo or screenshot */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleScanFromFile}
            />

            {/* Viewfinder & Scanner Frame (Permanently Mounts #qr-reader in DOM) */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black border-2 border-white/15 shadow-2xl">
              {/* HTML5 QR Mount Point - Always in DOM so it never unmounts */}
              <div id="qr-reader" className="w-full h-full object-cover" />

              {/* Error / Permission Denied Overlay */}
              {scannerError && (
                <div className="absolute inset-0 z-30 bg-[#0D121F]/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-rose-300 max-w-xs leading-relaxed">
                      {scannerError}
                    </p>
                    <p className="text-[10px] text-white/40 mt-1.5 max-w-xs">
                      Tip: In Chrome/Safari, tap the 🔒 lock or tune icon in the address bar → Site Settings → Set Camera to &quot;Allow&quot;.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-full max-w-xs pt-1">
                    <button
                      type="button"
                      disabled={isRetryingCamera}
                      onClick={() => startScanner(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isRetryingCamera ? 'Requesting Camera...' : 'Retry Camera Permission'}
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#E8621A]" />
                      <span>Scan Pass Image / Photo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Viewfinder Reticle Overlay (Only shown when no error) */}
              {!scannerError && (
                <>
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-56 relative border-2 border-dashed border-white/30 rounded-2xl">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#E8621A] rounded-tl-xl shadow-[0_0_12px_rgba(232,98,26,0.6)]" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#E8621A] rounded-tr-xl shadow-[0_0_12px_rgba(232,98,26,0.6)]" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#E8621A] rounded-bl-xl shadow-[0_0_12px_rgba(232,98,26,0.6)]" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#E8621A] rounded-br-xl shadow-[0_0_12px_rgba(232,98,26,0.6)]" />
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#E8621A] to-transparent shadow-[0_0_12px_rgba(232,98,26,0.9)] animate-qr-scan" />
                    </div>
                  </div>

                  {/* Badge Top Left */}
                  <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Instant Gate Scanner Ready</span>
                  </div>
                </>
              )}
            </div>

            {/* Instruction Tip */}
            <p className="text-[11px] text-white/50 text-center mt-3 font-mono">
              Align digital pass QR inside viewfinder • Verifies & enters to sheet instantly
            </p>
          </div>

          {/* Quick Manual Check-In Bar */}
          <div className="bg-[#0D121F] border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#E8621A]" />
              <div>
                <p className="text-xs font-bold text-white">Manual Check-In</p>
                <p className="text-[10px] text-white/50">For dead batteries or broken screens</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setManualSearchOpen(true)}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Search Guest
            </button>
          </div>
        </section>

        {/* ======================================================= */}
        {/* RIGHT COLUMN: LIVE GUEST ADMISSION SHEET / ROSTER      */}
        {/* ======================================================= */}
        <section
          className={`lg:col-span-7 flex flex-col space-y-4 ${
            mobileTab === 'scanner' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Document Header Card */}
          <div className="bg-[#0D121F] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 print:border-none print:bg-white print:p-0 print:shadow-none">
            {/* Document Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E8621A]/10 border border-[#E8621A]/30 flex items-center justify-center text-[#E8621A]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-black text-sm sm:text-base text-white tracking-tight">
                    Live Admission Sheet
                  </h2>
                  <p className="text-[11px] text-white/50 font-mono">
                    Official gate entry document for {currentEvent?.title || 'Event'}
                  </p>
                </div>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: `All (${eventRSVPs.length})` },
                  { id: 'entered', label: `Entered (${admittedCount})` },
                  { id: 'pending', label: `Pending (${pendingCount})` },
                  { id: 'waitlisted', label: `Waitlist (${waitlistCount})` },
                ].map((tab) => {
                  const active = sheetStatusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSheetStatusFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#E8621A] text-white shadow-xs'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search filter input */}
            <div className="relative print:hidden">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter sheet by guest name, email, phone, or pass serial..."
                value={sheetSearch}
                onChange={(e) => setSheetSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#E8621A] transition-colors"
              />
            </div>

            {/* The Live Document Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20 print:border-black">
              <table className="w-full text-left text-xs border-collapse print:text-black">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[10px] font-mono font-bold uppercase tracking-wider text-white/50 print:bg-slate-100 print:text-black print:border-black">
                    <th className="py-2.5 px-3">Pass #</th>
                    <th className="py-2.5 px-3">Guest Name</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">Contact</th>
                    <th className="py-2.5 px-3">Admission Status</th>
                    <th className="py-2.5 px-3 text-right print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-slate-200">
                  {filteredSheetRSVPs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/40 text-xs">
                        No guests matching the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSheetRSVPs.map((rsvp) => {
                      const isEntered =
                        rsvp.custom_responses?.attended === true || (rsvp as any).status === 'attended';
                      const isWaitlisted = rsvp.status === 'waitlisted';
                      const isCancelled = rsvp.status === 'cancelled';
                      const attendedAt = rsvp.custom_responses?.attended_at
                        ? new Date(rsvp.custom_responses.attended_at as string).toLocaleTimeString(
                            'en-IN',
                            { hour: '2-digit', minute: '2-digit' }
                          )
                        : null;
                      const isFlashing = recentlyAdmittedId === rsvp.id;

                      return (
                        <tr
                          key={rsvp.id}
                          className={`transition-colors ${
                            isFlashing
                              ? 'bg-emerald-500/20 animate-pulse'
                              : isEntered
                              ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          {/* Pass Serial */}
                          <td className="py-2.5 px-3 font-mono font-bold text-[11px] text-amber-400 print:text-black">
                            {getPassSerialNumber(rsvp, currentEvent, eventRSVPs)}
                          </td>

                          {/* Guest Name & Plus One */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white print:text-black flex items-center gap-1.5">
                              <span>{rsvp.name || rsvp.guest_name || 'Guest'}</span>
                              {rsvp.plus_one_name && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  +1 {rsvp.plus_one_name}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-white/40 sm:hidden truncate max-w-[140px] print:text-slate-600">
                              {rsvp.email}
                            </div>
                          </td>

                          {/* Contact (Desktop) */}
                          <td className="py-2.5 px-3 hidden sm:table-cell text-white/60 font-mono text-[11px] truncate max-w-[160px] print:text-black">
                            <div>{rsvp.email}</div>
                            {rsvp.phone && (
                              <div className="text-[10px] text-white/40">{rsvp.phone}</div>
                            )}
                          </td>

                          {/* Admission Status */}
                          <td className="py-2.5 px-3">
                            {isEntered ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Entered {attendedAt ? `• ${attendedAt}` : ''}</span>
                              </span>
                            ) : isWaitlisted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-400/30">
                                <Clock className="w-3 h-3" />
                                <span>Waitlist</span>
                              </span>
                            ) : isCancelled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-400/30">
                                <XCircle className="w-3 h-3" />
                                <span>Void</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-white/50 bg-white/5 border border-white/10">
                                <Clock className="w-3 h-3 text-white/40" />
                                <span>Awaiting Arrival</span>
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-2.5 px-3 text-right print:hidden">
                            {isEntered ? (
                              <button
                                type="button"
                                onClick={() => handleToggleEntry(rsvp.id, true)}
                                className="py-1 px-2 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-white/40 text-[10px] font-bold transition-colors cursor-pointer"
                                title="Revert entry to awaiting"
                              >
                                Undo
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleEntry(rsvp.id, false)}
                                disabled={isCancelled}
                                className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                                  isCancelled
                                    ? 'opacity-30 cursor-not-allowed text-white/40'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                                }`}
                              >
                                Admit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Document Sign-Off Footer (For Print Ledger) */}
            <div className="hidden print:flex justify-between items-center pt-8 mt-8 border-t border-black text-xs font-mono">
              <div>
                <p>Gate Controller / Host Name: _______________________</p>
                <p className="mt-1 text-[10px] text-slate-500">Sign & Archive after event closure</p>
              </div>
              <div className="text-right">
                <p>Official Gate Seal / Signature: _______________________</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* 4. OPTIMISTIC VERIFIED POPUP MODAL                       */}
      {/* ========================================================= */}
      {lastScanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`max-w-md w-full rounded-3xl p-6 sm:p-7 space-y-5 text-center shadow-2xl border ${
              lastScanResult.valid && !lastScanResult.already_attended
                ? 'bg-gradient-to-b from-[#0F2D1F] to-[#0A1A12] border-emerald-500/50'
                : lastScanResult.already_attended
                ? 'bg-gradient-to-b from-[#382806] to-[#1C1402] border-amber-500/50'
                : 'bg-gradient-to-b from-[#3B1111] to-[#1F0707] border-red-500/50'
            }`}
          >
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
              <span
                className={`text-[11px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${
                  lastScanResult.valid && !lastScanResult.already_attended
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : lastScanResult.already_attended
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    : 'bg-red-500/20 text-red-300 border-red-400/30'
                }`}
              >
                {lastScanResult.valid && !lastScanResult.already_attended
                  ? 'ADMITTED • RECORDED IN SHEET'
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

            {/* Details */}
            {lastScanResult.rsvp && (
              <div className="bg-black/40 rounded-2xl p-4 text-left font-mono text-xs space-y-2 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-white/50">Email:</span>
                  <span className="text-white font-bold truncate max-w-[200px]">
                    {lastScanResult.rsvp.email}
                  </span>
                </div>
                {lastScanResult.rsvp.plus_one_name && (
                  <div className="flex justify-between text-amber-300">
                    <span>+1 Guest:</span>
                    <span className="font-bold">{lastScanResult.rsvp.plus_one_name}</span>
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

            {/* Resume scanning */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResumeScanning}
                className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-200 text-[#090D16] font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#E8621A]" />
                <span>Scan Next Guest (Auto in 3s)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MANUAL SEARCH FALLBACK MODAL                           */}
      {/* ========================================================= */}
      {manualSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-lg w-full bg-[#131B2E] border border-white/15 rounded-3xl p-6 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-[#E8621A]" />
                <h3 className="font-bold text-base text-white">Manual Guest Check-In</h3>
              </div>
              <button
                type="button"
                onClick={() => setManualSearchOpen(false)}
                className="text-white/50 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#E8621A]"
            />

            <div className="flex-1 overflow-y-auto space-y-2 max-h-72">
              {eventRSVPs
                .filter((r) => {
                  if (!manualQuery.trim()) return true;
                  const q = manualQuery.toLowerCase();
                  return (
                    (r.name && r.name.toLowerCase().includes(q)) ||
                    (r.email && r.email.toLowerCase().includes(q)) ||
                    (r.phone && r.phone.includes(q))
                  );
                })
                .slice(0, 20)
                .map((r) => {
                  const isEntered =
                    r.custom_responses?.attended === true || (r as any).status === 'attended';
                  return (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-xs text-white">{r.name}</p>
                        <p className="text-[11px] text-white/50">{r.email}</p>
                      </div>

                      {isEntered ? (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          ✓ Already Admitted
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handleToggleEntry(r.id, false);
                            setManualSearchOpen(false);
                          }}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
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
            <p className="text-xs text-white/60 font-mono">Loading Gate Command Center...</p>
          </div>
        </div>
      }
    >
      <OrganizerCheckInContent />
    </Suspense>
  );
}
