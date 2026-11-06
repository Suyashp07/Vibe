'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Users,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Scan,
  Share2,
  Trash2,
  Calendar,
  MapPin,
  Search,
  Radio,
  TrendingUp,
  Sparkles,
  DollarSign,
  X
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import ShareEventModal from '@/components/events/ShareEventModal';
import HostBroadcastModal from '@/components/communication/HostBroadcastModal';
import HostInboxDrawer from '@/components/communication/HostInboxDrawer';
import {
  getEvents,
  getRSVPs,
  getEventMessages,
  deleteEvent,
  syncEventsWithSupabase,
  syncRSVPsWithSupabase,
  subscribeToStore
} from '@/lib/store';
import { EventItem, RSVPItem, EventDirectMessage } from '@/types';
import { useAuth, signInWithGoogle, getLocalAuthSession } from '@/lib/auth';

function formatEventDate(dateStr?: string) {
  if (!dateStr) return 'Date TBA';
  try {
    const d = new Date(dateStr);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${weekday}, ${day} ${month} · ${time}`;
  } catch {
    return dateStr;
  }
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
  const [messages, setMessages] = useState<EventDirectMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return getEventMessages();
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isSyncing, setIsSyncing] = useState(true);

  // Tabs: 'upcoming' | 'past' | 'drafts'
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'drafts'>('upcoming');

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & drawers
  const [shareEvent, setShareEvent] = useState<EventItem | null>(null);
  const [broadcastEvent, setBroadcastEvent] = useState<EventItem | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [selectedInboxEventId, setSelectedInboxEventId] = useState<string | undefined>(undefined);

  // Subscribe to reactive store changes
  useEffect(() => {
    const unsub = subscribeToStore(() => {
      setEvents(getEvents());
      setRsvps(getRSVPs());
      setMessages(getEventMessages());
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
      setMessages(getEventMessages());
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  // Events hosted by this user
  const hostEvents = useMemo(() => {
    const profileId = (profile?.id || '').toLowerCase();
    const profileHandle = (profile?.handle || '').toLowerCase();
    const profileName = (profile?.name || '').toLowerCase();
    const profileEmail = (profile?.email || '').toLowerCase();

    return events.filter((e) => {
      const eOrgId = (e.organizer_id || '').toLowerCase();
      const eOrgHandle = (e.organizer_handle || '').toLowerCase();
      const eOrgName = (e.organizer_name || '').toLowerCase();
      const eOrgEmail = (e.organizer_email || '').toLowerCase();

      if (profile) {
        if (profile.role === 'super_admin') return true;
        if (profileId && eOrgId === profileId) return true;
        if (profileHandle && eOrgHandle === profileHandle) return true;
        if (profileName && (eOrgName === profileName || eOrgName.includes(profileName))) return true;
        if (profileEmail && eOrgEmail === profileEmail) return true;
      }

      // Also capture events created locally on this device/browser
      if (eOrgId === 'org-local' || (!eOrgId && !e.id?.startsWith('sample-'))) return true;

      return false;
    });
  }, [events, profile]);

  // Messages corresponding to host's events
  const hostMessages = useMemo(() => {
    const hostEventIds = new Set(hostEvents.map((e) => e.id));
    return messages.filter((m) => hostEventIds.has(m.event_id) && !m.parent_id);
  }, [messages, hostEvents]);

  const unreadMessagesCount = useMemo(() => {
    return hostMessages.filter((m) => !m.is_read).length;
  }, [hostMessages]);

  // Compute live list of events mapped to display row item format
  const mappedHostEvents = useMemo(() => {
    const now = new Date();

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
      const rawPrice = ev.external_price_text || (ev.is_external ? 'Ticketed' : 'Free');
      const capacity = ev.capacity || ev.spots_limit || Math.max(14, rsvpCount + 4);

      return {
        id: ev.id,
        slug: ev.slug,
        title: ev.title,
        start_at: ev.start_at || '',
        location_name: ev.location_name || '',
        city: ev.city || 'Indore',
        formatted_date: formatEventDate(ev.start_at),
        cover_image_url:
          ev.cover_image_url ||
          'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
        status: (ev.status === 'draft' ? 'draft' : 'published') as 'published' | 'draft',
        guests_count: rsvpCount,
        capacity,
        category: (ev.category || ev.flash_activity || 'GATHERING').toUpperCase(),
        priceText: rawPrice,
        originalEvent: ev,
      };
    });
  }, [hostEvents, activeTab, rsvps]);

  // Filter events by search input
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return mappedHostEvents;
    const q = searchQuery.toLowerCase().trim();
    return mappedHostEvents.filter((ev) => {
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.city.toLowerCase().includes(q) ||
        (ev.location_name && ev.location_name.toLowerCase().includes(q)) ||
        (ev.category && ev.category.toLowerCase().includes(q))
      );
    });
  }, [mappedHostEvents, searchQuery]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const now = new Date();
    const upcoming = hostEvents.filter((e) => {
      if (e.status === 'draft') return false;
      if (!e.start_at) return true;
      return new Date(e.start_at) >= now;
    }).length;
    const past = hostEvents.filter((e) => e.start_at && new Date(e.start_at) < now).length;
    const drafts = hostEvents.filter((e) => e.status === 'draft').length;
    return { upcoming, past, drafts };
  }, [hostEvents]);

  // Metric values
  const displayMetrics = useMemo(() => {
    const hostEventIds = new Set(hostEvents.map((e) => e.id));
    const totalGuests = rsvps.filter(
      (r) => hostEventIds.has(r.event_id) && r.status === 'confirmed'
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
      guests: String(totalGuests),
      messages: String(hostMessages.length),
      revenue: formattedRev,
    };
  }, [hostEvents, rsvps, tabCounts.upcoming, hostMessages.length]);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteEvent(id);
      setEvents(getEvents());
    }
  };

  // 1. Loading screen while authentication resolves
  if (loading && !localSession && !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#070709] text-slate-900 dark:text-[#F3F4F6]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-7 h-7 border-2 border-[#0066F5] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#070709] text-slate-900 dark:text-[#F3F4F6] selection:bg-[#0066F5] selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-8">
        {/* ========================================================= */}
        {/* 1. TOP HEADER SECTION (YOUR HOST SPACE)                   */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-[11px] font-bold text-[#0038A8] dark:text-[#38BDF8] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-[#0038A8]/20 stroke-[#0038A8] dark:stroke-[#38BDF8]" />
              <span>YOUR HOST SPACE</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0A1128] dark:text-white tracking-tight leading-tight">
              Your events, your guests, all together.
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-normal leading-relaxed pt-1">
              Manage your hosted gatherings, monitor live guest registrations, broadcast real-time updates, and scan passes at the door.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={() => setIsInboxOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-[#0038A8] dark:text-sky-400" />
              <span>Guest Messages ({displayMetrics.messages})</span>
              {unreadMessagesCount > 0 && (
                <span className="bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadMessagesCount} new
                </span>
              )}
            </button>

            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0038A8] hover:bg-[#173DAA] text-white !text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-900/20 hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5] text-white !text-white" />
              <span className="text-white !text-white">New Gathering</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. 4 METRIC CARDS GRID                                    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Upcoming Events */}
          <div className="bg-white dark:bg-[#111318] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Upcoming Events</span>
              <Calendar className="w-4 h-4 text-[#0038A8]" />
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-[#0A1128] dark:text-white tracking-tight">
                {displayMetrics.upcoming} Active
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{tabCounts.upcoming > 0 ? 'Live in your city' : 'No active gatherings'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: People Joining */}
          <div className="bg-white dark:bg-[#111318] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">People Joining</span>
              <Users className="w-4 h-4 text-[#0038A8]" />
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-[#0A1128] dark:text-white tracking-tight">
                {displayMetrics.guests} Guests
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                Confirmed RSVPs &amp; ticket holders
              </div>
            </div>
          </div>

          {/* Card 3: Gross Revenue */}
          <div className="bg-white dark:bg-[#111318] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-[#0A1128] dark:text-white tracking-tight">
                {displayMetrics.revenue}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                0% Host fee · Instant UPI payouts
              </div>
            </div>
          </div>

          {/* Card 4: Guest Messages */}
          <div
            onClick={() => setIsInboxOpen(true)}
            className="bg-white dark:bg-[#111318] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Guest Messages</span>
              <MessageSquare className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#0A1128] dark:text-white tracking-tight">
                  {displayMetrics.messages} Threads
                </span>
                {unreadMessagesCount > 0 && (
                  <span className="bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadMessagesCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 mt-2 hover:underline">
                <span>Click to open inbox</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. TABS & SEARCH BAR ROW                                  */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          {/* Left Tabs */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-[#0038A8] text-white !text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium'
              }`}
            >
              Upcoming ({tabCounts.upcoming})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'past'
                  ? 'bg-[#0038A8] text-white !text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Past ({tabCounts.past})
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'drafts'
                  ? 'bg-[#0038A8] text-white !text-white shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Drafts ({tabCounts.drafts})
            </button>
            <button
              onClick={() => setIsInboxOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              <span>Guest Messages ({displayMetrics.messages})</span>
              {unreadMessagesCount > 0 && (
                <span className="bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadMessagesCount} new
                </span>
              )}
            </button>
          </div>

          {/* Right Search Box */}
          <div className="relative min-w-[260px] sm:min-w-[320px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your events by name or city..."
              className="w-full pl-9 pr-8 py-2 rounded-full bg-white dark:bg-[#111318] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#0066F5] transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. EVENT CARDS LIST                                       */}
        {/* ========================================================= */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="py-16 px-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-white dark:bg-[#111318] flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-[#0038A8]">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="max-w-md space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {searchQuery
                    ? `No events matching "${searchQuery}"`
                    : activeTab === 'upcoming'
                    ? 'No upcoming gatherings yet'
                    : activeTab === 'past'
                    ? 'No past gatherings found'
                    : 'No draft gatherings found'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {searchQuery
                    ? 'Try searching with a different keyword or clear the search field.'
                    : activeTab === 'upcoming'
                    ? 'Host your first event to publish tickets, manage live RSVPs, and scan passes at the door.'
                    : `Any ${activeTab} gatherings you host will appear here automatically.`}
                </p>
              </div>
              {!searchQuery && activeTab === 'upcoming' && (
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0038A8] hover:bg-[#173DAA] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Host an Event</span>
                </Link>
              )}
            </div>
          ) : (
            filteredEvents.map((event) => {
              const originalEv = (event as any).originalEvent as EventItem | undefined;
              const capacity = event.capacity || 14;
              const joined = event.guests_count;
              const spotsLeft = Math.max(0, capacity - joined);
              const progressPct = Math.min(100, Math.round((joined / Math.max(1, capacity)) * 100));
              const category = event.category || 'CRICKET';
              const isPublished = event.status === 'published';
              const priceText = (event as any).priceText || '₹150';

              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-[#111318] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all hover:border-slate-300 dark:hover:border-white/20 hover:shadow-sm"
                >
                  {/* Left Section: Image + Meta Details */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    {/* Thumbnail */}
                    <Link
                      href={`/${event.slug}`}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-white/5 group"
                    >
                      <Image
                        src={event.cover_image_url}
                        alt={event.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      {/* Category + Live & Published Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black tracking-wider text-[#0038A8] dark:text-sky-300 bg-blue-50 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-500/30 uppercase">
                          {category}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600 font-bold">·</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                          {isPublished ? 'LIVE & PUBLISHED' : 'DRAFT'}
                        </span>
                      </div>

                      {/* Title */}
                      <Link href={`/${event.slug}`} className="block group">
                        <h3 className="text-base sm:text-lg font-black text-[#0A1128] dark:text-white group-hover:text-[#0038A8] transition-colors truncate">
                          {event.title}
                        </h3>
                      </Link>

                      {/* Meta Row: Date, Location, Price */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{(event as any).formatted_date || formatEventDate(event.start_at)}</span>
                        </div>
                        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">·</span>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-[280px]">
                            {event.location_name ? `${event.location_name}, ${event.city}` : event.city || 'Indore'}
                          </span>
                        </div>
                        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">·</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {priceText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Progress Bar + Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-row sm:items-center gap-4 sm:gap-6 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-white/5">
                    {/* Attendance progress */}
                    <div className="min-w-[130px] sm:min-w-[150px] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{joined}/{capacity} joined</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold text-[#0038A8] dark:text-sky-300 bg-blue-50 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-500/30">
                          {spotsLeft} left
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0038A8] rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action pills */}
                    <div className="flex items-center gap-2">
                      {/* WhatsApp */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Join me at ${event.title}! RSVP & details: https://vibe.indore.in/${event.slug}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50/50 border border-emerald-500 text-emerald-600 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] active:scale-98"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Scan */}
                      <Link
                        href={`/organizer/check-in?eventId=${event.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/90 border border-blue-200 dark:border-blue-500/30 dark:bg-blue-500/15 text-[#0038A8] dark:text-sky-300 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] active:scale-98"
                        title="Scan tickets & gate check-in"
                      >
                        <Scan className="w-3.5 h-3.5 text-[#0038A8] dark:text-sky-300" />
                        <span>Scan ({joined})</span>
                      </Link>

                      {/* Dispatch */}
                      <button
                        onClick={() => setBroadcastEvent(originalEv || null)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/90 border border-blue-200 dark:border-blue-500/30 dark:bg-blue-500/15 text-[#0038A8] dark:text-sky-300 text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] active:scale-98 cursor-pointer"
                        title="Send broadcast to guests"
                      >
                        <Radio className="w-3.5 h-3.5 text-[#0038A8] dark:text-sky-300" />
                        <span>Dispatch</span>
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDelete(event.id, event.title)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

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
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070709] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0066F5]" />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
