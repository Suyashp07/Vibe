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
  ChevronRight,
  Zap,
  SlidersHorizontal,
  Users
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
  getPublicEvents,
  isPublicLiveEvent,
  isFlashVibeEvent,
  syncEventsWithSupabase,
  getDatePolls,
  syncDatePollsWithSupabase,
  subscribeToStore,
  SAMPLE_TEMPLATE_EVENTS,
  formatIST,
  isEventExpired
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
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
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
    setEvents(getPublicEvents());

    Promise.all([syncEventsWithSupabase(), syncDatePollsWithSupabase()])
      .then(() => {
        setEvents(getPublicEvents());
      })
      .catch(() => {});

    const update = () => {
      setEvents(getPublicEvents());
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

  // Strictly filter public live events ONLY, EXCLUDING flash vibes (which belong exclusively to the Vibe section)
  const publicLiveEvents = useMemo(() => {
    return events.filter((e) => isPublicLiveEvent(e) && !isFlashVibeEvent(e));
  }, [events]);

  // Calculate distance for each public event from active location
  const eventsWithDistance: EventWithDistance[] = useMemo(() => {
    const effectiveCoords =
      userCoords ||
      (userCity && userCity !== 'All India' ? getCityCoordinates(userCity) : null);

    return publicLiveEvents.map((e) => {
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
  }, [publicLiveEvents, userCoords, userCity]);

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

  // Handle tag click directly from any event card (acting as an interactive filter)
  const handleTagClick = (tag: string, type: 'mood' | 'category' | 'source') => {
    if (type === 'category') {
      const matched = CATEGORY_FILTERS.find((c) => c.toLowerCase() === tag.toLowerCase());
      if (matched) {
        setCategoryFilter((prev) => (prev === matched ? 'All' : matched));
      } else {
        setCategoryFilter('All');
        setSearchQuery((prev) => (prev.toLowerCase() === tag.toLowerCase() ? '' : tag));
      }
    } else if (type === 'source') {
      const sourceQuery = tag === 'vibe' ? 'vibe' : tag;
      setSearchQuery((prev) => (prev.toLowerCase() === sourceQuery.toLowerCase() ? '' : sourceQuery));
    } else {
      // Mood / Attribute tag
      const matchedMood = MOOD_TAGS.find((m) => m.toLowerCase() === tag.toLowerCase());
      const targetMood = matchedMood || tag;
      setSelectedMoods((prev) =>
        prev.includes(targetMood) ? prev.filter((t) => t !== targetMood) : [...prev, targetMood]
      );
    }

    // Smooth scroll to feed controls to clearly show active filter state
    const feedElem = document.getElementById('whats-on-feed');
    if (feedElem) {
      feedElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 3 to 4 prominent events for the BookMyShow-style flashcard slider (strictly upcoming public events only)
  const prominentEvents = useMemo(() => {
    const valid = eventsWithDistance.filter(isPublicLiveEvent).filter((e) => !isFlashVibeEvent(e) && !isEventExpired(e));
    const pool = valid.length > 0 ? valid : SAMPLE_TEMPLATE_EVENTS.filter((e) => isPublicLiveEvent(e) && !isEventExpired(e));
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

  // Filter Logic (Strictly excludes Flash Vibe events which are exclusive to Vibe Instant)
  const filteredEvents = useMemo(() => {
    return eventsWithDistance
      .filter(isPublicLiveEvent)
      .filter((e) => !isFlashVibeEvent(e))
      .filter((e) => {

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
    <div className="w-full space-y-8 sm:space-y-12">
      {/* ========================================================================= */}
      {/* SPOTLIGHT HERO BILLBOARD CAROUSEL (Matching reference image)              */}
      {/* ========================================================================= */}
      {currentFlashEvent && (
        <div
          className="w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group min-h-[350px] md:h-[400px] bg-black"
          onMouseEnter={() => setIsFlashcardPaused(true)}
          onMouseLeave={() => setIsFlashcardPaused(false)}
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

              {/* Cinematic Dark Gradient Overlay matching image */}
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/80 to-black/35 pointer-events-none" />

              {/* Spotlight Content Overlay */}
              <div className="absolute inset-0 p-6 sm:p-8 md:p-10 flex flex-col justify-between z-10 text-white">
                {/* Top Badge: ⚡ IN THE SPOTLIGHT */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 fill-[#FF5500] text-[#FF5500]" />
                    <span>IN THE SPOTLIGHT</span>
                  </span>

                  <span className="text-xs font-bold bg-[#FF5500]/20 border border-[#FF5500]/30 text-[#FF5500] px-3.5 py-1 rounded-full backdrop-blur-md shadow-xs">
                    {currentFlashEvent.external_price_text || (isFlashcardExternal ? 'Official Site ↗' : 'Free RSVP')}
                  </span>
                </div>

                {/* Middle: Date, Venue, Grand Event Title & Tagline */}
                <div className="space-y-2 max-w-2xl my-auto">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-amber-300">
                    <Calendar className="w-4 h-4 shrink-0 text-[#FF5500]" />
                    <span>{currentFlashEvent.start_at ? formatIST(currentFlashEvent.start_at) : 'THU, 15 OCT · 7:00 PM'}</span>
                    <span className="text-white/40">·</span>
                    <span className="flex items-center gap-1 text-white/90 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                      <span className="truncate">{currentFlashEvent.city} · {currentFlashEvent.location_name || currentFlashEvent.event_type}</span>
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                    {currentFlashEvent.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-white/80 line-clamp-2 max-w-xl font-medium">
                    {currentFlashEvent.tagline || 'Live music. Open skies. A crowd that feels like your people.'}
                  </p>
                </div>

                {/* Bottom Row: [Find your spot ↗] + Avatar Stack + Pagination Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
                    <Link
                      href={flashcardLink}
                      target={isFlashcardExternal ? '_blank' : undefined}
                      rel={isFlashcardExternal ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs sm:text-sm font-black shadow-[0_0_25px_rgba(255,85,0,0.45)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <span>Find your spot</span>
                      <ArrowRight className="w-4 h-4 -rotate-45" />
                    </Link>

                    {/* Avatar stack matching reference image */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex -space-x-2">
                        <span className="w-7 h-7 rounded-full bg-[#3B82F6] border-2 border-black text-[9px] font-bold flex items-center justify-center text-white">AS</span>
                        <span className="w-7 h-7 rounded-full bg-[#EC4899] border-2 border-black text-[9px] font-bold flex items-center justify-center text-white">RK</span>
                        <span className="w-7 h-7 rounded-full bg-[#10B981] border-2 border-black text-[9px] font-bold flex items-center justify-center text-white">NM</span>
                        <span className="w-7 h-7 rounded-full bg-[#FF5500] border-2 border-black text-[9px] font-bold flex items-center justify-center text-white">+178</span>
                      </div>
                      <span className="text-xs text-white/70 font-semibold">178 people going</span>
                    </div>
                  </div>

                  {/* Pagination and Chevron Controls */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-white/60">
                      {String(flashcardIdx + 1).padStart(2, '0')} / {String(prominentEvents.length).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevFlashcard}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                        aria-label="Previous event"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextFlashcard}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                        aria-label="Next event"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DISCOVERY SECTION: SEARCH, CATEGORY PILLS & FILTERS                     */}
      {/* ========================================================================= */}
      <div id="whats-on-feed" className="space-y-6">
        {/* Header row: "Find your next good time." + Search Box */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-1.5">
              <span>Find your next good time</span>
              <span className="w-2 h-2 rounded-full bg-[#FF5500] inline-block" />
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Big nights, small gatherings, and everything in between.
            </p>
          </div>

          {/* Search bar matching screenshot: "Search for a vibe..." */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a vibe..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#111114] border border-white/10 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF5500] shadow-inner transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills matching screenshot */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORY_FILTERS.map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.4)]'
                      : 'bg-[#111114] text-white/80 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat === 'All' && <Sparkles className="w-3 h-3" />}
                  <span>{cat === 'All' ? 'All vibes' : cat}</span>
                </button>
              );
            })}
          </div>

          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className={`px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              showFiltersDrawer || selectedMoods.length > 0 || distanceFilter !== 'Off'
                ? 'bg-[#FF5500]/20 border border-[#FF5500]/50 text-[#FF5500]'
                : 'bg-[#111114] text-white/80 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(selectedMoods.length > 0 || distanceFilter !== 'Off') && (
              <span className="w-2 h-2 rounded-full bg-[#FF5500]" />
            )}
          </button>
        </div>

        {/* Expandable Advanced Mood & Distance Filter Drawer */}
        <AnimatePresence>
          {showFiltersDrawer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-[#111114] rounded-2xl p-5 border border-white/10 space-y-4 overflow-hidden"
            >
              {/* Distance Row */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">DISTANCE:</span>
                <div className="flex items-center gap-2">
                  {DISTANCE_OPTIONS.map((dist) => (
                    <button
                      key={dist}
                      onClick={() => setDistanceFilter(dist)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                        distanceFilter === dist
                          ? 'bg-[#FF5500] text-white'
                          : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Tags */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">MOOD & VIBE:</span>
                  <button
                    onClick={handleResetMyView}
                    className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {MOOD_TAGS.map((tag) => {
                    const active = selectedMoods.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleToggleMood(tag)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                          active
                            ? 'bg-[#FF5500] text-white'
                            : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Experience count sub-bar matching screenshot: "4 experiences for you" & "• Good times ahead" */}
        <div className="flex items-center justify-between text-xs text-white/50 font-medium pt-1">
          <span>{filteredEvents.length} experiences for you</span>
          <div className="flex items-center gap-1.5 text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
            <span>Good times ahead</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. EVENTS GRID                                                            */}
        {/* ========================================================================= */}
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-[#111114] rounded-3xl border border-dashed border-white/10 space-y-3">
            <Calendar className="w-10 h-10 text-white/30 mx-auto" />
            <p className="font-bold text-base text-white">No experiences match your filters</p>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Try adjusting your category pills or search keywords to discover more experiences.
            </p>
            <div className="pt-2">
              <button
                onClick={handleResetMyView}
                className="px-5 py-2.5 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold rounded-full transition-all shadow-md cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.35,
                  delay: (idx % 4) * 0.06,
                }}
                className="h-full flex flex-col"
              >
                <EventCard
                  event={event}
                  distanceKm={event.distanceKm}
                  activeMoods={selectedMoods}
                  activeCategory={categoryFilter}
                  onTagClick={handleTagClick}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. BRING YOUR PEOPLE TOGETHER BANNER (Matching bottom callout in image)   */}
        {/* ========================================================================= */}
        <div className="rounded-2xl sm:rounded-3xl bg-[#111114] border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500] shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Bring your people together.
              </h3>
              <p className="text-xs sm:text-sm text-white/50">
                Something in mind? Make it a Vibe.
              </p>
            </div>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer hover:border-[#FF5500] hover:text-[#FF5500] shrink-0"
          >
            <span>Host an event</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
