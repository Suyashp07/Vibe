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
  Copy,
  Check,
  X,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import ShareEventModal from '@/components/events/ShareEventModal';
import HostBroadcastModal from '@/components/communication/HostBroadcastModal';
import HostInboxDrawer from '@/components/communication/HostInboxDrawer';
import {
  getEvents,
  getRSVPs,
  deleteEvent,
  syncEventsWithSupabase,
  syncRSVPsWithSupabase,
  formatIST
} from '@/lib/store';
import { EventItem, RSVPItem } from '@/types';
import { useAuth, getInitials, isSyntheticAvatar } from '@/lib/auth';

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoggedIn } = useAuth();

  // If user lands with ?tab=passes, redirect smoothly to the dedicated /passes page
  const tabParam = searchParams.get('tab');
  useEffect(() => {
    if (tabParam === 'passes') {
      router.replace('/passes');
    }
  }, [tabParam, router]);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar_url]);

  // Host sub-filter: upcoming, past, drafts, all
  const [hostFilter, setHostFilter] = useState<'upcoming' | 'past' | 'drafts' | 'all'>('upcoming');
  const [hostSearch, setHostSearch] = useState('');

  // Selected Event for Host Modals
  const [shareEvent, setShareEvent] = useState<EventItem | null>(null);
  const [guestListEvent, setGuestListEvent] = useState<EventItem | null>(null);
  const [broadcastEvent, setBroadcastEvent] = useState<EventItem | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

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

  // Events hosted by this user/organizer
  const hostEvents = useMemo(() => {
    if (!profile) return events;
    return events.filter(
      (e) =>
        e.organizer_id === profile.id ||
        e.organizer_id === 'org-current' ||
        (profile.email && e.organizer_name?.toLowerCase().includes(profile.name?.toLowerCase() || ''))
    );
  }, [events, profile]);

  // Host KPI Metrics
  const metrics = useMemo(() => {
    const totalHosted = hostEvents.length;
    const hostedIds = new Set(hostEvents.map((e) => e.id));
    const totalGuests = rsvps.filter(
      (r) => hostedIds.has(r.event_id) && r.status === 'confirmed'
    ).length;

    const now = new Date();
    const upcomingEvents = hostEvents.filter((e) => {
      if (!e.start_at) return true;
      return new Date(e.start_at) >= now;
    }).length;

    return {
      totalHosted,
      totalGuests,
      upcomingEvents,
    };
  }, [hostEvents, rsvps]);

  // Sub-filtered host events
  const filteredHostEvents = useMemo(() => {
    const now = new Date();

    return hostEvents.filter((event) => {
      // 1. Time / status filter
      if (hostFilter === 'upcoming') {
        if (event.status === 'draft') return false;
        if (event.start_at) {
          const start = new Date(event.start_at);
          if (start < now) return false;
        }
      } else if (hostFilter === 'past') {
        if (!event.start_at) return false;
        const start = new Date(event.start_at);
        if (start >= now) return false;
      } else if (hostFilter === 'drafts') {
        if (event.status !== 'draft') return false;
      }

      // 2. Search filter
      if (hostSearch.trim()) {
        const q = hostSearch.toLowerCase().trim();
        const titleMatch = event.title.toLowerCase().includes(q);
        const venueMatch = (event.location_name || '').toLowerCase().includes(q);
        const cityMatch = (event.city || '').toLowerCase().includes(q);
        return titleMatch || venueMatch || cityMatch;
      }

      return true;
    });
  }, [hostEvents, hostFilter, hostSearch]);

  // Tab counts for quick glance
  const tabCounts = useMemo(() => {
    const now = new Date();
    const upcoming = hostEvents.filter((e) => {
      if (e.status === 'draft') return false;
      if (!e.start_at) return true;
      return new Date(e.start_at) >= now;
    }).length;
    const past = hostEvents.filter((e) => {
      if (!e.start_at) return false;
      return new Date(e.start_at) < now;
    }).length;
    const drafts = hostEvents.filter((e) => e.status === 'draft').length;
    const all = hostEvents.length;

    return { upcoming, past, drafts, all };
  }, [hostEvents]);

  // RSVPs for a specific hosted event
  const getEventRsvps = (eventId: string) => {
    return rsvps.filter((r) => r.event_id === eventId);
  };

  const getEventRsvpCount = (eventId: string) => {
    return rsvps.filter((r) => r.event_id === eventId && r.status === 'confirmed').length;
  };

  // Handle Event Deletion
  const handleDeleteEvent = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the event "${title}"? This action cannot be undone.`)) {
      deleteEvent(id);
      setEvents(getEvents());
    }
  };

  const displayName = profile?.name || 'Organizer';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 w-full">
        {/* ==================================================== */}
        {/* HOST COMMAND CENTER HERO BANNER                      */}
        {/* ==================================================== */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_16px_-4px_rgba(0,0,0,0.03)] mb-6 sm:mb-8 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
            {/* Host Identity Details */}
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white flex items-center justify-center font-black text-lg sm:text-2xl shadow-sm overflow-hidden ring-1 ring-slate-900/10">
                  {profile?.avatar_url && !avatarError && !isSyntheticAvatar(profile.avatar_url) ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.name || 'Host'}
                      width={72}
                      height={72}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span>
                      {getInitials(profile?.name, profile?.email)}
                    </span>
                  )}
                </div>
                {/* Active Workstation Status Beacon */}
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center"
                  title="Host Workstation Active"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Host Workstation</span>
                  </span>
                  <span className="text-slate-300 hidden sm:inline">·</span>
                  <span className="text-xs font-mono text-slate-500 truncate max-w-[220px] sm:max-w-none">
                    {profile?.email || 'host@vibe.in'}
                  </span>
                  {profile?.role === 'super_admin' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                      Super Admin
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
                  Host Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl leading-relaxed">
                  Manage your live events, track attendee door registrations, and broadcast live event updates.
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap pt-2 lg:pt-0 border-t border-slate-100 lg:border-t-0">
              <button
                onClick={loadData}
                disabled={isSyncing}
                title="Sync Live Data"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-orange-600' : ''}`} />
              </button>

              <Link
                href="/passes"
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-all hover:border-slate-400 shadow-2xs"
              >
                <Ticket className="w-4 h-4 text-[#E8621A]" />
                <span>My Passes</span>
              </Link>

              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-all shadow-sm hover:shadow"
              >
                <Plus className="w-4 h-4" />
                <span>List New Event</span>
              </Link>
            </div>
          </div>

          {/* ==================================================== */}
          {/* WORKSTATION KPI METRICS BAR (CLEAN ARCHITECTURE)     */}
          {/* ==================================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-100">
            {/* Metric 1: Hosted Events */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Hosted Events
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {metrics.totalHosted}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Live & scheduled
                </span>
              </div>
            </div>

            {/* Metric 2: Total Guests Hosted */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Total Guests
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {metrics.totalGuests}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Confirmed door RSVPs
                </span>
              </div>
            </div>

            {/* Metric 3: Upcoming Active */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 hover:border-purple-300 hover:shadow-xs transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Upcoming
                </span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {metrics.upcomingEvents}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Gatherings in progress
                </span>
              </div>
            </div>

            {/* Metric 4: Attendee Inquiries Inbox */}
            <button
              onClick={() => setIsInboxOpen(true)}
              className="group p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-xs text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Attendee Inbox
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 group-hover:bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-amber-600 flex items-center gap-1 transition-colors">
                  <span>Open Inbox</span>
                  <span className="text-xs transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Direct guest inquiries
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* HOSTED EVENTS SECTION                                */}
        {/* ==================================================== */}
        <div className="space-y-5 sm:space-y-6">
          {/* Sub-header Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            {/* Filter Tabs with Live Count Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none -mx-1 px-1">
              {[
                { id: 'upcoming', label: 'Live & Upcoming', count: tabCounts.upcoming },
                { id: 'past', label: 'Past Events', count: tabCounts.past },
                { id: 'drafts', label: 'Drafts', count: tabCounts.drafts },
                { id: 'all', label: 'All Hosted', count: tabCounts.all },
              ].map((tab) => {
                const isActive = hostFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setHostFilter(tab.id as any)}
                    className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200/90 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Guest Inquiries Inbox Button */}
              <button
                onClick={() => setIsInboxOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 hover:border-amber-400 text-slate-800 hover:text-amber-700 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
                title="View direct messages and inquiries from attendees"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Inquiries</span>
                <span className="sm:hidden">Inbox</span>
              </button>

              {/* Search Hosted Events */}
              <div className="relative flex-1 md:w-64 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events, venues..."
                  value={hostSearch}
                  onChange={(e) => setHostSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:border-slate-900 transition-colors shadow-2xs placeholder:text-slate-400"
                />
                {hostSearch && (
                  <button
                    onClick={() => setHostSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hosted Events Grid */}
          {filteredHostEvents.length === 0 ? (
            <div className="py-16 sm:py-20 bg-white border border-dashed border-slate-200 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3.5 shadow-xs">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {hostFilter === 'upcoming'
                  ? 'No active or upcoming events scheduled'
                  : 'No hosted events found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Publish a gathering in 60 seconds with our instant event creator or customize every detail manually.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Event</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredHostEvents.map((event) => {
                const rsvpCount = getEventRsvpCount(event.id);
                const isDraft = event.status === 'draft';
                const isPast = event.start_at ? new Date(event.start_at) < new Date() : false;
                const isLive = !isDraft && !isPast;

                return (
                  <div
                    key={event.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-400 overflow-hidden transition-all hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.06)] flex flex-col"
                  >
                    {/* Poster Image Container */}
                    <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden">
                      {event.cover_image_url ? (
                        <Image
                          src={event.cover_image_url}
                          alt={event.title}
                          fill
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white text-xs font-bold font-mono">
                          VIBE EVENT
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        {isLive && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Live
                          </span>
                        )}
                        {isDraft && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-600 text-white shadow-xs">
                            Draft
                          </span>
                        )}
                        {isPast && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500 text-white shadow-xs">
                            Ended
                          </span>
                        )}
                      </div>

                      {/* Attendee Count Pill */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-950/80 text-white backdrop-blur-md flex items-center gap-1.5 shadow-xs border border-white/10">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{rsvpCount} RSVPs</span>
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-[#E8621A]" />
                          <span>{event.start_at ? formatIST(event.start_at) : 'Date TBA'}</span>
                        </div>

                        <h3 className="font-bold text-base text-slate-900 mt-1 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                          {event.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{event.location_name || event.city || 'Online / TBA'}</span>
                        </div>
                      </div>

                      {/* Host Actions */}
                      <div className="space-y-2 pt-3 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setGuestListEvent(event)}
                            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Guest List</span>
                          </button>

                          <button
                            onClick={() => setBroadcastEvent(event)}
                            className="py-2 px-3 rounded-xl border border-slate-200/90 hover:border-slate-400 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white"
                          >
                            <Megaphone className="w-3.5 h-3.5 text-[#E8621A]" />
                            <span>Broadcast</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                          <Link
                            href={`/${event.slug}`}
                            target="_blank"
                            className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>View Page</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setShareEvent(event)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Share Event"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteEvent(event.id, event.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

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
        onClose={() => setIsInboxOpen(false)}
      />

      {/* Guest List Modal */}
      {guestListEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Guest List & Door RSVPs
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {guestListEvent.title} · <span className="font-mono font-bold text-emerald-600">{getEventRsvpCount(guestListEvent.id)} confirmed</span>
                </p>
              </div>
              <button
                onClick={() => setGuestListEvent(null)}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-2.5">
              {getEventRsvps(guestListEvent.id).length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No RSVPs registered yet for this event.
                </div>
              ) : (
                getEventRsvps(guestListEvent.id).map((r) => (
                  <div
                    key={r.id}
                    className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {r.name || r.guest_name || 'Guest'}
                      </p>
                      <p className="text-xs text-slate-500 truncate font-mono">{r.email}</p>
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          r.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0F172A]" />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
