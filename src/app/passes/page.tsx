'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Compass,
  MapPin,
  Ticket,
  Search,
  CheckCircle,
  Clock,
  QrCode,
  ExternalLink,
  X,
  Mail,
  RefreshCw,
  Plus
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import DigitalPassModal from '@/components/ui/DigitalPassModal';
import {
  getEvents,
  getRSVPs,
  syncEventsWithSupabase,
  syncRSVPsWithSupabase,
  cancelRSVP
} from '@/lib/store';
import { EventItem, RSVPItem } from '@/types';
import { useAuth } from '@/lib/auth';

function PassesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, isLoggedIn } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  // Sub-filter: upcoming, past, all
  const [passFilter, setPassFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [passSearch, setPassSearch] = useState('');

  // Selected Pass for Digital Pass Modal with QR
  const [selectedPass, setSelectedPass] = useState<{ rsvp: RSVPItem; event: EventItem } | null>(null);

  // Guest email switcher
  const [guestEmail, setGuestEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Load & Sync data
  const loadData = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([syncEventsWithSupabase(), syncRSVPsWithSupabase()]);
    } catch (e) {
      console.warn('Passes sync fallback:', e);
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

  // Handle email switch
  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      const clean = emailInput.trim().toLowerCase();
      setGuestEmail(clean);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vibe_guest_email', clean);
      }
      setIsEditingEmail(false);
    }
  };

  // Format date helper
  const formatBookMyShowDate = (dateStr?: string) => {
    if (!dateStr) return 'Date TBA';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Filter passes belonging to this guest
  const guestPasses = useMemo(() => {
    const targetEmail = guestEmail.trim().toLowerCase();

    return rsvps
      .filter((r) => {
        if (!targetEmail) return true;
        const rEmail = (r.email || '').toLowerCase().trim();
        return rEmail === targetEmail;
      })
      .map((r) => ({
        rsvp: r,
        event: events.find((e) => e.id === r.event_id),
      }))
      .filter(
        (item): item is { rsvp: RSVPItem; event: EventItem } => item.event !== undefined
      );
  }, [rsvps, events, guestEmail]);

  // Sub-filtered passes
  const filteredPasses = useMemo(() => {
    const now = new Date();

    return guestPasses.filter(({ rsvp, event }) => {
      // 1. Status/Time Filter
      if (passFilter === 'upcoming') {
        if (rsvp.status === 'cancelled') return false;
        if (event.start_at) {
          const start = new Date(event.start_at);
          if (start < now) return false;
        }
      } else if (passFilter === 'past') {
        if (event.start_at) {
          const start = new Date(event.start_at);
          if (start >= now && rsvp.status !== 'cancelled') return false;
        } else {
          return false;
        }
      }

      // 2. Search query filter
      if (passSearch.trim()) {
        const q = passSearch.toLowerCase().trim();
        const titleMatch = event.title.toLowerCase().includes(q);
        const venueMatch = (event.location_name || '').toLowerCase().includes(q);
        const cityMatch = (event.city || '').toLowerCase().includes(q);
        return titleMatch || venueMatch || cityMatch;
      }

      return true;
    });
  }, [guestPasses, passFilter, passSearch]);

  // Attendee metrics
  const confirmedCount = guestPasses.filter((p) => p.rsvp.status === 'confirmed').length;
  const upcomingCount = guestPasses.filter((p) => {
    if (p.rsvp.status === 'cancelled') return false;
    if (!p.event.start_at) return true;
    return new Date(p.event.start_at) >= new Date();
  }).length;
  const pastCount = guestPasses.filter((p) => {
    if (!p.event.start_at) return false;
    return new Date(p.event.start_at) < new Date();
  }).length;

  // Handle pass cancellation
  const handleCancelPass = (rsvpId: string) => {
    if (window.confirm('Are you sure you want to cancel your RSVP for this event?')) {
      cancelRSVP(rsvpId);
      setRsvps(getRSVPs());
    }
  };

  const displayName = profile?.name || guestEmail.split('@')[0] || 'Guest';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#0A0A0A]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full">
        {/* ==================================================== */}
        {/* ATTENDEE ACCOUNT HERO BANNER                        */}
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
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-[#E8621A] border border-amber-200">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Digital Pass Wallet</span>
                  </span>
                  <span className="text-xs text-[#94A3B8]">·</span>
                  <span className="text-xs font-semibold text-[#64748B]">
                    {guestEmail || profile?.email || 'Attendee Hub'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A] mt-1.5">
                  My Passes & Bookings
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 max-w-xl">
                  Access your entry QR codes, live tickets, venue directions, and calendar reminders.
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
                <span>Host an Event</span>
              </Link>
            </div>
          </div>

          {/* Attendee Quick KPI Strip */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-[#F1F5F9]">
            {/* Metric 1: My Confirmed Passes */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Confirmed Passes
                </span>
                <Ticket className="w-4 h-4 text-[#E8621A]" />
              </div>
              <p className="text-2xl font-black text-[#0F172A] mt-1.5">{confirmedCount}</p>
              <span className="text-[11px] text-[#64748B] mt-0.5 block font-medium">
                Active tickets
              </span>
            </div>

            {/* Metric 2: Upcoming Events */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Upcoming
                </span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-[#0F172A] mt-1.5">{upcomingCount}</p>
              <span className="text-[11px] text-[#64748B] mt-0.5 block font-medium">
                Future gatherings
              </span>
            </div>

            {/* Metric 3: Past Experiences */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Past Attended
                </span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-[#0F172A] mt-1.5">{pastCount}</p>
              <span className="text-[11px] text-[#64748B] mt-0.5 block font-medium">
                Completed events
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* PASSES FILTER & SEARCH BAR                          */}
        {/* ==================================================== */}
        <div className="space-y-6">
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
                Showing passes issued to{' '}
                <strong className="text-[#0F172A] font-bold">
                  {guestEmail || 'your guest session'}
                </strong>
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

          {/* Passes Grid */}
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
                Bookings and event passes you register for will appear here with live QR verification codes and entry directions.
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
                    {/* Poster Image Container */}
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

                      {/* Date Banner (Bottom Edge Overlay) */}
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

                      {/* Card Action Buttons */}
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
      </main>

      <Footer />

      {/* Digital Pass Modal with QR */}
      {selectedPass && (
        <DigitalPassModal
          rsvp={selectedPass.rsvp}
          event={selectedPass.event}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </div>
  );
}

export default function PassesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0F172A]" />
        </div>
      }
    >
      <PassesInner />
    </Suspense>
  );
}
