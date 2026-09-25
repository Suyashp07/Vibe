'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  Filter,
  Flame,
  MapPin,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { EventItem } from '@/types';
import { getFlashVibeEvents, subscribeToStore, syncEventsWithSupabase, SAMPLE_FLASH_VIBES } from '@/lib/store';
import { getUserCity } from '@/lib/location';
import VibeReelCard from '@/components/vibes/VibeReelCard';
import CreateVibeModal from '@/components/vibes/CreateVibeModal';

const CITIES = [
  'All Cities',
  'Bhopal',
  'Indore',
  'Satna',
  'Mumbai',
  'Pune',
  'Delhi NCR',
  'Bengaluru',
  'Hyderabad',
  'Goa',
  'Jaipur',
  'Chandigarh',
  'Kolkata',
  'Chennai',
  'Ahmedabad',
  'Lucknow'
];

const ACTIVITY_FILTERS = [
  { id: 'all', label: '⚡ All Vibes' },
  { id: 'sports', label: '🏏 Sports & Turf', match: ['cricket', 'football', 'badminton', 'pickleball'] },
  { id: 'coffee', label: '☕ Chai & Hangouts', match: ['coffee', 'chai', 'cafe', 'sprint'] },
  { id: 'games', label: '🎲 Tabletop & Games', match: ['games', 'chess', 'catan'] },
  { id: 'music', label: '🎸 Jam & Acoustic', match: ['music', 'jam', 'acoustic'] },
];

function matchesCityFilter(event: EventItem, filterCity: string): boolean {
  if (!filterCity || filterCity === 'All Cities' || filterCity === 'All India' || filterCity === 'all') {
    return true;
  }
  const cleanTarget = filterCity.toLowerCase().trim();
  const eventCity = (event.city || '').toLowerCase().trim();
  const eventVenue = (event.location_name || '').toLowerCase().trim();
  const eventAddress = (event.location_address || '').toLowerCase().trim();

  // Common Indian city aliases
  if (cleanTarget.includes('delhi') || cleanTarget.includes('ncr') || cleanTarget.includes('gurgaon') || cleanTarget.includes('noida')) {
    return (
      eventCity.includes('delhi') || eventCity.includes('noida') || eventCity.includes('gurugram') || eventCity.includes('gurgaon') ||
      eventVenue.includes('delhi') || eventAddress.includes('delhi')
    );
  }
  if (cleanTarget.includes('bengaluru') || cleanTarget.includes('bangalore')) {
    return (
      eventCity.includes('bengaluru') || eventCity.includes('bangalore') ||
      eventVenue.includes('bengaluru') || eventVenue.includes('bangalore')
    );
  }
  if (cleanTarget.includes('mumbai') || cleanTarget.includes('bombay')) {
    return Boolean(
      eventCity.includes('mumbai') || eventCity.includes('bombay') || eventCity.includes('bandra') || eventCity.includes('juhu') ||
      eventVenue.includes('mumbai') || eventAddress.includes('mumbai')
    );
  }

  return Boolean(
    (eventCity && (eventCity.includes(cleanTarget) || cleanTarget.includes(eventCity))) ||
    (eventVenue && eventVenue.includes(cleanTarget)) ||
    (eventAddress && eventAddress.includes(cleanTarget))
  );
}

function VibesReelsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetSlug = searchParams.get('event') || searchParams.get('id');

  const [events, setEvents] = useState<EventItem[]>(SAMPLE_FLASH_VIBES);
  const [activeCity, setActiveCity] = useState<string>('All Cities');
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cityDropdownRef = useRef<HTMLDivElement | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Load initial events from store & fetch fresh from Supabase
  useEffect(() => {
    const loadEvents = () => {
      const vibes = getFlashVibeEvents();
      setEvents(vibes);
    };

    loadEvents();
    syncEventsWithSupabase().then(() => loadEvents()).catch(() => {});
    const unsubscribe = subscribeToStore(loadEvents);

    // City sync
    const syncCity = () => {
      const userCity = getUserCity();
      if (!userCity || userCity === 'All India' || userCity === 'all') {
        setActiveCity('All Cities');
      } else {
        setActiveCity(userCity);
      }
    };
    syncCity();
    window.addEventListener('vibe:location_changed', syncCity);

    return () => {
      unsubscribe();
      window.removeEventListener('vibe:location_changed', syncCity);
    };
  }, []);

  // Fetch target event directly if requested in query param and not found yet
  useEffect(() => {
    if (!targetSlug) return;
    setActiveCity('All Cities');
    setSelectedActivity('all');

    const checkAndFetchTarget = async () => {
      try {
        const res = await fetch(`/api/events/by-slug?slug=${encodeURIComponent(targetSlug)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.event) {
            const r = data.event;
            const orgProfile = r.profiles || {};
            const targetEvent: EventItem = {
              id: r.id,
              organizer_id: r.organizer_id || orgProfile.id || 'org-1',
              organizer_name: orgProfile.name || r.organizer_name || 'Host',
              organizer_handle: orgProfile.handle || r.organizer_handle || 'host',
              organizer_logo: orgProfile.logo_url || r.organizer_logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              organizer_brand_color: orgProfile.brand_color || '#E8621A',
              slug: r.slug,
              title: r.title,
              tagline: r.tagline || '',
              description: r.description || '',
              cover_image_url: r.cover_image_url,
              template: r.template || 'ember',
              theme: r.theme || {},
              sections: r.sections || {},
              event_type: r.event_type || 'in-person',
              location_name: r.location_name,
              location_address: r.location_address,
              city: r.city || 'Mumbai',
              start_at: r.start_at,
              end_at: r.end_at,
              timezone: r.timezone || 'Asia/Kolkata',
              capacity: r.capacity || 20,
              is_public: true,
              status: r.status || 'live',
              ai_generated: r.ai_generated || false,
              is_flash: true,
              flash_activity: r.flash_activity || 'other',
              faq: r.faq || [],
              rsvp_form_config: r.rsvp_form_config || { ask_plus_one: true, waitlist_enabled: true },
              created_at: r.created_at,
              updated_at: r.updated_at || r.created_at,
            } as EventItem;

            setEvents((prev) => {
              const filtered = prev.filter((e) => e.slug !== targetEvent.slug && e.id !== targetEvent.id);
              return [targetEvent, ...filtered];
            });
            setCurrentIndex(0);
          }
        }
      } catch (err) {
        console.warn('Failed to load target vibe event:', err);
      }
    };

    checkAndFetchTarget();
  }, [targetSlug]);

  // Filter events by City & Activity
  const filteredEvents = useMemo(() => {
    const filtered = events.filter((e) => {
      // If targetSlug is specified, always keep the target event regardless of city or activity filter
      if (targetSlug && (e.slug?.toLowerCase() === targetSlug.toLowerCase() || e.id === targetSlug)) {
        return true;
      }

      // City filter
      if (!matchesCityFilter(e, activeCity)) {
        return false;
      }

      // Activity filter
      if (selectedActivity !== 'all') {
        const filterDef = ACTIVITY_FILTERS.find((f) => f.id === selectedActivity);
        if (filterDef?.match) {
          const act = (e.flash_activity || '').toLowerCase();
          const title = (e.title || '').toLowerCase();
          const matches = filterDef.match.some(
            (m) => act.includes(m) || title.includes(m)
          );
          if (!matches) return false;
        }
      }

      return true;
    });

    return filtered;
  }, [events, activeCity, selectedActivity, targetSlug]);

  // Scroll to target event if requested in query params
  useEffect(() => {
    if (targetSlug && filteredEvents.length > 0) {
      const idx = filteredEvents.findIndex(
        (e) => e.slug?.toLowerCase() === targetSlug.toLowerCase() || e.id === targetSlug
      );
      if (idx >= 0 && containerRef.current) {
        const container = containerRef.current;
        container.scrollTo({
          top: idx * container.clientHeight,
          behavior: 'smooth',
        });
        setCurrentIndex(idx);
      }
    }
  }, [targetSlug, filteredEvents]);

  // Track scroll position to update current reel index and URL
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== currentIndex && index >= 0 && index < filteredEvents.length) {
      setCurrentIndex(index);
      const cur = filteredEvents[index];
      if (cur?.slug && typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/vibes?event=${cur.slug}`);
      }
    }
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || !containerRef.current) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const threshold = 40;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        scrollToNext();
      } else {
        scrollToPrev();
      }
    }
    touchStartY.current = null;
  };

  // Keyboard navigation (Arrow keys, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      const height = containerRef.current.clientHeight;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        containerRef.current.scrollBy({ top: height, behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        containerRef.current.scrollBy({ top: -height, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close city or category dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToPrev = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        top: -containerRef.current.clientHeight,
        behavior: 'smooth',
      });
    }
  };

  const scrollToNext = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        top: containerRef.current.clientHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#07090E] text-white relative overflow-hidden flex flex-col justify-center items-center select-none">
      {/* Top Floating Glass Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/90 via-black/40 to-transparent px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between pointer-events-auto">
        {/* Left: Brand / Back */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-xl cursor-pointer shadow-md"
            title="Back to Discover Feed"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-1.5">
            <span className="font-display font-black text-base sm:text-lg tracking-tight text-white flex items-center gap-1">
              <Zap className="w-4 h-4 text-[#E8621A] fill-[#E8621A]" />
              <span>VIBE</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#E8621A] text-white font-black tracking-wider uppercase ml-0.5">
                INSTANT
              </span>
            </span>
          </div>
        </div>

        {/* Right: Category Dropdown, City Selector & Post Vibe */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Category Dropdown Filter */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-xs font-bold text-white backdrop-blur-xl transition-all cursor-pointer shadow-md"
              title="Filter by Category"
            >
              <Filter className="w-3.5 h-3.5 text-[#E8621A] shrink-0" />
              <span className="max-w-[70px] sm:max-w-[120px] truncate">
                {ACTIVITY_FILTERS.find((f) => f.id === selectedActivity)?.label || 'All Vibes'}
              </span>
              <ChevronDown className="w-3 h-3 text-white/60 shrink-0" />
            </button>

            {categoryDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 sm:w-52 rounded-2xl bg-[#14171F] border border-white/15 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-1 text-[10px] font-mono uppercase tracking-widest text-white/40 border-b border-white/10 mb-1">
                  Filter Category
                </div>
                {ACTIVITY_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedActivity(f.id);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      selectedActivity === f.id
                        ? 'bg-[#E8621A]/20 text-[#E8621A] font-bold'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{f.label}</span>
                    {selectedActivity === f.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E8621A]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City Dropdown Selector */}
          <div className="relative" ref={cityDropdownRef}>
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-xs font-bold text-white backdrop-blur-xl transition-all cursor-pointer shadow-md"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E8621A] shrink-0" />
              <span className="max-w-[70px] sm:max-w-[100px] truncate">{activeCity}</span>
              <ChevronDown className="w-3 h-3 text-white/60 shrink-0" />
            </button>

            {cityDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-[#14171F] border border-white/15 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setActiveCity(c);
                      setCityDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      activeCity === c
                        ? 'bg-[#E8621A]/20 text-[#E8621A] font-bold'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{c}</span>
                    {activeCity === c && <span className="w-1.5 h-1.5 rounded-full bg-[#E8621A]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create / Post Vibe CTA */}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-[#E8621A]/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Post Vibe</span>
          </button>
        </div>
      </header>

      {/* Center Stage: Clean, Focused Reels Container */}
      <main className="w-full h-full flex justify-center items-center relative">
        {/* Responsive Reels Frame: full bleed on mobile, sleek phone frame on larger screens */}
        <div className="w-full h-full sm:max-w-[460px] sm:h-[100dvh] relative sm:border-x sm:border-white/10 shadow-2xl bg-black overflow-hidden flex flex-col justify-between">
          {filteredEvents.length > 0 ? (
            <div
              ref={containerRef}
              onScroll={handleScroll}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
            >
              {filteredEvents.map((evt, idx) => (
                <div key={evt.id} className="w-full h-full snap-start snap-always relative">
                  <VibeReelCard
                    event={evt}
                    isActive={idx === currentIndex}
                    onPrev={scrollToPrev}
                    onNext={scrollToNext}
                    index={idx}
                    total={filteredEvents.length}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Empty State when filter yields 0 events */
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black/90">
              <div className="w-16 h-16 rounded-full bg-[#E8621A]/20 text-[#E8621A] border border-[#E8621A]/30 flex items-center justify-center mb-4 animate-pulse">
                <Flame className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">
                No Vibes in {activeCity} yet!
              </h3>
              <p className="text-xs text-white/60 max-w-xs mb-6 leading-relaxed">
                Be the trendsetter! Post a pickup game, casual hangout, or sprint in seconds.
              </p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] text-white font-bold text-xs shadow-lg shadow-[#E8621A]/30 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post a Vibe</span>
              </button>
            </div>
          )}
        </div>
      </main>

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
          <RefreshCw className="w-8 h-8 animate-spin text-[#E8621A] mb-3" />
          <p className="text-xs font-bold text-white/60 tracking-wider uppercase">Loading Vibe Stream...</p>
        </div>
      }
    >
      <VibesReelsContent />
    </Suspense>
  );
}
