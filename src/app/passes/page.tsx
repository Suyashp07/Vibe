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
  Plus,
  Scan,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import DigitalPassModal from '@/components/ui/DigitalPassModal';
import {
  getEvents,
  getRSVPs,
  syncEventsWithSupabase,
  syncRSVPsWithSupabase,
  cancelRSVP,
} from '@/lib/store';
import { EventItem, RSVPItem } from '@/types';
import { useAuth } from '@/lib/auth';
import { getPassSerialNumber } from '@/lib/ticketSecurity';

interface PassDisplayItem {
  id: string;
  rsvp: RSVPItem;
  event: EventItem;
  passSerial: string;
  price: string;
  formattedDate: string;
  category: string;
  isSample?: boolean;
}

const SAMPLE_PASSES: PassDisplayItem[] = [
  {
    id: 'sample-1',
    passSerial: 'VB-PREVIEW-001',
    price: '₹499',
    formattedDate: 'THU, 15 OCT · 7:00 PM',
    category: 'Music',
    isSample: true,
    rsvp: {
      id: 'sample-rsvp-1',
      event_id: 'sample-event-1',
      name: 'Guest Pass Holder',
      email: 'attendee@vibe.community',
      phone: '+91 98765 43210',
      status: 'confirmed',
      pass_serial: 'VB-PREVIEW-001',
      enrollment_number: 1,
      created_at: new Date().toISOString(),
    },
    event: {
      id: 'sample-event-1',
      slug: 'sameera-bharadwaj-live',
      title: 'Sameera Bharadwaj, live',
      category: 'Music',
      cover_image_url:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
      location_name: 'Live Venue, Mumbai',
      city: 'Mumbai',
      start_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 50,
      spots_filled: 42,
      status: 'live',
      description: 'An intimate live rooftop session under the Mumbai sunset sky.',
      organizer_id: 'org-sample-1',
      organizer_name: 'Swaniki Social',
    } as EventItem,
  },
  {
    id: 'sample-2',
    passSerial: 'VB-PREVIEW-002',
    price: '₹299',
    formattedDate: 'FRI, 16 OCT · 6:00 PM',
    category: 'Music',
    isSample: true,
    rsvp: {
      id: 'sample-rsvp-2',
      event_id: 'sample-event-2',
      name: 'Guest Pass Holder',
      email: 'attendee@vibe.community',
      phone: '+91 98765 43210',
      status: 'confirmed',
      pass_serial: 'VB-PREVIEW-002',
      enrollment_number: 2,
      created_at: new Date().toISOString(),
    },
    event: {
      id: 'sample-event-2',
      slug: 'royal-raas-2-0',
      title: 'Royal Raas 2.0',
      category: 'Music',
      cover_image_url:
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&auto=format&fit=crop&q=80',
      location_name: 'Kurry Leaf, Pune',
      city: 'Pune',
      start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 100,
      spots_filled: 88,
      status: 'live',
      description: 'High energy festive garba & dandiya raas under stadium lighting.',
      organizer_id: 'org-sample-2',
      organizer_name: 'Swaniki Social',
    } as EventItem,
  },
  {
    id: 'sample-3',
    passSerial: 'VB-PREVIEW-003',
    price: '₹1,200',
    formattedDate: 'FRI, 16 OCT · 8:00 PM',
    category: 'Food',
    isSample: true,
    rsvp: {
      id: 'sample-rsvp-3',
      event_id: 'sample-event-3',
      name: 'Guest Pass Holder',
      email: 'attendee@vibe.community',
      phone: '+91 98765 43210',
      status: 'confirmed',
      pass_serial: 'VB-PREVIEW-003',
      enrollment_number: 3,
      created_at: new Date().toISOString(),
    },
    event: {
      id: 'sample-event-3',
      slug: 'the-friday-supper-club',
      title: 'The Friday supper club',
      category: 'Food',
      cover_image_url:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
      location_name: 'Bandra, Mumbai',
      city: 'Mumbai',
      start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 16,
      spots_filled: 14,
      status: 'live',
      description: 'A 5-course curated communal dining experience in Bandra.',
      organizer_id: 'org-sample-3',
      organizer_name: 'Swaniki Social',
    } as EventItem,
  },
  {
    id: 'sample-4',
    passSerial: 'VB-PREVIEW-004',
    price: 'Free',
    formattedDate: 'SAT, 17 OCT · 11:00 AM',
    category: 'Technology',
    isSample: true,
    rsvp: {
      id: 'sample-rsvp-4',
      event_id: 'sample-event-4',
      name: 'Guest Pass Holder',
      email: 'attendee@vibe.community',
      phone: '+91 98765 43210',
      status: 'confirmed',
      pass_serial: 'VB-PREVIEW-004',
      enrollment_number: 4,
      created_at: new Date().toISOString(),
    },
    event: {
      id: 'sample-event-4',
      slug: 'good-coffee-great-connections',
      title: 'Good coffee. Great connections.',
      category: 'Technology',
      cover_image_url:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
      location_name: 'The Studio, Mumbai',
      city: 'Mumbai',
      start_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      capacity: 12,
      spots_filled: 4,
      status: 'live',
      description: 'A small, easy-going gathering. Come solo or bring a friend.',
      organizer_id: 'org-sample-4',
      organizer_name: 'Swaniki Social',
    } as EventItem,
  },
];

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

  // Toggle for preview sample passes
  const [showSamplePasses, setShowSamplePasses] = useState(true);

  // Load & Sync data from Supabase & local storage
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

  // Format date helper matching screenshot: "THU, 15 OCT · 7:00 PM"
  const formatBookMyShowDate = (dateStr?: string) => {
    if (!dateStr) return 'DATE TBA';
    try {
      const d = new Date(dateStr);
      const day = d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();
      const dateNum = d.getDate();
      const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
      const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
      return `${day}, ${dateNum} ${month} · ${time}`;
    } catch {
      return dateStr;
    }
  };

  // Filter real passes belonging to this guest
  const realGuestPasses = useMemo(() => {
    const targetEmail = guestEmail.trim().toLowerCase();
    if (!targetEmail) return [];

    return rsvps
      .filter((r) => {
        const rEmail = (r.email || '').toLowerCase().trim();
        return rEmail === targetEmail;
      })
      .map((r) => {
        const event = events.find((e) => e.id === r.event_id || e.slug === r.event_id);
        return { rsvp: r, event };
      })
      .filter(
        (item): item is { rsvp: RSVPItem; event: EventItem } => item.event !== undefined
      );
  }, [rsvps, events, guestEmail]);

  // Convert real passes into display items
  const realDisplayPasses = useMemo<PassDisplayItem[]>(() => {
    return realGuestPasses.map(({ rsvp, event }) => {
      let price = 'Free';
      if ((event as any).ticket_tiers && (event as any).ticket_tiers.length > 0) {
        price = `₹${(event as any).ticket_tiers[0].price}`;
      } else if (event.external_price_text) {
        price = event.external_price_text;
      }

      return {
        id: rsvp.id,
        rsvp,
        event,
        passSerial: rsvp.pass_serial || getPassSerialNumber(rsvp, event, rsvps),
        price,
        formattedDate: formatBookMyShowDate(event.start_at),
        category: event.category || 'Special',
        isSample: false,
      };
    });
  }, [realGuestPasses, rsvps]);

  // Combine real passes with sample passes if requested or if user has no passes yet
  const allAvailablePasses = useMemo<PassDisplayItem[]>(() => {
    if (realDisplayPasses.length > 0 && !showSamplePasses) {
      return realDisplayPasses;
    }
    if (realDisplayPasses.length > 0 && showSamplePasses) {
      return [...realDisplayPasses, ...SAMPLE_PASSES];
    }
    return SAMPLE_PASSES;
  }, [realDisplayPasses, showSamplePasses]);

  // Sub-filtered passes according to active tab & search query
  const filteredPasses = useMemo(() => {
    const now = new Date();

    return allAvailablePasses.filter((item) => {
      const { rsvp, event } = item;

      // 1. Status / Time Filter
      if (passFilter === 'upcoming') {
        if (rsvp.status === 'cancelled') return false;
        if (event.start_at && !item.isSample) {
          const start = new Date(event.start_at);
          if (start < now) return false;
        }
      } else if (passFilter === 'past') {
        if (item.isSample) return false;
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
        const catMatch = (item.category || '').toLowerCase().includes(q);
        return titleMatch || venueMatch || cityMatch || catMatch;
      }

      return true;
    });
  }, [allAvailablePasses, passFilter, passSearch]);

  // Attendee metrics matching Screenshot 1 exactly
  const confirmedCount = allAvailablePasses.filter((p) => p.rsvp.status === 'confirmed').length;
  const upcomingCount = allAvailablePasses.filter((p) => {
    if (p.rsvp.status === 'cancelled') return false;
    if (p.isSample) return true;
    if (!p.event.start_at) return true;
    return new Date(p.event.start_at) >= new Date();
  }).length;
  const pastCount = allAvailablePasses.filter((p) => {
    if (p.isSample) return false;
    if (!p.event.start_at) return false;
    return new Date(p.event.start_at) < new Date();
  }).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#F3F4F6] selection:bg-[#FF5500] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* ========================================================= */}
        {/* 1. TOP HEADER & HERO SECTION (MATCHING SCREENSHOT 1)       */}
        {/* ========================================================= */}
        <div className="space-y-4 mb-8">
          {/* Top Pill Row */}
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30 shadow-xs">
              <Ticket className="w-3.5 h-3.5 fill-current" />
              <span>YOUR DIGITAL WALLET</span>
            </div>

            <button
              onClick={() => setShowSamplePasses(!showSamplePasses)}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Toggle preview sample passes"
            >
              {showSamplePasses ? 'Sample passes' : 'Real passes only'}
            </button>
          </div>

          {/* Heading + Explore Events Button */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black tracking-tight text-white leading-tight">
                My passes &amp; bookings<span className="text-[#FF5500]">.</span>
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 mt-1">
                Good plans. All in one place.
              </p>
            </div>

            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 text-xs font-bold text-white transition-all shadow-sm self-start sm:self-auto cursor-pointer"
            >
              <Compass className="w-4 h-4 text-neutral-400" />
              <span>Explore events</span>
              <span className="text-xs font-normal">↗</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. THREE STATS KPI CARDS (MATCHING SCREENSHOT 1)           */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Card 1: Confirmed passes */}
          <div className="p-5 rounded-2xl bg-[#0D0D10] border border-white/10 flex items-center gap-4 transition-all hover:border-white/15">
            <div className="w-12 h-12 rounded-xl bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500] shrink-0">
              <Ticket className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400">Confirmed passes</p>
              <p className="text-3xl font-black text-white tracking-tight mt-0.5">
                {String(confirmedCount).padStart(2, '0')}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Ready for your next good time
              </p>
            </div>
          </div>

          {/* Card 2: Upcoming events */}
          <div className="p-5 rounded-2xl bg-[#0D0D10] border border-white/10 flex items-center gap-4 transition-all hover:border-white/15">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400">Upcoming events</p>
              <p className="text-3xl font-black text-white tracking-tight mt-0.5">
                {String(upcomingCount).padStart(2, '0')}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                On your calendar
              </p>
            </div>
          </div>

          {/* Card 3: Past attended */}
          <div className="p-5 rounded-2xl bg-[#0D0D10] border border-white/10 flex items-center gap-4 transition-all hover:border-white/15">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400">Past attended</p>
              <p className="text-3xl font-black text-white tracking-tight mt-0.5">
                {String(pastCount).padStart(2, '0')}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                More memories ahead
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. TABS AND SEARCH BAR (MATCHING SCREENSHOT 1)            */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPassFilter('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                passFilter === 'upcoming'
                  ? 'bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30'
                  : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
              }`}
            >
              <span>Upcoming</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  passFilter === 'upcoming'
                    ? 'bg-[#FF5500] text-white'
                    : 'bg-white/10 text-neutral-400'
                }`}
              >
                {upcomingCount}
              </span>
            </button>

            <button
              onClick={() => setPassFilter('past')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                passFilter === 'past'
                  ? 'bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30'
                  : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
              }`}
            >
              <span>Past events</span>
            </button>

            <button
              onClick={() => setPassFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                passFilter === 'all'
                  ? 'bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/30'
                  : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
              }`}
            >
              <span>All bookings</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event or venue"
              value={passSearch}
              onChange={(e) => setPassSearch(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#0D0D10] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF5500]/60 transition-colors shadow-xs"
            />
            {passSearch && (
              <button
                onClick={() => setPassSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Section title & count */}
        <div className="flex items-center justify-between text-xs text-neutral-400 font-medium mb-4">
          <span>Your next good times</span>
          <span>{filteredPasses.length} bookings</span>
        </div>

        {/* ========================================================= */}
        {/* 4. PASSES GRID (MATCHING SCREENSHOT 1 & 2)                */}
        {/* ========================================================= */}
        {filteredPasses.length === 0 ? (
          <div className="py-20 bg-[#0D0D10] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-8 text-white">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF5500] mb-4">
              <Ticket className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No bookings found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              Your registered events and passes will appear here with entry passes and gate verification codes.
            </p>
            <Link
              href="/discover"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF5500] hover:bg-[#E04B00] text-xs font-bold text-white transition-all shadow-md"
            >
              <Compass className="w-4 h-4" />
              <span>Explore events</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPasses.map((item) => {
              const { rsvp, event, passSerial, price, formattedDate, category } = item;

              return (
                <div
                  key={item.id}
                  className="bg-[#0D0D10] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group shadow-xl"
                >
                  {/* Top Image Poster Container */}
                  <div className="relative aspect-[16/10] w-full bg-black overflow-hidden">
                    {event.cover_image_url ? (
                      <Image
                        src={event.cover_image_url}
                        alt={event.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white/50 text-xs font-bold">
                        VIBE GATHERING
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Top Left: Confirmed Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/35 backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <CheckCircle className="w-3 h-3 text-[#10B981]" />
                        <span>Confirmed</span>
                      </span>
                    </div>

                    {/* Bottom Left: Category Pill */}
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/65 text-white backdrop-blur-md border border-white/15">
                        {category}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Date & Time in Orange */}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF5500] uppercase tracking-wide">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </div>

                      {/* Event Title */}
                      <h3 className="text-lg font-black text-white leading-snug mt-1.5 line-clamp-1 group-hover:text-[#FF5500] transition-colors">
                        {event.title}
                      </h3>

                      {/* Venue / Location */}
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="truncate">
                          {event.location_name || event.city || 'Mumbai'}
                        </span>
                      </div>
                    </div>

                    {/* Quantity & Price Row */}
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
                      <span className="text-neutral-400 font-medium">1 guest pass</span>
                      <span className="font-bold text-white text-sm">{price}</span>
                    </div>
                  </div>

                  {/* Ticket Perforation Dashed Line with Notches */}
                  <div className="relative my-0.5 px-3">
                    {/* Left half-circle cutout notch */}
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#050505] rounded-full border-r border-white/10" />
                    {/* Dashed line */}
                    <div className="border-t border-dashed border-white/15 w-full" />
                    {/* Right half-circle cutout notch */}
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#050505] rounded-full border-l border-white/10" />
                  </div>

                  {/* Card Footer: Pass ID + View Pass Button */}
                  <div className="p-4 pt-2 pb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                        PASS ID
                      </p>
                      <p className="text-xs font-mono font-bold text-white tracking-wider mt-0.5">
                        {passSerial}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedPass({ rsvp, event })}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 text-xs font-bold text-white flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                    >
                      <span>View pass</span>
                      <span className="text-xs font-normal">↗</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Email switcher utility footer row */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>
              Passes synced for:{' '}
              <strong className="text-neutral-300 font-semibold">
                {guestEmail || profile?.email || 'Guest attendee session'}
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
                className="px-3 py-1 text-xs bg-[#111114] border border-white/15 rounded-lg focus:outline-none focus:border-[#FF5500] text-white"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-[#FF5500] text-white text-xs font-bold rounded-lg hover:bg-[#E04B00]"
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => setIsEditingEmail(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditingEmail(true)}
                className="text-[#FF5500] hover:underline font-bold cursor-pointer"
              >
                Switch Email
              </button>
              <Link
                href="/organizer/check-in"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Gate Check-in Tool ↗
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Digital Pass Modal with QR Code, Barcode, Calendar Integration */}
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
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#FF5500]" />
        </div>
      }
    >
      <PassesInner />
    </Suspense>
  );
}
