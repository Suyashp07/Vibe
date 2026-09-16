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
      {/* 1. TOP SECTION: "What's On" + Animated Event Panel Card (Scrolling Right)  */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* The word "What's On" — DIRECTLY ON PAGE CANVAS (NO CARD!) */}
        <div className="shrink-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-[#E8621A]">
              Live Discovery
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-[#0F172A] tracking-tight">
            What's On
          </h1>
          <p className="text-xs text-[#64748B] font-medium max-w-xs leading-relaxed">
            Curated local and virtual events, AI-verified and ready to explore.
          </p>
        </div>

        {/* Animated Event Panel Card into which automated most clicked and famous events are scrolling right */}
        <div className="flex-1 w-full max-w-3xl overflow-hidden rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 sm:p-4 shadow-2xs relative group">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0] text-xs">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#E8621A] fill-[#E8621A]" />
              <span className="font-extrabold text-[#0F172A] uppercase tracking-wider text-xs">
                Most Clicked & Famous Events
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

      {/* ========================================================================= */}
      {/* 2. ALL THE TAGS IN ONE CLEAN HORIZONTAL PLANE (NO CARD! DIRECTLY ON CANVAS)*/}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2 border-b border-[#E2E8F0] pb-6">
        {/* Category Filters Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_FILTERS.map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Mood Tags Strip + Distance Selector + Reset in one clean horizontal line */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Mood Tags */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider shrink-0 mr-1">
              MOOD:
            </span>
            {MOOD_TAGS.map((tag) => {
              const active = selectedMoods.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleToggleMood(tag)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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

          {/* Right: Distance Selector + Reset */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <div className="flex items-center gap-1 border border-[#E2E8F0] rounded-full p-0.5 bg-white shadow-2xs">
              <Navigation className="w-3 h-3 text-[#64748B] ml-2 rotate-45" />
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

            <button
              onClick={handleResetMyView}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-full transition-colors cursor-pointer border border-[#E2E8F0] shadow-2xs"
              title="Reset my view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
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
