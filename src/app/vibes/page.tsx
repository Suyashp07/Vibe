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
  MessageCircle,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Zap,
  Plus,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Ticket,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { EventItem, RSVPItem } from '@/types';
import {
  getFlashVibeEvents,
  subscribeToStore,
  syncEventsWithSupabase,
  isEventExpired,
  isFlashVibeLiked,
  toggleFlashVibeLike,
  getRSVPs,
  getComments,
} from '@/lib/store';
import { getUserCity } from '@/lib/location';
import { useAuth, getLocalAuthSession } from '@/lib/auth';
import ConnectHostModal from '@/components/communication/ConnectHostModal';
import QuickJoinModal from '@/components/vibes/QuickJoinModal';
import DigitalPassModal from '@/components/ui/DigitalPassModal';
import CreateVibeModal from '@/components/vibes/CreateVibeModal';
import VibeCommentsModal from '@/components/vibes/VibeCommentsModal';
import VibeDetailsModal from '@/components/vibes/VibeDetailsModal';
import ThemeToggle from '@/components/common/ThemeToggle';
import Navbar from '@/components/common/Navbar';

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
  capacity?: number;
  spots_left?: number;
  has_spots_limit?: boolean;
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
    has_spots_limit: false,
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
    has_spots_limit: false,
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
    has_spots_limit: true,
    likes_count: 18,
    comments_count: 0,
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
    has_spots_limit: false,
    likes_count: 31,
    comments_count: 0,
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
  const [scrollDirection, setScrollDirection] = useState<'next' | 'prev'>('next');

  // Modals
  const [connectHostOpen, setConnectHostOpen] = useState(false);
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

  const { profile, user, isLoggedIn } = useAuth();
  const [passModalRsvp, setPassModalRsvp] = useState<RSVPItem | null>(null);
  const [passModalEvent, setPassModalEvent] = useState<EventItem | null>(null);
  const [quickJoinOpen, setQuickJoinOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsModalVibe, setDetailsModalVibe] = useState<VibeInstantItem | null>(null);

  // Check which vibes the current user has confirmed passes for
  const userEmail = (isLoggedIn && (profile?.email || user?.email) ? (profile?.email || user?.email || '') : '').trim().toLowerCase();

  const userPassMap = useMemo<Record<string, RSVPItem>>(() => {
    const map: Record<string, RSVPItem> = {};
    if (!isLoggedIn || !userEmail) return map;

    allRsvps.forEach((r) => {
      if (r.status === 'confirmed') {
        const matchesUser = Boolean(r.email && r.email.trim().toLowerCase() === userEmail);
        if (matchesUser) {
          if (r.event_id) map[r.event_id] = r;
          if (r.event_slug) map[r.event_slug] = r;
        }
      }
    });
    return map;
  }, [allRsvps, userEmail, isLoggedIn]);

  const openPassModal = useCallback((rsvp: RSVPItem, vibe: VibeInstantItem) => {
    const ev = vibe.originalEvent || ({
      id: vibe.id,
      slug: vibe.slug,
      title: vibe.title,
      description: vibe.description,
      organizer_id: 'org-1',
      organizer_name: vibe.host_name,
      cover_image_url: vibe.cover_image_url,
      city: vibe.city,
      location_name: vibe.location_name,
      start_at: new Date().toISOString(),
      capacity: vibe.capacity,
      spots_limit: vibe.capacity,
      spots_filled: vibe.going_count,
    } as EventItem);

    setPassModalRsvp(rsvp);
    setPassModalEvent(ev);
  }, []);

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
      
      // Spots limit: ONLY enabled when host/user explicitly specified participant/player/slot limit
      const hasSpotsLimit = Boolean(
        e.spots_limit ||
        (e.theme as any)?.spots_limit ||
        ((e.theme as any)?.has_spots_limit === true && e.capacity)
      );
      const capacity = hasSpotsLimit
        ? (e.spots_limit || (e.theme as any)?.spots_limit || e.capacity || 0)
        : 0;
      const spotsLeft = hasSpotsLimit && capacity > 0 ? Math.max(0, capacity - going) : 0;

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

      const commentsCount = typeof window !== 'undefined'
        ? (() => {
            const raw = [
              ...getComments(e.id),
              ...(e.slug && e.slug !== e.id ? getComments(e.slug) : []),
            ];
            const seen = new Set<string>();
            for (const c of raw) {
              const sig = `${(c.author_name || '').trim().toLowerCase()}:::${(c.body || '').trim().toLowerCase()}`;
              seen.add(sig);
            }
            return seen.size;
          })()
        : 0;

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
        capacity: hasSpotsLimit ? capacity : undefined,
        spots_left: hasSpotsLimit ? spotsLeft : undefined,
        has_spots_limit: hasSpotsLimit,
        likes_count: Math.max(
          Number(e.vibe_cheers_count ?? (e.theme as any)?.vibe_cheers_count ?? 0),
          typeof window !== 'undefined'
            ? Number(
                localStorage.getItem(`vibe_like_count_${e.id}`) ||
                  (e.slug ? localStorage.getItem(`vibe_like_count_${e.slug}`) : null) ||
                  0
              )
            : 0
        ),
        comments_count: commentsCount,
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

  // Auto-open QuickJoinModal when returning from Google OAuth or via autoJoin link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const autoJoinParam = searchParams.get('autoJoin') === '1' || searchParams.get('join') === '1';
    let pendingSlug: string | null = null;
    try {
      pendingSlug = sessionStorage.getItem('vibe_pending_join_slug');
    } catch {}

    const slugToJoin = (autoJoinParam && targetSlug) || pendingSlug;
    if (!slugToJoin) return;

    const foundVibe = activeVibes.find(
      (v) => v.slug.toLowerCase() === slugToJoin.toLowerCase() || v.id === slugToJoin
    );
    if (foundVibe) {
      const idx = activeVibes.indexOf(foundVibe);
      if (idx !== -1) setCurrentIndex(idx);
      setSelectedModalVibe(foundVibe);
      setQuickJoinOpen(true);
      try {
        sessionStorage.removeItem('vibe_pending_join_slug');
      } catch {}
    }
  }, [searchParams, targetSlug, activeVibes]);

  // Current active vibe
  const currentVibe = activeVibes[currentIndex] || activeVibes[0] || DEFAULT_VIBES_LIST[0];

  // State for tactile overscroll bounce on boundaries
  const [overscrollOffset, setOverscrollOffset] = useState<number>(0);
  const overscrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Desktop Drag Gesture State (Mouse & Pointer Drag across entire card interface)
  const [desktopDragOffset, setDesktopDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDesktopDragging = useRef(false);
  const desktopDragStart = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const [desktopFlamePop, setDesktopFlamePop] = useState(false);

  const triggerBoundaryBounce = useCallback((direction: 'top' | 'bottom') => {
    if (overscrollTimerRef.current) clearTimeout(overscrollTimerRef.current);
    setOverscrollOffset(direction === 'top' ? 14 : -14);
    overscrollTimerRef.current = setTimeout(() => {
      setOverscrollOffset(0);
    }, 220);
  }, []);

  // Up/down navigation with directional tracking
  const handlePrev = useCallback(() => {
    setScrollDirection('prev');
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setScrollDirection('next');
    setCurrentIndex((prev) => Math.min(activeVibes.length - 1, prev + 1));
  }, [activeVibes.length]);

  // Pointer drag gestures for desktop website view
  const handleDesktopPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, [role="button"], .no-drag')) return;

    isDesktopDragging.current = true;
    desktopDragStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }, []);

  const handleDesktopPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDesktopDragging.current) return;
    const dx = e.clientX - desktopDragStart.current.x;
    const dy = e.clientY - desktopDragStart.current.y;
    // Real-time elastic translation
    setDesktopDragOffset({ x: dx * 0.35, y: dy * 0.4 });
  }, []);

  const handleDesktopPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDesktopDragging.current) return;
    isDesktopDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const dx = e.clientX - desktopDragStart.current.x;
    const dy = e.clientY - desktopDragStart.current.y;
    const dt = Math.max(1, Date.now() - desktopDragStart.current.time);
    setDesktopDragOffset({ x: 0, y: 0 });

    const velocityY = Math.abs(dy) / dt;
    const velocityX = Math.abs(dx) / dt;

    if (Math.abs(dy) >= Math.abs(dx)) {
      // Vertical gesture: drag up -> next, drag down -> prev
      const isUp = dy < 0;
      const threshold = 38;
      const isFlick = velocityY > 0.3 && Math.abs(dy) > 16;

      if (Math.abs(dy) > threshold || isFlick) {
        if (isUp) {
          if (currentIndex < activeVibes.length - 1) {
            handleNext();
          } else {
            triggerBoundaryBounce('bottom');
          }
        } else {
          if (currentIndex > 0) {
            handlePrev();
          } else {
            triggerBoundaryBounce('top');
          }
        }
      }
    } else {
      // Horizontal gesture: swipe left -> next, swipe right -> prev
      const isLeft = dx < 0;
      const threshold = 45;
      const isFlick = velocityX > 0.3 && Math.abs(dx) > 18;

      if (Math.abs(dx) > threshold || isFlick) {
        if (isLeft) {
          if (currentIndex < activeVibes.length - 1) {
            handleNext();
          } else {
            triggerBoundaryBounce('bottom');
          }
        } else {
          if (currentIndex > 0) {
            handlePrev();
          } else {
            triggerBoundaryBounce('top');
          }
        }
      }
    }
  }, [currentIndex, activeVibes.length, handleNext, handlePrev, triggerBoundaryBounce]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          handlePrev();
        } else {
          triggerBoundaryBounce('top');
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < activeVibes.length - 1) {
          handleNext();
        } else {
          triggerBoundaryBounce('bottom');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, activeVibes.length, handlePrev, handleNext, triggerBoundaryBounce]);

  // High-precision trackpad & mouse wheel momentum-absorbing navigation (strictly 1 event per scroll)
  useEffect(() => {
    let accumulatedDelta = 0;
    let isTransitioning = false;
    let unlockTimer: NodeJS.Timeout | null = null;
    let silenceTimer: NodeJS.Timeout | null = null;
    let lastWheelTimestamp = 0;

    const onWheel = (e: WheelEvent) => {
      // Don't intercept if scrolling inside a modal, dropdown, input, comments or details pane
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          '[role="dialog"], .comments-modal, input, textarea, select, .no-vibe-scroll'
        )
      ) {
        return;
      }

      const now = Date.now();
      // Handle both vertical and horizontal trackpad gestures
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      // Always reset silence timer on every wheel event.
      // A trackpad gesture is only considered finished when no wheel events occur for 180ms.
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        isTransitioning = false;
        accumulatedDelta = 0;
      }, 180);

      // If we are currently transitioning from a previous scroll trigger,
      // completely absorb all remaining momentum / inertia events from the same swipe.
      if (isTransitioning) {
        lastWheelTimestamp = now;
        return;
      }

      // Reset accumulated movement if user paused (> 100ms) or reversed direction
      if (
        now - lastWheelTimestamp > 100 ||
        (accumulatedDelta > 0 && delta < 0) ||
        (accumulatedDelta < 0 && delta > 0)
      ) {
        accumulatedDelta = 0;
      }
      lastWheelTimestamp = now;
      accumulatedDelta += delta;

      // Threshold: 60px for trackpad, 40px for discrete mouse wheel notch
      const isDiscreteMouse = e.deltaMode !== 0 || Math.abs(delta) >= 80;
      const threshold = isDiscreteMouse ? 40 : 60;

      if (Math.abs(accumulatedDelta) >= threshold) {
        const isNext = accumulatedDelta > 0;
        accumulatedDelta = 0;

        // Immediately lock until the current swipe gesture fully dies out
        isTransitioning = true;

        // Minimum animation cooldown of 500ms
        if (unlockTimer) clearTimeout(unlockTimer);
        unlockTimer = setTimeout(() => {
          if (Date.now() - lastWheelTimestamp >= 120) {
            isTransitioning = false;
          }
        }, 500);

        // Boundary checks
        if (isNext && currentIndex >= activeVibes.length - 1) {
          triggerBoundaryBounce('bottom');
          return;
        }

        if (!isNext && currentIndex <= 0) {
          triggerBoundaryBounce('top');
          return;
        }

        // Trigger single vibe transition
        if (isNext) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      if (unlockTimer) clearTimeout(unlockTimer);
      if (silenceTimer) clearTimeout(silenceTimer);
      if (overscrollTimerRef.current) clearTimeout(overscrollTimerRef.current);
    };
  }, [currentIndex, activeVibes.length, handleNext, handlePrev, triggerBoundaryBounce]);

  // Lock document & body to prevent outer page rubber-banding / scrolling on mobile
  useEffect(() => {
    // Prevent document background scrolling only while inside vibes reel view
    document.documentElement.classList.add('vibe-screen-active');
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.classList.remove('vibe-screen-active');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('height');
      document.documentElement.style.removeProperty('position');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('height');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('padding-bottom');
      document.body.style.removeProperty('overscroll-behavior');
    };
  }, []);

  // Mobile Feed Scroll Ref & programmatic tracking
  const mobileFeedRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const userScrolledMobile = useRef(false);
  const isUserTouching = useRef(false);
  const scrollSettleTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync mobile scroll position ONLY when currentIndex changes from external triggers
  // (e.g. desktop next/prev buttons, keyboard arrows, or query params).
  // If the user is touching or actively scrolling on mobile, NEVER fight their finger with scrollTo!
  useEffect(() => {
    if (userScrolledMobile.current) {
      userScrolledMobile.current = false;
      return;
    }
    if (isUserTouching.current) return;
    if (!mobileFeedRef.current) return;

    const container = mobileFeedRef.current;
    const height = container.clientHeight;
    if (!height) return;
    const targetTop = currentIndex * height;
    if (Math.abs(container.scrollTop - targetTop) > 10) {
      isProgrammaticScroll.current = true;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
      const timer = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  // Use IntersectionObserver on mobile cards for smooth, jitter-free active index tracking
  useEffect(() => {
    const container = mobileFeedRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('.vibe-reel-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indexStr = entry.target.getAttribute('data-index');
            if (indexStr !== null) {
              const idx = parseInt(indexStr, 10);
              if (!isNaN(idx) && idx !== currentIndex) {
                userScrolledMobile.current = true;
                setCurrentIndex(idx);
              }
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.55,
      }
    );

    cards.forEach((c) => observer.observe(c));

    return () => {
      observer.disconnect();
    };
  }, [activeVibes.length, currentIndex]);

  // Fallback scroll handler that only syncs after scrolling settles (debounced to avoid fighting)
  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll.current) return;
    const container = e.currentTarget;
    if (scrollSettleTimeout.current) clearTimeout(scrollSettleTimeout.current);
    scrollSettleTimeout.current = setTimeout(() => {
      if (isProgrammaticScroll.current) return;
      const height = container.clientHeight;
      if (!height) return;
      const newIndex = Math.round(container.scrollTop / height);
      if (newIndex >= 0 && newIndex < activeVibes.length && newIndex !== currentIndex) {
        userScrolledMobile.current = true;
        setCurrentIndex(newIndex);
      }
    }, 60);
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

  // Modal targeted vibe state
  const [selectedModalVibe, setSelectedModalVibe] = useState<VibeInstantItem | null>(null);
  const activeTargetVibe = selectedModalVibe || currentVibe;

  // Toast notification for clipboard share & actions
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // Authoritative like data helper (single source of truth)
  const getVibeLikeData = useCallback(
    (vibe: VibeInstantItem) => {
      const key = vibe.id || vibe.slug;
      const isLiked =
        likedMap[key] !== undefined
          ? likedMap[key]
          : typeof window !== 'undefined'
          ? isFlashVibeLiked(key, vibe.slug)
          : false;

      const storedCount =
        typeof window !== 'undefined'
          ? Number(
              localStorage.getItem(`vibe_like_count_${key}`) ||
                (vibe.slug ? localStorage.getItem(`vibe_like_count_${vibe.slug}`) : null) ||
                0
            )
          : 0;

      const baseCount = Math.max(vibe.likes_count ?? 0, storedCount);
      const count =
        likesCountMap[key] !== undefined
          ? likesCountMap[key]
          : isLiked && baseCount === 0
          ? 1
          : baseCount;

      return { isLiked, count: Math.max(0, count), key };
    },
    [likedMap, likesCountMap]
  );

  const handleLikeVibe = (vibe: VibeInstantItem) => {
    const { isLiked, count, key } = getVibeLikeData(vibe);
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? count + 1 : Math.max(0, count - 1);

    setLikedMap((prev) => ({ ...prev, [key]: nextLiked }));
    setLikesCountMap((prev) => ({ ...prev, [key]: nextCount }));

    if (typeof window !== 'undefined') {
      localStorage.setItem(`vibe_like_count_${key}`, String(nextCount));
      if (vibe.slug) localStorage.setItem(`vibe_like_count_${vibe.slug}`, String(nextCount));
    }

    toggleFlashVibeLike(key, vibe.slug);

    if (nextLiked) {
      try {
        confetti({
          particleCount: 28,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#FF5500', '#FF8C42', '#FFA07A'],
        });
      } catch {}
    }
  };

  const handleLike = () => handleLikeVibe(currentVibe);

  const handleDesktopDoubleClick = useCallback(() => {
    const { isLiked } = getVibeLikeData(currentVibe);
    if (!isLiked) {
      handleLikeVibe(currentVibe);
    }
    setDesktopFlamePop(true);
    setTimeout(() => setDesktopFlamePop(false), 900);
  }, [currentVibe, getVibeLikeData]);

  // Mobile double-tap to like gesture handler
  const [doubleTapVibeId, setDoubleTapVibeId] = useState<string | null>(null);
  const lastTapRef = useRef<{ [key: string]: number }>({});

  const handleMobileCardTap = (vibe: VibeInstantItem, e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select')) return;

    const key = vibe.id || vibe.slug;
    const now = Date.now();
    const last = lastTapRef.current[key] || 0;

    if (now - last < 320) {
      const { isLiked } = getVibeLikeData(vibe);
      if (!isLiked) {
        handleLikeVibe(vibe);
      }
      setDoubleTapVibeId(key);
      setTimeout(() => setDoubleTapVibeId(null), 900);
      lastTapRef.current[key] = 0;
    } else {
      lastTapRef.current[key] = now;
    }
  };

  const handleShareVibe = async (vibe: VibeInstantItem) => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/vibes?event=${vibe.slug}`
        : `https://vibe.swaniki.com/vibes?event=${vibe.slug}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: vibe.title,
          text: `Check out "${vibe.title}" on Vibe Instant`,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard!');
        return;
      }
    } catch {}

    showToast('Event link: ' + shareUrl);
  };

  const handleShare = () => handleShareVibe(currentVibe);

  // Comments Modal state
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedCommentsVibe, setSelectedCommentsVibe] = useState<VibeInstantItem | null>(null);
  const [commentCountsMap, setCommentCountsMap] = useState<Record<string, number>>({});

  const openComments = (vibe?: VibeInstantItem) => {
    setSelectedCommentsVibe(vibe || currentVibe);
    setCommentsModalOpen(true);
  };

  const getVibeCommentsCount = (vibe: VibeInstantItem) => {
    if (!vibe) return 0;
    const key = vibe.id || vibe.slug;
    if (key && commentCountsMap[key] !== undefined) return commentCountsMap[key];
    if (vibe.slug && commentCountsMap[vibe.slug] !== undefined) return commentCountsMap[vibe.slug];
    if (vibe.id && commentCountsMap[vibe.id] !== undefined) return commentCountsMap[vibe.id];
    if (typeof window !== 'undefined') {
      const raw = [
        ...getComments(vibe.id),
        ...(vibe.slug && vibe.slug !== vibe.id ? getComments(vibe.slug) : []),
      ];
      const seen = new Set<string>();
      for (const c of raw) {
        const sig = `${(c.author_name || '').trim().toLowerCase()}:::${(c.body || '').trim().toLowerCase()}`;
        seen.add(sig);
      }
      return seen.size;
    }
    return vibe.comments_count || 0;
  };

  // Fetch real comments count from DB for current vibe so it's always accurate
  useEffect(() => {
    if (!currentVibe) return;
    const targetId = currentVibe.id || currentVibe.slug;
    if (!targetId) return;

    let isMounted = true;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    const lookupId = isUUID ? targetId : (currentVibe.slug || currentVibe.id || '');

    fetch(`/api/events/comments?eventId=${encodeURIComponent(lookupId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        const dbList = Array.isArray(data.comments) ? data.comments : [];
        const rawStore = typeof window !== 'undefined' ? [
          ...getComments(currentVibe.id),
          ...(currentVibe.slug && currentVibe.slug !== currentVibe.id ? getComments(currentVibe.slug) : []),
        ] : [];
        const seen = new Set<string>();
        for (const c of dbList) {
          seen.add(`${(c.user_name || c.author_name || '').trim().toLowerCase()}:::${(c.content || c.body || '').trim().toLowerCase()}`);
        }
        for (const c of rawStore) {
          seen.add(`${(c.author_name || '').trim().toLowerCase()}:::${(c.body || '').trim().toLowerCase()}`);
        }
        const total = seen.size;
        setCommentCountsMap((prev) => ({
          ...prev,
          [targetId]: total,
          ...(currentVibe.id ? { [currentVibe.id]: total } : {}),
          ...(currentVibe.slug ? { [currentVibe.slug]: total } : {}),
        }));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [currentVibe?.id, currentVibe?.slug]);

  const openAskHost = (vibe?: VibeInstantItem) => {
    setSelectedModalVibe(vibe || currentVibe);
    setConnectHostOpen(true);
  };

  const openQuickJoin = (vibe?: VibeInstantItem) => {
    setSelectedModalVibe(vibe || currentVibe);
    setQuickJoinOpen(true);
  };

  const openEventDetails = (vibe?: VibeInstantItem) => {
    setSelectedModalVibe(vibe || currentVibe);
    setDetailsModalVibe(vibe || currentVibe);
    setDetailsModalOpen(true);
  };



  // Build temporary EventItem for Modals if originalEvent is not set
  const modalEvent: EventItem = useMemo(() => {
    if (activeTargetVibe.originalEvent) return activeTargetVibe.originalEvent;
    return {
      id: activeTargetVibe.id,
      slug: activeTargetVibe.slug,
      title: activeTargetVibe.title,
      description: activeTargetVibe.description,
      organizer_id: 'org-1',
      organizer_name: activeTargetVibe.host_name,
      cover_image_url: activeTargetVibe.cover_image_url,
      city: activeTargetVibe.city,
      location_name: activeTargetVibe.location_name,
      start_at: new Date().toISOString(),
      capacity: activeTargetVibe.capacity,
      spots_limit: activeTargetVibe.capacity,
      spots_filled: activeTargetVibe.going_count,
    } as EventItem;
  }, [activeTargetVibe]);

  const selectedFilterLabel = ACTIVITY_FILTERS.find((f) => f.id === selectedActivity)?.label || 'All vibes';

  return (
    <div
      className="vibe-instant-container fixed inset-0 h-[100dvh] w-full bg-[#08080A] text-white overflow-hidden overscroll-none select-none flex flex-col justify-between"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#FF5500]" />
          <span>{toastMessage}</span>
        </div>
      )}

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

        {/* Right: Location Badge + Filter Dropdown + Theme Toggle */}
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

          {/* Theme Toggle Button */}
          <ThemeToggle />
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. DESKTOP VIEW (SPLIT-SCREEN CARD - SCREENSHOT 1)        */}
      {/* ========================================================= */}
      <main
        onPointerDown={handleDesktopPointerDown}
        onPointerMove={handleDesktopPointerMove}
        onPointerUp={handleDesktopPointerUp}
        onPointerCancel={handleDesktopPointerUp}
        className="hidden md:flex flex-1 items-center justify-center w-full px-4 pb-4 select-none cursor-grab active:cursor-grabbing touch-none"
      >
        <motion.div
          animate={{
            y: overscrollOffset + desktopDragOffset.y,
            x: desktopDragOffset.x * 0.45,
            rotate: desktopDragOffset.x * 0.015,
          }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="flex items-center justify-center gap-5 lg:gap-7 max-w-6xl w-full"
        >
          {/* Left Card: Vertical Reel Frame with Mouse/Trackpad Drag Gesture & Double-Click Like */}
          <div
            onDoubleClick={handleDesktopDoubleClick}
            className="vibe-reel-card relative w-[360px] lg:w-[400px] h-[560px] lg:h-[620px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-neutral-900 shrink-0 group select-none cursor-grab active:cursor-grabbing"
          >
            {/* Desktop Double-click animated Flame Pop */}
            {desktopFlamePop && (
              <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center animate-in zoom-in-50 fade-in duration-200">
                <div className="w-20 h-20 rounded-full bg-[#FF5500]/95 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(255,85,0,0.85)] animate-bounce">
                  <Flame className="w-12 h-12 text-white fill-white" />
                </div>
              </div>
            )}

            {/* Badge: Community pick */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-black/50 backdrop-blur-md text-white/90 border border-white/10 shadow-sm">
                {currentVibe.badge || 'Community pick'}
              </span>
            </div>

            {/* Visual Media with Buttery Spring Directional Motion */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={currentVibe.id || currentVibe.slug}
                  initial={{ opacity: 0, y: scrollDirection === 'next' ? 65 : -65, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: scrollDirection === 'next' ? -65 : 65, scale: 0.98 }}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 w-full h-full bg-black overflow-hidden"
                >
                  {/* Ambient Blurred Backdrop (matches mood & colors of host poster) */}
                  <Image
                    src={currentVibe.cover_image_url}
                    alt=""
                    fill
                    unoptimized
                    priority
                    className="object-cover scale-110 blur-2xl opacity-45 brightness-50"
                    aria-hidden="true"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                  {/* Full Uncropped Poster (Preserves 100% of flyer and text without cropping) */}
                  <div className="absolute inset-0 flex items-center justify-center p-3">
                    <div className="relative w-full h-full max-h-[90%] flex items-center justify-center">
                      <Image
                        src={currentVibe.cover_image_url}
                        alt={currentVibe.title}
                        fill
                        unoptimized
                        priority
                        className="object-contain drop-shadow-[0_12px_36px_rgba(0,0,0,0.85)] rounded-2xl"
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Floating Action Stack (Right Edge) - stopPropagation prevents dragging when clicking actions */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-3.5 bottom-5 z-20 flex flex-col items-center gap-3.5"
            >
              {/* Flame */}
              {(() => {
                const { isLiked: desktopLiked, count: desktopLikesCount } = getVibeLikeData(currentVibe);
                return (
                  <button
                    type="button"
                    onClick={handleLike}
                    className="flex flex-col items-center gap-1 cursor-pointer group/flame"
                    aria-label="Like vibe"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        desktopLiked
                          ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.5)]'
                          : 'bg-black/50 backdrop-blur-md border border-white/15 text-white/90 hover:bg-black/70'
                      }`}
                    >
                      <Flame className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-xs font-bold text-white shadow-sm">{desktopLikesCount}</span>
                  </button>
                );
              })()}

              {/* Chat / Comments */}
              <button
                type="button"
                onClick={() => openComments(currentVibe)}
                className="flex flex-col items-center gap-1 cursor-pointer group/chat"
                title="View & post comments"
              >
                <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/90 group-hover/chat:text-white group-hover/chat:bg-[#FF5500]/20 group-hover/chat:border-[#FF5500]/40 flex items-center justify-center transition-all group-hover/chat:scale-105 active:scale-95 shadow-md">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-white shadow-sm">{getVibeCommentsCount(currentVibe)}</span>
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                className="flex flex-col items-center gap-1 cursor-pointer group/share"
                title="Share vibe"
              >
                <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/90 hover:bg-black/70 flex items-center justify-center transition-all group-hover/share:scale-105 active:scale-95">
                  <Share2 className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-semibold text-white/80 shadow-sm">Share</span>
              </button>
            </div>
          </div>

          {/* Center Floating Navigation Chevrons & Pill Progress Indicator */}
          <div className="flex flex-col items-center gap-3 z-20 shrink-0">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`w-9 h-9 rounded-full border flex items-center justify-center backdrop-blur-md transition-all ${
                currentIndex === 0
                  ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-[#FF5500] border-white/15 hover:border-[#FF5500] text-white shadow-lg cursor-pointer hover:scale-105 active:scale-95'
              }`}
              title="Previous vibe (Up Arrow / Scroll Up)"
              aria-label="Previous vibe"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Vertical Pill Progress Indicator */}
            <div className="flex flex-col items-center gap-1.5 py-1">
              {activeVibes.slice(0, 8).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setScrollDirection(idx > currentIndex ? 'next' : 'prev');
                    setCurrentIndex(idx);
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-1.5 h-5 bg-[#FF5500] shadow-[0_0_10px_rgba(255,85,0,0.8)]'
                      : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/60'
                  }`}
                  title={`Jump to vibe ${idx + 1}`}
                  aria-label={`Jump to vibe ${idx + 1}`}
                />
              ))}
              {activeVibes.length > 8 && (
                <span className="text-[10px] font-mono font-bold text-white/40 pt-0.5">
                  {currentIndex + 1}/{activeVibes.length}
                </span>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex >= activeVibes.length - 1}
              className={`w-9 h-9 rounded-full border flex items-center justify-center backdrop-blur-md transition-all ${
                currentIndex >= activeVibes.length - 1
                  ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'
                  : 'bg-white/10 hover:bg-[#FF5500] border-white/15 hover:border-[#FF5500] text-white shadow-lg cursor-pointer hover:scale-105 active:scale-95'
              }`}
              title="Next vibe (Down Arrow / Scroll Down)"
              aria-label="Next vibe"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Right Card: Details & Actions (Synchronized with Reel) */}
          <div className="w-[380px] lg:w-[420px] rounded-3xl bg-[#141416]/90 backdrop-blur-xl border border-white/10 p-6 sm:p-7 shadow-2xl flex flex-col justify-between shrink-0 space-y-4 overflow-hidden relative min-h-[560px] lg:min-h-[620px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={currentVibe.id || currentVibe.slug}
                initial={{ opacity: 0, y: scrollDirection === 'next' ? 40 : -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: scrollDirection === 'next' ? -40 : 40 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col justify-between h-full space-y-4 w-full"
              >
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

                {/* Spots Capacity Bar - ONLY shown when host explicitly asked for spots */}
                {currentVibe.has_spots_limit && (currentVibe.capacity || 0) > 0 && (
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
                        style={{ width: `${Math.min(100, (currentVibe.going_count / (currentVibe.capacity || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons: Join Now & Connect with Host */}
                <div className="flex items-center gap-2.5 pt-1">
                  {(() => {
                    const currentRsvp = userPassMap[currentVibe.id] || userPassMap[currentVibe.slug];
                    if (currentRsvp) {
                      return (
                        <button
                          onClick={() => openPassModal(currentRsvp, currentVibe)}
                          className="flex-1 py-3 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold text-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-98"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>You're in · View pass</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={() => openQuickJoin(currentVibe)}
                        className="flex-1 py-3 px-3.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E8621A] hover:brightness-110 active:scale-[0.98] text-xs font-bold text-white transition-all shadow-[0_0_20px_rgba(255,85,0,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Join now</span>
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => openAskHost(currentVibe)}
                    className="py-3 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-md hover:scale-[1.02] active:scale-98 shrink-0"
                    title="Connect with host"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#FF8C42]" />
                    <span>Connect with host</span>
                  </button>
                </div>

                {/* Keyboard, Mouse & Trackpad Gesture Hint */}
                <p className="text-[11px] text-white/40 font-medium text-center flex items-center justify-center gap-1.5 select-none">
                  <span>Drag or scroll to browse</span>
                  <span>·</span>
                  <span>Double-click to like</span>
                  <span>·</span>
                  <span>Use ↑ ↓</span>
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* ========================================================= */}
      {/* 3. MOBILE VIEW (INSTAGRAM REELS / TIKTOK VIBE FEED)       */}
      {/* ========================================================= */}
      <main
        ref={mobileFeedRef}
        onScroll={handleMobileScroll}
        onTouchStart={() => {
          isUserTouching.current = true;
        }}
        onTouchEnd={() => {
          setTimeout(() => {
            isUserTouching.current = false;
          }, 250);
        }}
        data-reel-feed="true"
        className="flex flex-col md:hidden flex-1 relative w-full min-h-0 mb-[calc(58px+env(safe-area-inset-bottom,0px))] overflow-y-auto overflow-x-hidden snap-y snap-mandatory overscroll-contain no-scrollbar select-none"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
        }}
      >
        {activeVibes.map((vibe, index) => {
          const { isLiked, count, key: vibeKey } = getVibeLikeData(vibe);
          const isDoubleTapped = doubleTapVibeId === (vibe.id || vibe.slug);

          return (
            <section
              key={vibeKey || index}
              data-index={index}
              onClick={(e) => handleMobileCardTap(vibe, e)}
              className="vibe-reel-card relative w-full h-full min-h-full max-h-full snap-start snap-always shrink-0 flex flex-col justify-between overflow-hidden select-none touch-manipulation cursor-pointer"
              style={{
                height: '100%',
                minHeight: '100%',
                maxHeight: '100%',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              {/* Double-tap animated Flame Pop */}
              {isDoubleTapped && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center animate-in zoom-in-50 fade-in duration-200">
                  <div className="w-20 h-20 rounded-full bg-[#FF5500]/95 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(255,85,0,0.8)] animate-bounce">
                    <Flame className="w-12 h-12 text-white fill-white" />
                  </div>
                </div>
              )}

              {/* Top Left Badge */}
              <div className="absolute top-3 left-4 z-20">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white border border-white/15">
                  {vibe.badge || 'Selling fast'}
                </span>
              </div>

              {/* Full Screen Visual: Ambient Blurred Canvas + Uncropped Fitted Poster */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
                {/* Layer 1: Ambient Blurred Backdrop filling entire reel height */}
                <Image
                  src={vibe.cover_image_url}
                  alt=""
                  fill
                  unoptimized
                  priority={index === 0}
                  className="object-cover scale-110 blur-2xl opacity-45 brightness-50"
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/60" />

                {/* Layer 2: True Uncropped Poster (Preserves 100% of host flyer without cropping) */}
                <div className="absolute inset-0 flex items-center justify-center px-3 pt-12 pb-44 sm:pb-40">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={vibe.cover_image_url}
                      alt={vibe.title}
                      fill
                      unoptimized
                      priority={index === 0}
                      className="object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)] rounded-2xl"
                    />
                  </div>
                </div>
              </div>

              {/* Floating Action Stack (Right side) - Elevated Z-index to z-40 and pointer-events-auto */}
              <div className="absolute right-3.5 bottom-28 sm:bottom-24 z-40 flex flex-col items-center gap-3 pointer-events-auto select-none">
                {/* Flame */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleLikeVibe(vibe);
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform touch-manipulation pointer-events-auto select-none"
                  aria-label="Like vibe"
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                      isLiked
                        ? 'bg-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.5)]'
                        : 'bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80'
                    }`}
                  >
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-[11px] font-bold text-white shadow-sm">{count}</span>
                </button>

                {/* Comments */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    openComments(vibe);
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform touch-manipulation pointer-events-auto select-none"
                  title="Comments"
                  aria-label="Open comments"
                >
                  <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-md hover:bg-black/80">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-white shadow-sm">{getVibeCommentsCount(vibe)}</span>
                </button>

                {/* Event Details "i" icon */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    openEventDetails(vibe);
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform touch-manipulation pointer-events-auto select-none"
                  aria-label="Event details"
                  title="Event details"
                >
                  <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-md hover:bg-black/80 hover:border-[#FF5500]/50 transition-colors">
                    <Info className="w-5 h-5 text-white/90" />
                  </div>
                  <span className="text-[10px] font-semibold text-white shadow-sm">Info</span>
                </button>

                {/* Share */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleShareVibe(vibe);
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform touch-manipulation pointer-events-auto select-none"
                  aria-label="Share vibe"
                >
                  <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-md hover:bg-black/80">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-white shadow-sm">Share</span>
                </button>
              </div>

              {/* Bottom Overlay Card - pr-18 ensures no overlap with right-side action stack */}
              <div className="relative z-20 px-4 pr-18 pb-3.5 pt-4 space-y-2 mt-auto w-full pointer-events-auto">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-neutral-400 font-medium">
                      Hosted by {vibe.host_name}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEventDetails(vibe);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="View full event details"
                    >
                      <Info className="w-3 h-3 text-[#FF8C42]" />
                      <span>Details</span>
                    </button>
                  </div>
                  <h3
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventDetails(vibe);
                    }}
                    className="text-lg sm:text-xl font-black text-white leading-snug mt-0.5 line-clamp-2 cursor-pointer active:opacity-80 transition-opacity"
                  >
                    {vibe.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mt-0.5 truncate">
                    {vibe.formatted_date_time_venue}
                  </p>
                </div>

                {/* Spots Bar - ONLY shown when host explicitly asked for spots */}
                {vibe.has_spots_limit && (vibe.capacity || 0) > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{vibe.going_count}/{vibe.capacity} going</span>
                      </span>
                      <span className="font-bold text-[#FF5500] flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-[#FF5500]" />
                        <span>{vibe.spots_left} spots left</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF5500] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (vibe.going_count / (vibe.capacity || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons: Join Now & Connect with Host */}
                <div className="flex items-center gap-2 pt-0.5">
                  {(() => {
                    const userRsvp = userPassMap[vibe.id] || userPassMap[vibe.slug];
                    if (userRsvp) {
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openPassModal(userRsvp, vibe);
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 shadow-lg active:scale-98 cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>You're in · View pass</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickJoin(vibe);
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E8621A] hover:brightness-110 active:scale-[0.98] text-xs font-semibold text-white flex items-center justify-center gap-1.5 backdrop-blur-md shadow-lg cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Join now</span>
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAskHost(vibe);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 backdrop-blur-md shadow-lg cursor-pointer active:scale-[0.98] transition-all shrink-0"
                    title="Connect with host"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#FF8C42]" />
                    <span>Connect with host</span>
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </main>

      {/* Quick Join Modal with Email OTP verification */}
      <QuickJoinModal
        event={modalEvent}
        isOpen={quickJoinOpen}
        onClose={() => setQuickJoinOpen(false)}
        onAskHost={() => {
          setQuickJoinOpen(false);
          setConnectHostOpen(true);
        }}
        onSuccess={(confirmedRsvp) => {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
          if (confirmedRsvp) {
            setAllRsvps((prev) => [confirmedRsvp, ...prev.filter((r) => r.id !== confirmedRsvp.id)]);
          }
        }}
      />

      {/* Digital Pass Modal for Confirmed RSVPs */}
      {passModalRsvp && passModalEvent && (
        <DigitalPassModal
          rsvp={passModalRsvp}
          event={passModalEvent}
          onClose={() => {
            setPassModalRsvp(null);
            setPassModalEvent(null);
          }}
        />
      )}

      {/* Connect Host Modal */}
      <ConnectHostModal
        event={modalEvent}
        isOpen={connectHostOpen}
        onClose={() => setConnectHostOpen(false)}
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

      {/* Vibe Comments Modal */}
      <VibeCommentsModal
        isOpen={commentsModalOpen}
        onClose={() => setCommentsModalOpen(false)}
        vibe={selectedCommentsVibe || currentVibe}
        onCommentAdded={(newCount) => {
          const target = selectedCommentsVibe || currentVibe;
          const key = target.id || target.slug;
          setCommentCountsMap((prev) => ({ ...prev, [key]: newCount }));
        }}
      />

      {/* Vibe Details Modal */}
      <VibeDetailsModal
        vibe={detailsModalVibe || currentVibe}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onJoin={(vibe) => {
          const userRsvp = userPassMap[vibe.id] || userPassMap[vibe.slug];
          if (userRsvp) {
            openPassModal(userRsvp, vibe);
          } else {
            openQuickJoin(vibe);
          }
        }}
        onConnectHost={(vibe) => openAskHost(vibe)}
        onShare={(vibe) => handleShareVibe(vibe)}
        userRsvp={
          detailsModalVibe
            ? userPassMap[detailsModalVibe.id] || userPassMap[detailsModalVibe.slug]
            : userPassMap[currentVibe.id] || userPassMap[currentVibe.slug]
        }
      />

      {/* Mobile Bottom Navigation Bar & Swipe Gestures */}
      <Navbar bottomNavOnly />
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
