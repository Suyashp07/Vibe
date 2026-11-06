'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Calendar,
  X,
  RotateCcw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Zap,
  FilterX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '@/components/ui/EventCard';
import MomentsWall from '@/components/events/MomentsWall';
import MostLovedSection, {
  MOST_LOVED_CATEGORIES,
  ALL_EXPLORE_CATEGORIES,
  MostLovedCategory,
} from '@/components/events/MostLovedSection';
import {
  getUserCity,
  getUserCoords,
  getCityCoordinates,
  calculateDistanceKm,
} from '@/lib/location';
import {
  getPublicEvents,
  isPublicLiveEvent,
  isFlashVibeEvent,
  syncEventsWithSupabase,
  syncDatePollsWithSupabase,
  subscribeToStore,
  SAMPLE_TEMPLATE_EVENTS,
  isEventExpired,
} from '@/lib/store';
import { EventItem } from '@/types';

// =============================================================================
// DATE FILTER CONFIG
// =============================================================================
export const DATE_FILTER_OPTIONS = [
  { id: 'anytime', label: 'Anytime' },
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'month', label: 'This month' },
] as const;

export type DateFilterType = (typeof DATE_FILTER_OPTIONS)[number]['id'];

export const DATE_FILTER_LABELS: Record<string, string> = {
  anytime: 'Anytime',
  today: 'Today',
  weekend: 'This weekend',
  month: 'This month',
};

interface EventWithDistance extends EventItem {
  distanceKm?: number | null;
}

function formatSpotlightDate(startAt?: string) {
  if (!startAt) return 'THU, 15 OCT • 7:00 PM';
  try {
    const d = new Date(startAt);
    if (isNaN(d.getTime())) return 'THU, 15 OCT • 7:00 PM';
    const weekday = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' }).toUpperCase();
    const day = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' });
    const month = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' }).toUpperCase();
    const time = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    return `${weekday}, ${day} ${month} • ${time}`;
  } catch {
    return 'THU, 15 OCT • 7:00 PM';
  }
}

// Helper to determine if an event falls into the selected timeframe
function matchesDateFilter(eventDateStr: string | undefined, filter: string): boolean {
  if (filter === 'anytime') return true;
  if (!eventDateStr) return false;
  const eventDate = new Date(eventDateStr);
  if (isNaN(eventDate.getTime())) return false;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (filter === 'today') {
    return eventDate >= todayStart && eventDate <= todayEnd;
  }

  if (filter === 'weekend') {
    const currentDay = now.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
    const weekendStart = new Date(todayStart);

    if (currentDay === 0 || currentDay === 6) {
      // Already the weekend -> match from today
    } else if (currentDay === 5) {
      // Friday: match from Friday 4 PM onwards
      weekendStart.setHours(16, 0, 0, 0);
    } else {
      // Mon - Thu: Jump to upcoming Friday 4 PM
      const daysUntilFriday = 5 - currentDay;
      weekendStart.setDate(weekendStart.getDate() + daysUntilFriday);
      weekendStart.setHours(16, 0, 0, 0);
    }

    const weekendEnd = new Date(weekendStart);
    const daysUntilSunday = (7 - weekendStart.getDay()) % 7;
    weekendEnd.setDate(weekendEnd.getDate() + daysUntilSunday);
    weekendEnd.setHours(23, 59, 59, 999);

    return eventDate >= weekendStart && eventDate <= weekendEnd;
  }

  if (filter === 'month' || filter === 'this_month') {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return eventDate >= todayStart && eventDate <= monthEnd;
  }

  return true;
}

// Helper for multi-category matching against all explore categories
function matchesCategoryFilter(
  event: EventItem,
  selectedCategoryIds: string[],
  allCategories: MostLovedCategory[]
): boolean {
  if (selectedCategoryIds.length === 0) return true;

  const eTitle = event.title || '';
  const eTagline = event.tagline || '';
  const eDesc = event.description || '';
  const eCategory = (event.category || '').toLowerCase();
  const eFlashActivity = (event.flash_activity || '').toLowerCase();
  const eLocation = `${event.location_name || ''} ${event.location_address || ''} ${event.city || ''}`.toLowerCase();
  const eOrganizer = (event.organizer_name || '').toLowerCase();
  const eFlashTags = (event.theme?.flash_tags || []).join(' ').toLowerCase();
  const eText = `${eTitle} ${eTagline} ${eDesc} ${eCategory} ${eFlashActivity} ${eLocation} ${eOrganizer} ${eFlashTags}`.toLowerCase();

  return selectedCategoryIds.some((catId) => {
    if (catId === 'all') return true;

    const catObj = allCategories.find((c) => c.id === catId);
    if (!catObj) {
      return eCategory.includes(catId.toLowerCase()) || eText.includes(catId.toLowerCase());
    }

    // 1. Direct keywords match
    if (catObj.keywords && catObj.keywords.length > 0) {
      if (catObj.keywords.some((kw) => eText.includes(kw.toLowerCase()))) {
        return true;
      }
    }

    // 2. CategoryFilter match
    if (catObj.categoryFilter && catObj.categoryFilter !== 'All') {
      const cf = catObj.categoryFilter.toLowerCase();
      if (eCategory.includes(cf) || eText.includes(cf)) {
        return true;
      }
    }

    // 3. Kids / Family specific
    if (catId === 'kids') {
      if (
        (event.theme?.flash_tags || []).some((t) => t.toLowerCase().includes('kid') || t.toLowerCase().includes('family')) ||
        (Array.isArray((event as any).theme_tags) && (event as any).theme_tags.some((t: string) => t.toLowerCase().includes('kid') || t.toLowerCase().includes('family'))) ||
        eText.includes('kid') ||
        eText.includes('family')
      ) {
        return true;
      }
    }

    // 4. Exact or partial category name match
    const lowerName = catObj.name.toLowerCase();
    if (eCategory.includes(lowerName) || eText.includes(lowerName)) {
      return true;
    }

    return false;
  });
}

export default function WhatsOnFeed() {
  const searchParams = useSearchParams();

  // URL search params sync
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';
  const rawCatParam = searchParams.get('category') || '';
  const whenParam = searchParams.get('when') || 'anytime';

  const [events, setEvents] = useState<EventItem[]>([]);
  const [userCity, setUserCity] = useState<string>('All India');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Single Source of Truth for state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (!rawCatParam) return [];
    const lower = rawCatParam.toLowerCase();
    const matched = ALL_EXPLORE_CATEGORIES.find((c) => c.id.toLowerCase() === lower || c.name.toLowerCase().includes(lower));
    return matched ? [matched.id] : [];
  });

  const [dateFilter, setDateFilter] = useState<'anytime' | 'today' | 'weekend' | 'month'>(() => {
    if (whenParam === 'today' || whenParam === 'weekend' || whenParam === 'month') {
      return whenParam;
    }
    return 'anytime';
  });

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Shortcut key listener (Cmd+K / Ctrl+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync external search query if URL changes
  useEffect(() => {
    if (queryParam) setSearchQuery(queryParam);
  }, [queryParam]);

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

  // Filter public live events ONLY, excluding internal flash vibes
  const publicLiveEvents = useMemo(() => {
    return events.filter((e) => isPublicLiveEvent(e) && !isFlashVibeEvent(e));
  }, [events]);

  // Dynamic host categories aggregated from events
  const dynamicHostCategories = useMemo(() => {
    const presetNames = new Set(ALL_EXPLORE_CATEGORIES.map((c) => c.name.toLowerCase()));
    presetNames.add('all');

    const customItems: MostLovedCategory[] = [];

    events.forEach((e) => {
      if (e.category && typeof e.category === 'string') {
        const raw = e.category.trim();
        const lower = raw.toLowerCase();
        if (raw && !presetNames.has(lower)) {
          presetNames.add(lower);
          customItems.push({
            id: `host-${lower.replace(/\s+/g, '-')}`,
            name: raw,
            alt: raw,
            isCustom: true,
            keywords: [lower],
          });
        }
      }

      if (e.theme && Array.isArray(e.theme.flash_tags)) {
        e.theme.flash_tags.forEach((tag) => {
          if (tag && typeof tag === 'string') {
            const rawTag = tag.trim();
            const lowerTag = rawTag.toLowerCase();
            if (rawTag.length >= 3 && rawTag.length <= 24 && !presetNames.has(lowerTag) && !lowerTag.includes('vibe')) {
              if (['meetup', 'jam', 'league', 'dance', 'hackathon', 'gaming', 'poetry', 'books', 'cycling', 'running'].some((w) => lowerTag.includes(w))) {
                presetNames.add(lowerTag);
                customItems.push({
                  id: `host-tag-${lowerTag.replace(/\s+/g, '-')}`,
                  name: rawTag,
                  alt: rawTag,
                  isCustom: true,
                  keywords: [lowerTag],
                });
              }
            }
          }
        });
      }
    });

    return customItems;
  }, [events]);

  const allCategoriesList = useMemo(() => {
    return [...ALL_EXPLORE_CATEGORIES, ...dynamicHostCategories];
  }, [dynamicHostCategories]);

  // Calculate distance for each public event from active location
  const eventsWithDistance: EventWithDistance[] = useMemo(() => {
    const effectiveCoords =
      userCoords ||
      (userCity && userCity !== 'All India' ? getCityCoordinates(userCity) : null);

    return publicLiveEvents.map((e) => {
      const isSameCity = Boolean(
        userCity &&
        userCity !== 'All India' &&
        e.city?.toLowerCase().trim() === userCity.toLowerCase().trim()
      );

      if (isSameCity && effectiveCoords) {
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
          const dist = calculateDistanceKm(
            effectiveCoords.lat,
            effectiveCoords.lng,
            eventLat,
            eventLng
          );
          return { ...e, distanceKm: dist };
        }

        return { ...e, distanceKm: 0 };
      }

      return { ...e, distanceKm: null };
    });
  }, [publicLiveEvents, userCoords, userCity]);

  // 1. Toggle category from category card
  // Clicking an unselected card filters to it; clicking the same card again deselects and returns to All
  const handleToggleCategory = useCallback((catId: string) => {
    setSelectedCategories((prev) => {
      if (prev.length === 1 && prev[0] === catId) {
        return [];
      }
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      }
      return [catId];
    });

    const feedElem = document.getElementById('whats-on-feed');
    if (feedElem) {
      feedElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // 2. "All events" pill click resets all filters (both category and date)
  const handleResetToAll = useCallback(() => {
    setSelectedCategories([]);
    setDateFilter('anytime');
    setSearchQuery('');
  }, []);

  // 3. Apply filters from modal
  const handleApplyFilters = useCallback((categories: string[], when: string) => {
    setSelectedCategories(categories);
    setDateFilter(when as 'anytime' | 'today' | 'weekend' | 'month');

    const feedElem = document.getElementById('whats-on-feed');
    if (feedElem) {
      feedElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // 4. Remove single category tag from status line
  const handleRemoveCategoryTag = useCallback((catId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== catId));
  }, []);

  // Handle tag click directly from event card
  const handleTagClick = useCallback((tag: string, type: 'mood' | 'category' | 'source') => {
    if (type === 'category') {
      const lower = tag.toLowerCase();
      const matched = allCategoriesList.find(
        (c) => c.name.toLowerCase() === lower || c.id.toLowerCase() === lower || (c.keywords && c.keywords.some((k) => k.toLowerCase() === lower))
      );
      if (matched) {
        setSelectedCategories([matched.id]);
      } else {
        setSearchQuery(tag);
      }
    } else {
      setSearchQuery(tag);
    }

    const feedElem = document.getElementById('whats-on-feed');
    if (feedElem) {
      feedElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [allCategoriesList]);

  // 3 to 4 prominent events for the hero carousel
  const prominentEvents = useMemo(() => {
    const valid = eventsWithDistance
      .filter(isPublicLiveEvent)
      .filter((e) => !isFlashVibeEvent(e) && !isEventExpired(e));
    const pool =
      valid.length > 0
        ? valid
        : SAMPLE_TEMPLATE_EVENTS.filter((e) => isPublicLiveEvent(e) && !isEventExpired(e));
    return pool.slice(0, 4);
  }, [eventsWithDistance]);

  const [flashcardIdx, setFlashcardIdx] = useState(0);
  const [isFlashcardPaused, setIsFlashcardPaused] = useState(false);

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
  const flashcardLink = `/${currentFlashEvent?.slug || ''}`;

  // =========================================================================
  // DERIVED FILTERED EVENTS LIST (Single Source of Truth)
  // =========================================================================
  const filteredEvents = useMemo(() => {
    return eventsWithDistance
      .filter(isPublicLiveEvent)
      .filter((e) => !isFlashVibeEvent(e))
      .filter((e) => {
        const eTitle = e.title || '';
        const eTagline = e.tagline || '';
        const eDesc = e.description || '';
        const eCategory = (e.category || '').toLowerCase();
        const eFlashActivity = (e.flash_activity || '').toLowerCase();
        const eLocation = `${e.location_name || ''} ${e.location_address || ''} ${e.city || ''}`.toLowerCase();
        const eOrganizer = (e.organizer_name || '').toLowerCase();
        const eFlashTags = (e.theme?.flash_tags || []).join(' ').toLowerCase();
        const ePriceText = (e.external_price_text || '').toLowerCase();
        const eText = `${eTitle} ${eTagline} ${eDesc} ${eCategory} ${eFlashActivity} ${eLocation} ${eOrganizer} ${eFlashTags} ${ePriceText}`.toLowerCase();

        // 1. Tokenized Search Query
        if (searchQuery.trim()) {
          const tokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
          const matchesAllTokens = tokens.every((token) => eText.includes(token));
          if (!matchesAllTokens) return false;
        }

        // 2. Date Filter (When)
        if (dateFilter !== 'anytime') {
          if (!matchesDateFilter(e.start_at, dateFilter)) {
            return false;
          }
        }

        // 3. Category Filter
        if (!matchesCategoryFilter(e, selectedCategories, allCategoriesList)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.start_at ? new Date(a.start_at).getTime() : 0;
        const timeB = b.start_at ? new Date(b.start_at).getTime() : 0;
        return timeA - timeB;
      });
  }, [eventsWithDistance, searchQuery, dateFilter, selectedCategories, allCategoriesList]);

  // Active filters count for badge
  const activeFiltersCount =
    selectedCategories.length +
    (dateFilter !== 'anytime' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  // Status line title derivation
  const statusTitle = useMemo(() => {
    if (selectedCategories.length === 0) {
      return 'All events';
    }
    const names = selectedCategories.map((id) => {
      const cat = allCategoriesList.find((c) => c.id === id);
      return cat ? cat.name : id;
    });

    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} + ${names[1]}`;
    return `${names[0]} + ${names[1]} + ${names.length - 2} more`;
  }, [selectedCategories, allCategoriesList]);

  return (
    <>
      {/* Accessible semantic heading for SEO & screen readers */}
      <h1 className="sr-only">
        Vibe by Swaniki — Discover Live Events, Cultural Gatherings, Gigs, Sports & Spontaneous Meetups in India
      </h1>

      <div className="w-full">
        {/* Main Feed Content (Aligned with 7xl container) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* ========================================================================= */}
        {/* 1. SPOTLIGHT HERO BILLBOARD CAROUSEL                                      */}
        {/* ========================================================================= */}
        {currentFlashEvent && (
          <div
            data-cursor="view"
            className="w-full relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-white/10 group min-h-[460px] sm:min-h-[480px] md:h-[500px] lg:h-[520px] bg-[#07133A] touch-pan-y select-none"
            onMouseEnter={() => setIsFlashcardPaused(true)}
            onMouseLeave={() => setIsFlashcardPaused(false)}
          >
            {/* Seamless Image Crossfade Layer */}
            <div className="absolute inset-0 overflow-hidden">
              <AnimatePresence initial={false}>
                <motion.div
                  key={currentFlashEvent.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_e, info) => {
                    if (info.offset.x < -40 || info.velocity.x < -300) {
                      setFlashcardIdx((prev) => (prev + 1) % prominentEvents.length);
                    } else if (info.offset.x > 40 || info.velocity.x > 300) {
                      setFlashcardIdx((prev) => (prev - 1 + prominentEvents.length) % prominentEvents.length);
                    }
                  }}
                  className="absolute inset-0"
                >
                  <Image
                    src={currentFlashEvent.cover_image_url}
                    alt={currentFlashEvent.title}
                    fill
                    unoptimized
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Soft Directional Cinematic Scrim */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background:
                  'radial-gradient(circle at bottom left, rgba(7, 19, 58, 0.72) 0%, rgba(7, 19, 58, 0.30) 42%, rgba(7, 19, 58, 0) 75%)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#07133A]/75 via-[#07133A]/30 to-transparent pointer-events-none z-10" />

            {/* Content Group at Bottom-Left */}
            <div className="flashcard-hero-overlay absolute bottom-0 left-0 p-6 sm:p-8 md:p-10 max-w-xl lg:max-w-2xl z-20 pointer-events-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFlashEvent.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-3 sm:space-y-3.5"
                >
                  {/* Badge Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm">
                      <Zap className="w-3 h-3 fill-[#08B9F5] text-[#08B9F5]" />
                      <span>IN THE SPOTLIGHT</span>
                    </span>

                    {/* Mobile carousel controls */}
                    <div className="sm:hidden flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {prominentEvents.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setFlashcardIdx(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              flashcardIdx === i
                                ? 'w-5 bg-white shadow-xs'
                                : 'w-1.5 bg-white/40 hover:bg-white/70'
                            }`}
                            aria-label={`Slide ${i + 1}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={handlePrevFlashcard}
                          className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
                          aria-label="Previous"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextFlashcard}
                          className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
                          aria-label="Next"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Event Meta: Date & Venue */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-100/90 text-xs sm:text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#08B9F5] shrink-0" />
                      <span className="font-semibold uppercase tracking-wide">
                        {formatSpotlightDate(currentFlashEvent.start_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#08B9F5] shrink-0" />
                      <span className="truncate">
                        {currentFlashEvent.location_name || 'Live Venue'}, {currentFlashEvent.city || 'Indore'}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <Link
                    href={flashcardLink}
                    className="block group/title"
                  >
                    <h2 className="hero-spotlight-title font-extrabold text-2xl sm:text-3xl md:text-4xl leading-tight tracking-tight line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] group-hover/title:text-[#08B9F5] transition-colors" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                      {currentFlashEvent.title}
                    </h2>
                  </Link>

                  {/* Subtitle / Description */}
                  <p className="text-slate-100/90 text-sm sm:text-base line-clamp-2 font-normal leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] max-w-lg">
                    {currentFlashEvent.tagline || 'Live music. Open skies. A crowd that feels like your people.'}
                  </p>

                  {/* Action Button */}
                  <div className="pt-2 sm:pt-3">
                    <Link
                      href={flashcardLink}
                      className="hero-spotlight-btn inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-full bg-[#0066F5] hover:bg-[#0052cc] text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
                      style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                    >
                      <span className="hero-spotlight-btn-text" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Find your spot</span>
                      <ArrowRight className="w-4 h-4 text-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Carousel Indicators & Controls Capsule */}
            <div className="hidden sm:flex absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-20 items-center gap-3 px-3.5 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-xl">
              {/* Sleek Animated Slide Indicators */}
              <div className="flex items-center gap-1.5 px-1">
                {prominentEvents.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFlashcardIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      flashcardIdx === i
                        ? 'w-6 bg-white shadow-xs'
                        : 'w-1.5 bg-white/40 hover:bg-white/75'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Chevrons */}
              <div className="flex items-center gap-1 pl-1 border-l border-white/20">
                <button
                  type="button"
                  onClick={handlePrevFlashcard}
                  className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Previous event"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextFlashcard}
                  className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Next event"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CHOOSE YOUR VIBE CATEGORY NAVIGATION (Only category navigation)           */}
        {/* ========================================================================= */}
        <MostLovedSection
          cityName={userCity && userCity !== 'All India' ? userCity : 'Indore'}
          selectedCategories={selectedCategories}
          dateFilter={dateFilter}
          onToggleCategory={handleToggleCategory}
          onResetToAll={handleResetToAll}
          onApplyFilters={handleApplyFilters}
          activeFiltersCount={activeFiltersCount}
          events={events}
        />

        {/* ========================================================================= */}
        {/* EVENTS SECTION: STATUS LINE & GRID                                        */}
        {/* ========================================================================= */}
        <div id="whats-on-feed" className="space-y-6 pt-1">
          {/* Status Line: Current Title, Event Count & Interactive Filter Tags */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-extrabold text-xl sm:text-2xl text-[#07133A] dark:text-white tracking-tight">
                {statusTitle}
              </h3>
              <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                ({filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'})
              </span>
            </div>

            {/* Active Filter Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Date Tag */}
                {dateFilter !== 'anytime' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/10">
                    <Calendar className="w-3 h-3 text-[#0066F5]" />
                    <span>{DATE_FILTER_LABELS[dateFilter] || dateFilter}</span>
                    <button
                      type="button"
                      onClick={() => setDateFilter('anytime')}
                      className="hover:text-red-500 cursor-pointer ml-0.5"
                      aria-label="Remove date filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Category Tags */}
                {selectedCategories.map((catId) => {
                  const cat = allCategoriesList.find((c) => c.id === catId);
                  const name = cat ? cat.name : catId;
                  return (
                    <span
                      key={catId}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-[#0066F5]/20 text-[#0066F5] dark:text-[#38bdf8] border border-blue-200/80 dark:border-[#0066F5]/30"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategoryTag(catId)}
                        className="hover:text-red-500 cursor-pointer ml-0.5"
                        aria-label={`Remove ${name} filter`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                {/* Search Query Tag */}
                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/10">
                    <Search className="w-3 h-3 text-[#0066F5]" />
                    <span>&quot;{searchQuery}&quot;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-red-500 cursor-pointer ml-0.5"
                      aria-label="Remove search filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {/* Clear all link */}
                <button
                  type="button"
                  onClick={handleResetToAll}
                  className="text-xs font-semibold text-slate-400 hover:text-[#0066F5] dark:hover:text-white transition-colors cursor-pointer ml-1.5"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Events Grid or Empty State */}
          {filteredEvents.length === 0 ? (
            <div className="p-10 sm:p-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-white/15 space-y-4 max-w-xl mx-auto my-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto text-slate-400 dark:text-white/40">
                <FilterX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-[#07133A] dark:text-white">
                  No events found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 max-w-sm mx-auto">
                  We couldn&apos;t find any events matching your selected categories or dates.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleResetToAll}
                  className="px-5 py-2.5 bg-[#07133A] hover:bg-[#0A1F4D] text-white text-xs font-bold rounded-full transition-all shadow-md cursor-pointer flex items-center gap-2 dark:bg-white dark:text-[#07133A]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Show all events</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEvents.map((event) => (
                <div key={event.id} className="h-full flex flex-col">
                  <EventCard
                    event={event}
                    distanceKm={event.distanceKm}
                    userCity={userCity}
                    activeMoods={[]}
                    activeCategory={selectedCategories[0] || 'All'}
                    onTagClick={handleTagClick}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        </div>

        {/* Social Proof / Moments Wall - Spread Across Whole Page */}
        <div className="w-full mt-10 sm:mt-16">
          <MomentsWall />
        </div>
      </div>
    </>
  );
}
