'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Sparkles,
  Compass,
  ArrowDown,
  RefreshCw,
  Vote,
  ArrowRight,
  SlidersHorizontal,
  Navigation
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import EventCard from '@/components/ui/EventCard';
import LocationModal from '@/components/location/LocationModal';
import {
  getUserCity,
  getUserCoords,
  getCityCoordinates,
  calculateDistanceKm,
  setUserLocation
} from '@/lib/location';
import {
  getEvents,
  syncEventsWithSupabase,
  getDatePolls,
  syncDatePollsWithSupabase,
  subscribeToStore
} from '@/lib/store';
import { EventItem, DatePoll } from '@/types';

interface EventWithDistance extends EventItem {
  distanceKm?: number | null;
}

export default function DiscoverPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [polls, setPolls] = useState<DatePoll[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userCity, setUserCity] = useState<string>('All India');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([syncEventsWithSupabase(), syncDatePollsWithSupabase()]);
      setEvents(getEvents());
      setPolls(getDatePolls());
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    setEvents(getEvents());
    setPolls(getDatePolls());

    // Reconcile with live Supabase database on mount
    Promise.all([syncEventsWithSupabase(), syncDatePollsWithSupabase()])
      .then(() => {
        setEvents(getEvents());
        setPolls(getDatePolls());
      })
      .catch(() => {});

    const update = () => {
      setEvents(getEvents());
      setPolls(getDatePolls());
    };
    const unsub = subscribeToStore(update);
    return () => unsub();
  }, []);

  // Listen for user location changes
  useEffect(() => {
    const syncLocation = () => {
      const city = getUserCity() || 'All India';
      setUserCity(city);
      const coords = getUserCoords() || (city !== 'All India' ? getCityCoordinates(city) : null);
      setUserCoords(coords);
    };

    syncLocation();
    window.addEventListener('vibe:location_changed', syncLocation);
    return () => window.removeEventListener('vibe:location_changed', syncLocation);
  }, []);

  // Calculate proximity distance for each event
  const eventsWithDistance: EventWithDistance[] = events.map((e) => {
    if (!userCoords || userCity === 'All India') {
      return { ...e, distanceKm: null };
    }

    let eventLat = e.location_lat;
    let eventLng = e.location_lng;

    if (!eventLat || !eventLng) {
      const resolved = getCityCoordinates(e.city);
      if (resolved) {
        eventLat = resolved.lat;
        eventLng = resolved.lng;
      }
    }

    if (eventLat && eventLng) {
      const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, eventLat, eventLng);
      return { ...e, distanceKm: dist };
    }

    // Direct city name match fallback
    if (e.city?.toLowerCase() === userCity.toLowerCase()) {
      return { ...e, distanceKm: 0 };
    }

    return { ...e, distanceKm: null };
  });

  // Dynamic filter pills matching location
  const filterPills = [
    'All',
    ...(userCity && userCity !== 'All India' && !['Pune', 'Mumbai', 'Bengaluru'].includes(userCity)
      ? [userCity]
      : []),
    'Pune',
    'Mumbai',
    'Bengaluru',
    'Date Polls',
    'Free',
    'Online',
    'This Weekend',
  ];

  const filteredEvents = eventsWithDistance
    .filter((e) => {
      // Strictly hide unverified drafts and private events from public discovery
      if (e.status !== 'live' || e.is_public === false) return false;

      // Search query match
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.tagline && e.tagline.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.city && e.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.location_name && e.location_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.source_platform && e.source_platform.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Filter pill matches
      if (activeFilter === 'All') return true;
      if (activeFilter === userCity) return e.city?.toLowerCase() === userCity.toLowerCase();
      if (activeFilter === 'Pune') return e.city?.toLowerCase() === 'pune';
      if (activeFilter === 'Mumbai') return e.city?.toLowerCase() === 'mumbai';
      if (activeFilter === 'Bengaluru') return e.city?.toLowerCase() === 'bengaluru';
      if (activeFilter === 'Free') return true; // All v1 events are free
      if (activeFilter === 'Online') return e.event_type === 'online' || e.event_type === 'hybrid';
      if (activeFilter === 'This Weekend') {
        const eventDate = new Date(e.start_at);
        const day = eventDate.getDay();
        return (
          day === 0 ||
          day === 6 ||
          eventDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Proximity ranking: events closest to user appear first!
      const aDist = typeof a.distanceKm === 'number' ? a.distanceKm : null;
      const bDist = typeof b.distanceKm === 'number' ? b.distanceKm : null;

      if (userCity !== 'All India' && (aDist !== null || bDist !== null)) {
        if (aDist !== null && bDist !== null) {
          if (aDist !== bDist) {
            return aDist - bDist;
          }
        } else if (aDist !== null) {
          return -1;
        } else if (bDist !== null) {
          return 1;
        }
      }
      // Fallback: Chronological ordering
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    });

  const displayedEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header Title & Proximity Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Proximity & Discovery Feed</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-brand">
              Experiences & Gatherings
            </h1>
            <p className="text-xs text-ink-muted mt-1">
              Curated communities, intimate dinners, hacker summits & cultural meetups
            </p>
          </div>

          {/* Action buttons: Location Selector & Sync Feed */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
            <button
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-surface border border-border text-ink hover:bg-surface-3 transition-all shadow-xs hover:border-accent/40 group"
              title="Change your location preference"
            >
              <MapPin className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>
                Near: <strong className="text-accent">{userCity}</strong>
              </span>
              <span className="text-[11px] text-ink-muted group-hover:text-ink underline ml-1">
                Change
              </span>
            </button>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-ink hover:bg-surface-3 transition-all shadow-xs"
              title="Refresh feed with latest live events from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-accent ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Feed'}</span>
            </button>
          </div>
        </div>

        {/* Proximity notice strip if active city is set */}
        {userCity !== 'All India' && (
          <div className="mb-6 px-4 py-3 rounded-2xl bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                <Navigation className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-medium text-ink">
                Events are dynamically sorted by distance from <strong>{userCity}</strong>. Closest gatherings appear at the top.
              </span>
            </div>
            <button
              onClick={() => {
                setUserLocation('All India');
                setUserCity('All India');
                setUserCoords(null);
              }}
              className="text-xs font-bold text-accent hover:underline shrink-0"
            >
              Show all India (Clear proximity)
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="w-5 h-5 text-ink-muted absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search by event title, host, city, or neighborhood (e.g. Bandra, Indiranagar, Hauz Khas)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm font-medium pl-12 pr-4 py-3 rounded-2xl bg-surface border border-border shadow-sm focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {filterPills.map((pill) => (
            <button
              key={pill}
              onClick={() => setActiveFilter(pill)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === pill
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface text-ink-secondary border border-border hover:bg-surface-3 hover:text-ink'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Community Date Polls Highlight Strip (shown when browsing All) */}
        {activeFilter === 'All' && polls.length > 0 && !searchQuery && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-xs">
                <Vote className="w-5 h-5" />
              </span>
              <div>
                <span className="text-xs font-bold text-ink block">
                  Community Date Polling is Active ({polls.length} open {polls.length === 1 ? 'poll' : 'polls'})
                </span>
                <span className="text-[11px] text-ink-muted">
                  Help local hosts select dates for upcoming meetups, hacker summits, and curated dinners.
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveFilter('Date Polls')}
              className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-2 border border-border text-xs font-bold text-accent shadow-xs transition-all shrink-0 hover-lift"
            >
              Vote on Dates →
            </button>
          </div>
        )}

        {/* Active Filter: Date Polls View */}
        {activeFilter === 'Date Polls' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                All Active Date Polls ({polls.length})
              </span>
              <span className="text-xs text-ink-muted">Live votes updated in real-time</span>
            </div>

            {polls.length === 0 ? (
              <div className="bg-surface rounded-2xl p-12 border border-border text-center space-y-3 shadow-card">
                <Vote className="w-8 h-8 text-accent mx-auto" />
                <p className="font-display font-bold text-xl text-ink">No active date polls right now</p>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  Organizers can spin up community date polls from their dashboard to gather votes before publishing an event.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {polls.map((poll) => {
                  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
                  let topOpt = poll.options[0];
                  poll.options.forEach((o) => {
                    if (o.votes.length > (topOpt?.votes.length || 0)) topOpt = o;
                  });

                  return (
                    <div
                      key={poll.id}
                      className="bg-surface rounded-2xl p-6 border border-border shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-accent-light px-2.5 py-0.5 rounded-full">
                            Community Poll
                          </span>
                          <span className="text-xs font-semibold text-ink-muted">
                            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                          </span>
                        </div>

                        <h3 className="font-display font-bold text-lg text-ink hover:text-accent transition-colors">
                          <Link href={`/poll/${poll.slug}`}>{poll.title}</Link>
                        </h3>

                        {poll.description && (
                          <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                            {poll.description}
                          </p>
                        )}

                        <div className="space-y-1.5 pt-2 border-t border-border">
                          {poll.options.slice(0, 3).map((opt) => {
                            const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                            const isLeading = totalVotes > 0 && opt.votes.length === topOpt?.votes.length;
                            return (
                              <div key={opt.id} className="text-xs">
                                <div className="flex items-center justify-between text-[11px] mb-0.5">
                                  <span className="font-medium text-ink truncate">{opt.date_label}</span>
                                  <span className="font-mono text-ink-muted">{pct}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${isLeading ? 'bg-accent' : 'bg-ink-muted/30'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                        <span className="text-[11px] text-ink-muted">
                          by <strong className="text-ink">{poll.organizer_name}</strong>
                        </span>

                        <Link
                          href={`/poll/${poll.slug}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-bold transition-all shadow-xs hover-lift"
                        >
                          <span>Cast Vote</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Events Grid (3-col desktop, 1-col mobile) */
          filteredEvents.length === 0 ? (
            <div className="bg-surface rounded-2xl p-12 border border-border text-center space-y-3 shadow-card">
              <p className="font-display font-bold text-xl text-ink">No events match your search or proximity</p>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                Try expanding your search or select a different city to discover more gatherings!
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('All');
                    setUserLocation('All India');
                    setUserCity('All India');
                  }}
                  className="text-xs text-accent font-bold underline"
                >
                  View All India Events
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    distanceKm={event.distanceKm}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {filteredEvents.length > visibleCount && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 3)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-surface hover:bg-surface-3 border border-border text-ink text-xs font-bold transition-all shadow-xs hover-lift"
                  >
                    <ArrowDown className="w-4 h-4 text-accent" />
                    <span>Load More Experiences</span>
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </main>

      {/* Location Selection Modal (can be triggered directly from Discover) */}
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelectCity={(city) => setUserCity(city)}
      />

      <Footer />
    </div>
  );
}
