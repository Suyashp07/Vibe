'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
  X,
  Calendar,
  Check
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import EventCard from '@/components/ui/EventCard';
import {
  getUserCity,
  getUserCoords,
  getCityCoordinates,
  calculateDistanceKm,
} from '@/lib/location';
import {
  getEvents,
  syncEventsWithSupabase,
  getDatePolls,
  syncDatePollsWithSupabase,
  subscribeToStore,
} from '@/lib/store';
import { EventItem, DatePoll } from '@/types';

// Categories matching BookMyShow and Navbar
const CATEGORY_CHIPS = [
  'All',
  'Music Shows',
  'Comedy Shows',
  'Founders & Tech',
  'Workshops',
  'Social Mixers',
  'Dining & Salons',
  'Date Polls',
];

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL search params sync
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';

  const [events, setEvents] = useState<EventItem[]>([]);
  const [polls, setPolls] = useState<DatePoll[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState<number>(9);
  const [userCity, setUserCity] = useState<string>('All India');
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync category param from Navbar
  useEffect(() => {
    if (!categoryParam) {
      setActiveCategory('All');
      return;
    }
    const catLower = categoryParam.toLowerCase();
    if (catLower.includes('music')) setActiveCategory('Music Shows');
    else if (catLower.includes('comedy')) setActiveCategory('Comedy Shows');
    else if (catLower.includes('founder') || catLower.includes('tech') || catLower.includes('startup')) setActiveCategory('Founders & Tech');
    else if (catLower.includes('workshop')) setActiveCategory('Workshops');
    else if (catLower.includes('social') || catLower.includes('mixer')) setActiveCategory('Social Mixers');
    else if (catLower.includes('dining') || catLower.includes('salon')) setActiveCategory('Dining & Salons');
    else setActiveCategory(categoryParam);
  }, [categoryParam]);

  // Sync events & location
  useEffect(() => {
    setEvents(getEvents());
    setPolls(getDatePolls());

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

  // Listen for user location changes from Navbar
  useEffect(() => {
    const syncLocation = () => {
      const city = getUserCity() || 'All India';
      setUserCity(city);
    };

    syncLocation();
    window.addEventListener('vibe:location_changed', syncLocation);
    return () => window.removeEventListener('vibe:location_changed', syncLocation);
  }, []);

  // Filter events by live status, selected city, category, and search query from Navbar
  const filteredEvents = useMemo(() => {
    return events
      .filter((e) => {
        // Only public live events
        if (e.status !== 'live' || e.is_public === false) return false;

        // City filter from Navbar
        if (userCity && userCity !== 'All India') {
          const c = userCity.toLowerCase();
          const matchCity =
            e.city?.toLowerCase().includes(c) ||
            e.location_name?.toLowerCase().includes(c) ||
            e.location_address?.toLowerCase().includes(c);
          if (!matchCity) return false;
        }

        // Global Navbar Search filter (?q=...)
        if (queryParam.trim()) {
          const q = queryParam.toLowerCase().trim();
          const matchSearch =
            e.title.toLowerCase().includes(q) ||
            (e.tagline && e.tagline.toLowerCase().includes(q)) ||
            (e.description && e.description.toLowerCase().includes(q)) ||
            (e.city && e.city.toLowerCase().includes(q)) ||
            (e.location_name && e.location_name.toLowerCase().includes(q)) ||
            (e.organizer_name && e.organizer_name.toLowerCase().includes(q));
          if (!matchSearch) return false;
        }

        // Category matching
        if (activeCategory && activeCategory !== 'All' && activeCategory !== 'Date Polls') {
          const cat = activeCategory.toLowerCase();
          const text = `${e.title} ${e.tagline || ''} ${e.description || ''} ${(e as any).category || ''}`.toLowerCase();

          if (cat.includes('music')) {
            return text.includes('music') || text.includes('concert') || text.includes('sitar') || text.includes('acoustic') || text.includes('poetry');
          }
          if (cat.includes('comedy')) {
            return text.includes('comedy') || text.includes('standup') || text.includes('stand-up') || text.includes('open mic');
          }
          if (cat.includes('founder') || cat.includes('tech')) {
            return text.includes('founder') || text.includes('tech') || text.includes('startup') || text.includes('ai') || text.includes('summit');
          }
          if (cat.includes('workshop')) {
            return text.includes('workshop') || text.includes('masterclass') || text.includes('learn') || text.includes('design');
          }
          if (cat.includes('social')) {
            return text.includes('social') || text.includes('mixer') || text.includes('meetup') || text.includes('gathering');
          }
          if (cat.includes('dining')) {
            return text.includes('dinner') || text.includes('dining') || text.includes('salon') || text.includes('culinary');
          }
        }

        return true;
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [events, userCity, queryParam, activeCategory]);

  const displayedEvents = filteredEvents.slice(0, visibleCount);

  // Clear search query
  const handleClearSearch = () => {
    router.push('/discover');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full">
        {/* BookMyShow Style Header: Clean Title + Category Filter Strip */}
        <div className="border-b border-[#E2E8F0] pb-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
                {userCity && userCity !== 'All India'
                  ? `Events In ${userCity}`
                  : 'Explore Events'}
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'experience available' : 'experiences available'}
                {queryParam && ` matching "${queryParam}"`}
              </p>
            </div>

            {/* Active search chip with 1-click clear */}
            {queryParam && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0F172A] text-white">
                  <span>Search: "{queryParam}"</span>
                  <button
                    onClick={handleClearSearch}
                    className="hover:text-amber-400 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* BookMyShow Category Pill Filter Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1 scrollbar-none">
            {CATEGORY_CHIPS.map((chip) => {
              const active = activeCategory === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setActiveCategory(chip)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A] hover:border-[#CBD5E1]'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter: Date Polls View */}
        {activeCategory === 'Date Polls' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-[#E8621A]">
                Community Date Polls ({polls.length})
              </span>
              <span className="text-xs text-[#64748B]">Live community votes</span>
            </div>

            {polls.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-[#E2E8F0] text-center space-y-3 shadow-xs">
                <Vote className="w-8 h-8 text-[#E8621A] mx-auto" />
                <p className="font-bold text-lg text-[#0F172A]">No active date polls right now</p>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Organizers can launch community date polls to gather votes before publishing gatherings.
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
                      className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-black tracking-wider text-[#E8621A] bg-[#E8621A]/10 px-2.5 py-0.5 rounded-full">
                            Community Poll
                          </span>
                          <span className="text-xs font-semibold text-[#64748B]">
                            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                          </span>
                        </div>

                        <h3 className="font-bold text-lg text-[#0F172A] hover:text-[#E8621A] transition-colors">
                          <Link href={`/poll/${poll.slug}`}>{poll.title}</Link>
                        </h3>

                        {poll.description && (
                          <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                            {poll.description}
                          </p>
                        )}

                        <div className="space-y-1.5 pt-2 border-t border-[#F1F5F9]">
                          {poll.options.slice(0, 3).map((opt) => {
                            const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                            const isLeading = totalVotes > 0 && opt.votes.length === topOpt?.votes.length;
                            return (
                              <div key={opt.id} className="text-xs">
                                <div className="flex items-center justify-between text-[11px] mb-0.5">
                                  <span className="font-medium text-[#0F172A] truncate">{opt.date_label}</span>
                                  <span className="font-mono text-[#64748B]">{pct}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${isLeading ? 'bg-[#E8621A]' : 'bg-slate-300'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#64748B]">
                          by <strong className="text-[#0F172A]">{poll.organizer_name}</strong>
                        </span>

                        <Link
                          href={`/poll/${poll.slug}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
          /* Events Grid */
          filteredEvents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-dashed border-[#E2E8F0] text-center space-y-3">
              <Calendar className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <p className="font-bold text-lg text-[#0F172A]">No events found</p>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                {userCity !== 'All India'
                  ? `There are no scheduled events in ${userCity} matching this filter yet.`
                  : 'Try selecting another category or clear your search query to see more events.'}
              </p>
              <div className="pt-3 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setActiveCategory('All');
                    router.push('/discover');
                  }}
                  className="px-4 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-[#1E293B]"
                >
                  View All Events
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
                  />
                ))}
              </div>

              {/* Load More Button */}
              {filteredEvents.length > visibleCount && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4 text-[#E8621A]" />
                    <span>Load More Events</span>
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

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0F172A]" />
            <p className="text-xs font-bold text-[#64748B]">Loading events...</p>
          </div>
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
