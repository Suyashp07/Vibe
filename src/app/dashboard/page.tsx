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
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#0A0A0A]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full">
        {/* ==================================================== */}
        {/* HOST ACCOUNT HERO BANNER                             */}
        {/* ==================================================== */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs mb-8 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* User Identity Details */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#334155] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm overflow-hidden shrink-0 border-2 border-white">
                {profile?.avatar_url && !avatarError && !isSyntheticAvatar(profile.avatar_url) ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.name || 'Host'}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span>
                    {getInitials(profile?.name, profile?.email)}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Host Workstation</span>
                  </span>
                  <span className="text-xs text-[#94A3B8]">·</span>
                  <span className="text-xs font-semibold text-[#64748B]">
                    {profile?.email || 'Host Account'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A] mt-1.5">
                  Host Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 max-w-xl">
                  Manage your live events, track attendee door registrations, and broadcast live event updates.
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Link
                href="/passes"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition-all hover:border-[#0F172A]"
              >
                <Ticket className="w-4 h-4 text-[#E8621A]" />
                <span>My Passes</span>
              </Link>

              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-xs font-bold text-white transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ List New Event</span>
              </Link>
            </div>
          </div>

          {/* Host KPI Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-[#F1F5F9]">
            {/* Metric 1: Gatherings Hosted */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
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
            </div>

            {/* Metric 2: Total Guests Hosted */}
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

            {/* Metric 3: Upcoming Active */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Upcoming
                </span>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-[#0F172A] mt-1.5">{metrics.upcomingEvents}</p>
              <span className="text-[11px] text-[#64748B] mt-0.5 block font-medium">
                Gatherings in progress
              </span>
            </div>

            {/* Metric 4: Direct Inquiries */}
            <button
              onClick={() => setIsInboxOpen(true)}
              className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left hover:border-amber-400 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Attendee Inbox
                </span>
                <MessageSquare className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-sm font-bold text-[#0F172A] mt-2 flex items-center gap-1">
                <span>Open Inbox</span>
                <span className="text-xs">↗</span>
              </p>
              <span className="text-[11px] text-[#64748B] mt-0.5 block font-medium">
                In-app messages
              </span>
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* HOSTED EVENTS SECTION                                */}
        {/* ==================================================== */}
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
                    {/* Poster Image Container */}
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
                          VIBE EVENT
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                        {isLive && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Live
                          </span>
                        )}
                        {isDraft && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-600 text-white shadow-sm">
                            Draft
                          </span>
                        )}
                        {isPast && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500 text-white shadow-sm">
                            Ended
                          </span>
                        )}
                      </div>

                      {/* Attendee Count Pill */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-black/75 text-white backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{rsvpCount} RSVPs</span>
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
                          <Clock className="w-3.5 h-3.5 text-[#E8621A]" />
                          <span>{event.start_at ? formatIST(event.start_at) : 'Date TBA'}</span>
                        </div>

                        <h3 className="font-black text-base text-[#0F172A] mt-1.5 line-clamp-2 leading-snug">
                          {event.title}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-2">
                          <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                          <span className="truncate">{event.location_name || event.city}</span>
                        </div>
                      </div>

                      {/* Host Actions */}
                      <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setGuestListEvent(event)}
                            className="py-2 px-3 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Guest List</span>
                          </button>

                          <button
                            onClick={() => setBroadcastEvent(event)}
                            className="py-2 px-3 rounded-xl border border-[#E2E8F0] hover:border-[#0F172A] text-[#0F172A] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Megaphone className="w-3.5 h-3.5 text-[#E8621A]" />
                            <span>Broadcast</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                          <Link
                            href={`/${event.slug}`}
                            target="_blank"
                            className="text-[#64748B] hover:text-[#0F172A] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>View Page</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShareEvent(event)}
                              className="p-1.5 text-[#64748B] hover:text-[#0F172A] transition-colors"
                              title="Share Event"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteEvent(event.id, event.title)}
                              className="p-1.5 text-[#94A3B8] hover:text-rose-600 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#0F172A]">
                  Guest List & RSVPs
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {guestListEvent.title} · {getEventRsvpCount(guestListEvent.id)} confirmed
                </p>
              </div>
              <button
                onClick={() => setGuestListEvent(null)}
                className="p-2 text-[#94A3B8] hover:text-[#0F172A] rounded-full hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-3">
              {getEventRsvps(guestListEvent.id).length === 0 ? (
                <div className="text-center py-12 text-[#64748B] text-xs">
                  No RSVPs registered yet for this event.
                </div>
              ) : (
                getEventRsvps(guestListEvent.id).map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">
                        {r.name || r.guest_name || 'Guest'}
                      </p>
                      <p className="text-xs text-[#64748B]">{r.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          r.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
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
