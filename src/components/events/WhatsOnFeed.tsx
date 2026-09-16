'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Calendar,
  X,
  RotateCcw,
  Navigation,
  ArrowDown
} from 'lucide-react';
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

// Quick Date Filters matching user reference
export const DATE_FILTERS = ['All', 'Today', 'Tomorrow', 'Weekend', 'This Week'] as const;
export type DateFilterType = (typeof DATE_FILTERS)[number];

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
  const dateParam = (searchParams.get('date') as DateFilterType) || 'All';
  const categoryParam = (searchParams.get('category') as CategoryFilterType) || 'All';

  const [events, setEvents] = useState<EventItem[]>([]);
  const [userCity, setUserCity] = useState<string>('All India');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(9);

  // Active filters state
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [dateFilter, setDateFilter] = useState<DateFilterType>(
    DATE_FILTERS.includes(dateParam) ? dateParam : 'All'
  );
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
        if (parsed.dateFilter && DATE_FILTERS.includes(parsed.dateFilter) && !dateParam) {
          setDateFilter(parsed.dateFilter);
        }
      }
    } catch {
      // ignore
    }
  }, [categoryParam, dateParam]);

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
          dateFilter,
        })
      );
    } catch {
      // ignore
    }
  }, [selectedMoods, distanceFilter, categoryFilter, dateFilter, mounted]);

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
    setDateFilter('All');
    setCategoryFilter('All');
    setDistanceFilter('Off');
    setSearchQuery('');
    try {
      localStorage.removeItem('vibe_filter_prefs');
    } catch {
      // ignore
    }
  };

  // Filter Logic
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

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

        // 2. Date filter
        if (dateFilter !== 'All') {
          const eDate = e.start_at ? new Date(e.start_at) : null;
          if (!eDate || isNaN(eDate.getTime())) return false;

          const eDateStr = eDate.toISOString().split('T')[0];

          if (dateFilter === 'Today') {
            if (eDateStr !== todayStr) return false;
          } else if (dateFilter === 'Tomorrow') {
            if (eDateStr !== tomorrowStr) return false;
          } else if (dateFilter === 'Weekend') {
            const day = eDate.getDay();
            if (day !== 0 && day !== 6) return false;
          } else if (dateFilter === 'This Week') {
            const diffDays = (eDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays < 0 || diffDays > 7) return false;
          }
        }

        // 3. Category filter
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

        // 4. Distance filter
        if (distanceFilter !== 'Off') {
          const maxKm = distanceFilter === '2 km' ? 2 : distanceFilter === '5 km' ? 5 : 10;
          if (typeof e.distanceKm === 'number') {
            if (e.distanceKm > maxKm) return false;
          }
        }

        // 5. Mood / Tag multi-select filter
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
  }, [eventsWithDistance, searchQuery, dateFilter, categoryFilter, distanceFilter, selectedMoods]);

  const displayedEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div className="w-full space-y-8">
      {/* Top Date Filter Strip (Matching user reference) */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 border-b border-[#E2E8F0] bg-white flex items-center justify-center sm:justify-start gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
        {DATE_FILTERS.map((df) => {
          const active = dateFilter === df;
          return (
            <button
              key={df}
              onClick={() => setDateFilter(df)}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              {df}
            </button>
          );
        })}
      </div>

      {/* Main Section Header */}
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0F172A]">
          What's On
        </h1>
        <p className="text-sm sm:text-base text-[#64748B]">
          Curated local and virtual events, AI-verified and ready to explore.
        </p>
      </div>

      {/* Global Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search events, venues, cities..."
          className="w-full pl-11 pr-10 py-3.5 bg-white border border-[#E2E8F0] rounded-full text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0F172A] shadow-xs transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
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

      {/* Distance Filter Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
          <Navigation className="w-3 h-3 rotate-45" />
          <span>DISTANCE</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {DISTANCE_OPTIONS.map((dist) => {
            const active = distanceFilter === dist;
            return (
              <button
                key={dist}
                onClick={() => setDistanceFilter(dist)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${
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

      {/* Mood / Tag System Row */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            MOOD
          </span>
          <button
            onClick={handleResetMyView}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset my view</span>
          </button>
        </div>

        {/* Interactive Multi-Select Tag Pills */}
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

        <p className="text-xs text-[#94A3B8]">
          Your filter choices are saved automatically as your default view.
        </p>
      </div>

      {/* Events Grid (Keeping EventCard UNCHANGED per user instruction) */}
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
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  distanceKm={event.distanceKm}
                />
              ))}
            </div>

            {/* Load More Button */}
            {filteredEvents.length > visibleCount && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4 text-[#E8621A]" />
                  <span>Load More Events</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
