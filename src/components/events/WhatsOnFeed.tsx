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
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Calculate distance for each event from active location
  const eventsWithDistance: EventWithDistance[] = useMemo(() => {
    const effectiveCoords =
      userCoords ||
      (userCity && userCity !== 'All India' ? getCityCoordinates(userCity) : null);

    return events.map((e) => {
      let eventLat = e.location_lat;
      let eventLng = e.location_lng;

      if (!eventLat || !eventLng) {
        const resolved = getCityCoordinates(e.city);
        if (resolved) {
          eventLat = resolved.lat;
          eventLng = resolved.lng;
        }
      }

      if (effectiveCoords && eventLat && eventLng) {
        const dist = calculateDistanceKm(
          effectiveCoords.lat,
          effectiveCoords.lng,
          eventLat,
          eventLng
        );
        return { ...e, distanceKm: dist };
      }

      if (userCity && userCity !== 'All India' && e.city?.toLowerCase() === userCity.toLowerCase()) {
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

  // 3 to 4 prominent events for the BookMyShow-style flashcard slider
  const prominentEvents = useMemo(() => {
    const pool = eventsWithDistance.length > 0 ? eventsWithDistance : SAMPLE_TEMPLATE_EVENTS;
    return pool.slice(0, 4);
  }, [eventsWithDistance]);

  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlashcardPaused, setIsFlashcardPaused] = useState(false);

  // Auto-cycle through the 3 to 4 prominent events every 4.5 seconds
  useEffect(() => {
    if (isFlashcardPaused || prominentEvents.length <= 1) return;
    const timer = setInterval(() => {
      setFlashcardIdx((prev) => (prev + 1) % prominentEvents.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isFlashcardPaused, prominentEvents.length]);

  const handlePrevFlashcard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFlashcardIdx((prev) => (prev - 1 + prominentEvents.length) % prominentEvents.length);
  };

  const handleNextFlashcard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFlashcardIdx((prev) => (prev + 1) % prominentEvents.length);
  };

  const currentFlashEvent = prominentEvents[flashcardIdx] || prominentEvents[0];
  const flashcardLink = currentFlashEvent?.source_type === 'external' && currentFlashEvent?.external_ticket_url
    ? currentFlashEvent.external_ticket_url
    : `/${currentFlashEvent?.slug || ''}`;
  const isFlashcardExternal = currentFlashEvent?.source_type === 'external';

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
      .sort((a, b) => {
        // Sort in ASCENDING order of proximity from location (nearest first)
        const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
        const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;

        if (distA !== distB) {
          return distA - distB;
        }

        // Secondary sort: chronological event start date
        const timeA = a.start_at ? new Date(a.start_at).getTime() : 0;
        const timeB = b.start_at ? new Date(b.start_at).getTime() : 0;
        return timeA - timeB;
      });
  }, [eventsWithDistance, searchQuery, categoryFilter, distanceFilter, selectedMoods]);

  return (
    <div className="w-full space-y-8">
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. TOP HERO: EVENT FLASHCARD CAROUSEL (FILLS ENTIRE TOP PORTION)          */}
      {/* ========================================================================= */}
      {currentFlashEvent && (
        <div
          className="w-full relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-[#E2E8F0] group cursor-pointer h-64 sm:h-72 md:h-80 bg-slate-950"
          onMouseEnter={() => setIsFlashcardPaused(true)}
          onMouseLeave={() => setIsFlashcardPaused(false)}
        >
          <Link
            href={flashcardLink}
            target={isFlashcardExternal ? '_blank' : undefined}
            rel={isFlashcardExternal ? 'noopener noreferrer' : undefined}
            className="block relative w-full h-full"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFlashEvent.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                {/* Background Poster Image */}
                <Image
                  src={currentFlashEvent.cover_image_url}
                  alt={currentFlashEvent.title}
                  fill
                  unoptimized
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Cinematic Dark Gradient Overlay (BookMyShow billboard style) */}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/75 to-black/35 pointer-events-none" />

                {/* Flashcard Content Overlay */}
                <div className="absolute inset-0 p-6 sm:p-8 md:p-10 flex flex-col justify-between z-10">
                  {/* Top Row: Prominent Badge + Price */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
                      <Flame className="w-3.5 h-3.5 fill-white" />
                      <span>PROMINENT EVENT {flashcardIdx + 1}/{prominentEvents.length}</span>
                    </span>

                    <span className="text-xs font-bold bg-white/95 text-[#0F172A] px-3 py-1 rounded-full shadow-sm">
                      {currentFlashEvent.external_price_text || (isFlashcardExternal ? 'Official Site ↗' : 'Free RSVP')}
                    </span>
                  </div>

                  {/* Middle: Date, Venue, and Grand Event Title */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-amber-300">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>{currentFlashEvent.start_at ? formatIST(currentFlashEvent.start_at) : 'Dates TBA'}</span>
                      <span className="text-white/40">·</span>
                      <span className="flex items-center gap-1 text-white/90 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#E8621A] shrink-0" />
                        <span className="truncate">{currentFlashEvent.city} · {currentFlashEvent.location_name || currentFlashEvent.event_type}</span>
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-white leading-tight line-clamp-2 drop-shadow-sm uppercase tracking-tight">
                      {currentFlashEvent.title}
                    </h2>

                    {currentFlashEvent.tagline && (
                      <p className="text-xs sm:text-sm text-white/80 line-clamp-1 italic font-tagline">
                        {currentFlashEvent.tagline}
                      </p>
                    )}
                  </div>

                  {/* Bottom Row: Organizer Pill + Book/RSVP Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-medium text-white/80 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15">
                      By {currentFlashEvent.organizer_name || 'Vibe Curated'}
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-[#0F172A] text-xs sm:text-sm font-black group-hover:bg-amber-300 group-hover:text-black transition-all shadow-md">
                      <span>{isFlashcardExternal ? 'Book Tickets' : 'RSVP Now'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Left Chevron */}
            <button
              type="button"
              onClick={handlePrevFlashcard}
              aria-label="Previous prominent event"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 z-30 shadow-md cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Navigation Right Chevron */}
            <button
              type="button"
              onClick={handleNextFlashcard}
              aria-label="Next prominent event"
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 z-30 shadow-md cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Bottom Indicator Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 pointer-events-auto">
              {prominentEvents.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFlashcardIdx(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    flashcardIdx === idx
                      ? 'w-7 bg-white shadow-sm'
                      : 'w-2 bg-white/40 hover:bg-white/75'
                  }`}
                  aria-label={`Go to event ${idx + 1}`}
                />
              ))}
            </div>
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAGS & FILTERS — EXPLICITLY MENTIONED (NO HORIZONTAL SCROLL, NO CARDS) */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2 border-b border-[#E2E8F0] pb-6">
        {/* Category Filter Pills (Explicitly Mentioned, Flex-Wrap) */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_FILTERS.map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
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

        {/* Distance Filter Row (Explicitly Mentioned) */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            <Navigation className="w-3.5 h-3.5 rotate-45" />
            <span>DISTANCE</span>
          </div>
          <div className="flex items-center gap-2">
            {DISTANCE_OPTIONS.map((dist) => {
              const active = distanceFilter === dist;
              return (
                <button
                  key={dist}
                  onClick={() => setDistanceFilter(dist)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  {dist}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mood Tags (Explicitly Mentioned, All Visible, Flex-Wrap, No Cards!) */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              MOOD
            </span>
            <button
              onClick={handleResetMyView}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset my view</span>
            </button>
          </div>

          {/* All 23 Mood Tags explicitly mentioned in flex-wrap */}
          <div className="flex flex-wrap items-center gap-2">
            {MOOD_TAGS.map((tag) => {
              const active = selectedMoods.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleToggleMood(tag)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
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

          <p className="text-xs text-[#94A3B8] pt-0.5">
            Your filter choices are saved automatically as your default view.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BELOW: ALL EVENTS LISTED IN GRID (Ascending order of proximity)         */}
      {/* ========================================================================= */}
      <div className="pt-2 space-y-4">
        {filteredEvents.length > 0 && (
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-[#E8621A] rotate-45" />
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                {userCity && userCity !== 'All India' ? `Events Near ${userCity}` : 'Events Near You'}
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            <span className="text-xs font-medium text-[#64748B] hidden sm:inline-flex items-center gap-1.5 bg-[#F8FAFC] px-3 py-1 rounded-full border border-[#E2E8F0]">
              <span>Sorted by proximity</span>
              <span className="text-[#0F172A] font-bold">(nearest first)</span>
            </span>
          </div>
        )}

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
