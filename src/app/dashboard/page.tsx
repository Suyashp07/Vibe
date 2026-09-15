'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  Mail
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import ShareEventModal from '@/components/events/ShareEventModal';
import {
  getEvents,
  getRSVPs,
  deleteEvent,
  syncEventsWithSupabase,
  syncRSVPsWithSupabase,
  formatIST
} from '@/lib/store';
import { EventItem, RSVPItem } from '@/types';
import { useAuth } from '@/lib/auth';

export default function HostDashboardPage() {
  const router = useRouter();
  const { profile, isLoggedIn, loading: authLoading } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'drafts' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(true);

  // Selected event for Share Modal
  const [shareEvent, setShareEvent] = useState<EventItem | null>(null);

  // Selected event for Guest List Modal
  const [guestListEvent, setGuestListEvent] = useState<EventItem | null>(null);

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

  // Filter events belonging to this host/organizer
  const hostEvents = useMemo(() => {
    if (!profile) return events;
    // If user has created events, match by organizer_id or show all user's events
    const matching = events.filter(
      (e) =>
        e.organizer_id === profile.id ||
        (profile.handle && e.organizer_handle === profile.handle)
    );
    // If no events explicitly tied to profile id yet (e.g. sample or first-time user), show all available
    return matching.length > 0 ? matching : events;
  }, [events, profile]);

  // Compute key host metrics
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
    };
  }, [hostEvents, rsvps]);

  // Filter events by selected tab and search
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return hostEvents
      .filter((e) => {
        const st = String(e.status || '');
        const isLive = st === 'live' || st === 'published';
        const isDraft = st === 'draft';
        const isFuture = e.start_at ? new Date(e.start_at) >= now : true;

        if (activeTab === 'upcoming') return isLive && isFuture;
        if (activeTab === 'past') return isLive && !isFuture;
        if (activeTab === 'drafts') return isDraft;
        return true;
      })
      .filter((e) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          (e.location_name || '').toLowerCase().includes(q)
        );
      });
  }, [hostEvents, activeTab, searchQuery]);

  // Get RSVP count for an event
  const getEventRsvpCount = (eventId: string) => {
    return rsvps.filter((r) => r.event_id === eventId && r.status === 'confirmed').length;
  };

  // Handle Event Deletion
  const handleDeleteEvent = async (event: EventItem) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"? This cannot be undone.`)) return;
    deleteEvent(event.id);
    setEvents(getEvents());
  };

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col font-sans selection:bg-[#0A0A0A] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Host Welcome & Hero Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#F1F5F9] text-[#475569]">
                Host Station
              </span>
              <span className="text-xs text-[#94A3B8]">·</span>
              <span className="text-xs font-semibold text-[#64748B]">District Standard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0A0A] mt-2">
              {profile ? `Welcome back, ${profile.name || 'Host'}` : 'Host Dashboard'}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-xl">
              Host and manage your gatherings, track confirmed attendee RSVPs, and discover what's happening around you.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] text-[#0A0A0A] text-xs font-bold rounded-full hover:border-[#0A0A0A] hover:bg-[#F8FAFC] transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Discover Events</span>
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-[#262626] transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Link>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Events Hosted</p>
              <p className="text-2xl font-black text-[#0A0A0A] mt-1">{metrics.totalHosted}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0A0A0A]">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Confirmed Guests</p>
              <p className="text-2xl font-black text-[#0A0A0A] mt-1">{metrics.totalGuests}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0A0A0A]">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Upcoming Events</p>
              <p className="text-2xl font-black text-[#0A0A0A] mt-1">{metrics.upcomingEvents}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0A0A0A]">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'past', label: 'Past Events' },
              { id: 'drafts', label: 'Drafts' },
              { id: 'all', label: 'All Events' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all ${
                    active
                      ? 'bg-[#0A0A0A] text-white'
                      : 'text-[#64748B] hover:text-[#0A0A0A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search my events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-full focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#94A3B8]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0A0A0A]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="py-20 border border-dashed border-[#E2E8F0] rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-[#FBFBFC]">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] mb-3 shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0A0A0A]">
              {activeTab === 'upcoming'
                ? 'No upcoming events scheduled'
                : activeTab === 'drafts'
                ? 'No saved drafts'
                : 'No events found'}
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm">
              Create an event to bring people together, or explore upcoming gatherings happening around you.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <Link
                href="/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-[#262626] transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Event</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] text-[#0A0A0A] text-xs font-semibold rounded-full hover:border-[#0A0A0A] hover:bg-white transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore City Events</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((event) => {
              const rsvpCount = getEventRsvpCount(event.id);
              const isDraft = event.status === 'draft';
              const isPast = event.start_at ? new Date(event.start_at) < new Date() : false;
              const cardSt = String(event.status || '');
              const isLive = (cardSt === 'live' || cardSt === 'published') && !isPast;

              return (
                <div
                  key={event.id}
                  className="group flex flex-col bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:border-[#0A0A0A] transition-all hover:shadow-md"
                >
                  {/* Card Cover Image */}
                  <div className="relative aspect-[16/9] w-full bg-[#F1F5F9] overflow-hidden">
                    {event.cover_image_url ? (
                      <Image
                        src={event.cover_image_url}
                        alt={event.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#94A3B8]">
                        VIBE EVENT
                      </div>
                    )}

                    {/* Status Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {isLive && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-green-700 shadow-sm backdrop-blur-sm flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Live
                        </span>
                      )}
                      {isDraft && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-amber-700 shadow-sm backdrop-blur-sm">
                          Draft
                        </span>
                      )}
                      {isPast && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-[#64748B] shadow-sm backdrop-blur-sm">
                          Past
                        </span>
                      )}
                      {event.is_external && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A0A0A]/80 text-white backdrop-blur-sm">
                          External
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-[#0A0A0A] leading-snug line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="mt-2 space-y-1 text-xs text-[#64748B]">
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                          <span>{event.start_at ? formatIST(event.start_at) : 'TBA'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                          <span>{event.location_name || event.city || 'Online'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Attendee / RSVP Stats */}
                    <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                      <button
                        onClick={() => setGuestListEvent(event)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0A] hover:text-blue-600 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>{rsvpCount} {rsvpCount === 1 ? 'Guest' : 'Guests'}</span>
                        <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
                      </button>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShareEvent(event)}
                          title="Share event link"
                          className="p-1.5 rounded-full hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0A0A0A] transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/${event.slug}`}
                          target="_blank"
                          title="View public event page"
                          className="p-1.5 rounded-full hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0A0A0A] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleDeleteEvent(event)}
                          title="Delete event"
                          className="p-1.5 rounded-full hover:bg-red-50 text-[#94A3B8] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Guest List Modal */}
      {guestListEvent && (
        <GuestListModal
          event={guestListEvent}
          rsvps={rsvps.filter((r) => r.event_id === guestListEvent.id)}
          onClose={() => setGuestListEvent(null)}
        />
      )}

      {/* Share Modal */}
      {shareEvent && (
        <ShareEventModal
          isOpen={Boolean(shareEvent)}
          onClose={() => setShareEvent(null)}
          event={shareEvent}
        />
      )}

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

  // Export Attendees to CSV
  const handleExportCSV = () => {
    if (confirmedGuests.length === 0) return;
    const headers = ['Name', 'Email', 'Status', 'RSVP Date'];
    const rows = confirmedGuests.map((g) => [
      `"${g.name || g.guest_name || 'Guest'}"`,
      `"${g.email || g.guest_email || ''}"`,
      `"${g.status}"`,
      `"${g.created_at || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `guests-${event.slug || 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy all emails
  const handleCopyEmails = async () => {
    const emails = confirmedGuests.map((g) => g.email || g.guest_email).filter(Boolean).join(', ');
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#E2E8F0] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-sm text-[#0A0A0A]">Confirmed Guests</h2>
            <p className="text-[11px] text-[#64748B] truncate max-w-xs">
              {event.title} · {confirmedGuests.length} registered
            </p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#0A0A0A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search + Actions */}
        <div className="p-4 border-b border-[#F1F5F9] flex items-center gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search guests by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>

          <button
            onClick={handleCopyEmails}
            disabled={confirmedGuests.length === 0}
            title="Copy all guest emails"
            className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0A0A0A] hover:bg-[#F8FAFC] flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            {copiedEmails ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedEmails ? 'Copied' : 'Emails'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={confirmedGuests.length === 0}
            title="Export CSV"
            className="px-3 py-1.5 bg-[#0A0A0A] text-white rounded-lg text-xs font-bold hover:bg-[#262626] flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        {/* Guest List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredGuests.length === 0 ? (
            <div className="py-16 text-center text-[#94A3B8]">
              <Users className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
              <p className="text-xs font-semibold text-[#0A0A0A]">No attendees found</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {confirmedGuests.length === 0 ? 'Share your event link to start collecting RSVPs.' : 'No matches for this search query.'}
              </p>
            </div>
          ) : (
            filteredGuests.map((guest) => {
              const displayName = guest.name || guest.guest_name || 'Guest';
              const displayEmail = guest.email || guest.guest_email || '';
              return (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#0A0A0A] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center font-bold text-xs text-[#0A0A0A] shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#0A0A0A] truncate">{displayName}</p>
                      <p className="text-[11px] text-[#64748B] truncate">{displayEmail}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-200">
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
