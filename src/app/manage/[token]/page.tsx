'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  MessageCircle,
  Share2,
  Copy,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Check,
  Zap,
  Sliders,
  QrCode,
  DoorOpen,
  UserCheck,
  UserX,
  AlertTriangle,
  Lock,
  ChevronRight,
  Download,
  Calendar,
  MapPin,
  Sparkles,
  ArrowLeft,
  X,
  Ticket
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { useTheme } from '@/components/common/ThemeContext';

interface EventData {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description?: string;
  location_name: string;
  location_address?: string;
  city?: string;
  start_at: string;
  end_at?: string;
  capacity?: number | null;
  cover_image_url?: string;
  status: string;
  source_platform?: string;
  external_price_text?: string;
  theme?: Record<string, any>;
  rsvp_form_config?: Record<string, any>;
}

interface RSVPItem {
  id: string;
  event_id: string;
  name: string;
  email: string;
  phone: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled';
  plus_one_name?: string;
  custom_responses?: {
    attended?: boolean;
    attended_at?: string | null;
    channel?: string;
    [key: string]: any;
  };
  created_at: string;
}

interface StatsData {
  total: number;
  confirmed: number;
  waitlisted: number;
  cancelled: number;
  checkedIn: number;
  capacity: number | null;
  requireApproval: boolean;
  registrationsClosed: boolean;
}

export default function MagicLinkHostSheet() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    confirmed: 0,
    waitlisted: 0,
    cancelled: 0,
    checkedIn: 0,
    capacity: null,
    requireApproval: false,
    registrationsClosed: false,
  });

  // UI Filters & Search
  const [activeTab, setActiveTab] = useState<'all' | 'waitlisted' | 'confirmed' | 'checked_in' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerManualInput, setScannerManualInput] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; guestName?: string } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Fetch Event & Live RSVPs
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/manage/${token}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Invalid or expired host magic link.');
      }

      setEvent(data.event);
      setRsvps(data.rsvps || []);
      setStats(data.stats);
    } catch (err: any) {
      console.error('[Host Sheet] Load error:', err);
      setError(err.message || 'Could not load event data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Execute Host Action via API
  const handleHostAction = async (action: string, payload: Record<string, any>) => {
    try {
      const res = await fetch(`/api/manage/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Action failed');
      }
      return data;
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Action failed'}`);
      throw err;
    }
  };

  // 1. APPROVE / IN (Move from waitlist or cancelled to Confirmed)
  const handleApproveGuest = async (rsvp: RSVPItem) => {
    setActionLoadingId(rsvp.id);
    try {
      await handleHostAction('update_rsvp_status', {
        rsvpId: rsvp.id,
        status: 'confirmed',
      });
      setRsvps((prev) =>
        prev.map((r) => (r.id === rsvp.id ? { ...r, status: 'confirmed' } : r))
      );
      setStats((prev) => ({
        ...prev,
        confirmed: prev.confirmed + 1,
        waitlisted: Math.max(0, prev.waitlisted - (rsvp.status === 'waitlisted' ? 1 : 0)),
        cancelled: Math.max(0, prev.cancelled - (rsvp.status === 'cancelled' ? 1 : 0)),
      }));
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      showToast(`✅ Admitted ${rsvp.name}! Pass unlocked & emailed.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. DECLINE / OUT (Move to Cancelled)
  const handleDeclineGuest = async (rsvp: RSVPItem) => {
    setActionLoadingId(rsvp.id);
    try {
      await handleHostAction('update_rsvp_status', {
        rsvpId: rsvp.id,
        status: 'cancelled',
      });
      setRsvps((prev) =>
        prev.map((r) => (r.id === rsvp.id ? { ...r, status: 'cancelled' } : r))
      );
      setStats((prev) => ({
        ...prev,
        cancelled: prev.cancelled + 1,
        confirmed: Math.max(0, prev.confirmed - (rsvp.status === 'confirmed' ? 1 : 0)),
        waitlisted: Math.max(0, prev.waitlisted - (rsvp.status === 'waitlisted' ? 1 : 0)),
      }));
      showToast(`Declined RSVP for ${rsvp.name}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. MOVE TO WAITLIST
  const handleWaitlistGuest = async (rsvp: RSVPItem) => {
    setActionLoadingId(rsvp.id);
    try {
      await handleHostAction('update_rsvp_status', {
        rsvpId: rsvp.id,
        status: 'waitlisted',
      });
      setRsvps((prev) =>
        prev.map((r) => (r.id === rsvp.id ? { ...r, status: 'waitlisted' } : r))
      );
      setStats((prev) => ({
        ...prev,
        waitlisted: prev.waitlisted + 1,
        confirmed: Math.max(0, prev.confirmed - (rsvp.status === 'confirmed' ? 1 : 0)),
        cancelled: Math.max(0, prev.cancelled - (rsvp.status === 'cancelled' ? 1 : 0)),
      }));
      showToast(`Moved ${rsvp.name} to waitlist.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. CHECK-IN AT DOOR (Toggle Attended)
  const handleToggleCheckIn = async (rsvp: RSVPItem) => {
    const isCurrentlyAttended = Boolean(rsvp.custom_responses?.attended);
    const newAttended = !isCurrentlyAttended;
    setActionLoadingId(rsvp.id);
    try {
      await handleHostAction('check_in_guest', {
        rsvpId: rsvp.id,
        attended: newAttended,
      });
      setRsvps((prev) =>
        prev.map((r) =>
          r.id === rsvp.id
            ? {
                ...r,
                custom_responses: {
                  ...(r.custom_responses || {}),
                  attended: newAttended,
                  attended_at: newAttended ? new Date().toISOString() : null,
                },
              }
            : r
        )
      );
      setStats((prev) => ({
        ...prev,
        checkedIn: prev.checkedIn + (newAttended ? 1 : -1),
      }));
      if (newAttended) {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        showToast(`🚪 Checked in ${rsvp.name}`);
      } else {
        showToast(`Un-marked check-in for ${rsvp.name}`);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. BATCH APPROVE ALL WAITLISTED
  const handleBatchApproveWaitlist = async () => {
    try {
      const res = await handleHostAction('batch_approve_waitlist', {});
      const count = res.approvedCount || 0;
      setRsvps((prev) =>
        prev.map((r) => (r.status === 'waitlisted' ? { ...r, status: 'confirmed' } : r))
      );
      setStats((prev) => ({
        ...prev,
        confirmed: prev.confirmed + count,
        waitlisted: 0,
      }));
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      showToast(`🎉 Admitted all ${count} pending guests!`);
    } catch {}
  };

  // 6. TOGGLE APPROVAL MODE (Curated vs Instant)
  const handleToggleApprovalMode = async () => {
    const newSetting = !stats.requireApproval;
    try {
      await handleHostAction('toggle_approval_mode', { requireApproval: newSetting });
      setStats((prev) => ({ ...prev, requireApproval: newSetting }));
      showToast(
        newSetting
          ? '🛡️ Curated Mode Active: New RSVPs will require your explicit approval.'
          : '⚡ Instant Mode Active: New RSVPs are auto-admitted.'
      );
    } catch {}
  };

  // 7. TOGGLE REGISTRATIONS (Open vs Closed)
  const handleToggleRegistrations = async () => {
    const newSetting = !stats.registrationsClosed;
    try {
      await handleHostAction('toggle_registrations', { closed: newSetting });
      setStats((prev) => ({ ...prev, registrationsClosed: newSetting }));
      showToast(newSetting ? '🛑 Registrations closed.' : '✅ Registrations open to public.');
    } catch {}
  };

  // 8. COPY GUEST PHONE NUMBERS (For quick WhatsApp group creation)
  const handleCopyPhoneNumbers = () => {
    const phones = rsvps
      .filter((r) => r.status === 'confirmed' && r.phone)
      .map((r) => r.phone.replace(/[^0-9]/g, ''))
      .filter(Boolean);

    if (phones.length === 0) {
      showToast('No confirmed guest phone numbers available.');
      return;
    }

    navigator.clipboard.writeText(phones.join(', '));
    showToast(`📋 Copied ${phones.length} numbers to clipboard!`);
  };

  // 9. EXPORT CSV
  const handleExportCSV = () => {
    if (rsvps.length === 0) {
      showToast('Empty guest list exported. There are no guests in this preview.');
      const headers = ['Name', 'Email', 'Phone', 'Status', 'Attended', 'Plus One', 'Registered At'];
      const csvContent = headers.join(',') + '\n';
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event?.slug || 'event'}-guest-list-preview.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Status', 'Attended', 'Plus One', 'Registered At'];
    const rows = rsvps.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.phone || ''}"`,
      `"${r.status}"`,
      `"${r.custom_responses?.attended ? 'Yes' : 'No'}"`,
      `"${r.plus_one_name || ''}"`,
      `"${new Date(r.created_at).toLocaleString('en-IN')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event?.slug || 'event'}-guest-list.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Guest list CSV downloaded');
  };

  // Filtered Roster
  const filteredRsvps = useMemo(() => {
    return rsvps.filter((r) => {
      // Tab filter
      if (activeTab === 'waitlisted' && r.status !== 'waitlisted') return false;
      if (activeTab === 'confirmed' && r.status !== 'confirmed') return false;
      if (activeTab === 'checked_in' && !r.custom_responses?.attended) return false;
      if (activeTab === 'cancelled' && r.status !== 'cancelled') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesEmail = r.email.toLowerCase().includes(q);
        const matchesPhone = (r.phone || '').includes(q);
        return matchesName || matchesEmail || matchesPhone;
      }
      return true;
    });
  }, [rsvps, activeTab, searchQuery]);

  // Formatted Public Links
  const publicReelUrl = event ? `/vibes?event=${encodeURIComponent(event.slug)}` : '';
  const publicWebUrl = event ? `/${event.slug}` : '';

  const copyPublicInvite = () => {
    if (!event) return;
    const fullUrl = `${window.location.origin}/vibes?event=${encodeURIComponent(event.slug)}`;
    navigator.clipboard.writeText(fullUrl);
    showToast('🔗 Public invite link copied! Safe to forward to groups.');
  };

  // Door Scanner Manual Verification
  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerManualInput.trim()) return;

    const query = scannerManualInput.trim().toLowerCase();
    const matched = rsvps.find(
      (r) =>
        r.id.toLowerCase() === query ||
        r.id.slice(0, 8).toLowerCase() === query ||
        r.email.toLowerCase() === query ||
        (r.phone && r.phone.includes(query))
    );

    if (matched) {
      if (matched.status !== 'confirmed') {
        setScanResult({
          success: false,
          message: `Guest is marked as ${matched.status.toUpperCase()}. Please admit them first.`,
          guestName: matched.name,
        });
      } else {
        handleToggleCheckIn(matched);
        setScanResult({
          success: true,
          message: 'Valid Pass Verified! Guest checked in.',
          guestName: matched.name,
        });
      }
    } else {
      setScanResult({
        success: false,
        message: 'No matching RSVP found for this code or phone number.',
      });
    }
  };

  const isPreview = token === 'preview' || token === 'demo' || event?.theme?.manage_token === 'preview';

  const formattedDate = useMemo(() => {
    if (!event?.start_at) return 'Wed, 25 Nov · 1:30 PM IST';
    try {
      const d = new Date(event.start_at);
      if (isNaN(d.getTime())) return 'Wed, 25 Nov · 1:30 PM IST';
      const dayStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      const timeStr = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${dayStr} · ${timeStr} IST`;
    } catch {
      return 'Wed, 25 Nov · 1:30 PM IST';
    }
  }, [event?.start_at]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] dark:bg-[#0A0C10] light:bg-white text-gray-900 dark:text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full border-3 border-[#FF5500]/20 border-t-[#FF5500] animate-spin mb-4" />
          <p className="text-gray-900 dark:text-white/80 text-sm font-medium">Opening your Host Management Sheet...</p>
          <p className="text-gray-500 dark:text-white/40 text-xs mt-1">Verifying private security token</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0A0C10] dark:bg-[#0A0C10] light:bg-white text-gray-900 dark:text-white flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Access Restricted</h1>
          <p className="text-gray-600 dark:text-white/60 text-sm mb-6 leading-relaxed">
            {error || 'This magic host link is invalid or no longer active. Check your WhatsApp chat for the latest private control link.'}
          </p>
          <Link
            href="/vibes"
            className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white/10 hover:bg-black dark:hover:bg-white/15 text-white text-sm font-semibold transition-all shadow-sm"
          >
            Explore Vibe Instant
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] dark:bg-[#0A0C10] light:bg-white text-gray-900 dark:text-white font-sans selection:bg-[#FF5500]/30 selection:text-white flex flex-col justify-between">
      {/* Platform Navigation */}
      <Navbar />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-gray-900/95 dark:bg-black/90 backdrop-blur-xl border border-gray-700 dark:border-white/20 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-8">
        {/* Subheader Bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Host dashboard</span>
          </Link>

          <span className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/15 text-gray-500 dark:text-white/50 text-[11px] font-medium">
            {isPreview ? 'Host management - Preview' : 'Host management'}
          </span>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pt-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-gray-500 dark:text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
              <span>YOUR HOST SPACE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight flex items-baseline">
              <span>{event.title}</span>
              <span className="text-[#FF5500]">.</span>
            </h1>

            {event.tagline && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-white/60 leading-relaxed max-w-2xl">
                {event.tagline}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-600 dark:text-white/60 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF8C42]" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF8C42]" />
                {event.location_name}{event.city ? `, ${event.city}` : ''}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                {event.external_price_text || 'Free entry'}
              </span>
              <Link
                href={publicReelUrl}
                target="_blank"
                className="flex items-center gap-1 text-[#FF8C42] hover:text-[#FF5500] hover:underline font-medium ml-auto sm:ml-0"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Open in Vibe Instant ↗</span>
              </Link>
            </div>
          </div>

          {/* Hero Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start">
            <button
              onClick={copyPublicInvite}
              className="px-4 py-2 rounded-lg bg-[#18181B] hover:bg-black dark:bg-[#18181B] dark:hover:bg-[#27272A] border border-gray-300 dark:border-white/10 text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share invite</span>
            </button>

            <button
              onClick={() => setShowScannerModal(true)}
              className="px-4 py-2 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-sm shadow-[#EA580C]/20 cursor-pointer"
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Door check-in</span>
            </button>

            <button
              onClick={fetchData}
              className="p-2 rounded-lg text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* For Hosts Only Warning Banner */}
        <div className="p-3.5 px-4 rounded-xl bg-[#FFF4ED] dark:bg-[#2B160C]/60 border border-[#FDBA74] dark:border-[#FF5500]/25 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#9A3412] dark:text-[#FFA07A]">
            <Lock className="w-4 h-4 text-[#EA580C] dark:text-[#FF5500] shrink-0" />
            <span>
              <strong className="font-semibold text-[#7C2D12] dark:text-white/95">For hosts only.</strong> This link controls guest access. Share the public invite with your guests, not this page.
            </span>
          </div>
          <button
            onClick={copyPublicInvite}
            className="text-[#EA580C] dark:text-[#FF8C42] hover:underline font-semibold flex items-center gap-1 shrink-0 text-xs cursor-pointer"
          >
            Share invite ↗
          </button>
        </div>

        {/* 4-Column Stats Row with Dividers */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-y border-gray-200 dark:border-white/10 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-white/10 py-5">
          {/* Column 1: Total RSVPs */}
          <div className="px-4 py-3 sm:py-0">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/50 font-medium">
              <span>Total RSVPs</span>
              <Users className="w-4 h-4 text-gray-400 dark:text-white/40" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
              {stats.total}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-white/40 mt-1">
              Across all guest statuses
            </div>
          </div>

          {/* Column 2: Confirmed */}
          <div className="px-4 py-3 sm:py-0">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/50 font-medium">
              <span>Confirmed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              {stats.confirmed}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-white/40 mt-1">
              On the guest list
            </div>
          </div>

          {/* Column 3: Pending review */}
          <div className="px-4 py-3 sm:py-0">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/50 font-medium">
              <span>Pending review</span>
              <Shield className="w-4 h-4 text-[#FF8C42]" />
            </div>
            <div className="text-3xl font-black text-[#EA580C] dark:text-[#FF8C42] mt-2">
              {stats.waitlisted}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-white/40 mt-1">
              Awaiting your approval
            </div>
          </div>

          {/* Column 4: Checked in */}
          <div className="px-4 py-3 sm:py-0">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/50 font-medium">
              <span>Checked in</span>
              <DoorOpen className="w-4 h-4 text-gray-400 dark:text-white/40" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mt-2">
              {stats.checkedIn}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-white/40 mt-1">
              Through the door
            </div>
          </div>
        </div>

        {/* Admission & Access Section */}
        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FF5500]" />
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Admission & access
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                Your guest list, on your terms.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  !stats.registrationsClosed ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
              <span
                className={`text-[11px] font-medium ${
                  !stats.registrationsClosed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-400 dark:text-white/40'
                }`}
              >
                {!stats.registrationsClosed ? 'Registration open' : 'Registration closed'}
              </span>
            </div>
          </div>

          {/* Side-by-side Toggles with Divider */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-white/10 pt-2">
            {/* Toggle 1: Require host approval */}
            <div className="py-3 md:py-0 md:pr-8 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  Require host approval
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                  {stats.requireApproval
                    ? 'New RSVPs wait for your review.'
                    : 'New RSVPs join without a review.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleApprovalMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  stats.requireApproval ? 'bg-[#FF5500]' : 'bg-gray-300 dark:bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    stats.requireApproval ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Accept new RSVPs */}
            <div className="py-3 md:py-0 md:pl-8 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  Accept new RSVPs
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                  {!stats.registrationsClosed
                    ? 'Your public invite is open for registrations.'
                    : 'New registrations are paused.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleRegistrations}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  !stats.registrationsClosed ? 'bg-[#FF5500]' : 'bg-gray-300 dark:bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    !stats.registrationsClosed ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Guest List Section */}
        <section className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Guest list
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70">
                  {stats.total}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                Everyone joining, from first RSVP to check-in.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPhoneNumbers}
                className="px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-white/10 text-xs text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy numbers</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 rounded-lg bg-[#18181B] hover:bg-black dark:bg-[#18181B] dark:hover:bg-[#27272A] border border-gray-200 dark:border-white/10 text-xs font-medium text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Underline Tabs & Search Box */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All guests', count: stats.total },
                { id: 'waitlisted', label: 'Pending review', count: stats.waitlisted },
                { id: 'confirmed', label: 'Confirmed', count: stats.confirmed },
                { id: 'checked_in', label: 'Checked In', count: stats.checkedIn },
                { id: 'cancelled', label: 'Declined', count: stats.cancelled },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all relative flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'text-gray-900 dark:text-white font-semibold'
                        : 'text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[11px] opacity-70">{tab.count}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5500] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative pb-2 min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-gray-400 dark:text-white/40 absolute left-3 top-1/2 -translate-y-1/2 -mt-1" />
              <input
                type="text"
                placeholder="Search name, phone or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-transparent border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-[#FF5500]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 -mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* List or Empty State */}
          {filteredRsvps.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto text-gray-400 dark:text-white/40">
                <Users className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  {searchQuery
                    ? 'No guests match your search'
                    : activeTab === 'waitlisted'
                    ? 'No pending review guests yet.'
                    : activeTab === 'confirmed'
                    ? 'No confirmed guests yet.'
                    : activeTab === 'checked_in'
                    ? 'No guests checked in yet.'
                    : activeTab === 'cancelled'
                    ? 'No declined guests.'
                    : 'Your guest list starts here.'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/40">
                  When people RSVP, they'll appear here.
                </p>
              </div>

              <button
                onClick={copyPublicInvite}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#18181B] hover:bg-black dark:bg-[#18181B] dark:hover:bg-[#27272A] border border-gray-200 dark:border-white/10 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share invite ↗</span>
              </button>

              {/* Bottom Preview Info & Export Message */}
              <div className="pt-8 space-y-1.5 text-xs">
                <p className="text-gray-400 dark:text-white/40 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Preview only · No real guests or event settings are changed.</span>
                </p>
                {exportNotice && (
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {exportNotice}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredRsvps.map((rsvp) => {
                const isAttended = Boolean(rsvp.custom_responses?.attended);
                const isConfirmed = rsvp.status === 'confirmed';
                const isWaitlisted = rsvp.status === 'waitlisted';
                const isCancelled = rsvp.status === 'cancelled';
                const isActing = actionLoadingId === rsvp.id;

                const cleanPhone = rsvp.phone ? rsvp.phone.replace(/[^0-9]/g, '') : '';
                const waLink = cleanPhone ? `https://wa.me/${cleanPhone}` : null;

                return (
                  <div
                    key={rsvp.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isWaitlisted
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : isCancelled
                        ? 'bg-rose-500/5 border-rose-500/10 opacity-70'
                        : isAttended
                        ? 'bg-cyan-500/5 border-cyan-500/30'
                        : 'bg-[#12151D] border-white/10'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Guest Info Left */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                            isConfirmed
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isWaitlisted
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {rsvp.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">{rsvp.name}</span>

                            {/* Status Pill */}
                            {isConfirmed && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                IN · Confirmed
                              </span>
                            )}
                            {isWaitlisted && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Pending Review
                              </span>
                            )}
                            {isCancelled && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                OUT · Declined
                              </span>
                            )}
                            {isAttended && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Door Checked In
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                            {rsvp.phone && <span>{rsvp.phone}</span>}
                            {rsvp.email && <span>{rsvp.email}</span>}
                            <span>
                              {new Date(rsvp.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Guest Action Buttons Right (In & Out RSVP Control) */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Direct WhatsApp DM */}
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-white/5 hover:bg-[#25D366]/20 border border-white/10 hover:border-[#25D366]/40 text-white/70 hover:text-[#25D366] transition-all cursor-pointer"
                            title={`Chat with ${rsvp.name} on WhatsApp`}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        {/* CASE 1: WAITLISTED GUEST -> Admit (IN) or Decline (OUT) */}
                        {isWaitlisted && (
                          <>
                            <button
                              onClick={() => handleApproveGuest(rsvp)}
                              disabled={isActing}
                              className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-black flex items-center gap-1 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Admit (In)</span>
                            </button>

                            <button
                              onClick={() => handleDeclineGuest(rsvp)}
                              disabled={isActing}
                              className="py-1.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold text-rose-300 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {/* CASE 2: CONFIRMED GUEST -> Door Check In, Waitlist, or Remove (OUT) */}
                        {isConfirmed && (
                          <>
                            <button
                              onClick={() => handleToggleCheckIn(rsvp)}
                              disabled={isActing}
                              className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                isAttended
                                  ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                              }`}
                              title={isAttended ? 'Click to uncheck' : 'Click to check-in at door'}
                            >
                              <DoorOpen className="w-3.5 h-3.5" />
                              <span>{isAttended ? 'Checked In ✓' : 'Check In'}</span>
                            </button>

                            <button
                              onClick={() => handleWaitlistGuest(rsvp)}
                              disabled={isActing}
                              className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-amber-500/20 text-white/50 hover:text-amber-300 text-xs font-medium transition-all cursor-pointer"
                              title="Move back to waitlist"
                            >
                              Waitlist
                            </button>

                            <button
                              onClick={() => handleDeclineGuest(rsvp)}
                              disabled={isActing}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-all cursor-pointer"
                              title="Remove guest (Move OUT)"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* CASE 3: CANCELLED / DECLINED GUEST -> Re-admit (IN) */}
                        {isCancelled && (
                          <button
                            onClick={() => handleApproveGuest(rsvp)}
                            disabled={isActing}
                            className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-emerald-500/20 border border-white/15 hover:border-emerald-500/40 text-xs font-bold text-white hover:text-emerald-300 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Re-Admit (In)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Door Check-In Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#12151D] border border-gray-200 dark:border-white/15 p-6 space-y-5 shadow-2xl relative text-gray-900 dark:text-white">
            <button
              onClick={() => {
                setShowScannerModal(false);
                setScanResult(null);
                setScannerManualInput('');
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-600 dark:text-white flex items-center justify-center cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#FF5500]" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Door Pass Check-In</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-white/60">
                Verify guest passes at the door or turf. Enter guest email, phone, or pass code:
              </p>
            </div>

            {/* Manual Verification Form */}
            <form onSubmit={handleManualScanSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 9820011223 or rahul@gmail.com"
                  value={scannerManualInput}
                  onChange={(e) => setScannerManualInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-[#FF5500]"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#FF5500] hover:bg-[#FF5500]/90 text-sm font-bold text-white transition-all cursor-pointer shadow-lg shadow-[#FF5500]/20"
              >
                Verify & Check In
              </button>
            </form>

            {/* Scan Feedback Result */}
            {scanResult && (
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 animate-in zoom-in-95 duration-200 ${
                  scanResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {scanResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{scanResult.success ? 'Door Pass Valid' : 'Check-In Issue'}</span>
                </div>
                {scanResult.guestName && (
                  <p className="font-semibold text-gray-900 dark:text-white">{scanResult.guestName}</p>
                )}
                <p>{scanResult.message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform Footer */}
      <Footer />
    </div>
  );
}
