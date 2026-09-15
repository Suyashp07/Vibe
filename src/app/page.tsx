'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Calendar,
  Users,
  Compass,
  MapPin,
  Search,
  Plus,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import EventCard from '@/components/ui/EventCard';
import {
  getEvents,
  getRSVPs,
  formatIST,
  syncEventsWithSupabase,
  subscribeToStore,
  SAMPLE_TEMPLATE_EVENTS
} from '@/lib/store';
import { EventItem, RSVPItem } from '@/types';
import { INDIAN_CITIES, getUserCity } from '@/lib/location';

const FEATURED_CITIES = ['All India', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Pune', 'Hyderabad', 'Goa'];

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('All India');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const initialCity = getUserCity() || 'All India';
    setSelectedCity(initialCity);

    setEvents(getEvents());
    setRsvps(getRSVPs());

    syncEventsWithSupabase().then((synced) => {
      if (synced && synced.length > 0) {
        setEvents(synced);
      } else {
        setEvents(getEvents());
      }
      setRsvps(getRSVPs());
    }).catch(() => {
      setEvents(getEvents());
      setRsvps(getRSVPs());
    });

    const update = () => {
      setEvents(getEvents());
      setRsvps(getRSVPs());
    };
    const unsub = subscribeToStore(update);
    return () => unsub();
  }, []);

  // Filter events by live status, public visibility, selected city, and search query
  const liveEvents = events.filter((e) => e.status === 'live' && e.is_public !== false);
  const sourceEvents = liveEvents.length > 0 ? liveEvents : SAMPLE_TEMPLATE_EVENTS;

  const filteredEvents = sourceEvents.filter((ev) => {
    const matchesCity =
      selectedCity === 'All India' ||
      ev.city?.toLowerCase().includes(selectedCity.toLowerCase()) ||
      ev.location_address?.toLowerCase().includes(selectedCity.toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.tagline?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCity && matchesSearch;
  });

  // If returning from OAuth (?code=...), display a clean instant redirect state
  if (codeParam) {
    return (
      <div className="min-h-screen bg-surface-2 flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="font-sans font-bold text-xl text-ink">Signing you in with Google...</h2>
            <p className="text-xs text-ink-muted">Redirecting you straight to your dashboard.</p>
          </div>
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />

      {/* Clean District Search & City Filter Bar — No marketing hero fluff */}
      <section className="pt-6 pb-4 border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, venue, or neighborhood..."
              className="w-full pl-10 pr-4 py-3 bg-surface-2 border border-border rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-colors shadow-xs"
            />
            <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-3.5 pointer-events-none" />
          </div>

          {/* City Pills */}
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-2xl mx-auto">
            {FEATURED_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCity.toLowerCase() === city.toLowerCase()
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface-3 text-ink-muted hover:text-ink border border-border/80'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* Live Events Grid */}
      <section className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-sans font-bold text-xl text-ink">
              Events in {selectedCity}
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              {filteredEvents.length} active experiences available
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
          >
            <span>+ Create your event</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-2xl border border-border shadow-xs space-y-3">
            <p className="text-sm font-bold text-ink">No events found in {selectedCity}.</p>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Be the first to host an experience in this city or switch to "All India" to browse experiences across the country.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => { setSelectedCity('All India'); setSearchQuery(''); }}
                className="px-4 py-2 bg-surface-3 text-ink text-xs font-semibold rounded-xl border border-border"
              >
                Clear Filters
              </button>
              <Link
                href="/create"
                className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Create Event
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-2 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}
