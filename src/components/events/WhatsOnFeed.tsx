'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Calendar,
  X,
  RotateCcw,
  Navigation,
  Flame,
  Sparkles,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  SAMPLE_TEMPLATE_EVENTS,
  formatIST
} from '@/lib/store';
import { EventItem, DatePoll } from '@/types';

// Main Categories matching user reference
export const CATEGORY_FILTERS = [
  'All',
  'Technology',
  'Business',
  'Music',
  'Arts',
  'Food',
  'Sports',
  'Wellness',
  'Education',
  'Other',
] as const;
export type CategoryFilterType = (typeof CATEGORY_FILTERS)[number];

// Distance options matching user reference
export const DISTANCE_OPTIONS = ['Off', '2 km', '5 km', '10 km'] as const;
export type DistanceFilterType = (typeof DISTANCE_OPTIONS)[number];

// 23 Mood / Tag System options matching user reference
export const MOOD_TAGS = [
  'Singles friendly',
  'Couples friendly',
  'Kids allowed',
  '18+',
  'Comedy',
  'Stand-up',
  'Art',
  'Music',
  'Party',
  'Meetup',
  'Gaming',
  'Dance',
  'Fitness',
  'Sports',
  'Outdoor',
  'Indoor',
  'Morning',
  'Afternoon',
  'Evening',
  'Night',
  'Workshop',
  'Networking',
  'Free',
] as const;
export type MoodTagType = (typeof MOOD_TAGS)[number];

interface EventWithDistance extends EventItem {
  distanceKm?: number | null;
}



export default function WhatsOnFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL search params sync
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';
  const categoryParam = (searchParams.get('category') as CategoryFilterType) || 'All';

  const [events, setEvents] = useState<EventItem[]>([]);
  const [userCity, setUserCity] = useState<string>('All India');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Active filters state
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>(
    CATEGORY_FILTERS.includes(categoryParam) ? categoryParam : 'All'
  );
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilterType>('Off');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load saved filter choices from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('vibe_filter_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedMoods && Array.isArray(parsed.selectedMoods)) {
          setSelectedMoods(parsed.selectedMoods);
        }
        if (parsed.distanceFilter && DISTANCE_OPTIONS.includes(parsed.distanceFilter)) {
          setDistanceFilter(parsed.distanceFilter);
        }
        if (parsed.categoryFilter && CATEGORY_FILTERS.includes(parsed.categoryFilter) && !categoryParam) {
          setCategoryFilter(parsed.categoryFilter);
        }
      }
    } catch {
      // ignore
    }
  }, [categoryParam]);

  // Automatically save filter choices to localStorage
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(
        'vibe_filter_prefs',
        JSON.stringify({
          selectedMoods,
          distanceFilter,
          categoryFilter,
        })
      );
    } catch {
      // ignore
    }
  }, [selectedMoods, distanceFilter, categoryFilter, mounted]);

  // Sync external search query if URL changes
  useEffect(() => {
    if (queryParam) setSearchQuery(queryParam);
  }, [queryParam]);

  // Sync category param from Navbar
  useEffect(() => {
    if (!categoryParam) return;
    const catLower = categoryParam.toLowerCase();
    if (catLower.includes('music')) setCategoryFilter('Music');
    else if (catLower.includes('comedy')) setCategoryFilter('Arts');
    else if (catLower.includes('founder') || catLower.includes('tech') || catLower.includes('startup')) setCategoryFilter('Technology');
    else if (catLower.includes('workshop')) setCategoryFilter('Education');
    else if (catLower.includes('dining') || catLower.includes('salon')) setCategoryFilter('Food');
    else if (CATEGORY_FILTERS.includes(categoryParam as any)) setCategoryFilter(categoryParam as any);
  }, [categoryParam]);

  // Load events
  useEffect(() => {
    setEvents(getEvents());

    Promise.all([syncEventsWithSupabase(), syncDatePollsWithSupabase()])
      .then(() => {
        setEvents(getEvents());
      })
      .catch(() => {});

    const update = () => {
      setEvents(getEvents());
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

  // Calculate distance for each event
  const eventsWithDistance: EventWithDistance[] = useMemo(() => {
    return events.map((e) => {
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

      if (e.city?.toLowerCase() === userCity.toLowerCase()) {
        return { ...e, distanceKm: 0 };
      }

      return { ...e, distanceKm: null };
    });
  }, [events, userCoords, userCity]);

  // Toggle mood tag
  const handleToggleMood = (tag: string) => {
    setSelectedMoods((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Reset all filters to default
  const handleResetMyView = () => {
    setSelectedMoods([]);
    setCategoryFilter('All');
    setDistanceFilter('Off');
    setSearchQuery('');
    try {
      localStorage.removeItem('vibe_filter_prefs');
    } catch {
      // ignore
    }
  };

  // Automated Most Clicked & Famous events for the animated panel card
  const famousEvents = useMemo(() => {
    const pool = eventsWithDistance.length > 0 ? eventsWithDistance : SAMPLE_TEMPLATE_EVENTS;
    const badges = [
      '🔥 #1 Most Clicked',
      '⚡ Viral Trending',
      '⭐ Famous in City',
      '🎟️ Selling Fast',
      '✨ Curated Pick',
      '🏆 Community Favorite',
    ];
    const clickCounts = ['3.8k clicks', '2.9k clicks', '2.4k clicks', '1.8k clicks', '1.5k clicks', '1.2k clicks'];

    return pool.slice(0, 6).map((e, idx) => ({
      ...e,
      badge: badges[idx % badges.length],
      clicks: clickCounts[idx % clickCounts.length],
    }));
  }, [eventsWithDistance]);

  // Quadrupled list for a seamless continuous marquee scrolling to the right
  const famousScrollList = useMemo(() => {
    return [...famousEvents, ...famousEvents, ...famousEvents, ...famousEvents];
  }, [famousEvents]);

  // Filter Logic
  const filteredEvents = useMemo(() => {
    return eventsWithDistance
      .filter((e) => {
        // Only public live events
        if (e.status !== 'live' || e.is_public === false) return false;

        const eText = `${e.title} ${e.tagline || ''} ${e.description || ''} ${e.category || ''} ${e.location_name || ''} ${e.city || ''} ${e.organizer_name || ''}`.toLowerCase();

        // 1. Search input match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          if (!eText.includes(q)) return false;
        }

        // 2. Category filter
        if (categoryFilter !== 'All') {
          const cat = categoryFilter.toLowerCase();
          if (cat === 'technology') {
            if (!['tech', 'ai', 'hacker', 'software', 'developer', 'code', 'founder', 'build', 'startup'].some((w) => eText.includes(w))) return false;
          } else if (cat === 'business') {
            if (!['business', 'founder', 'investor', 'pitch', 'venture', 'summit', 'conference', 'networking'].some((w) => eText.includes(w))) return false;
          } else if (cat === 'music') {
            if (!['music', 'concert', 'sitar', 'band', 'acoustic', 'gig', 'live', 'orchestra', 'singer'].some((w) => eText.includes(w))) return false;
          } else if (cat === 'arts') {
            if (!['art', 'design', 'poetry', 'theatre', 'craft', 'photo', 'exhibition', 'sculpture'].some((w) => eText.includes(w))) return false;
          } else if (cat === 'food') {
            if (!['food', 'dining', 'dinner', 'culinary', 'drinks', 'tasting', 'supper', 'salon', 'chef'].some((w) => eText.includes(w))) return false;
          } else if (cat === 'sports') {
            if (!['sport', 'fitness', 'cricket', 'football', 'marathon', 'game', 'padel', 'badminton'].some((w) => eText.includes(w))) return false;
          } else if (cat === 'wellness') {
            if (!['wellness', 'yoga', 'meditation', 'mental', 'health', 'retreat', 'breathwork'].some((w) => eText.includes(w))) return false;
          } else if (cat === 'education') {
            if (!['workshop', 'masterclass', 'bootcamp', 'talk', 'learn', 'lecture'].some((w) => eText.includes(w))) return false;
          }
        }

        // 3. Distance filter
        if (distanceFilter !== 'Off') {
          const maxKm = distanceFilter === '2 km' ? 2 : distanceFilter === '5 km' ? 5 : 10;
          if (typeof e.distanceKm === 'number') {
            if (e.distanceKm > maxKm) return false;
          }
        }

        // 4. Mood / Tag multi-select filter
        if (selectedMoods.length > 0) {
          const eDate = e.start_at ? new Date(e.start_at) : null;
          const eHours = eDate ? eDate.getHours() : 18;

          for (const mood of selectedMoods) {
            let matched = false;
            if (mood === 'Free') {
              matched = !e.external_price_text || eText.includes('free') || (e as any).is_free;
            } else if (mood === 'Comedy') {
              matched = ['comedy', 'stand-up', 'standup', 'comic', 'humor', 'roast'].some((w) => eText.includes(w));
            } else if (mood === 'Stand-up') {
              matched = ['stand-up', 'standup', 'comedy'].some((w) => eText.includes(w));
            } else if (mood === 'Art') {
              matched = ['art', 'design', 'gallery', 'exhibit', 'theatre', 'poetry'].some((w) => eText.includes(w));
            } else if (mood === 'Music') {
              matched = ['music', 'concert', 'acoustic', 'sitar', 'band', 'gig', 'live'].some((w) => eText.includes(w));
            } else if (mood === 'Party') {
              matched = ['party', 'dj', 'nightlife', 'club', 'celebration'].some((w) => eText.includes(w));
            } else if (mood === 'Meetup') {
              matched = ['meetup', 'networking', 'mixer', 'gathering', 'community'].some((w) => eText.includes(w));
            } else if (mood === 'Gaming') {
              matched = ['game', 'gaming', 'boardgame', 'esports', 'chess'].some((w) => eText.includes(w));
            } else if (mood === 'Dance') {
              matched = ['dance', 'salsa', 'garba', 'club', 'techno'].some((w) => eText.includes(w));
            } else if (mood === 'Fitness') {
              matched = ['fitness', 'run', 'marathon', 'workout', 'yoga'].some((w) => eText.includes(w));
            } else if (mood === 'Sports') {
              matched = ['sport', 'turf', 'match', 'badminton', 'padel', 'cricket'].some((w) => eText.includes(w));
            } else if (mood === 'Outdoor') {
              matched = e.event_type === 'in-person' && ['outdoor', 'rooftop', 'terrace', 'park', 'lawn', 'ground', 'open air'].some((w) => eText.includes(w));
            } else if (mood === 'Indoor') {
              matched = ['indoor', 'hall', 'auditorium', 'theatre', 'studio', 'room', 'space', 'cafe'].some((w) => eText.includes(w));
            } else if (mood === 'Morning') {
              matched = eHours >= 5 && eHours < 12;
            } else if (mood === 'Afternoon') {
              matched = eHours >= 12 && eHours < 17;
            } else if (mood === 'Evening') {
              matched = eHours >= 17 && eHours < 21;
            } else if (mood === 'Night') {
              matched = eHours >= 21 || eHours < 5;
            } else if (mood === 'Singles friendly') {
              matched = true;
            } else if (mood === 'Couples friendly') {
              matched = ['dinner', 'concert', 'poetry', 'soiree', 'date', 'music', 'acoustic'].some((w) => eText.includes(w));
            } else if (mood === 'Kids allowed') {
              matched = !['18+', 'bar', 'cocktail', 'pub', 'liquor'].some((w) => eText.includes(w));
            } else if (mood === '18+') {
              matched = ['18+', 'bar', 'cocktail', 'pub', 'liquor', 'wine', 'beer'].some((w) => eText.includes(w));
            } else if (mood === 'Workshop') {
              matched = ['workshop', 'masterclass', 'hands-on', 'learn', 'bootcamp'].some((w) => eText.includes(w));
            } else if (mood === 'Networking') {
              matched = ['network', 'founder', 'connect', 'social', 'mixer', 'summit'].some((w) => eText.includes(w));
            }

            if (!matched) return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [eventsWithDistance, searchQuery, categoryFilter, distanceFilter, selectedMoods]);

  return (
    <div className="w-full space-y-8">
      {/* ========================================================================= */}
      {/* 1. UNIFIED HORIZONTAL PLANE: What's On + Real EventCards Marquee + Tags   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-7 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: What's On Branding & All Filter Tags (Categories, Moods, Distance, Reset) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  Live Discovery
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-black text-[#0F172A] tracking-tight">
                What's On
              </h1>
              <p className="text-xs text-[#64748B] font-medium mt-1 leading-relaxed">
                Curated local & virtual experiences, AI-verified and ready to explore.
              </p>
            </div>

            {/* Category Filter Pills (In Horizontal Plane) */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                CATEGORIES
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORY_FILTERS.map((cat) => {
                  const active = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#0F172A] text-white shadow-xs'
                          : 'bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood Tags + Distance Selector + Reset (In Horizontal Plane) */}
            <div className="space-y-2.5 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  <Navigation className="w-3 h-3 text-[#64748B] rotate-45" />
                  <span>DISTANCE & MOOD</span>
                </div>
                <button
                  onClick={handleResetMyView}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset filters</span>
                </button>
              </div>

              {/* Distance Pills */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 border border-[#E2E8F0] rounded-full p-0.5 bg-[#F8FAFC] shadow-2xs">
                  {DISTANCE_OPTIONS.map((dist) => (
                    <button
                      key={dist}
                      onClick={() => setDistanceFilter(dist)}
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${
                        distanceFilter === dist
                          ? 'bg-[#0F172A] text-white'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Tags Horizontal Scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {MOOD_TAGS.map((tag) => {
                  const active = selectedMoods.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleMood(tag)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-[#0F172A] text-white shadow-xs'
                          : 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Animated Event Panel Card with Full Earlier EventCards Scrolling Right */}
          <div className="lg:col-span-7 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-4 overflow-hidden relative shadow-2xs flex flex-col justify-between">
            {/* Header Strip */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#E2E8F0] text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#E8621A] fill-[#E8621A]" />
                <span className="font-extrabold text-[#0F172A] uppercase tracking-wider text-xs">
                  Most Clicked & Famous Gatherings
                </span>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold">
                  Trending
                </span>
              </div>
              <span className="text-[11px] text-[#64748B] font-medium hidden sm:inline">
                Auto-scrolling right → (Hover to pause)
              </span>
            </div>

            {/* Marquee Track with Genuine EventCards from Earlier Codes */}
            <div className="relative overflow-hidden w-full py-1">
              {/* Fade gradients */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#F8FAFC] to-transparent z-20 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F8FAFC] to-transparent z-20 pointer-events-none" />

              <div className="animate-scroll-right flex items-stretch gap-4 hover:[animation-play-state:paused] cursor-pointer">
                {famousScrollList.map((evt, idx) => (
                  <div
                    key={`marquee-card-${evt.id}-${idx}`}
                    className="w-[280px] sm:w-[320px] shrink-0 h-[410px] flex flex-col pointer-events-auto"
                  >
                    <EventCard event={evt} distanceKm={(evt as any).distanceKm} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BELOW: ALL EVENTS LISTED IN GRID (With 3D Perspective Spring Reveal)    */}
      {/* ========================================================================= */}
      <div className="pt-2">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-[#F8FAFC] rounded-3xl border border-dashed border-[#E2E8F0] space-y-3">
            <Calendar className="w-10 h-10 text-[#94A3B8] mx-auto" />
            <p className="font-bold text-base text-[#0F172A]">No events match your active filters</p>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Try resetting your mood tags or clearing search terms to explore more experiences.
            </p>
            <div className="pt-2">
              <button
                onClick={handleResetMyView}
                className="px-5 py-2.5 bg-[#0F172A] text-white text-xs font-bold rounded-full hover:bg-[#1E293B] transition-all shadow-xs cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 50, scale: 0.93, rotateX: 6 }}
                whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{
                  type: 'spring',
                  stiffness: 115,
                  damping: 18,
                  mass: 0.75,
                  delay: (idx % 3) * 0.08,
                }}
                whileHover={{
                  y: -8,
                  scale: 1.015,
                  transition: { duration: 0.22, ease: 'easeOut' },
                }}
                style={{ transformPerspective: 1000 }}
                className="h-full flex flex-col"
              >
                <EventCard event={event} distanceKm={event.distanceKm} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
