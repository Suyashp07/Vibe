'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  MapPin,
  Calendar,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  SlidersHorizontal,
  Users,
  Activity,
  Music,
  Smile,
  Laptop,
  Utensils,
  Palette,
  GraduationCap,
  Clock,
  Ticket,
  FilterX,
  Download,
  Smartphone,
  MessageCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '@/components/ui/EventCard';
import { triggerPWAInstall } from '@/components/pwa/PWARegister';
import MomentsWall from '@/components/events/MomentsWall';
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
  isEventExpired
} from '@/lib/store';
import { EventItem } from '@/types';

// =============================================================================
// FILTER DEFINITIONS & INDUSTRY TAXONOMY
// =============================================================================

// When / Date filter options (Standard Luma / Eventbrite pattern)
export const DATE_FILTER_OPTIONS = [
  { id: 'anytime', label: 'Anytime' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend', label: 'This Weekend' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
] as const;
export type DateFilterType = (typeof DATE_FILTER_OPTIONS)[number]['id'];

// Category taxonomy with clear icons
export const CATEGORY_FILTERS = [
  'All',
  'Sports',
  'Music',
  'Comedy',
  'Technology',
  'Social',
  'Food',
  'Arts',
  'Workshops',
  'Other',
] as const;
export type CategoryFilterType = (typeof CATEGORY_FILTERS)[number];

// Important categories to show on the primary filter bar
export const IMPORTANT_CATEGORY_FILTERS: CategoryFilterType[] = [
  'All',
  'Music',
  'Sports',
  'Comedy',
  'Social',
];

export const CATEGORY_CONFIG: Record<
  CategoryFilterType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  All: { label: 'All vibes', icon: Sparkles },
  Sports: { label: 'Sports & Fitness', icon: Activity },
  Music: { label: 'Music & Gigs', icon: Music },
  Comedy: { label: 'Comedy & Stand-up', icon: Smile },
  Technology: { label: 'Tech & Startups', icon: Laptop },
  Social: { label: 'Social & Meetups', icon: Users },
  Food: { label: 'Food & Drinks', icon: Utensils },
  Arts: { label: 'Art & Culture', icon: Palette },
  Workshops: { label: 'Workshops & Talks', icon: GraduationCap },
  Other: { label: 'More Vibes', icon: Zap },
};

// Price filter options
export const PRICE_OPTIONS = [
  { id: 'all', label: 'All Prices' },
  { id: 'free', label: 'Free RSVP' },
  { id: 'paid', label: 'Paid Passes' },
] as const;
export type PriceFilterType = (typeof PRICE_OPTIONS)[number]['id'];

// Distance options
export const DISTANCE_OPTIONS = ['Off', '5 km', '15 km', '30 km'] as const;
export type DistanceFilterType = (typeof DISTANCE_OPTIONS)[number];

// 23 Mood / Vibe Tag System options
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
function matchesDateFilter(eventDateStr: string | undefined, filter: DateFilterType): boolean {
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

  if (filter === 'tomorrow') {
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(todayEnd);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    return eventDate >= tomorrowStart && eventDate <= tomorrowEnd;
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

    // Weekend ends Sunday night 23:59:59
    const weekendEnd = new Date(weekendStart);
    const daysUntilSunday = (7 - weekendStart.getDay()) % 7;
    weekendEnd.setDate(weekendEnd.getDate() + daysUntilSunday);
    weekendEnd.setHours(23, 59, 59, 999);

    return eventDate >= weekendStart && eventDate <= weekendEnd;
  }

  if (filter === 'this_week') {
    const currentDay = now.getDay();
    const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + daysUntilSunday);
    weekEnd.setHours(23, 59, 59, 999);

    return eventDate >= todayStart && eventDate <= weekEnd;
  }

  if (filter === 'this_month') {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return eventDate >= todayStart && eventDate <= monthEnd;
  }

  return true;
}

export default function WhatsOnFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL search params sync
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';
  const rawCatParam = searchParams.get('category') || '';
  const whenParam = (searchParams.get('when') as DateFilterType) || 'anytime';
  const priceParam = (searchParams.get('price') as PriceFilterType) || 'all';

  // Map initial category from URL
  const initialCategory: CategoryFilterType = useMemo(() => {
    if (!rawCatParam) return 'All';
    const lower = rawCatParam.toLowerCase();
    if (lower.includes('sport') || lower.includes('fitness')) return 'Sports';
    if (lower.includes('music')) return 'Music';
    if (lower.includes('comedy') || lower.includes('stand')) return 'Comedy';
    if (lower.includes('tech') || lower.includes('software') || lower.includes('startup')) return 'Technology';
    if (lower.includes('social') || lower.includes('meetup')) return 'Social';
    if (lower.includes('food') || lower.includes('drink') || lower.includes('dining')) return 'Food';
    if (lower.includes('art') || lower.includes('theatre') || lower.includes('culture')) return 'Arts';
    if (lower.includes('workshop') || lower.includes('learn') || lower.includes('masterclass')) return 'Workshops';
    const exact = CATEGORY_FILTERS.find((c) => c.toLowerCase() === lower);
    return exact || 'All';
  }, [rawCatParam]);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [userCity, setUserCity] = useState<string>('All India');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Active filter states
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close date dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const [dateFilter, setDateFilter] = useState<DateFilterType>(
    DATE_FILTER_OPTIONS.some((d) => d.id === whenParam) ? whenParam : 'anytime'
  );
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>(initialCategory);
  const [priceFilter, setPriceFilter] = useState<PriceFilterType>(
    PRICE_OPTIONS.some((p) => p.id === priceParam) ? priceParam : 'all'
  );
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilterType>('Off');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Sync external search query if URL changes
  useEffect(() => {
    if (queryParam) setSearchQuery(queryParam);
  }, [queryParam]);

  // Sync external category if URL changes
  useEffect(() => {
    if (rawCatParam) setCategoryFilter(initialCategory);
  }, [rawCatParam, initialCategory]);

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

      // Only calculate numeric distanceKm if event is in the user's active city
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

      // Events happening outside the user's city or in 'All India' view do not display a km distance
      return { ...e, distanceKm: null };
    });
  }, [publicLiveEvents, userCoords, userCity]);

  // Toggle mood tag (flexible union logic)
  const handleToggleMood = (tag: string) => {
    setSelectedMoods((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Reset all filters to default clean state
  const handleResetMyView = useCallback(() => {
    setSelectedMoods([]);
    setCategoryFilter('All');
    setDateFilter('anytime');
    setPriceFilter('all');
    setDistanceFilter('Off');
    setSearchQuery('');
    try {
      localStorage.removeItem('vibe_filter_prefs');
    } catch {
      // ignore
    }
  }, []);

  // Handle tag click directly from any event card (acting as an interactive filter)
  const handleTagClick = (tag: string, type: 'mood' | 'category' | 'source') => {
    if (type === 'category') {
      const lower = tag.toLowerCase();
      let matched: CategoryFilterType = 'All';
      if (lower.includes('sport') || lower.includes('fitness')) matched = 'Sports';
      else if (lower.includes('music')) matched = 'Music';
      else if (lower.includes('comedy') || lower.includes('stand')) matched = 'Comedy';
      else if (lower.includes('tech') || lower.includes('startup')) matched = 'Technology';
      else if (lower.includes('social') || lower.includes('meetup')) matched = 'Social';
      else if (lower.includes('food') || lower.includes('dining')) matched = 'Food';
      else if (lower.includes('art')) matched = 'Arts';
      else if (lower.includes('workshop')) matched = 'Workshops';
      else {
        const exact = CATEGORY_FILTERS.find((c) => c.toLowerCase() === lower);
        if (exact) matched = exact;
      }

      if (matched !== 'All') {
        setCategoryFilter((prev) => (prev === matched ? 'All' : matched));
      } else {
        setCategoryFilter('All');
        setSearchQuery((prev) => (prev.toLowerCase() === tag.toLowerCase() ? '' : tag));
      }
    } else if (type === 'source') {
      const sourceQuery = tag === 'vibe' ? 'vibe' : tag;
      setSearchQuery((prev) => (prev.toLowerCase() === sourceQuery.toLowerCase() ? '' : sourceQuery));
    } else {
      const matchedMood = MOOD_TAGS.find((m) => m.toLowerCase() === tag.toLowerCase());
      const targetMood = matchedMood || tag;
      setSelectedMoods((prev) =>
        prev.includes(targetMood) ? prev.filter((t) => t !== targetMood) : [...prev, targetMood]
      );
    }

    const feedElem = document.getElementById('whats-on-feed');
    if (feedElem) {
      feedElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
  // MULTI-DIMENSIONAL FILTER ENGINE (Standard Luma / Eventbrite / BookMyShow)
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

        // 1. Tokenized Search Query: match all words in any order
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

        // 3. Category Filter (What)
        if (categoryFilter !== 'All') {
          const cat = categoryFilter;
          if (cat === 'Sports') {
            const isDirect = eCategory.includes('sport') || eCategory.includes('fitness');
            const isActivity = ['cricket', 'football', 'badminton', 'pickleball', 'sprint'].includes(eFlashActivity);
            const hasKeyword = [
              'sport',
              'fitness',
              'pickleball',
              'cricket',
              'football',
              'marathon',
              'padel',
              'badminton',
              'run',
              'runner',
              'turf',
              'tennis',
              'yoga',
              'swim',
              'workout',
              'cycling',
              'trek',
              'game',
              'tournament',
            ].some((w) => eText.includes(w));
            if (!isDirect && !isActivity && !hasKeyword) return false;
          } else if (cat === 'Music') {
            const isDirect = eCategory.includes('music');
            const isActivity = eFlashActivity === 'music';
            const hasKeyword = [
              'music',
              'concert',
              'acoustic',
              'sitar',
              'band',
              'gig',
              'live',
              'techno',
              'dj',
              'synth',
              'orchestra',
              'singer',
              'festival',
              'jam',
            ].some((w) => eText.includes(w));
            if (!isDirect && !isActivity && !hasKeyword) return false;
          } else if (cat === 'Comedy') {
            const isDirect = eCategory.includes('comedy');
            const hasKeyword = [
              'comedy',
              'stand-up',
              'standup',
              'comic',
              'roast',
              'humor',
              'open mic',
              'improv',
              'laugh',
            ].some((w) => eText.includes(w));
            if (!isDirect && !hasKeyword) return false;
          } else if (cat === 'Technology') {
            const isDirect = eCategory.includes('tech') || eCategory.includes('software');
            const hasKeyword = [
              'tech',
              'ai',
              'hacker',
              'software',
              'developer',
              'code',
              'founder',
              'build',
              'startup',
              'web3',
              'pitch',
              'demo',
              'saas',
              'product',
            ].some((w) => eText.includes(w));
            if (!isDirect && !hasKeyword) return false;
          } else if (cat === 'Social') {
            const isDirect = eCategory.includes('social') || eCategory.includes('community');
            const isActivity = ['coffee', 'games'].includes(eFlashActivity);
            const hasKeyword = [
              'meetup',
              'mixer',
              'community',
              'networking',
              'singles',
              'gathering',
              'boardgame',
              'games',
              'catan',
              'chess',
              'social',
              'hangout',
            ].some((w) => eText.includes(w));
            if (!isDirect && !isActivity && !hasKeyword) return false;
          } else if (cat === 'Food') {
            const isDirect = eCategory.includes('food') || eCategory.includes('culinary');
            const hasKeyword = [
              'food',
              'dining',
              'dinner',
              'culinary',
              'drinks',
              'tasting',
              'supper',
              'salon',
              'chef',
              'cocktail',
              'wine',
              'brunch',
              'bakery',
              'coffee',
            ].some((w) => eText.includes(w));
            if (!isDirect && !hasKeyword) return false;
          } else if (cat === 'Arts') {
            const isDirect = eCategory.includes('art') || eCategory.includes('design');
            const hasKeyword = [
              'art',
              'design',
              'poetry',
              'theatre',
              'craft',
              'photo',
              'exhibition',
              'sculpture',
              'gallery',
              'painting',
              'pottery',
              'heritage',
              'cinema',
              'screening',
            ].some((w) => eText.includes(w));
            if (!isDirect && !hasKeyword) return false;
          } else if (cat === 'Workshops') {
            const isDirect = eCategory.includes('workshop') || eCategory.includes('education');
            const hasKeyword = [
              'workshop',
              'masterclass',
              'bootcamp',
              'talk',
              'learn',
              'lecture',
              'panel',
              'seminar',
              'hands-on',
            ].some((w) => eText.includes(w));
            if (!isDirect && !hasKeyword) return false;
          }
        }

        // 4. Price Filter (All / Free / Paid)
        if (priceFilter !== 'all') {
          const isFree =
            (e as any).is_free ||
            ePriceText.includes('free') ||
            ePriceText === '₹0' ||
            ePriceText === '0' ||
            (!ePriceText && e.source_type !== 'external');
          if (priceFilter === 'free' && !isFree) return false;
          if (priceFilter === 'paid' && isFree) return false;
        }

        // 5. Proximity / Distance Filter
        if (distanceFilter !== 'Off') {
          const maxKm = distanceFilter === '5 km' ? 5 : distanceFilter === '15 km' ? 15 : 30;
          if (typeof e.distanceKm === 'number') {
            if (e.distanceKm > maxKm) return false;
          } else if (userCity && userCity !== 'All India' && e.city?.toLowerCase() !== userCity.toLowerCase()) {
            return false;
          }
        }

        // 6. Mood / Tag Multi-Select (Flexible OR / Any Match)
        if (selectedMoods.length > 0) {
          const eDate = e.start_at ? new Date(e.start_at) : null;
          const eHours = eDate ? eDate.getHours() : 18;

          const matchesAnyMood = selectedMoods.some((mood) => {
            if (mood === 'Free') {
              return !e.external_price_text || eText.includes('free') || (e as any).is_free;
            } else if (mood === 'Comedy') {
              return ['comedy', 'stand-up', 'standup', 'comic', 'humor', 'roast', 'open mic'].some((w) =>
                eText.includes(w)
              );
            } else if (mood === 'Stand-up') {
              return ['stand-up', 'standup', 'comedy'].some((w) => eText.includes(w));
            } else if (mood === 'Art') {
              return ['art', 'design', 'gallery', 'exhibit', 'theatre', 'poetry'].some((w) => eText.includes(w));
            } else if (mood === 'Music') {
              return ['music', 'concert', 'acoustic', 'sitar', 'band', 'gig', 'live', 'dj'].some((w) =>
                eText.includes(w)
              );
            } else if (mood === 'Party') {
              return ['party', 'dj', 'nightlife', 'club', 'celebration'].some((w) => eText.includes(w));
            } else if (mood === 'Meetup') {
              return ['meetup', 'networking', 'mixer', 'gathering', 'community'].some((w) => eText.includes(w));
            } else if (mood === 'Gaming') {
              return ['game', 'gaming', 'boardgame', 'esports', 'chess'].some((w) => eText.includes(w));
            } else if (mood === 'Dance') {
              return ['dance', 'salsa', 'garba', 'club', 'techno'].some((w) => eText.includes(w));
            } else if (mood === 'Fitness') {
              return ['fitness', 'run', 'marathon', 'workout', 'yoga', 'gym'].some((w) => eText.includes(w));
            } else if (mood === 'Sports') {
              return ['sport', 'turf', 'match', 'badminton', 'padel', 'cricket', 'pickleball', 'football'].some((w) =>
                eText.includes(w)
              );
            } else if (mood === 'Outdoor') {
              return (
                e.event_type === 'in-person' &&
                ['outdoor', 'rooftop', 'terrace', 'park', 'lawn', 'ground', 'open air'].some((w) => eText.includes(w))
              );
            } else if (mood === 'Indoor') {
              return ['indoor', 'hall', 'auditorium', 'theatre', 'studio', 'room', 'space', 'cafe', 'court'].some(
                (w) => eText.includes(w)
              );
            } else if (mood === 'Morning') {
              return eHours >= 5 && eHours < 12;
            } else if (mood === 'Afternoon') {
              return eHours >= 12 && eHours < 17;
            } else if (mood === 'Evening') {
              return eHours >= 17 && eHours < 21;
            } else if (mood === 'Night') {
              return eHours >= 21 || eHours < 5;
            } else if (mood === 'Singles friendly') {
              return true;
            } else if (mood === 'Couples friendly') {
              return ['dinner', 'concert', 'poetry', 'soiree', 'date', 'music', 'acoustic'].some((w) =>
                eText.includes(w)
              );
            } else if (mood === 'Kids allowed') {
              return !['18+', 'bar', 'cocktail', 'pub', 'liquor'].some((w) => eText.includes(w));
            } else if (mood === '18+') {
              return ['18+', 'bar', 'cocktail', 'pub', 'liquor', 'wine', 'beer'].some((w) => eText.includes(w));
            } else if (mood === 'Workshop') {
              return ['workshop', 'masterclass', 'hands-on', 'learn', 'bootcamp'].some((w) => eText.includes(w));
            } else if (mood === 'Networking') {
              return ['network', 'founder', 'connect', 'social', 'mixer', 'summit'].some((w) => eText.includes(w));
            }
            return eText.includes(mood.toLowerCase());
          });

          if (!matchesAnyMood) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Nearest first if distance filter is active
        if (distanceFilter !== 'Off') {
          const distA = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
          const distB = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
          if (distA !== distB) return distA - distB;
        }

        // Default: Chronological start date
        const timeA = a.start_at ? new Date(a.start_at).getTime() : 0;
        const timeB = b.start_at ? new Date(b.start_at).getTime() : 0;
        return timeA - timeB;
      });
  }, [
    eventsWithDistance,
    searchQuery,
    dateFilter,
    categoryFilter,
    priceFilter,
    distanceFilter,
    selectedMoods,
    userCity,
  ]);

  // Determine active filter badges
  const activeFiltersCount =
    (searchQuery.trim() ? 1 : 0) +
    (dateFilter !== 'anytime' ? 1 : 0) +
    (categoryFilter !== 'All' ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0) +
    (distanceFilter !== 'Off' ? 1 : 0) +
    selectedMoods.length;

  return (
    <>
      {/* Accessible semantic heading for SEO & screen readers */}
      <h1 className="sr-only">
        Vibe by Swaniki — Discover Live Events, Cultural Gatherings, Gigs, Sports & Spontaneous Meetups in India
      </h1>

      <div className="w-full space-y-8 sm:space-y-12">
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
            {/* Seamless Image Crossfade Layer (Zero Black Flash) */}
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
                  {/* Natural Vibrant Event Photograph - full-bleed, no heavy black filter */}
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

            {/* Soft Directional Cinematic Scrim (Netflix-style, lighter & anchored at bottom-left) */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background:
                  'radial-gradient(circle at bottom left, rgba(7, 19, 58, 0.72) 0%, rgba(7, 19, 58, 0.30) 42%, rgba(7, 19, 58, 0) 75%)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#07133A]/75 via-[#07133A]/30 to-transparent pointer-events-none z-10" />

            {/* Content Group at Bottom-Left with Razor-Sharp Readability */}
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
                  {/* Badge Row (with mobile-friendly pagination inline on small screens) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm">
                      <Zap className="w-3 h-3 fill-[#08B9F5] text-[#08B9F5]" />
                      <span>IN THE SPOTLIGHT</span>
                    </span>

                    {/* Mobile pagination controls inside card */}
                    <div className="sm:hidden flex items-center gap-1.5 font-mono text-[11px] font-bold text-white/90">
                      <span>{String(flashcardIdx + 1).padStart(2, '0')}/{String(prominentEvents.length).padStart(2, '0')}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevFlashcard}
                          className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
                          aria-label="Previous"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextFlashcard}
                          className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
                          aria-label="Next"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Event Meta: Date & Venue with Soft Shadow */}
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
                        {currentFlashEvent.location_name || 'Live Venue'}, {currentFlashEvent.city || 'Mumbai'}
                      </span>
                    </div>
                  </div>

                  {/* Title: Crisp bold white text with soft shadow */}
                  <Link
                    href={flashcardLink}
                    className="block group/title"
                  >
                    <h2 className="hero-spotlight-title font-extrabold text-2xl sm:text-3xl md:text-4xl leading-tight tracking-tight line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] group-hover/title:text-[#08B9F5] transition-colors" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                      {currentFlashEvent.title}
                    </h2>
                  </Link>

                  {/* Subtitle / Description: High-contrast soft white */}
                  <p className="text-slate-100/90 text-sm sm:text-base line-clamp-2 font-normal leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] max-w-lg">
                    {currentFlashEvent.tagline || 'Live music. Open skies. A crowd that feels like your people.'}
                  </p>

                  {/* Action Button: Bright blue button with subtle glow */}
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

            {/* Desktop Frosted Glass Capsule for Pagination & Controls (Bottom-Right) */}
            <div className="hidden sm:flex absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-20 items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/20 dark:bg-black/40 backdrop-blur-md border border-white/30 text-white shadow-lg">
              <span className="text-[11px] sm:text-xs font-mono font-bold text-white tracking-wider">
                {String(flashcardIdx + 1).padStart(2, '0')} / {String(prominentEvents.length).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevFlashcard}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Previous event"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextFlashcard}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Next event"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ========================================================================= */}
        {/* 2. DISCOVERY SECTION: SEARCH, DATE PILLS, CATEGORIES & CONTROLS           */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* 2-TIER COMPACT TOOLBAR                                                    */}
        {/* ========================================================================= */}
        <div id="whats-on-feed" className="space-y-5 pt-3">
          {/* ========================================================================= */}
          {/* 1. STREAMLINED HEADER: Bold Navy Heading + Sleek Search Input             */}
          {/* ========================================================================= */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="discovery-feed-title text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#07133A] dark:text-white tracking-tight leading-tight">
                Find your next good time
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Live gigs, founder mixers, sports games, and underground meetups.
              </p>
            </div>

            {/* Right: Sleek Pill-shaped Search Input with shortcut badge */}
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, venues..."
                className="w-full pl-10 pr-12 py-2.5 rounded-full border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.06)] text-sm text-[#07133A] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#07133A]/20 dark:focus:ring-white/20 transition-all"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  ⌘K
                </span>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. FILTER BAR (Single Clean Row)                                         */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Scrollable Category Pills on Left */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1 min-w-0">
              {CATEGORY_FILTERS.map((cat) => {
                const active = categoryFilter === cat;
                const config = CATEGORY_CONFIG[cat];
                const Icon = config.icon as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`category-pill rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      active
                        ? 'category-pill-active bg-[#07133A] text-white shadow-sm border border-[#07133A]'
                        : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200/90 dark:border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: '#07133A',
                            borderColor: '#07133A',
                            color: '#FFFFFF',
                            WebkitTextFillColor: '#FFFFFF',
                          }
                        : undefined
                    }
                  >
                    <Icon
                      className="w-3.5 h-3.5 shrink-0"
                      style={active ? { color: '#FFFFFF', stroke: '#FFFFFF' } : undefined}
                    />
                    <span style={active ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Utility Pills: Date Dropdown + Filters Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Quick Date Dropdown */}
              <div className="relative" ref={dateDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap border ${
                    dateFilter !== 'anytime'
                      ? 'feed-active-btn bg-[#07133A] text-white border-[#07133A] shadow-sm dark:bg-white dark:text-[#07133A] dark:border-white'
                      : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                  }`}
                  style={dateFilter !== 'anytime' ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}
                >
                  <Calendar className="w-3.5 h-3.5" style={dateFilter !== 'anytime' ? { color: '#FFFFFF', stroke: '#FFFFFF' } : undefined} />
                  <span style={dateFilter !== 'anytime' ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}>
                    {dateFilter === 'weekend'
                      ? 'This Weekend'
                      : DATE_FILTER_OPTIONS.find((d) => d.id === dateFilter)?.label || 'Date'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isDateDropdownOpen ? 'rotate-180' : ''
                    }`}
                    style={dateFilter !== 'anytime' ? { color: '#FFFFFF', stroke: '#FFFFFF' } : undefined}
                  />
                </button>

                <AnimatePresence>
                  {isDateDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-xl py-1.5 z-40 overflow-hidden"
                    >
                      {DATE_FILTER_OPTIONS.map((opt) => {
                        const isSelected = dateFilter === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setDateFilter(opt.id);
                              setIsDateDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-slate-100 dark:bg-slate-800 text-[#07133A] dark:text-white font-bold'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0038A8] dark:bg-[#08B9F5]" />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Clean Filters Button */}
              <button
                type="button"
                onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap border ${
                  showFiltersDrawer ||
                  selectedMoods.length > 0 ||
                  distanceFilter !== 'Off' ||
                  priceFilter !== 'all'
                    ? 'feed-active-btn bg-[#07133A] text-white border-[#07133A] shadow-sm dark:bg-white dark:text-[#07133A] dark:border-white'
                    : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                }`}
                style={
                  showFiltersDrawer || selectedMoods.length > 0 || distanceFilter !== 'Off' || priceFilter !== 'all'
                    ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }
                    : undefined
                }
              >
                <SlidersHorizontal
                  className="w-3.5 h-3.5"
                  style={
                    showFiltersDrawer || selectedMoods.length > 0 || distanceFilter !== 'Off' || priceFilter !== 'all'
                      ? { color: '#FFFFFF', stroke: '#FFFFFF' }
                      : undefined
                  }
                />
                <span
                  style={
                    showFiltersDrawer || selectedMoods.length > 0 || distanceFilter !== 'Off' || priceFilter !== 'all'
                      ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }
                      : undefined
                  }
                >
                  Filters
                </span>
                {(selectedMoods.length > 0 ||
                  distanceFilter !== 'Off' ||
                  priceFilter !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-[#08B9F5]" />
                )}
              </button>
            </div>
          </div>

          {/* Active Filter Badges Strip (Visible when any filter is active) */}
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 flex-wrap text-xs pt-1"
            >
              <span className="text-[11px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">
                Active:
              </span>

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-200/80 dark:border-white/10">
                  <Search className="w-3 h-3 text-[#0038A8] dark:text-[#08B9F5]" />
                  <span>&quot;{searchQuery}&quot;</span>
                  <button onClick={() => setSearchQuery('')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {dateFilter !== 'anytime' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-200/80 dark:border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-[#0038A8] dark:text-[#08B9F5]" />
                  <span>
                    {DATE_FILTER_OPTIONS.find((d) => d.id === dateFilter)?.label}
                  </span>
                  <button onClick={() => setDateFilter('anytime')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {categoryFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-200/80 dark:border-white/10">
                  <span>{CATEGORY_CONFIG[categoryFilter].label}</span>
                  <button onClick={() => setCategoryFilter('All')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {priceFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-200/80 dark:border-white/10">
                  <Ticket className="w-3 h-3 text-[#0038A8] dark:text-[#08B9F5]" />
                  <span>{priceFilter === 'free' ? 'Free RSVP' : 'Paid Passes'}</span>
                  <button onClick={() => setPriceFilter('all')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {distanceFilter !== 'Off' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-200/80 dark:border-white/10">
                  <MapPin className="w-3 h-3 text-[#0038A8] dark:text-[#08B9F5]" />
                  <span>Within {distanceFilter}</span>
                  <button onClick={() => setDistanceFilter('Off')} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedMoods.map((mood) => (
                <span
                  key={mood}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#08B9F5]/15 text-[#0038A8] dark:text-[#08B9F5] border border-blue-200/60 dark:border-[#08B9F5]/30 font-medium"
                >
                  <span>{mood}</span>
                  <button onClick={() => handleToggleMood(mood)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={handleResetMyView}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-[#07133A] dark:hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset all</span>
              </button>
            </motion.div>
          )}

          {/* Expandable Filter Drawer */}
          <AnimatePresence>
            {showFiltersDrawer && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.08)] space-y-4 overflow-hidden"
              >
                {/* 1. Price / Passes Option */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">
                    ENTRY & TICKETS:
                  </span>
                  <div className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-white/10">
                    {PRICE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPriceFilter(opt.id)}
                        className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                          priceFilter === opt.id
                            ? 'bg-[#07133A] text-white shadow-sm dark:bg-white dark:text-[#07133A]'
                            : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {opt.id === 'all' ? 'All' : opt.id === 'free' ? 'Free RSVP' : 'Paid Passes'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Radius / Distance from You */}
                <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-slate-100 dark:border-white/10">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">
                    RADIUS FROM YOU:
                  </span>
                  <div className="flex items-center gap-2">
                    {DISTANCE_OPTIONS.map((dist) => (
                      <button
                        key={dist}
                        onClick={() => setDistanceFilter(dist)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer border ${
                          distanceFilter === dist
                            ? 'bg-[#07133A] text-white border-[#07133A] shadow-sm dark:bg-white dark:text-[#07133A] dark:border-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:text-white/70 border-slate-200/80 dark:border-white/10'
                        }`}
                      >
                        {dist === 'Off' ? 'Anywhere' : dist}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Mood & Vibe Tags */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">
                      MOOD & VIBE TAGS:
                    </span>
                    {selectedMoods.length > 0 && (
                      <button
                        onClick={() => setSelectedMoods([])}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-[#07133A] dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear tags</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {MOOD_TAGS.map((tag) => {
                      const active = selectedMoods.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => handleToggleMood(tag)}
                          className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer border ${
                            active
                              ? 'bg-[#07133A] text-white border-[#07133A] font-semibold dark:bg-white dark:text-[#07133A] dark:border-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:text-white/70 border-slate-200/80 dark:border-white/10'
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

          {/* ========================================================================= */}
          {/* 3. EVENTS GRID & EMPTY STATE (4 columns on desktop)                      */}
          {/* ========================================================================= */}
          {filteredEvents.length === 0 ? (
            <div className="p-10 sm:p-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-white/15 space-y-4 max-w-2xl mx-auto my-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto text-slate-400 dark:text-white/40">
                <FilterX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-[#07133A] dark:text-white">
                  No experiences match these filters
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 max-w-md mx-auto">
                  Try broadening your dates, clearing tags, or resetting distance radius to see upcoming vibes.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={handleResetMyView}
                  className="px-5 py-2.5 bg-[#07133A] hover:bg-[#0A1F4D] text-white text-xs font-bold rounded-full transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
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
                    activeMoods={selectedMoods}
                    activeCategory={categoryFilter}
                    onTagClick={handleTagClick}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* HOST QUICK SHORT EVENT BANNER CARD (SLIM CTA STRIP)                       */}
          {/* ========================================================================= */}
          <section className="host-card" aria-label="Host an event with us">
            <style dangerouslySetInnerHTML={{ __html: `
              .host-card {
                position: relative;
                overflow: hidden;
                background: linear-gradient(135deg, #0b2a6f 0%, #1d4ed8 100%);
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.15);
                box-shadow: 0 10px 30px -5px rgba(29, 78, 216, 0.25);
                padding: 24px 32px;
                margin: 36px 0 16px 0;
                font-family: var(--font-inter), 'Segoe UI', system-ui, -apple-system, sans-serif;
              }
              .host-card-glow {
                position: absolute;
                top: -40px;
                right: -40px;
                width: 180px;
                height: 180px;
                background: radial-gradient(circle, rgba(147, 197, 253, 0.35) 0%, transparent 70%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
              }
              .host-card-inner {
                position: relative;
                z-index: 2;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
              }
              .host-card-text {
                flex: 1;
                min-width: 0;
              }
              .host-card-heading {
                font-family: var(--font-bricolage), 'Bricolage Grotesque', var(--font-outfit), 'Outfit', -apple-system, sans-serif !important;
                font-size: 25px;
                font-weight: 800;
                color: #ffffff !important;
                -webkit-text-fill-color: #ffffff !important;
                margin: 0 0 6px 0;
                line-height: 1.22;
                letter-spacing: -0.02em;
              }
              .host-card-subtext {
                font-family: var(--font-inter), -apple-system, sans-serif;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.88) !important;
                -webkit-text-fill-color: rgba(255, 255, 255, 0.88) !important;
                margin: 0;
                line-height: 1.45;
                max-width: 640px;
              }
              .host-card-buttons {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-shrink: 0;
              }
              .host-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 10px 22px;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
                outline: none;
                white-space: nowrap;
              }
              .host-btn:hover {
                transform: translateY(-2px);
              }
              .host-btn:focus-visible {
                outline: 2px solid #ffffff;
                outline-offset: 3px;
              }
              .host-btn-whatsapp {
                background-color: #ffffff;
                color: #075e54 !important;
                -webkit-text-fill-color: #075e54 !important;
                border: 1px solid transparent;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
              }
              .host-btn-whatsapp:hover {
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
                background-color: #f8fafc;
              }
              .host-btn-telegram {
                background-color: transparent;
                color: #ffffff !important;
                -webkit-text-fill-color: #ffffff !important;
                border: 1.5px solid rgba(255, 255, 255, 0.9);
              }
              .host-btn-telegram:hover {
                background-color: rgba(255, 255, 255, 0.12);
                border-color: #ffffff;
              }
              @media (max-width: 720px) {
                .host-card {
                  padding: 20px 18px;
                }
                .host-card-inner {
                  flex-direction: column;
                  align-items: stretch;
                  gap: 16px;
                }
                .host-card-heading {
                  font-size: 20px;
                }
                .host-card-subtext {
                  font-size: 13px;
                }
                .host-card-buttons {
                  flex-direction: column;
                  width: 100%;
                  gap: 10px;
                }
                .host-btn {
                  width: 100%;
                }
              }
              @media (prefers-reduced-motion: reduce) {
                .host-btn {
                  transition: none;
                }
                .host-btn:hover {
                  transform: none;
                }
              }
            `}} />

            {/* Soft light-blue glow in top-right corner */}
            <div className="host-card-glow" aria-hidden="true" />

            <div className="host-card-inner">
              <div className="host-card-text">
                <h3 className="host-card-heading">
                  Host a quick, short event with us
                </h3>
                <p className="host-card-subtext">
                  Webinar, meetup or mini workshop: we handle the setup, you just bring the idea. Message us and your event can be live in no time.
                </p>
              </div>

              <div className="host-card-buttons">
                {/* 
                  REPLACE WHATSAPP NUMBER BELOW:
                  Format: https://wa.me/<country_code><phone_number>?text=<encoded_message>
                */}
                <a
                  href="https://wa.me/919183123093?text=Hi%2C%20I%20want%20to%20host%20a%20quick%20short%20event%20with%20you!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="host-btn host-btn-whatsapp"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41a8.17 8.17 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.25-1.5-1.4-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.23.9 2.43 1.03 2.6.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/>
                  </svg>
                  <span>WhatsApp</span>
                </a>

                {/* 
                  REPLACE TELEGRAM USERNAME BELOW:
                  Format: https://t.me/<your_username>
                */}
                <a
                  href="https://t.me/vibe_events"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="host-btn host-btn-telegram"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                  <span>Telegram</span>
                </a>
              </div>
            </div>
          </section>
          <MomentsWall />
        </div>
      </div>
    </>
  );
}
