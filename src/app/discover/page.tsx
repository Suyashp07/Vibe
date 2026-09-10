'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Map, Grid, Filter, Sparkles, Compass, ArrowDown, RefreshCw, Vote, ArrowRight, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import EventCard from '@/components/ui/EventCard';
import { INITIAL_EVENTS, getEvents, syncEventsWithSupabase, getDatePolls, syncDatePollsWithSupabase, subscribeToStore } from '@/lib/store';
import { EventItem, DatePoll } from '@/types';

export default function DiscoverPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [polls, setPolls] = useState<DatePoll[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [isSyncing, setIsSyncing] = useState(false);

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
    Promise.all([syncEventsWithSupabase(), syncDatePollsWithSupabase()]).then(() => {
      setEvents(getEvents());
      setPolls(getDatePolls());
    }).catch(() => {});

    const update = () => {
      setEvents(getEvents());
      setPolls(getDatePolls());
    };
    const unsub = subscribeToStore(update);
    return () => unsub();
  }, []);

  // Filter pills with Date Polls included
  const filterPills = ['All', 'Date Polls', 'Mumbai', 'Bengaluru', 'Free', 'Online', 'This Weekend'];

  const filteredEvents = events.filter((e) => {
    // Search query match
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Filter pill matches
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Mumbai') return e.city.toLowerCase() === 'mumbai';
    if (activeFilter === 'Bengaluru') return e.city.toLowerCase() === 'bengaluru';
    if (activeFilter === 'Free') return true; // All v1 events are free
    if (activeFilter === 'Online') return e.event_type === 'online' || e.event_type === 'hybrid';
    if (activeFilter === 'This Weekend') {
      const eventDate = new Date(e.start_at);
      const day = eventDate.getDay();
      return day === 0 || day === 6 || (eventDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000);
    }
    return true;
  });

  const displayedEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header Title & View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>India Discover Feed</span>
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-brand">
              Experiences & Gatherings
            </h1>
            <p className="text-xs text-ink-muted mt-1">
              Live RSVP counts · High-trust communities across Mumbai, Bengaluru, Delhi & Goa
            </p>
          </div>

          {/* Map vs Grid Toggle Button + Sync Feed */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-ink hover:bg-surface-3 transition-all shadow-xs"
              title="Refresh feed with latest live events from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-accent ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Feed'}</span>
            </button>

            <div className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-border shadow-sm flex-1 sm:flex-none">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-3'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>

              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'map'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-3'
                }`}
              >
                <Map className="w-3.5 h-3.5 text-accent" />
                <span>Map View</span>
              </button>
            </div>
          </div>

        </div>

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

        {/* View Mode: Map View */}
        {viewMode === 'map' ? (
          <div className="space-y-6 mb-8">
            <div className="bg-surface rounded-2xl p-4 border border-border shadow-card">
              <div className="rounded-xl overflow-hidden border border-border h-[460px] w-full relative bg-surface-3">
                <iframe
                  title="Events Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src="https://maps.google.com/maps?q=India%20Mumbai%20Bengaluru%20Delhi&t=&z=5&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="text-xs text-ink-muted">
              Showing active pinpoints across hubs. Click an event card below to view details and RSVP:
            </div>
          </div>
        ) : null}

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
              <p className="font-display font-bold text-xl text-ink">No events match your search</p>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                Try searching for a different city or term, or create your own experience!
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('All');
                  }}
                  className="text-xs text-accent font-bold underline"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {/* Load More Button */}
              {filteredEvents.length > visibleCount && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 3)}
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

      <Footer />
    </div>
  );
}
