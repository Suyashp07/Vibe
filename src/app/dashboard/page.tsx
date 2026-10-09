'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Users,
  MessageSquare,
  ArrowUpRight,
  Send,
  ShieldCheck,
  LogIn,
  ArrowRight,
  RefreshCw,
  QrCode,
  Scan,
  Share2,
  Trash2,
  MoreHorizontal,
  X,
  CheckCircle2
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import ShareEventModal from '@/components/events/ShareEventModal';
import HostBroadcastModal from '@/components/communication/HostBroadcastModal';
import HostInboxDrawer from '@/components/communication/HostInboxDrawer';
import {
  getEvents,
  getRSVPs,
  deleteEvent,
  syncEventsWithSupabase,
  syncRSVPsWithSupabase,
  subscribeToStore
} from '@/lib/store';
import { EventItem, RSVPItem } from '@/types';
import { useAuth, signInWithGoogle, getLocalAuthSession } from '@/lib/auth';

// 3 Default sample events directly matching the design reference for preview
const SAMPLE_WORKSPACE_EVENTS = [
  {
    id: 'sample-1',
    slug: 'sameera-bharadwaj-live',
    title: 'Sameera Bharadwaj, live',
    start_at: '2026-10-15T19:00:00+05:30',
    location_name: 'Live Venue',
    city: 'Mumbai',
    formatted_date_venue: 'THU, 15 OCT · 7:00 PM · Live Venue, Mumbai',
    cover_image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    status: 'published' as const,
    guests_count: 128,
  },
  {
    id: 'sample-2',
    slug: 'royal-raas-2-0',
    title: 'Royal Raas 2.0',
    start_at: '2026-10-16T18:00:00+05:30',
    location_name: 'Kurry Leaf',
    city: 'Pune',
    formatted_date_venue: 'FRI, 16 OCT · 6:00 PM · Kurry Leaf, Pune',
    cover_image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80',
    status: 'published' as const,
    guests_count: 86,
  },
  {
    id: 'sample-3',
    slug: 'the-friday-supper-club',
    title: 'The Friday supper club',
    start_at: '2026-10-16T20:00:00+05:30',
    location_name: 'Bandra',
    city: 'Mumbai',
    formatted_date_venue: 'FRI, 16 OCT · 8:00 PM · Bandra, Mumbai',
    cover_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    status: 'published' as const,
    guests_count: 24,
  },
];

function formatHostDateVenue(dateStr?: string, venue?: string, city?: string) {
  let datePart = 'DATE TBA';
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const yearPart = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '';
      datePart = `${weekday}, ${day} ${month}${yearPart} · ${time}`;
    } catch {
      datePart = dateStr.toUpperCase();
    }
  }

  const venueTrimmed = (venue || '').trim();
  const cityTrimmed = (city || '').trim();
  let placePart = 'Venue TBA';
  if (venueTrimmed && cityTrimmed && !venueTrimmed.toLowerCase().includes(cityTrimmed.toLowerCase())) {
    placePart = `${venueTrimmed} · ${cityTrimmed}`;
  } else if (venueTrimmed) {
    placePart = venueTrimmed;
  } else if (cityTrimmed) {
    placePart = cityTrimmed;
  }
  return `${datePart} · ${placePart}`;
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoggedIn, loading } = useAuth();
  const localSession = typeof window !== 'undefined' ? getLocalAuthSession() : null;
  const isAuth = isLoggedIn || Boolean(localSession) || Boolean(profile);

  // If user lands with ?tab=passes, redirect smoothly to /passes
  const tabParam = searchParams.get('tab');
  useEffect(() => {
    if (tabParam === 'passes') {
      router.replace('/passes');
    }
  }, [tabParam, router]);

  const [events, setEvents] = useState<EventItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return getEvents();
      } catch {
        return [];
      }
    }
    return [];
  });
  const [rsvps, setRsvps] = useState<RSVPItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return getRSVPs();
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isSyncing, setIsSyncing] = useState(true);

  // Tabs: 'upcoming' | 'past' | 'drafts'
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'drafts'>('upcoming');

  // Modals & drawers
  const [shareEvent, setShareEvent] = useState<EventItem | null>(null);
  const [broadcastEvent, setBroadcastEvent] = useState<EventItem | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [selectedInboxEventId, setSelectedInboxEventId] = useState<string | undefined>(undefined);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Subscribe to reactive store changes
  useEffect(() => {
    const unsub = subscribeToStore(() => {
      setEvents(getEvents());
      setRsvps(getRSVPs());
    });
    return () => unsub();
  }, []);

  // Load & Sync data
  const loadData = async () => {
    setIsSyncing(true);
    try {
      const syncOptions = profile?.id
        ? { organizerId: profile.id, includePrivate: true }
        : { includePrivate: true };
      await Promise.all([syncEventsWithSupabase(syncOptions), syncRSVPsWithSupabase()]);
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
  }, [profile?.id]);

  // Events hosted by this user (strictly scoped to personal hosted events)
  const hostEvents = useMemo(() => {
    if (!profile) return [];

    const profileId = (profile.id || '').toLowerCase();
    const profileHandle = (profile.handle || '').toLowerCase();
    const profileName = (profile.name || '').toLowerCase();
    const profileEmail = (profile.email || '').toLowerCase();

    return events.filter((e) => {
      const eOrgId = (e.organizer_id || '').toLowerCase();
      const eOrgHandle = (e.organizer_handle || '').toLowerCase();
      const eOrgName = (e.organizer_name || '').toLowerCase();
      const eOrgEmail = (e.organizer_email || '').toLowerCase();

      return (
        (profileId && eOrgId === profileId) ||
        (profileHandle && eOrgHandle === profileHandle) ||
        (profileName && (eOrgName === profileName || eOrgName.includes(profileName))) ||
        (profileEmail && eOrgEmail === profileEmail)
      );
    });
  }, [events, profile]);

  // Sample workspace preview is only for unauthenticated preview mode, never for logged-in hosts
  const isSampleWorkspace = !isAuth && !profile;

  // Compute live list of events mapped to display row item format
  const mappedHostEvents = useMemo(() => {
    const now = new Date();

    if (isSampleWorkspace) {
      if (activeTab === 'upcoming') return SAMPLE_WORKSPACE_EVENTS;
      if (activeTab === 'past') return [];
      return [];
    }

    const filtered = hostEvents.filter((ev) => {
      if (activeTab === 'drafts') return ev.status === 'draft';
      if (activeTab === 'past') {
        if (!ev.start_at) return false;
        return new Date(ev.start_at) < now;
      }
      // upcoming
      if (ev.status === 'draft') return false;
      if (!ev.start_at) return true;
      return new Date(ev.start_at) >= now;
    });

    // Chronological sorting: soonest upcoming first, most recent past first
    filtered.sort((a, b) => {
      const timeA = a.start_at ? new Date(a.start_at).getTime() : 0;
      const timeB = b.start_at ? new Date(b.start_at).getTime() : 0;
      if (activeTab === 'past') {
        return timeB - timeA;
      }
      if (!timeA) return 1;
      if (!timeB) return -1;
      return timeA - timeB;
    });

    return filtered.map((ev) => {
      const rsvpCount = rsvps.filter((r) => r.event_id === ev.id && r.status === 'confirmed').length;
      return {
        id: ev.id,
        slug: ev.slug,
        title: ev.title,
        start_at: ev.start_at || '',
        location_name: ev.location_name || '',
        city: ev.city || '',
        formatted_date_venue: formatHostDateVenue(ev.start_at, ev.location_name, ev.city),
        cover_image_url:
          ev.cover_image_url ||
          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
        status: (ev.status === 'draft' ? 'draft' : 'published') as 'published' | 'draft',
        guests_count: rsvpCount,
        originalEvent: ev,
      };
    });
  }, [hostEvents, isSampleWorkspace, activeTab, rsvps]);

  // Tab counts
  const tabCounts = useMemo(() => {
    if (isSampleWorkspace) {
      return { upcoming: 3, past: 0, drafts: 0 };
    }
    const now = new Date();
    const upcoming = hostEvents.filter((e) => {
      if (e.status === 'draft') return false;
      if (!e.start_at) return true;
      return new Date(e.start_at) >= now;
    }).length;
    const past = hostEvents.filter((e) => e.start_at && new Date(e.start_at) < now).length;
    const drafts = hostEvents.filter((e) => e.status === 'draft').length;
    return { upcoming, past, drafts };
  }, [hostEvents, isSampleWorkspace]);

  // Metric values
  const displayMetrics = useMemo(() => {
    if (isSampleWorkspace) {
      return {
        upcoming: '3',
        upcomingSub: 'Your next gathering is in 7 days',
        guests: '238',
        guestsSub: '↑ 24 this week',
        messages: '12',
        revenue: '₹63,872',
        revenueSub: '↑ 18% this month',
      };
    }

    const totalGuests = rsvps.filter(
      (r) => hostEvents.some((e) => e.id === r.event_id) && r.status === 'confirmed'
    ).length;

    // Calculate revenue based on ticket prices
    let calculatedRevenue = 0;
    hostEvents.forEach((ev) => {
      const confirmedForEv = rsvps.filter((r) => r.event_id === ev.id && r.status === 'confirmed').length;
      const priceText = (ev.external_price_text || '').toLowerCase();
      let price = 0;
      if (!priceText.includes('free')) {
        price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      }
      calculatedRevenue += confirmedForEv * price;
    });

    const formattedRev = `₹${calculatedRevenue.toLocaleString('en-IN')}`;

    return {
      upcoming: String(tabCounts.upcoming),
      upcomingSub:
        tabCounts.upcoming > 0 ? 'Your next gathering is active' : 'No upcoming gatherings',
      guests: String(totalGuests),
      guestsSub: totalGuests > 0 ? `↑ ${totalGuests} confirmed door RSVPs` : 'Start inviting guests',
      messages: String(Math.max(0, totalGuests)),
      revenue: formattedRev,
      revenueSub: '↑ 18% this month',
    };
  }, [isSampleWorkspace, hostEvents, rsvps, tabCounts.upcoming]);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteEvent(id);
      setEvents(getEvents());
      setActiveMenuId(null);
    }
  };

  // Close 3-dot dropdown menu on outside click
  useEffect(() => {
    const handleDocClick = () => setActiveMenuId(null);
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  // 1. Loading screen while authentication resolves
  if (loading && !localSession && !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070709] text-[#F3F4F6]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-7 h-7 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  // 2. Unauthenticated Gate
  if (!isAuth && !loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#070709] text-[#F3F4F6]">
        <Navbar />

        <main className="flex-1 max-w-md mx-auto px-4 py-16 flex items-center justify-center w-full">
          <div className="w-full bg-[#0D0D10] rounded-3xl p-8 border border-white/10 shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white mx-auto flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#FF5500]" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#FF5500] font-bold">
                Host Space Restricted
              </span>
              <h1 className="font-sans font-bold text-2xl text-white">
                Sign in to your host space
              </h1>
              <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                Manage your hosted gatherings, monitor live guest registrations, and broadcast real-time updates.
              </p>
            </div>

            <button
              onClick={() => signInWithGoogle('organizer', '/dashboard')}
              type="button"
              className="w-full py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition flex items-center justify-center gap-3 shadow-xs hover:border-white/30 cursor-pointer"
            >
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
              <span>Continue with Google</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/login?redirect=/dashboard"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 hover:text-white text-xs font-semibold transition"
              >
                <LogIn className="w-3.5 h-3.5 text-white/50" />
                <span>Host Sign In</span>
              </Link>

              <Link
                href="/signup?redirect=/dashboard"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FF5500] hover:bg-[#FF661A] text-white font-semibold text-xs transition shadow-md"
              >
                <span>Sign Up Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const broadcastTarget = hostEvents[0] || events[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] dark:bg-[#070709] text-neutral-900 dark:text-[#F3F4F6] selection:bg-[#FF5500] selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-12 sm:space-y-14">
        {/* ========================================================= */}
        {/* 1. TOP HEADER SECTION (YOUR HOST SPACE)                   */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <span className="text-[11px] sm:text-xs font-mono font-semibold tracking-widest text-neutral-500 dark:text-neutral-400 uppercase">
              YOUR HOST SPACE
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-neutral-900 dark:text-white mt-2 leading-tight">
              Good things are happening<span className="text-[#FF5500]">.</span>
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2 font-normal">
              Your events, your guests, all together.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white text-sm font-semibold transition-all shadow-[0_0_24px_rgba(255,85,0,0.35)] shrink-0 self-start hover:scale-[1.02] active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create an event</span>
          </Link>
        </div>

        {/* ========================================================= */}
        {/* 2. METRICS / KPI BAR (3 COLUMNS)                          */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 pt-2 pb-8 border-b border-neutral-200 dark:border-white/[0.08]">
          {/* Column 1: Upcoming events */}
          <div className="space-y-1 pr-4 sm:border-r sm:border-neutral-200 dark:sm:border-white/[0.08]">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Upcoming events</p>
            <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {displayMetrics.upcoming}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {displayMetrics.upcomingSub}
            </p>
          </div>

          {/* Column 2: People joining */}
          <div className="space-y-1 pr-4 sm:border-r sm:border-neutral-200 dark:sm:border-white/[0.08]">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">People joining</p>
            <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {displayMetrics.guests}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {displayMetrics.guestsSub}
            </p>
          </div>

          {/* Column 3: Guest messages */}
          <div className="space-y-1">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Guest messages</p>
            <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {displayMetrics.messages}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Stay close to your community
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. YOUR EVENTS SECTION                                    */}
        {/* ========================================================= */}
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Your events</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono px-3 py-1 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-xs dark:shadow-none">
                {isSampleWorkspace ? 'Sample host workspace' : `${profile?.name || 'Active'} workspace`}
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-[#FFF1EB] text-[#FF5500] border border-[#FF5500]/30 dark:bg-[#2A160E] dark:text-[#FF6A1A]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-transparent border border-transparent'
              }`}
            >
              Upcoming {tabCounts.upcoming}
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'past'
                  ? 'bg-[#FFF1EB] text-[#FF5500] border border-[#FF5500]/30 dark:bg-[#2A160E] dark:text-[#FF6A1A]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-transparent border border-transparent'
              }`}
            >
              Past
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'drafts'
                  ? 'bg-[#FFF1EB] text-[#FF5500] border border-[#FF5500]/30 dark:bg-[#2A160E] dark:text-[#FF6A1A]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-transparent border border-transparent'
              }`}
            >
              Drafts
            </button>
          </div>

          {/* Horizontal List Rows */}
          {mappedHostEvents.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-neutral-300 dark:border-white/10 rounded-2xl bg-white dark:bg-white/[0.01]">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {activeTab === 'past' ? 'No past events found' : 'No draft events found'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                Any {activeTab} gatherings will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-white/[0.08]">
              {mappedHostEvents.map((event) => {
                const originalEv = (event as any).originalEvent as EventItem | undefined;

                return (
                  <div
                    key={event.id}
                    onClick={() => router.push(`/${event.slug}`)}
                    className="group py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all rounded-xl px-3 cursor-pointer"
                  >
                    {/* Left: Thumbnail & Details */}
                    <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                      <div className="relative w-28 sm:w-32 h-18 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 block group-hover:border-[#FF5500]/40 transition-colors">
                        <Image
                          src={event.cover_image_url}
                          alt={event.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                          <span>Published</span>
                        </span>

                        <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white group-hover:text-[#FF5500] transition-colors mt-1 truncate">
                          {event.title}
                        </h3>

                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium tracking-wide uppercase mt-1 truncate">
                          {event.formatted_date_venue}
                        </p>
                      </div>
                    </div>

                    {/* Right: Guest Count, Inbox button & Scan passes */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0 self-start md:self-auto pt-2 md:pt-0">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                        <Users className="w-4 h-4 text-[#FF5500]" />
                        <span>{event.guests_count} guests</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInboxEventId(event.id);
                          setIsInboxOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800 shadow-xs dark:shadow-none dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white transition-colors cursor-pointer"
                        title="Open guest inbox"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                        <span>Inbox</span>
                      </button>

                      {/* Scanner for passes & attendance system */}
                      <Link
                        href={`/organizer/check-in?eventId=${event.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:border-emerald-500/25 dark:text-emerald-400 dark:hover:text-emerald-300 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                        title="Scan passes & live attendance system"
                      >
                        <Scan className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Scan passes</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 4. KEEP EVERYONE IN THE LOOP BANNER                       */}
        {/* ========================================================= */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111114] border border-neutral-200 dark:border-white/10 shadow-xs dark:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFF1EB] dark:bg-[#2A160E] border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500] shrink-0">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">Keep everyone in the loop.</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">A quick update goes a long way.</p>
            </div>
          </div>

          <button
            onClick={() => setBroadcastEvent(broadcastTarget)}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-xs sm:text-sm font-semibold text-neutral-800 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-white transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>Send an update</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 5. MINIMAL EDITORIAL FOOTER                               */}
      {/* ========================================================= */}
      <footer className="mt-20 border-t border-neutral-200 dark:border-white/[0.08] py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="font-bold text-neutral-900 dark:text-white text-sm tracking-tight">
            vibe<span className="text-[#FF5500]">.</span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono tracking-wider ml-1">BY SWANIKI</span>
          </span>
          <span className="text-neutral-300 dark:text-neutral-700">·</span>
          <span className="text-neutral-500 dark:text-neutral-500">Good people. Real connections.</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
          <span>© 2026 Vibe by Swaniki</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </footer>

      {/* Share Modal */}
      {shareEvent && (
        <ShareEventModal
          isOpen={!!shareEvent}
          onClose={() => setShareEvent(null)}
          event={shareEvent}
        />
      )}

      {/* Broadcast Modal */}
      {broadcastEvent && (
        <HostBroadcastModal
          isOpen={!!broadcastEvent}
          onClose={() => setBroadcastEvent(null)}
          event={broadcastEvent}
        />
      )}

      {/* Host Inbox Drawer */}
      <HostInboxDrawer
        isOpen={isInboxOpen}
        onClose={() => {
          setIsInboxOpen(false);
          setSelectedInboxEventId(undefined);
        }}
        events={hostEvents}
        selectedEventId={selectedInboxEventId}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#070709] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#FF5500]" />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
