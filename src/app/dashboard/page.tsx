'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Plus,
  Compass,
  Users,
  ExternalLink,
  Trash2,
  Share2,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Ticket,
  Download,
  Copy,
  Check,
  X,
  Layers,
  ChevronRight,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Mail,
  QrCode,
  Navigation,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  Building2,
  Lock,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import ShareEventModal from '@/components/events/ShareEventModal';
import DigitalPassModal from '@/components/ui/DigitalPassModal';
import HostBroadcastModal from '@/components/communication/HostBroadcastModal';
import HostInboxDrawer from '@/components/communication/HostInboxDrawer';
import {
  getEvents,
  getRSVPs,
  deleteEvent,
  syncEventsWithSupabase,
  syncRSVPsWithSupabase,
  formatIST,
  cancelRSVP
} from '@/lib/store';
import { EventItem, RSVPItem } from '@/types';
import { useAuth } from '@/lib/auth';

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoggedIn } = useAuth();

  // Primary Dual-Tab: 'passes' (My Passes & Bookings) vs 'hosted' (Hosted Gatherings)
  const tabParam = searchParams.get('tab');
  const [mainTab, setMainTab] = useState<'passes' | 'hosted'>(
    tabParam === 'hosted' ? 'hosted' : 'passes'
  );

  // Sync tab from URL if changed externally
  useEffect(() => {
    if (tabParam === 'hosted') {
      setMainTab('hosted');
    } else if (tabParam === 'passes') {
      setMainTab('passes');
    }
  }, [tabParam]);

  // Update URL query param when main tab changes
  const handleSwitchMainTab = (newTab: 'passes' | 'hosted') => {
    setMainTab(newTab);
    router.replace(`/dashboard?tab=${newTab}`, { scroll: false });
  };

  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  // Sub-tabs
  const [passFilter, setPassFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [hostFilter, setHostFilter] = useState<'upcoming' | 'past' | 'drafts' | 'all'>('upcoming');

  // Search queries
  const [passSearch, setPassSearch] = useState('');
  const [hostSearch, setHostSearch] = useState('');

  // Selected Pass for BookMyShow-style Digital Pass Modal
  const [selectedPass, setSelectedPass] = useState<{ rsvp: RSVPItem; event: EventItem } | null>(null);

  // Selected Event for Host Modals
  const [shareEvent, setShareEvent] = useState<EventItem | null>(null);
  const [guestListEvent, setGuestListEvent] = useState<EventItem | null>(null);
  const [broadcastEvent, setBroadcastEvent] = useState<EventItem | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Guest email switcher (for attendees accessing bookings via email)
  const [guestEmail, setGuestEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Load & Sync data
  const loadData = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([syncEventsWithSupabase(), syncRSVPsWithSupabase()]);
    } catch (e) {
      console.warn('Dashboard sync fallback:', e);
    } finally {
      setEvents(getEvents());
      setRsvps(getRSVPs());
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Determine active guest email for passes
  useEffect(() => {
    const active =
      profile?.email ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('vibe_guest_email') ||
          localStorage.getItem('vibe_user_email') ||
          ''
        : '');
    setGuestEmail(active);
    setEmailInput(active);
  }, [profile]);

  // Update guest email manually
  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setGuestEmail(emailInput.trim());
      if (typeof window !== 'undefined') {
        localStorage.setItem('vibe_guest_email', emailInput.trim());
      }
      setIsEditingEmail(false);
    }
  };

  // ----------------------------------------------------
  // PASSES COMPUTATION (MakeMyTrip / BookMyShow Bookings)
  // ----------------------------------------------------
  const userPasses = useMemo(() => {
    const cleanEmail = (guestEmail || profile?.email || '').trim().toLowerCase();
    const cleanUserId = profile?.id;

    // Match RSVPs belonging to this user or email
    const matchingRsvps = rsvps.filter((r) => {
      const rEmail = (r.email || r.guest_email || '').toLowerCase().trim();
      const matchEmail = cleanEmail && rEmail === cleanEmail;
      const matchUser = cleanUserId && (r as any).user_id === cleanUserId;
      return matchEmail || matchUser;
    });

    // Pair each RSVP with its corresponding event
    const paired = matchingRsvps
      .map((r) => ({
        rsvp: r,
        event: events.find((e) => e.id === r.event_id || e.slug === r.event_slug),
      }))
      .filter(
        (item): item is { rsvp: RSVPItem; event: EventItem } => Boolean(item.event)
      );

    return paired;
  }, [rsvps, events, guestEmail, profile]);

  // Filtered Passes (Upcoming vs Past vs All + Search)
  const filteredPasses = useMemo(() => {
    const now = new Date().getTime();
    return userPasses
      .filter(({ event }) => {
        const eventTime = event.start_at ? new Date(event.start_at).getTime() : now;
        if (passFilter === 'upcoming') return eventTime >= now;
        if (passFilter === 'past') return eventTime < now;
        return true;
      })
      .filter(({ event, rsvp }) => {
        if (!passSearch.trim()) return true;
        const q = passSearch.toLowerCase();
        return (
          event.title.toLowerCase().includes(q) ||
          event.city.toLowerCase().includes(q) ||
          (event.location_name || '').toLowerCase().includes(q) ||
          rsvp.name.toLowerCase().includes(q) ||
          rsvp.id.toLowerCase().includes(q)
        );
      });
  }, [userPasses, passFilter, passSearch]);

  // ----------------------------------------------------
  // HOSTED EVENTS COMPUTATION (Host Console)
  // ----------------------------------------------------
  const hostEvents = useMemo(() => {
    if (!profile) return events;
    const matching = events.filter(
      (e) =>
        e.organizer_id === profile.id ||
        (profile.handle && e.organizer_handle === profile.handle)
    );
    return matching.length > 0 ? matching : events;
  }, [events, profile]);

  const metrics = useMemo(() => {
    const now = new Date();
    let upcoming = 0;
    let totalRsvps = 0;

    const eventIds = new Set(hostEvents.map((e) => e.id));
    rsvps.forEach((r) => {
      if (eventIds.has(r.event_id) && r.status === 'confirmed') {
        totalRsvps++;
      }
    });

    hostEvents.forEach((e) => {
      const st = String(e.status || '');
      const isLive = st === 'live' || st === 'published';
      const isFuture = e.start_at ? new Date(e.start_at) >= now : true;
      if (isLive && isFuture) upcoming++;
    });

    return {
      totalHosted: hostEvents.length,
      totalGuests: totalRsvps,
      upcomingEvents: upcoming,
      confirmedPasses: userPasses.filter((p) => p.rsvp.status === 'confirmed').length,
    };
  }, [hostEvents, rsvps, userPasses]);

  // Filtered Hosted Events
  const filteredHostEvents = useMemo(() => {
    const now = new Date();
    return hostEvents
      .filter((e) => {
        const st = String(e.status || '');
        const isLive = st === 'live' || st === 'published';
        const isDraft = st === 'draft';
        const isFuture = e.start_at ? new Date(e.start_at) >= now : true;

        if (hostFilter === 'upcoming') return isLive && isFuture;
        if (hostFilter === 'past') return isLive && !isFuture;
        if (hostFilter === 'drafts') return isDraft;
        return true;
      })
      .filter((e) => {
        if (!hostSearch.trim()) return true;
        const q = hostSearch.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          (e.location_name || '').toLowerCase().includes(q)
        );
      });
  }, [hostEvents, hostFilter, hostSearch]);

  const getEventRsvpCount = (eventId: string) => {
    return rsvps.filter((r) => r.event_id === eventId && r.status === 'confirmed').length;
  };

  const handleDeleteEvent = async (event: EventItem) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"? This cannot be undone.`)) return;
    deleteEvent(event.id);
    setEvents(getEvents());
  };

  const handleCancelPass = (rsvpId: string) => {
    if (!confirm('Are you sure you want to cancel this booking pass?')) return;
    cancelRSVP(rsvpId);
    setRsvps(getRSVPs());
  };

  // Format date like BookMyShow poster badge: "Sat, 10 Oct" or "Sun, 24 Nov · 7:00 PM"
  const formatBookMyShowDate = (dateStr?: string) => {
    if (!dateStr) return 'Date TBA';
    try {
      const d = new Date(dateStr);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${weekday}, ${day} ${month} · ${time}`;
    } catch {
      return formatIST(dateStr);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0A0A0A] flex flex-col font-sans selection:bg-[#0A0A0A] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* ==================================================== */}
        {/* HERO ACCOUNT BANNER (MakeMyTrip & BookMyShow Style)  */}
        {/* ==================================================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs mb-8 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* User Identity Details */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#334155] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm overflow-hidden shrink-0 border-2 border-white">
                {profile?.avatar_url && !profile?.email?.toLowerCase().includes('pandeysuyash100@gmail.com') ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name || 'User'}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(profile?.name || guestEmail || 'VIBE')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Member
                  </span>
                  <span className="text-xs text-[#94A3B8]">·</span>
                  <span className="text-xs font-semibold text-[#64748B]">
                    {guestEmail || profile?.email || 'Account Hub'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A] mt-1.5">
                  {profile?.name ? `Welcome back, ${profile.name}` : 'My Bookings & Gatherings'}
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 max-w-xl">
                  Manage your digital passes, upcoming event admissions, and host station analytics from one unified console.
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-all hover:border-[#0F172A]"
              >
                <Compass className="w-4 h-4 text-[#64748B]" />
                <span>Explore Events</span>
              </Link>

              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-xs font-bold text-white transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>List New Event</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar (MakeMyTrip Style KPI Strip) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-[#F1F5F9]">
            {/* Metric 1: My Confirmed Passes */}
            <button
              onClick={() => handleSwitchMainTab('passes')}
              className={`p-3.5 sm:p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                mainTab === 'passes'
                  ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  My Passes
                </span>
                <Ticket className="w-4 h-4 text-[#E8621A]" />
              </div>
              <p className="text-2xl font-black text-[#0F172A] mt-1.5">{metrics.confirmedPasses}</p>
              <span className="text-[11px] text-[#64748B] mt-0.5 block font-medium">
                Confirmed tickets
              </span>
            </button>

            {/* Metric 2: Gatherings Hosted */}
            <button
              onClick={() => handleSwitchMainTab('hosted')}
              className={`p-3.5 sm:p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                mainTab === 'hosted'
                  ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Hosted Events
                </span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-[#0F172A] mt-1.5">{metrics.totalHosted}</p>
              <span className="text-[11px] text-[#64748B] mt-0.5 block font-medium">
                Live & scheduled
              </span>
            </button>

            {/* Metric 3: Total Guests Hosted */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Total Guests
                </span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-[#0F172A] mt-1.5">{metrics.totalGuests}</p>
              <span className="text-[11px] text-[#64748B] mt-0.5 block font-medium">
                Confirmed door RSVPs
              </span>
            </div>

            {/* Metric 4: Live / Active Upcoming */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Upcoming Hosted
                </span>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-[#0F172A] mt-1.5">{metrics.upcomingEvents}</p>
              <span className="text-[11px] text-[#64748B] mt-0.5 block font-medium">
                Gatherings in progress
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* DUAL-CORE NAVIGATION TABS (MakeMyTrip Architecture) */}
        {/* ==================================================== */}
        <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] mb-6 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSwitchMainTab('passes')}
              className={`flex items-center gap-2.5 pb-3 px-2 text-sm sm:text-base font-black transition-all border-b-2 cursor-pointer ${
                mainTab === 'passes'
                  ? 'border-[#E8621A] text-[#0F172A]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Ticket className="w-5 h-5 text-[#E8621A]" />
              <span>My Passes & Bookings</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  mainTab === 'passes'
                    ? 'bg-[#E8621A]/10 text-[#E8621A]'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {userPasses.length}
              </span>
            </button>

            <button
              onClick={() => handleSwitchMainTab('hosted')}
              className={`flex items-center gap-2.5 pb-3 px-2 text-sm sm:text-base font-black transition-all border-b-2 cursor-pointer ${
                mainTab === 'hosted'
                  ? 'border-[#0F172A] text-[#0F172A]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Hosted Gatherings</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  mainTab === 'hosted'
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}
              >
                {hostEvents.length}
              </span>
            </button>
          </div>

          <button
            onClick={loadData}
            title="Refresh bookings"
            className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-white rounded-xl transition-colors shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ==================================================== */}
        {/* TAB CONTENT 1: MY PASSES & BOOKINGS (BookMyShow UX)  */}
        {/* ==================================================== */}
        {mainTab === 'passes' && (
          <div className="space-y-6">
            {/* Sub-header Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'upcoming', label: 'Upcoming Passes' },
                  { id: 'past', label: 'Past Events' },
                  { id: 'all', label: 'All Bookings' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPassFilter(tab.id as any)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      passFilter === tab.id
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Passes */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search passes by event or venue..."
                  value={passSearch}
                  onChange={(e) => setPassSearch(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] transition-colors shadow-xs"
                />
                {passSearch && (
                  <button
                    onClick={() => setPassSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Email Association Notice / Switcher */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-[#64748B]">
                <Mail className="w-4 h-4 text-[#94A3B8] shrink-0" />
                <span>
                  Showing passes issued to <strong className="text-[#0F172A] font-bold">{guestEmail || 'your guest session'}</strong>
                </span>
              </div>

              {isEditingEmail ? (
                <form onSubmit={handleSaveEmail} className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="Enter booking email..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="px-3 py-1 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#0F172A]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#0F172A] text-white text-xs font-bold rounded-lg hover:bg-[#1E293B]"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(false)}
                    className="text-[#94A3B8] hover:text-[#0F172A]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsEditingEmail(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  Change Email
                </button>
              )}
            </div>

            {/* BookMyShow Style Passes Grid */}
            {filteredPasses.length === 0 ? (
              <div className="py-20 bg-white border border-dashed border-[#E2E8F0] rounded-3xl flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#E8621A] mb-4 shadow-xs">
                  <Ticket className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-[#0F172A]">
                  {passFilter === 'upcoming'
                    ? 'No upcoming confirmed passes'
                    : 'No bookings found'}
                </h3>
                <p className="text-xs text-[#64748B] mt-1.5 max-w-md">
                  Bookings and event passes you register for will appear here with live QR verification codes, barcodes, and calendar sync.
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <Link
                    href="/discover"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white text-xs font-bold rounded-xl hover:bg-[#1E293B] transition-all shadow-xs"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore City Gatherings</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPasses.map(({ rsvp, event }) => {
                  const isConfirmed = rsvp.status === 'confirmed';
                  const isWaitlisted = rsvp.status === 'waitlisted';
                  const isCancelled = rsvp.status === 'cancelled';
                  const dateBadge = formatBookMyShowDate(event.start_at);

                  return (
                    <div
                      key={rsvp.id}
                      className="group bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#0F172A] overflow-hidden transition-all hover:shadow-lg flex flex-col"
                    >
                      {/* BookMyShow 4:5 Poster Image Container with Date Pill Overlay */}
                      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full bg-[#0F172A] overflow-hidden">
                        {event.cover_image_url ? (
                          <Image
                            src={event.cover_image_url}
                            alt={event.title}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white text-xs font-bold">
                            VIBE GATHERING
                          </div>
                        )}

                        {/* Top Gradient & Badges */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />

                        {/* Status Badge Top Left */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                          {isConfirmed && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Confirmed
                            </span>
                          )}
                          {isWaitlisted && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Waitlist
                            </span>
                          )}
                          {isCancelled && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                              Cancelled
                            </span>
                          )}
                        </div>

                        {/* Pass Serial Top Right */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/60 text-white/90 backdrop-blur-md">
                            #{rsvp.id.slice(-6).toUpperCase()}
                          </span>
                        </div>

                        {/* BookMyShow Date Banner (Bottom Edge Overlay) */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent z-10">
                          <p className="text-xs font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#E8621A]" />
                            <span>{dateBadge}</span>
                          </p>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#E8621A] uppercase tracking-wider">
                            <span>{event.category || 'Special Gathering'}</span>
                            <span className="text-[#CBD5E1]">·</span>
                            <span>{event.city || 'Mumbai'}</span>
                          </div>

                          <h3 className="font-black text-base text-[#0F172A] mt-1 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h3>

                          {/* Venue Line */}
                          <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-2.5">
                            <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                            <span className="truncate font-medium">
                              {event.location_name || event.location_address || event.city}
                            </span>
                          </div>

                          {/* Ticket Holder info */}
                          <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
                            <span>Pass Holder:</span>
                            <span className="font-bold text-[#0F172A] truncate max-w-[160px]">
                              {rsvp.name || rsvp.guest_name || 'Guest'}
                            </span>
                          </div>
                        </div>

                        {/* Card Action Buttons (BookMyShow Style "View Pass") */}
                        <div className="space-y-2 pt-2">
                          <button
                            onClick={() => setSelectedPass({ rsvp, event })}
                            className="w-full py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                          >
                            <QrCode className="w-4 h-4 text-[#E8621A]" />
                            <span>View Digital Pass & QR</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/${event.slug}`}
                              target="_blank"
                              className="flex-1 py-2 px-3 rounded-lg border border-[#E2E8F0] hover:border-[#0F172A] text-[#0F172A] text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1"
                            >
                              <span>Event Page</span>
                              <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
                            </Link>

                            <button
                              onClick={() => handleCancelPass(rsvp.id)}
                              title="Cancel RSVP"
                              className="py-2 px-3 rounded-lg border border-[#E2E8F0] hover:bg-rose-50 hover:border-rose-200 text-[#94A3B8] hover:text-rose-600 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB CONTENT 2: HOSTED GATHERINGS (Host Console UX)   */}
        {/* ==================================================== */}
        {mainTab === 'hosted' && (
          <div className="space-y-6">
            {/* Sub-header Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'upcoming', label: 'Live & Upcoming' },
                  { id: 'past', label: 'Past Events' },
                  { id: 'drafts', label: 'Drafts' },
                  { id: 'all', label: 'All Hosted' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setHostFilter(tab.id as any)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      hostFilter === tab.id
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Guest Inquiries Inbox */}
                <button
                  onClick={() => setIsInboxOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-orange-500 text-[#0F172A] hover:text-orange-600 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                  title="View direct messages and inquiries from attendees"
                >
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <span>Inquiries Inbox</span>
                </button>

                {/* Search Hosted Events */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search hosted events..."
                    value={hostSearch}
                    onChange={(e) => setHostSearch(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] transition-colors shadow-xs"
                  />
                  {hostSearch && (
                    <button
                      onClick={() => setHostSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hosted Events Grid */}
            {filteredHostEvents.length === 0 ? (
              <div className="py-20 bg-white border border-dashed border-[#E2E8F0] rounded-3xl flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-[#0F172A]">
                  {hostFilter === 'upcoming'
                    ? 'No active or upcoming events scheduled'
                    : 'No hosted events found'}
                </h3>
                <p className="text-xs text-[#64748B] mt-1.5 max-w-md">
                  Publish a gathering in 60 seconds with our instant AI event creator or customize every detail manually.
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] text-white text-xs font-bold rounded-xl hover:bg-[#1E293B] transition-all shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Event</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHostEvents.map((event) => {
                  const rsvpCount = getEventRsvpCount(event.id);
                  const isDraft = event.status === 'draft';
                  const isPast = event.start_at ? new Date(event.start_at) < new Date() : false;
                  const isLive = !isDraft && !isPast;

                  return (
                    <div
                      key={event.id}
                      className="group bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#0F172A] overflow-hidden transition-all hover:shadow-lg flex flex-col"
                    >
                      {/* Event Cover Image */}
                      <div className="relative aspect-[16/9] w-full bg-[#0F172A] overflow-hidden">
                        {event.cover_image_url ? (
                          <Image
                            src={event.cover_image_url}
                            alt={event.title}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white text-xs font-bold">
                            VIBE GATHERING
                          </div>
                        )}

                        {/* Badges Top Left */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 flex-wrap">
                          {event.is_public === false && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950 text-white shadow-sm flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-amber-400" />
                              Private
                            </span>
                          )}
                          {isLive && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-emerald-700 shadow-sm flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live
                            </span>
                          )}
                          {isDraft && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-amber-700 shadow-sm">
                              Draft
                            </span>
                          )}
                          {isPast && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-[#64748B] shadow-sm">
                              Past
                            </span>
                          )}
                        </div>

                        {/* City Top Right */}
                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white/90 backdrop-blur-md">
                            {event.city || 'Mumbai'}
                          </span>
                        </div>
                      </div>

                      {/* Event Card Body */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="font-black text-base text-[#0F172A] line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                            {event.title}
                          </h3>

                          <div className="mt-2.5 space-y-1.5 text-xs text-[#64748B]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                              <span className="font-medium">
                                {event.start_at ? formatIST(event.start_at) : 'Date TBA'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                              <span className="truncate font-medium">
                                {event.location_name || event.city}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions & Guest List Trigger */}
                        <div className="pt-3 border-t border-[#F1F5F9] space-y-3">
                          <button
                            onClick={() => setGuestListEvent(event)}
                            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#0F172A] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span>{rsvpCount} {rsvpCount === 1 ? 'Guest Confirmed' : 'Guests Confirmed'}</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                          </button>

                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setShareEvent(event)}
                                title="Share Event Link"
                                className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setBroadcastEvent(event)}
                                title="Broadcast Announcement to Guests"
                                className="p-2 rounded-lg hover:bg-orange-50 text-[#64748B] hover:text-orange-600 transition-colors cursor-pointer"
                              >
                                <Megaphone className="w-4 h-4 text-orange-500" />
                              </button>

                              <Link
                                href={`/${event.slug}`}
                                target="_blank"
                                title="View Live Page"
                                className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </div>

                            <button
                              onClick={() => handleDeleteEvent(event)}
                              title="Delete Event"
                              className="p-2 rounded-lg hover:bg-rose-50 text-[#94A3B8] hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* DIGITAL PASS MODAL (BookMyShow / Apple Wallet Pass)   */}
      {/* ==================================================== */}
      {selectedPass && (
        <DigitalPassModal
          rsvp={selectedPass.rsvp}
          event={selectedPass.event}
          onClose={() => setSelectedPass(null)}
        />
      )}

      {/* ==================================================== */}
      {/* GUEST LIST & DOOR CHECK-IN MODAL                     */}
      {/* ==================================================== */}
      {guestListEvent && (
        <GuestListModal
          event={guestListEvent}
          rsvps={rsvps.filter((r) => r.event_id === guestListEvent.id || r.event_slug === guestListEvent.slug)}
          onClose={() => setGuestListEvent(null)}
        />
      )}

      {/* ==================================================== */}
      {/* SHARE EVENT MODAL                                    */}
      {/* ==================================================== */}
      {shareEvent && (
        <ShareEventModal
          isOpen={Boolean(shareEvent)}
          onClose={() => setShareEvent(null)}
          event={shareEvent}
        />
      )}

      {/* ==================================================== */}
      {/* HOST BROADCAST ANNOUNCEMENT MODAL                    */}
      {/* ==================================================== */}
      {broadcastEvent && (
        <HostBroadcastModal
          event={broadcastEvent}
          isOpen={Boolean(broadcastEvent)}
          onClose={() => setBroadcastEvent(null)}
        />
      )}

      {/* ==================================================== */}
      {/* HOST INBOX DRAWER                                    */}
      {/* ==================================================== */}
      <HostInboxDrawer
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        events={events}
      />

      <Footer />
    </div>
  );
}

// Guest List & Attendee Drawer Modal
function GuestListModal({
  event,
  rsvps,
  onClose,
}: {
  event: EventItem;
  rsvps: RSVPItem[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [copiedEmails, setCopiedEmails] = useState(false);

  const confirmedGuests = useMemo(() => {
    return rsvps.filter((r) => r.status === 'confirmed');
  }, [rsvps]);

  const filteredGuests = useMemo(() => {
    if (!search.trim()) return confirmedGuests;
    const q = search.toLowerCase();
    return confirmedGuests.filter(
      (g) =>
        (g.name || g.guest_name || '').toLowerCase().includes(q) ||
        (g.email || g.guest_email || '').toLowerCase().includes(q)
    );
  }, [confirmedGuests, search]);

  const handleExportCSV = () => {
    if (confirmedGuests.length === 0) return;
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Registration Date'];
    const rows = confirmedGuests.map((g) => [
      `"${g.name || g.guest_name || 'Guest'}"`,
      `"${g.email || g.guest_email || ''}"`,
      `"${g.phone || ''}"`,
      `"${g.status}"`,
      `"${g.created_at || ''}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendees-${event.slug || 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyEmails = async () => {
    const emails = confirmedGuests
      .map((g) => g.email || g.guest_email)
      .filter(Boolean)
      .join(', ');
    if (!emails) return;
    try {
      await navigator.clipboard.writeText(emails);
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2000);
    } catch {
      window.prompt('Copy guest emails:', emails);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-[#E2E8F0] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-black text-base text-[#0F172A]">Confirmed Guest Door List</h2>
            <p className="text-xs text-[#64748B] truncate max-w-xs mt-0.5">
              {event.title} · {confirmedGuests.length} registered
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-[#F1F5F9] flex items-center gap-2 shrink-0 bg-[#F8FAFC]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A]"
            />
          </div>

          <button
            onClick={handleCopyEmails}
            disabled={confirmedGuests.length === 0}
            title="Copy all guest emails"
            className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-1.5 shrink-0 disabled:opacity-40 cursor-pointer"
          >
            {copiedEmails ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{copiedEmails ? 'Copied' : 'Emails'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={confirmedGuests.length === 0}
            title="Export CSV door list"
            className="px-3 py-1.5 bg-[#0F172A] text-white rounded-xl text-xs font-black hover:bg-[#1E293B] flex items-center gap-1.5 shrink-0 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        {/* Attendees List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredGuests.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8]">
              <Users className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
              <p className="text-xs font-bold text-[#0F172A]">No attendees found</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {confirmedGuests.length === 0
                  ? 'Share your event link to start collecting guest RSVPs.'
                  : 'No matches for this search query.'}
              </p>
            </div>
          ) : (
            filteredGuests.map((guest) => {
              const displayName = guest.name || guest.guest_name || 'Guest';
              const displayEmail = guest.email || guest.guest_email || '';
              return (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-[#E2E8F0] bg-white hover:border-[#0F172A] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-[#E2E8F0] flex items-center justify-center font-bold text-xs text-[#0F172A] shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#0F172A] truncate">{displayName}</p>
                      <p className="text-[11px] text-[#64748B] truncate">{displayEmail}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Confirmed
                    </span>
                    {guest.created_at && (
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">
                        {new Date(guest.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function HostDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0F172A]" />
            <p className="text-xs font-bold text-[#64748B]">Loading your dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
