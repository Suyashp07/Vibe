'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Flame,
  MessageSquare,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Zap,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventItem, RSVPItem } from '@/types';
import {
  getFlashVibeEvents,
  subscribeToStore,
  syncEventsWithSupabase,
  isEventExpired,
  isFlashVibeLiked,
  toggleFlashVibeLike,
  hasUserRSVP,
  getRSVPs,
  getComments,
} from '@/lib/store';
import { getUserCity } from '@/lib/location';
import ConnectHostModal from '@/components/communication/ConnectHostModal';
import QuickJoinModal from '@/components/vibes/QuickJoinModal';
import CreateVibeModal from '@/components/vibes/CreateVibeModal';

interface VibeInstantItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  badge?: string;
  host_name: string;
  host_initials: string;
  host_rating: string;
  host_vibes_count: number;
  formatted_date: string;
  formatted_time: string;
  formatted_date_time_venue: string;
  location_name: string;
  city: string;
  description: string;
  going_count: number;
  capacity: number;
  spots_left: number;
  likes_count: number;
  comments_count: number;
  cover_image_url: string;
  originalEvent?: EventItem;
}

// Curated default vibes strictly matching the design references in Screenshot 1 & 2
const DEFAULT_VIBES_LIST: VibeInstantItem[] = [
  {
    id: 'vibe-coffee-1',
    slug: 'good-coffee-great-connections',
    title: 'Good coffee. Great connections.',
    category: 'TECHNOLOGY',
    badge: 'Community pick',
    host_name: 'Swaniki Social',
    host_initials: 'SS',
    host_rating: '4.9',
    host_vibes_count: 12,
    formatted_date: 'SAT, 17 OCT',
    formatted_time: '11:00 AM',
    formatted_date_time_venue: 'SAT, 17 OCT · 11:00 AM · The Studio, Mumbai',
    location_name: 'The Studio, Mumbai',
    city: 'Mumbai',
    description:
      'A small, easy-going gathering. Come solo or bring a friend — the host will share final details in chat.',
    going_count: 4,
    capacity: 12,
    spots_left: 8,
    likes_count: 9,
    comments_count: 4,
    cover_image_url:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'vibe-sameera-2',
    slug: 'sameera-bharadwaj-live',
    title: 'Sameera Bharadwaj, live',
    category: 'MUSIC',
    badge: 'Selling fast',
    host_name: 'Swaniki Social',
    host_initials: 'SS',
    host_rating: '4.9',
    host_vibes_count: 12,
    formatted_date: 'THU, 15 OCT',
    formatted_time: '7:00 PM',
    formatted_date_time_venue: 'THU, 15 OCT · 7:00 PM · Live Venue, Mumbai',
    location_name: 'Live Venue, Mumbai',
    city: 'Mumbai',
    description:
      'An intimate live rooftop session under the Mumbai sunset sky. Unfiltered acoustic melodies and good conversations.',
    going_count: 2,
    capacity: 12,
    spots_left: 10,
    likes_count: 24,
    comments_count: 6,
    cover_image_url:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'vibe-cricket-3',
    slug: 'box-cricket-bandra-turf',
    title: 'Box Cricket Match at Bandra Turf',
    category: 'SPORTS',
    badge: 'Community pick',
    host_name: 'Bandra Strikers',
    host_initials: 'BS',
    host_rating: '4.8',
    host_vibes_count: 9,
    formatted_date: 'SUN, 18 OCT',
    formatted_time: '7:00 PM',
    formatted_date_time_venue: 'SUN, 18 OCT · 7:00 PM · Bandra Turf, Mumbai',
    location_name: 'Bandra Turf, Mumbai',
    city: 'Mumbai',
    description:
      'Friendly underarm turf match under lights. All gear provided, fresh chai after the final over.',
    going_count: 8,
    capacity: 14,
    spots_left: 6,
    likes_count: 18,
    comments_count: 5,
    cover_image_url:
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'vibe-founders-4',
    slug: 'ai-founders-indie-hackers',
    title: 'AI Founders & Indie Hackers Meetup',
    category: 'TECHNOLOGY',
    badge: 'Filling fast',
    host_name: 'Vibe Tech Guild',
    host_initials: 'VT',
    host_rating: '5.0',
    host_vibes_count: 16,
    formatted_date: 'SAT, 24 OCT',
    formatted_time: '5:00 PM',
    formatted_date_time_venue: 'SAT, 24 OCT · 5:00 PM · Subko Specialty Coffee, Bandra',
    location_name: 'Subko Specialty Coffee, Bandra',
    city: 'Mumbai',
    description:
      'Casual lightning demos, shipping war stories, and pour-over coffee with fellow indie builders in Bombay.',
    going_count: 6,
    capacity: 10,
    spots_left: 4,
    likes_count: 31,
    comments_count: 8,
    cover_image_url:
      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80',
  },
];

const ACTIVITY_FILTERS = [
  { id: 'all', label: 'All vibes' },
  { id: 'tech', label: 'Technology', match: ['technology', 'founders', 'code', 'ai', 'cyber', 'tech'] },
  { id: 'music', label: 'Live Music', match: ['music', 'acoustic', 'concert', 'live', 'jam'] },
  { id: 'sports', label: 'Sports & Turf', match: ['sports', 'cricket', 'padel', 'football', 'turf', 'badminton'] },
  { id: 'social', label: 'Social & Cafes', match: ['coffee', 'chai', 'social', 'cafe', 'milan', 'samaroh', 'meetup'] },
];

function VibesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetSlug = searchParams.get('event') || searchParams.get('id');

  const [activeCity, setActiveCity] = useState<string>('Mumbai');
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Modals
  const [connectHostOpen, setConnectHostOpen] = useState(false);
  const [quickJoinOpen, setQuickJoinOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Likes & interaction states
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likesCountMap, setLikesCountMap] = useState<Record<string, number>>({});
  
  // Real vibes from local/remote store - lazily initialized from store cache
  const [storeEvents, setStoreEvents] = useState<EventItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return getFlashVibeEvents().filter((e) => !isEventExpired(e));
      } catch {
        return [];
      }
    }
    return [];
  });

  const [allRsvps, setAllRsvps] = useState<RSVPItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return getRSVPs();
      } catch {
        return [];
      }
    }
    return [];
  });

  const filterDropdownRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number>(0);

  // Sync city from user location
  useEffect(() => {
    const c = getUserCity();
    if (c && c !== 'All India' && c !== 'all') {
      setActiveCity(c);
    }
  }, []);

  // Load and continuously sync live vibes from store/Supabase
  useEffect(() => {
    const loadStoreVibes = () => {
      const live = getFlashVibeEvents().filter((e) => !isEventExpired(e));
      setStoreEvents(live);
      setAllRsvps(getRSVPs());
    };
    loadStoreVibes();
    syncEventsWithSupabase().then(() => loadStoreVibes()).catch(() => {});
    const unsub = subscribeToStore(loadStoreVibes);
    return () => unsub();
  }, []);

  // Map real store events into VibeInstantItem format
  const convertedStoreVibes = useMemo<VibeInstantItem[]>(() => {
    return storeEvents.map((e, idx) => {
      const confirmedRsvps = allRsvps.filter(
        (r) => (r.event_id === e.id || r.event_slug === e.slug) && r.status === 'confirmed'
      ).length;
      const going = Math.max(confirmedRsvps, e.spots_filled || (e.theme as any)?.spots_filled || 1);
      const capacity = e.spots_limit || (e.theme as any)?.spots_limit || e.capacity || 12;
      const spotsLeft = Math.max(0, capacity - going);

      let dStr = 'TODAY';
      let tStr = 'TIME TBA';
      if (e.start_at) {
        try {
          const d = new Date(e.start_at);
          const now = new Date();
          const yearStr = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '';
          dStr = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase() + yearStr;
          tStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch {}
      }

      // Determine category dynamically from activity, category or title
      const titleLower = (e.title || '').toLowerCase();
      const activityLower = (e.flash_activity || '').toLowerCase();
      let cat = 'COMMUNITY';
      if (
        activityLower.includes('cricket') ||
        activityLower.includes('sport') ||
        titleLower.includes('cricket') ||
        titleLower.includes('turf') ||
        titleLower.includes('match') ||
        titleLower.includes('sports')
      ) {
        cat = 'SPORTS';
      } else if (
        activityLower.includes('tech') ||
        activityLower.includes('founder') ||
        activityLower.includes('code') ||
        titleLower.includes('ai') ||
        titleLower.includes('tech') ||
        titleLower.includes('cyber') ||
        titleLower.includes('founders')
      ) {
        cat = 'TECHNOLOGY';
      } else if (
        activityLower.includes('music') ||
        activityLower.includes('acoustic') ||
        titleLower.includes('music') ||
        titleLower.includes('live')
      ) {
        cat = 'MUSIC';
      } else if (
        activityLower.includes('coffee') ||
        activityLower.includes('chai') ||
        titleLower.includes('coffee') ||
        titleLower.includes('milan') ||
        titleLower.includes('samaroh') ||
        titleLower.includes('cafe')
      ) {
        cat = 'SOCIAL';
      } else if (e.category) {
        cat = e.category.toUpperCase();
      }

      // Dynamic badges
      let badge = spotsLeft <= 3 ? 'Selling fast' : 'Community pick';
      if (e.source_platform === 'whatsapp') {
        badge = 'WhatsApp Instant Vibe';
      } else if (e.source_platform === 'telegram') {
        badge = 'Telegram Instant Vibe';
      }

      const hostName =
        e.organizer_name ||
        (e as any).profiles?.name ||
        (e.source_platform ? `${e.source_platform.toUpperCase()} Host` : 'Vibe Host');

      const initials =
        hostName
          .split(' ')
          .map((p: string) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'VH';

      const venue = (e.location_name || '').trim();
      const city = (e.city || '').trim();
      let venueDisplay = 'Venue TBA';
      if (venue && city && !venue.toLowerCase().includes(city.toLowerCase())) {
        venueDisplay = `${venue} · ${city}`;
      } else if (venue) {
        venueDisplay = venue;
      } else if (city) {
        venueDisplay = city;
      }

      // Pick contextual cover image based on activity if image is missing
      let coverImg = e.cover_image_url;
      if (!coverImg) {
        if (cat === 'SPORTS') {
          coverImg = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80';
        } else if (cat === 'TECHNOLOGY') {
          coverImg = 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80';
        } else if (cat === 'MUSIC') {
          coverImg = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80';
        } else {
          coverImg = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80';
        }
      }

      const commentsCount = typeof window !== 'undefined' ? getComments(e.id).length : 0;

      return {
        id: e.id,
        slug: e.slug,
        title: e.title,
        category: cat,
        badge,
        host_name: hostName,
        host_initials: initials,
        host_rating: '4.9',
        host_vibes_count: Math.max(1, 4 + (idx % 8)),
        formatted_date: dStr,
        formatted_time: tStr,
        formatted_date_time_venue: `${dStr} · ${tStr} · ${venueDisplay}`,
        location_name: venue || city || 'Venue TBA',
        city: city || 'Mumbai',
        description:
          e.description ||
          e.tagline ||
          'Spontaneous community gathering organized via Vibe Instant. Come solo or bring a friend.',
        going_count: going,
        capacity,
        spots_left: spotsLeft,
        likes_count: Number(e.vibe_cheers_count || 0),
        comments_count: Math.max(commentsCount, (going > 1 ? going - 1 : 0)),
        cover_image_url: coverImg,
        originalEvent: e,
      };
    });
  }, [storeEvents, allRsvps]);

  // Combine vibes: Strictly prioritize REAL vibes from Supabase/bots!
  // Only fall back to DEFAULT_VIBES_LIST if zero real vibes exist.
  const allVibes = useMemo<VibeInstantItem[]>(() => {
    if (convertedStoreVibes.length > 0) {
      // Prioritize events matching the user's active/detected city first, then by date / newest
      const targetCity = (activeCity || '').toLowerCase().trim();
      const sorted = [...convertedStoreVibes].sort((a, b) => {
        const aCityMatch = Boolean(targetCity && targetCity !== 'all' && a.city.toLowerCase().includes(targetCity));
        const bCityMatch = Boolean(targetCity && targetCity !== 'all' && b.city.toLowerCase().includes(targetCity));
        if (aCityMatch && !bCityMatch) return -1;
        if (!aCityMatch && bCityMatch) return 1;

        const timeA = a.originalEvent?.start_at ? new Date(a.originalEvent.start_at).getTime() : 0;
        const timeB = b.originalEvent?.start_at ? new Date(b.originalEvent.start_at).getTime() : 0;
        return timeA - timeB;
      });
      return sorted;
    }

    return DEFAULT_VIBES_LIST;
  }, [convertedStoreVibes, activeCity]);

  // Filtered vibes
  const filteredVibes = useMemo(() => {
    if (selectedActivity === 'all') return allVibes;
    const filter = ACTIVITY_FILTERS.find((f) => f.id === selectedActivity);
    if (!filter || !filter.match) return allVibes;

    return allVibes.filter((v) => {
      const text = `${v.category} ${v.title} ${v.description}`.toLowerCase();
      return filter.match!.some((m) => text.includes(m));
    });
  }, [allVibes, selectedActivity]);

  const activeVibes = filteredVibes.length > 0 ? filteredVibes : allVibes;

  // Jump to targeted vibe if query param is provided
  useEffect(() => {
    if (!targetSlug) return;
    const idx = activeVibes.findIndex(
      (v) => v.slug.toLowerCase() === targetSlug.toLowerCase() || v.id === targetSlug
    );
    if (idx !== -1) {
      setCurrentIndex(idx);
    }
  }, [targetSlug, activeVibes]);

  // Current active vibe
  const currentVibe = activeVibes[currentIndex] || activeVibes[0] || DEFAULT_VIBES_LIST[0];

  // Up/down navigation
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(activeVibes.length - 1, prev + 1));
  }, [activeVibes.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Mouse wheel navigation
  useEffect(() => {
    let wheeling = false;
    const onWheel = (e: WheelEvent) => {
      if (wheeling) return;
      if (Math.abs(e.deltaY) > 30) {
        wheeling = true;
        if (e.deltaY > 0) handleNext();
        else handlePrev();
        setTimeout(() => {
          wheeling = false;
        }, 380);
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [handleNext, handlePrev]);

  // Touch Swipe for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
  };

  // Close filter dropdown on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Likes handling
  const vibeKey = currentVibe.id || currentVibe.slug;
  const hasLiked = likedMap[vibeKey] ?? (typeof window !== 'undefined' ? isFlashVibeLiked(vibeKey, currentVibe.slug) : false);
  const likeCount = (likesCountMap[vibeKey] ?? currentVibe.likes_count) + (hasLiked ? 1 : 0);

  const handleLike = () => {
    const next = !hasLiked;
    setLikedMap((prev) => ({ ...prev, [vibeKey]: next }));
    toggleFlashVibeLike(vibeKey, currentVibe.slug);
    if (next) {
      confetti({
        particleCount: 28,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#FF5500', '#FF8C42', '#FFA07A'],
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/vibes?event=${currentVibe.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentVibe.title,
          text: `Check out "${currentVibe.title}" on Vibe Instant`,
          url: shareUrl,
        });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(shareUrl);
    alert('Vibe link copied to clipboard!');
  };

  // Build temporary EventItem for Modals if originalEvent is not set
  const modalEvent: EventItem = useMemo(() => {
    if (currentVibe.originalEvent) return currentVibe.originalEvent;
    return {
      id: currentVibe.id,
      slug: currentVibe.slug,
      title: currentVibe.title,
      description: currentVibe.description,
      organizer_id: 'org-1',
      organizer_name: currentVibe.host_name,
      cover_image_url: currentVibe.cover_image_url,
      city: currentVibe.city,
      location_name: currentVibe.location_name,
      start_at: new Date().toISOString(),
      capacity: currentVibe.capacity,
      spots_limit: currentVibe.capacity,
      spots_filled: currentVibe.going_count,
    } as EventItem;
  }, [currentVibe]);

  const selectedFilterLabel = ACTIVITY_FILTERS.find((f) => f.id === selectedActivity)?.label || 'All vibes';

  // Story bars count
  const storyCount = Math.min(6, Math.max(3, activeVibes.length));
  const activeStoryIndex = currentIndex % storyCount;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="h-[100dvh] w-full bg-[#08080A] text-white relative overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Ambient Radial Glow in background (like in Screenshot 1) */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute left-1/4 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF5500]/10 rounded-full blur-[140px]" />
      </div>

      {/* ========================================================= */}
      {/* 1. UNIVERSAL TOP BAR (DESKTOP & MOBILE)                   */}
      {/* ========================================================= */}
      <header className="w-full max-w-6xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between z-30 shrink-0">
        {/* Left: Back Arrow + Vibe INSTANT */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            title="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-1 font-sans">
            <Zap className="w-4 h-4 text-[#FF5500] fill-[#FF5500]" />
            <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">Vibe</span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#FF5500] text-white px-2 py-0.5 rounded-md ml-0.5">
              INSTANT
            </span>
          </div>
        </div>

        {/* Right: Location Badge + Filter Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Near Mumbai (Desktop pill) */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-neutral-300">
            <MapPin className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Near {activeCity || 'Mumbai'}</span>
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 text-[#FF5500]" />
              <span className="max-w-[90px] sm:max-w-none truncate">{selectedFilterLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#141416] border border-white/15 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                {ACTIVITY_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedActivity(f.id);
                      setFilterOpen(false);
                      setCurrentIndex(0);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                      selectedActivity === f.id
                        ? 'bg-[#FF5500]/20 text-[#FF5500] font-bold'
                        : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{f.label}</span>
                    {selectedActivity === f.id && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. DESKTOP VIEW (SPLIT-SCREEN CARD - SCREENSHOT 1)        */}
      {/* ========================================================= */}
      <main className="hidden md:flex flex-1 items-center justify-center w-full px-4 pb-4">
        <div className="flex items-center justify-center gap-5 lg:gap-7 max-w-6xl w-full">
          {/* Left Card: Vertical Reel Frame */}
          <div className="relative w-[360px] lg:w-[400px] h-[560px] lg:h-[620px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-neutral-900 shrink-0">
            {/* Story Progress Indicators Top */}
            <div className="absolute top-3 left-4 right-4 z-20 flex gap-1.5">
              {Array.from({ length: storyCount }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i === activeStoryIndex ? 'bg-[#FF5500]' : i < activeStoryIndex ? 'bg-white/70' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Badge: Community pick */}
            <div className="absolute top-7 left-4 z-20">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-black/50 backdrop-blur-md text-white/90 border border-white/10 shadow-sm">
                {currentVibe.badge || 'Community pick'}
              </span>
            </div>

            {/* Visual Media */}
            <div className="absolute inset-0 z-0">
              <Image
                src={currentVibe.cover_image_url}
                alt={currentVibe.title}
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
            </div>

            {/* Floating Action Stack (Right Edge) */}
            <div className="absolute right-3.5 bottom-5 z-20 flex flex-col items-center gap-3.5">
              {/* Flame */}
              <button onClick={handleLike} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    hasLiked
                      ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.5)]'
                      : 'bg-black/50 backdrop-blur-md border border-white/15 text-white/90 hover:bg-black/70'
                  }`}
                >
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <span className="text-xs font-bold text-white shadow-sm">{likeCount}</span>
              </button>

              {/* Chat / Comments */}
              <button onClick={() => setConnectHostOpen(true)} className="flex flex-col items-center gap-1 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/90 hover:bg-black/70 flex items-center justify-center transition-all">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-white shadow-sm">{currentVibe.comments_count}</span>
              </button>

              {/* Share */}
              <button onClick={handleShare} className="flex flex-col items-center gap-1 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/90 hover:bg-black/70 flex items-center justify-center transition-all">
                  <Share2 className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-semibold text-white/80 shadow-sm">Share</span>
              </button>
            </div>
          </div>

          {/* Center Floating Navigation Chevrons */}
          <div className="flex flex-col gap-2 z-20 shrink-0">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`w-9 h-9 rounded-full border flex items-center justify-center backdrop-blur-md transition-all ${
                currentIndex === 0
                  ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-[#FF5500] border-white/15 hover:border-[#FF5500] text-white shadow-lg cursor-pointer hover:scale-105'
              }`}
              title="Previous vibe (Up Arrow)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= activeVibes.length - 1}
              className={`w-9 h-9 rounded-full border flex items-center justify-center backdrop-blur-md transition-all ${
                currentIndex >= activeVibes.length - 1
                  ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-[#FF5500] border-white/15 hover:border-[#FF5500] text-white shadow-lg cursor-pointer hover:scale-105'
              }`}
              title="Next vibe (Down Arrow)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Right Card: Details & Actions */}
          <div className="w-[380px] lg:w-[420px] rounded-3xl bg-[#141416]/90 backdrop-blur-xl border border-white/10 p-6 sm:p-7 shadow-2xl flex flex-col justify-between shrink-0 space-y-4">
            {/* Host Identity */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#3D251A] text-[#FF8542] border border-white/10 flex items-center justify-center font-bold text-sm shrink-0">
                {currentVibe.host_initials}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{currentVibe.host_name}</h4>
                <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                  <span className="text-amber-400">★</span>
                  <span>{currentVibe.host_rating} · {currentVibe.host_vibes_count} vibes hosted</span>
                </p>
              </div>
            </div>

            {/* Category Tag & Headline */}
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-[#FF5500] uppercase">
                {currentVibe.category}
              </span>
              <h2 className="text-2xl lg:text-[26px] font-black tracking-tight text-white mt-1 leading-tight">
                {currentVibe.title}
              </h2>
            </div>

            {/* Specs */}
            <div className="space-y-2 text-xs font-medium text-neutral-300">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>{currentVibe.formatted_date}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>{currentVibe.formatted_time}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>{currentVibe.location_name}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {currentVibe.description}
            </p>

            {/* Spots Capacity Bar */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{currentVibe.going_count}/{currentVibe.capacity} going</span>
                </span>
                <span className="font-bold text-[#FF5500] flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-[#FF5500]" />
                  <span>{currentVibe.spots_left} spots left</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF5500] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentVibe.going_count / currentVibe.capacity) * 100)}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setConnectHostOpen(true)}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer hover:border-white/20"
              >
                <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
                <span>Ask host</span>
              </button>

              <button
                onClick={() => setQuickJoinOpen(true)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-xs font-bold text-white transition-all shadow-[0_0_20px_rgba(255,85,0,0.35)] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-98"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>I'm in</span>
              </button>
            </div>

            {/* Keyboard Hint */}
            <p className="text-[11px] text-neutral-500 font-medium text-center">
              Use ↑ ↓ to browse vibes
            </p>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* 3. MOBILE VIEW (FULL-BLEED IMMERSIVE - SCREENSHOT 2)      */}
      {/* ========================================================= */}
      <main className="flex md:hidden flex-1 relative w-full h-full overflow-hidden">
        {/* Story Progress Indicators Top */}
        <div className="absolute top-2 left-4 right-4 z-20 flex gap-1.5">
          {Array.from({ length: storyCount }).map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                i === activeStoryIndex ? 'bg-[#FF5500]' : i < activeStoryIndex ? 'bg-white/70' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Top Left Badge */}
        <div className="absolute top-5 left-4 z-20">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/15">
            {currentVibe.badge || 'Selling fast'}
          </span>
        </div>

        {/* Full Screen Visual */}
        <div className="absolute inset-0 z-0">
          <Image
            src={currentVibe.cover_image_url}
            alt={currentVibe.title}
            fill
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/50" />
        </div>

        {/* Floating Action Stack (Right side) */}
        <div className="absolute right-4 bottom-32 z-20 flex flex-col items-center gap-3.5">
          {/* Flame */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1 cursor-pointer">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                hasLiked ? 'bg-[#FF5500] text-white shadow-lg' : 'bg-black/50 backdrop-blur-md border border-white/15 text-white'
              }`}
            >
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[11px] font-bold text-white">{likeCount}</span>
          </button>

          {/* Comments */}
          <button onClick={() => setConnectHostOpen(true)} className="flex flex-col items-center gap-1 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold text-white">{currentVibe.comments_count}</span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex flex-col items-center gap-1 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white flex items-center justify-center">
              <Share2 className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-semibold text-white">Share</span>
          </button>
        </div>

        {/* Bottom Overlay Card */}
        <div className="relative z-20 px-4 pb-5 pt-8 space-y-3 mt-auto w-full">
          <div>
            <p className="text-xs text-neutral-400 font-medium">
              Hosted by {currentVibe.host_name}
            </p>
            <h3 className="text-xl font-black text-white leading-snug mt-0.5">
              {currentVibe.title}
            </h3>
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mt-1">
              {currentVibe.formatted_date_time_venue}
            </p>
          </div>

          {/* Spots Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                <span>{currentVibe.going_count}/{currentVibe.capacity} going</span>
              </span>
              <span className="font-bold text-[#FF5500] flex items-center gap-1">
                <Zap className="w-3 h-3 fill-[#FF5500]" />
                <span>{currentVibe.spots_left} spots left</span>
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF5500] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (currentVibe.going_count / currentVibe.capacity) * 100)}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={() => setConnectHostOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-black/60 hover:bg-black/80 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-1.5 backdrop-blur-md"
            >
              <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
              <span>Ask host</span>
            </button>

            <button
              onClick={() => setQuickJoinOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>I'm in</span>
            </button>
          </div>
        </div>
      </main>

      {/* Connect Host Modal */}
      <ConnectHostModal
        event={modalEvent}
        isOpen={connectHostOpen}
        onClose={() => setConnectHostOpen(false)}
      />

      {/* Quick Join Modal */}
      <QuickJoinModal
        event={modalEvent}
        isOpen={quickJoinOpen}
        onClose={() => setQuickJoinOpen(false)}
        onSuccess={() => {
          setQuickJoinOpen(false);
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        }}
      />

      {/* Create Vibe Modal */}
      <CreateVibeModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(slug) => {
          setCreateModalOpen(false);
          router.push(`/vibes?event=${slug}`);
        }}
      />
    </div>
  );
}

export default function VibesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center text-white">
          <RefreshCw className="w-8 h-8 animate-spin text-[#FF5500] mb-3" />
          <p className="text-xs font-bold text-white/60 tracking-wider uppercase">Loading Vibe Stream...</p>
        </div>
      }
    >
      <VibesContent />
    </Suspense>
  );
}
