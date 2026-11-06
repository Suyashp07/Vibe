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
  User,
  Volume2,
  VolumeX,
  Filter,
  Check,
  X,
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
import StructuredDescription from '@/components/vibes/StructuredDescription';
import ThemeToggle from '@/components/common/ThemeToggle';
import Navbar from '@/components/common/Navbar';
import LocationModal from '@/components/location/LocationModal';
import { isUserUploadedPoster } from '@/lib/posterUtils';

import { DEFAULT_VIBES_LIST, VibeInstantItem } from '@/lib/defaultVibes';

const ACTIVITY_FILTERS = [
  { id: 'all', label: 'All vibes' },
  { id: 'tech', label: 'Technology', match: ['technology', 'founders', 'code', 'ai', 'cyber', 'tech', 'saas', 'robotics'] },
  { id: 'music', label: 'Live Music', match: ['music', 'acoustic', 'concert', 'live', 'jam', 'singalong'] },
  { id: 'sports', label: 'Sports & Turf', match: ['sports', 'cricket', 'padel', 'football', 'turf', 'badminton', 'pickleball', 'trail', 'cycling', 'kayak', 'basketball'] },
  { id: 'social', label: 'Social & Cafes', match: ['coffee', 'chai', 'social', 'cafe', 'milan', 'samaroh', 'meetup', 'pottery', 'comedy', 'stargazing', 'food', 'walk'] },
];

const FILTER_CITIES = [
  { id: 'all', name: 'All Cities' },
  { id: 'pune', name: 'Pune' },
  { id: 'delhi', name: 'Delhi' },
  { id: 'bengaluru', name: 'Bengaluru' },
  { id: 'bhopal', name: 'Bhopal' },
  { id: 'mumbai', name: 'Mumbai' },
  { id: 'indore', name: 'Indore' },
];

function VibesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetSlug = searchParams.get('event') || searchParams.get('id');

  const [activeCity, setActiveCity] = useState<string>('All Cities');
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
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedCommentsVibe, setSelectedCommentsVibe] = useState<VibeInstantItem | null>(null);
  const [commentCountsMap, setCommentCountsMap] = useState<Record<string, number>>({});
  const [isMuted, setIsMuted] = useState(true);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Check which vibes the current user has confirmed passes for
  const activeUserEmail = useMemo(() => {
    if (isLoggedIn && (profile?.email || user?.email)) {
      return (profile?.email || user?.email || '').trim().toLowerCase();
    }
    // Only if user joined as an active guest in this specific browser session
    if (typeof window !== 'undefined') {
      try {
        const guestInfo = localStorage.getItem('vibe_guest_info');
        if (guestInfo) {
          const parsed = JSON.parse(guestInfo);
          if (parsed?.email) return String(parsed.email).trim().toLowerCase();
        }
      } catch {}
    }
    return '';
  }, [isLoggedIn, profile?.email, user?.email]);

  const userPassMap = useMemo<Record<string, RSVPItem>>(() => {
    const map: Record<string, RSVPItem> = {};
    if (!activeUserEmail) {
      // User is completely logged out with no active identity - NEVER show other people's passes!
      return map;
    }

    // Merge both local and remote RSVPs, matching STRICTLY against activeUserEmail
    const combined = [...allRsvps];
    if (typeof window !== 'undefined') {
      try {
        const localRsvps = getRSVPs();
        localRsvps.forEach((r) => {
          if (!combined.some((c) => c.id === r.id)) {
            combined.push(r);
          }
        });
      } catch {}
    }

    combined.forEach((r) => {
      if (r.status === 'confirmed') {
        const matchesUser = Boolean(r.email && r.email.trim().toLowerCase() === activeUserEmail);
        if (matchesUser) {
          if (r.event_id) map[r.event_id] = r;
          if (r.event_slug) map[r.event_slug] = r;
        }
      }
    });

    return map;
  }, [allRsvps, activeUserEmail]);

  const openPassModal = useCallback((rsvp: RSVPItem, vibe: VibeInstantItem) => {
    const ev = vibe.originalEvent || ({
      id: vibe.id,
      slug: vibe.slug,
      title: vibe.title,
      description: vibe.description,
      organizer_id: 'org-1',
      organizer_name: (!vibe.host_name || /^(organizer|host|admin)$/i.test(vibe.host_name.trim())) ? 'Vibe Pass' : vibe.host_name,
      organizer_handle: 'vibepass',
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

  // User detected city (used for prioritizing local vibes at index 0 without restricting feed to 1 event)
  const [userDetectedCity, setUserDetectedCity] = useState<string>('');

  useEffect(() => {
    const c = getUserCity();
    if (c && c !== 'All India' && c !== 'all') {
      setUserDetectedCity(c);
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
      const badge = spotsLeft <= 3 ? 'Selling fast' : 'Community pick';

      const rawHostName =
        e.organizer_name ||
        (e as any).profiles?.name ||
        (e.source_platform ? `${e.source_platform.toUpperCase()} Host` : 'Vibe Pass');

      const isGenericHost = !rawHostName || /^(organizer|host|event host|admin|default organizer)$/i.test(rawHostName.trim());
      const hostName = isGenericHost ? 'Vibe Pass' : rawHostName;

      const initials = isGenericHost
        ? 'VP'
        : hostName
          .split(' ')
          .map((p: string) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'VP';

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

  // Combine vibes: Merge converted store vibes (user/bot created) and DEFAULT_VIBES_LIST (all 28 curated vibes)
  const allVibes = useMemo<VibeInstantItem[]>(() => {
    const seenSlugs = new Set<string>();
    const seenIds = new Set<string>();
    const list: VibeInstantItem[] = [];

    // Prioritize user-created / bot store events first
    for (const v of convertedStoreVibes) {
      const s = (v.slug || '').toLowerCase().trim();
      const id = v.id.toLowerCase().trim();
      if (!seenSlugs.has(s) && !seenIds.has(id)) {
        if (s) seenSlugs.add(s);
        seenIds.add(id);
        list.push(v);
      }
    }

    // Add all 28 default curated vibes across Pune, Delhi, Bengaluru, Bhopal, Mumbai, Indore
    for (const v of DEFAULT_VIBES_LIST) {
      const s = (v.slug || '').toLowerCase().trim();
      const id = v.id.toLowerCase().trim();
      if (!seenSlugs.has(s) && !seenIds.has(id)) {
        if (s) seenSlugs.add(s);
        seenIds.add(id);
        list.push(v);
      }
    }

    // Prioritize vibes matching the user's detected local city at the very top (index 0)
    // while keeping all other 28 curated vibes immediately accessible right below it!
    if (userDetectedCity) {
      const localLower = userDetectedCity.toLowerCase().trim();
      list.sort((a, b) => {
        const aLocal = a.city.toLowerCase().includes(localLower);
        const bLocal = b.city.toLowerCase().includes(localLower);
        if (aLocal && !bLocal) return -1;
        if (!aLocal && bLocal) return 1;
        return 0;
      });
    }

    // Direct Redirect for Bot links (Requirement 5):
    // If targetSlug is provided in URL, prioritize the targeted vibe immediately at index 0.
    if (targetSlug) {
      const targetLower = targetSlug.toLowerCase().trim();
      const targetIdx = list.findIndex(
        (v) => v.slug.toLowerCase().trim() === targetLower || v.id.toLowerCase().trim() === targetLower
      );
      if (targetIdx > 0) {
        const [targetVibe] = list.splice(targetIdx, 1);
        list.unshift(targetVibe);
      }
    }

    return list;
  }, [convertedStoreVibes, userDetectedCity, targetSlug]);

  // If targeted via bot link but not yet in storeEvents, fetch it directly
  useEffect(() => {
    if (!targetSlug) return;
    const exists = storeEvents.some(
      (e) => e.slug.toLowerCase() === targetSlug.toLowerCase() || e.id === targetSlug
    );
    if (!exists) {
      fetch(`/api/events/by-slug?slug=${encodeURIComponent(targetSlug)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.event) {
            setStoreEvents((prev) => {
              if (prev.some((e) => e.slug.toLowerCase() === targetSlug.toLowerCase())) return prev;
              return [data.event, ...prev];
            });
          }
        })
        .catch(() => {});
    }
  }, [targetSlug, storeEvents]);

  // Filtered vibes: respects activeCity and selectedActivity
  const filteredVibes = useMemo(() => {
    let result = allVibes;

    // Filter by city if a specific city is selected
    const targetCity = (activeCity || '').toLowerCase().trim();
    if (targetCity && targetCity !== 'all' && targetCity !== 'all india' && targetCity !== 'all cities') {
      const cityMatches = result.filter((v) => v.city.toLowerCase().includes(targetCity));
      if (cityMatches.length > 0) {
        result = cityMatches;
      }
    }

    // Filter by activity
    if (selectedActivity !== 'all') {
      const filter = ACTIVITY_FILTERS.find((f) => f.id === selectedActivity);
      if (filter && filter.match) {
        result = result.filter((v) => {
          const text = `${v.category} ${v.title} ${v.description}`.toLowerCase();
          return filter.match!.some((m) => text.includes(m));
        });
      }
    }

    return result;
  }, [allVibes, selectedActivity, activeCity]);

  const activeVibes = filteredVibes.length > 0 ? filteredVibes : allVibes;

  // Real count of vibes per category matching current city
  const categoryCounts = useMemo(() => {
    const targetCity = (activeCity || '').toLowerCase().trim();
    const cityFiltered = (targetCity && targetCity !== 'all' && targetCity !== 'all india' && targetCity !== 'all cities')
      ? allVibes.filter((v) => v.city.toLowerCase().includes(targetCity))
      : allVibes;

    const baseList = cityFiltered.length > 0 ? cityFiltered : allVibes;

    const counts: Record<string, number> = {
      all: baseList.length,
    };
    ACTIVITY_FILTERS.forEach((f) => {
      if (f.id === 'all') return;
      if (!f.match) {
        counts[f.id] = 0;
        return;
      }
      counts[f.id] = baseList.filter((v) => {
        const text = `${v.category} ${v.title} ${v.description}`.toLowerCase();
        return f.match!.some((m) => text.includes(m));
      }).length;
    });
    return counts;
  }, [allVibes, activeCity]);

  // Ensure the feed starts strictly at index 0 on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (!targetSlug && mobileFeedRef.current) {
      mobileFeedRef.current.scrollTop = 0;
    }
  }, [targetSlug]);

  // Auto-open QuickJoinModal ONLY when explicitly requested via autoJoin param (e.g. returning from OAuth with ?autoJoin=1 or ?join=1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const autoJoinParam = searchParams.get('autoJoin') === '1' || searchParams.get('join') === '1';
    if (!autoJoinParam) return;

    let pendingSlug: string | null = null;
    try {
      pendingSlug = sessionStorage.getItem('vibe_pending_join_slug');
    } catch {}

    const slugToJoin = targetSlug || pendingSlug;
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

  // Mobile Feed Scroll Ref & programmatic tracking
  const mobileFeedRef = useRef<HTMLElement | null>(null);
  const isProgrammaticScroll = useRef(false);
  const userScrolledMobile = useRef(false);
  const isUserTouching = useRef(false);
  const scrollSettleTimeout = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const programmaticScrollTo = useCallback((index: number) => {
    if (!mobileFeedRef.current) return;
    const container = mobileFeedRef.current;
    const height = container.clientHeight;
    if (!height) return;
    const targetTop = index * height;
    if (Math.abs(container.scrollTop - targetTop) > 5) {
      isProgrammaticScroll.current = true;
      container.scrollTo({ top: targetTop, behavior: 'smooth' });
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 350);
    }
  }, []);

  // Up/down navigation with directional tracking
  const handlePrev = useCallback(() => {
    setScrollDirection('prev');
    setCurrentIndex((prev) => {
      const nextIdx = Math.max(0, prev - 1);
      programmaticScrollTo(nextIdx);
      return nextIdx;
    });
  }, [programmaticScrollTo]);

  const handleNext = useCallback(() => {
    setScrollDirection('next');
    setCurrentIndex((prev) => {
      const nextIdx = Math.min(activeVibes.length - 1, prev + 1);
      programmaticScrollTo(nextIdx);
      return nextIdx;
    });
  }, [activeVibes.length, programmaticScrollTo]);

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
  }, [
    currentIndex,
    activeVibes.length,
    handleNext,
    handlePrev,
    triggerBoundaryBounce,
    commentsModalOpen,
    quickJoinOpen,
    passModalRsvp,
    detailsModalOpen,
    connectHostOpen,
    createModalOpen,
  ]);

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
      // Don't intercept on mobile devices (touch-driven) or when any modal is open
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        return;
      }

      if (
        commentsModalOpen ||
        quickJoinOpen ||
        Boolean(passModalRsvp) ||
        detailsModalOpen ||
        connectHostOpen ||
        createModalOpen
      ) {
        return;
      }

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
  }, [
    currentIndex,
    activeVibes.length,
    handleNext,
    handlePrev,
    triggerBoundaryBounce,
    commentsModalOpen,
    quickJoinOpen,
    passModalRsvp,
    detailsModalOpen,
    connectHostOpen,
    createModalOpen,
  ]);

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

  // Maintain body scroll lock and reset touch state whenever any modal toggles
  useEffect(() => {
    if (
      !quickJoinOpen &&
      !passModalRsvp &&
      !detailsModalOpen &&
      !connectHostOpen &&
      !commentsModalOpen &&
      !createModalOpen
    ) {
      document.body.style.overflow = 'hidden';
      isUserTouching.current = false;
    }
  }, [
    quickJoinOpen,
    passModalRsvp,
    detailsModalOpen,
    connectHostOpen,
    commentsModalOpen,
    createModalOpen,
  ]);

  // Use IntersectionObserver on mobile cards for smooth, jitter-free active index tracking (120fps CSS snap friendly)
  useEffect(() => {
    const container = mobileFeedRef.current;
    if (!container) return;

    const cards = container.querySelectorAll('.vibe-reel-card');
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;
        let maxRatio = 0;
        let bestIndex = -1;

        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const indexStr = entry.target.getAttribute('data-index');
            if (indexStr !== null) {
              const idx = parseInt(indexStr, 10);
              if (!isNaN(idx)) {
                bestIndex = idx;
              }
            }
          }
        }

        if (bestIndex !== -1 && maxRatio >= 0.5 && bestIndex !== currentIndexRef.current) {
          userScrolledMobile.current = true;
          currentIndexRef.current = bestIndex;
          setCurrentIndex(bestIndex);
        }
      },
      {
        root: container,
        threshold: [0.3, 0.55, 0.8],
      }
    );

    cards.forEach((c) => observer.observe(c));

    return () => {
      observer.disconnect();
    };
  }, [activeVibes]);

  // Fallback scroll handler that only syncs after scrolling settles (debounced to avoid fighting CSS snap)
  const handleMobileScroll = (e: React.UIEvent<HTMLElement>) => {
    if (isProgrammaticScroll.current) return;
    const container = e.currentTarget;
    if (scrollSettleTimeout.current) clearTimeout(scrollSettleTimeout.current);
    scrollSettleTimeout.current = setTimeout(() => {
      if (isProgrammaticScroll.current) return;
      const height = container.clientHeight;
      if (!height) return;
      const newIndex = Math.round(container.scrollTop / height);
      if (newIndex >= 0 && newIndex < activeVibes.length && newIndex !== currentIndexRef.current) {
        userScrolledMobile.current = true;
        currentIndexRef.current = newIndex;
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
          colors: ['#08B9F5', '#00D5E8', '#38BDF8'],
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
    isUserTouching.current = false;
    setSelectedModalVibe(vibe || currentVibe);
    setConnectHostOpen(true);
  };

  const openQuickJoin = (vibe?: VibeInstantItem) => {
    isUserTouching.current = false;
    setSelectedModalVibe(vibe || currentVibe);
    setQuickJoinOpen(true);
  };

  const openEventDetails = (vibe?: VibeInstantItem) => {
    isUserTouching.current = false;
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
      organizer_name: (!activeTargetVibe.host_name || /^(organizer|host|admin)$/i.test(activeTargetVibe.host_name.trim())) ? 'Vibe Pass' : activeTargetVibe.host_name,
      organizer_handle: 'vibepass',
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
      className="vibe-instant-container h-[100dvh] md:min-h-screen w-full bg-[#F4F7FB] dark:bg-[#081426] text-slate-900 dark:text-white flex flex-col justify-between transition-colors duration-200 relative overflow-hidden md:overflow-x-hidden"
    >
      {/* Global Site Navbar (Top header on desktop, Bottom nav bar on mobile) */}
      <Navbar hideTopOnMobile />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/90 dark:bg-black/90 backdrop-blur-md border border-slate-700/40 dark:border-white/20 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#0038A8] dark:text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Ambient Radial Glow in background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-40">
        <div className="absolute left-1/4 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0038A8]/10 rounded-full blur-[140px]" />
      </div>

      {/* Desktop Filter Bar (aligned to far left under the site logo) */}
      <div className="hidden md:flex w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-3 pb-1 items-center justify-start z-30 shrink-0">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#0D1D35] hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white shadow-xs transition-colors cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5 text-[#0038A8] dark:text-sky-300" />
          <span>{selectedFilterLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400" />
        </button>
      </div>

      {/* Mobile Floating Glass Header */}
      <header className="md:hidden absolute top-0 left-0 right-0 z-30 px-3.5 pt-3 pb-6 flex items-center justify-start pointer-events-auto bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        {/* Category Filter Pill (All vibes) */}
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/70 active:scale-95 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
          title="Filter Category"
        >
          <span>{selectedFilterLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/70" />
        </button>
      </header>

      {/* ========================================================= */}
      {/* 2. DESKTOP VIEW (SPLIT-SCREEN CARD - MATCHING SCREENSHOT) */}
      {/* ========================================================= */}
      <main
        onPointerDown={handleDesktopPointerDown}
        onPointerMove={handleDesktopPointerMove}
        onPointerUp={handleDesktopPointerUp}
        onPointerCancel={handleDesktopPointerUp}
        className="hidden md:flex flex-1 items-center justify-center w-full px-4 pb-6 pt-1 select-none cursor-grab active:cursor-grabbing touch-none"
      >
        <motion.div
          animate={{
            y: overscrollOffset + desktopDragOffset.y,
            x: desktopDragOffset.x * 0.45,
            rotate: desktopDragOffset.x * 0.015,
          }}
          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
          className="flex items-center justify-center gap-6 lg:gap-8 max-w-6xl w-full"
        >
          {/* Left Card: Vertical Reel Frame */}
          <div
            onDoubleClick={handleDesktopDoubleClick}
            className="vibe-reel-card relative w-[clamp(320px,27vw,410px)] h-[min(620px,calc(100vh-140px))] min-h-[490px] rounded-[32px] overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.18)] bg-neutral-950 shrink-0 group select-none cursor-grab active:cursor-grabbing"
          >
            {/* Desktop Double-click animated Flame Pop */}
            {desktopFlamePop && (
              <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center animate-in zoom-in-50 fade-in duration-200">
                <div className="w-20 h-20 rounded-full bg-[#0038A8]/95 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(0,56,168,0.85)] animate-bounce">
                  <Flame className="w-12 h-12 text-white fill-white" />
                </div>
              </div>
            )}

            {/* Badge: Community pick */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-black/45 backdrop-blur-md text-white border border-white/15 shadow-sm">
                {currentVibe.badge || 'Community pick'}
              </span>
            </div>

            {/* Top-Right Badge: All Cities dropdown trigger matching screenshot */}
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/45 hover:bg-black/60 backdrop-blur-md text-white border border-white/15 shadow-sm transition-colors cursor-pointer"
                title="Filter by City"
              >
                <MapPin className="w-3.5 h-3.5 text-[#00D5E8]" />
                <span>{activeCity === 'All India' ? 'All Cities' : activeCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/70" />
              </button>
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
                  {isUserUploadedPoster(currentVibe.cover_image_url, currentVibe) ? (
                    <>
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
                      <div className="absolute inset-0 flex items-center justify-center p-3">
                        <div className="relative w-full h-full max-h-[90%] flex items-center justify-center">
                          <Image
                            src={currentVibe.cover_image_url}
                            alt={currentVibe.title}
                            fill
                            unoptimized
                            priority
                            className="object-contain drop-shadow-[0_16px_40px_rgba(0,0,0,0.85)] rounded-2xl"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Image
                        src={currentVibe.cover_image_url}
                        alt={currentVibe.title}
                        fill
                        unoptimized
                        priority
                        className="object-cover w-full h-full scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/50" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Floating Action Stack (Right Edge) matching screenshot exactly */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-3.5 bottom-6 z-20 flex flex-col items-center gap-3.5"
            >
              {/* 1. Flame */}
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
                          ? 'bg-[#0038A8] text-white shadow-[0_0_15px_rgba(0,56,168,0.5)]'
                          : 'bg-black/50 backdrop-blur-md border border-white/15 text-white/90 hover:bg-black/70'
                      }`}
                    >
                      <Flame className="w-5 h-5 fill-current" />
                    </div>
                    <span className="text-xs font-bold text-white drop-shadow-sm">{desktopLikesCount}</span>
                  </button>
                );
              })()}

              {/* 2. Chat / Comments */}
              <button
                type="button"
                onClick={() => openComments(currentVibe)}
                className="flex flex-col items-center gap-1 cursor-pointer group/chat"
                title="View comments"
              >
                <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/90 group-hover/chat:text-white group-hover/chat:bg-[#0038A8]/20 group-hover/chat:border-[#0038A8]/40 flex items-center justify-center transition-all group-hover/chat:scale-105 active:scale-95 shadow-md">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-bold text-white drop-shadow-sm">{getVibeCommentsCount(currentVibe)}</span>
              </button>

              {/* 3. Share */}
              <button
                type="button"
                onClick={handleShare}
                className="flex flex-col items-center gap-1 cursor-pointer group/share"
                title="Share vibe"
              >
                <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white/90 hover:bg-black/70 flex items-center justify-center transition-all group-hover/share:scale-105 active:scale-95">
                  <Share2 className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-semibold text-white/90 drop-shadow-sm">Share</span>
              </button>


            </div>
          </div>

          {/* Center Navigation Chevrons & Counter matching screenshot */}
          <div className="flex flex-col items-center gap-3 z-20 shrink-0">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-md transition-all ${
                currentIndex === 0
                  ? 'bg-white/60 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-300 dark:text-white/20 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 dark:bg-[#0D1D35] dark:border-white/15 dark:text-white dark:hover:bg-white/10 cursor-pointer hover:scale-105 active:scale-95'
              }`}
              title="Previous vibe (Up Arrow)"
              aria-label="Previous vibe"
            >
              <ChevronUp className="w-4 h-4 stroke-[2.5]" />
            </button>

            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 py-1">
              {currentIndex + 1} / {activeVibes.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex >= activeVibes.length - 1}
              className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-md transition-all ${
                currentIndex >= activeVibes.length - 1
                  ? 'bg-white/60 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-300 dark:text-white/20 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700 dark:bg-[#0D1D35] dark:border-white/15 dark:text-white dark:hover:bg-white/10 cursor-pointer hover:scale-105 active:scale-95'
              }`}
              title="Next vibe (Down Arrow)"
              aria-label="Next vibe"
            >
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Right Card: Details & Actions matching screenshot */}
          <div className="vibe-details-card w-[clamp(360px,32vw,460px)] h-[min(620px,calc(100vh-140px))] min-h-[490px] rounded-[32px] bg-white dark:bg-[#0D1D35] border border-slate-100 dark:border-white/10 p-6 lg:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-2xl flex flex-col justify-between shrink-0 overflow-hidden relative transition-colors">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={currentVibe.id || currentVibe.slug}
                initial={{ opacity: 0, y: scrollDirection === 'next' ? 40 : -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: scrollDirection === 'next' ? -40 : 40 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col justify-between h-full w-full"
              >
                <div>
                  {/* Host Identity Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#0038A8] dark:text-sky-300 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center font-bold text-sm shrink-0">
                        {currentVibe.host_initials || 'SS'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{currentVibe.host_name}</h4>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5 font-medium">
                          <span className="text-amber-500">★</span>
                          <span>{currentVibe.host_rating || '4.9'} · {currentVibe.host_vibes_count || '12'} vibes hosted</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-full shrink-0">
                      VERIFIED HOST
                    </span>
                  </div>

                  {/* Category Tag & Headline */}
                  <div className="mt-5">
                    <span className="text-xs font-bold tracking-wider text-[#0038A8] dark:text-sky-300 uppercase font-mono">
                      {currentVibe.category}
                    </span>
                    <h2 className="text-2xl lg:text-[28px] font-black tracking-tight text-slate-900 dark:text-white mt-1.5 leading-snug">
                      {currentVibe.title}
                    </h2>
                  </div>

                  {/* Date, Time, Venue Box */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-2 mt-4 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-[#0038A8] dark:text-sky-300 shrink-0" />
                      <span className="font-semibold uppercase">{currentVibe.formatted_date}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-[#0038A8] dark:text-sky-300 shrink-0" />
                      <span className="font-semibold">{currentVibe.formatted_time}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#0038A8] dark:text-sky-300 shrink-0" />
                      <span className="font-semibold break-words">{currentVibe.location_name}</span>
                    </div>
                  </div>

                  {/* About Section (No line cuts or hidden content) */}
                  <div className="mt-3.5 flex-1 min-h-0 flex flex-col overflow-hidden">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block shrink-0">
                      ABOUT THIS VIBE
                    </span>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed overflow-y-auto no-scrollbar pr-1 flex-1">
                      <StructuredDescription description={currentVibe.description} />
                    </div>
                  </div>

                  {/* Spots Capacity Bar (if applicable) */}
                  {currentVibe.has_spots_limit && (currentVibe.capacity || 0) > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-1.5 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400" />
                          <span>{currentVibe.going_count}/{currentVibe.capacity} going</span>
                        </span>
                        <span className="font-bold text-[#0038A8] dark:text-sky-300 flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-current" />
                          <span>{currentVibe.spots_left} spots left</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0038A8] dark:bg-sky-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (currentVibe.going_count / (currentVibe.capacity || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Row */}
                <div className="flex items-center gap-3 pt-3 mt-auto">
                  {(() => {
                    const currentRsvp = userPassMap[currentVibe.id] || userPassMap[currentVibe.slug];
                    if (currentRsvp) {
                      return (
                        <button
                          onClick={() => openPassModal(currentRsvp, currentVibe)}
                          className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>You're in · View pass</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        onClick={() => openQuickJoin(currentVibe)}
                        className="vibe-join-btn flex-1 py-3.5 px-6 rounded-2xl bg-[#0038A8] hover:bg-[#173DAA] active:scale-[0.98] text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-900/25 flex items-center justify-center gap-2 cursor-pointer"
                        style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                      >
                        <Zap className="w-4 h-4 fill-white text-white" style={{ color: '#FFFFFF', stroke: '#FFFFFF', fill: '#FFFFFF' }} />
                        <span className="vibe-join-text font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Join now</span>
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => openAskHost(currentVibe)}
                    className="py-3.5 px-5 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-700 hover:text-slate-900 dark:text-white/90 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] shrink-0"
                  >
                    <span>Connect with host</span>
                  </button>
                </div>
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
          }, 100);
        }}
        onTouchCancel={() => {
          isUserTouching.current = false;
        }}
        data-reel-feed="true"
        className="flex flex-col md:hidden w-full h-[calc(100dvh-58px-env(safe-area-inset-bottom,0px))] overflow-y-scroll overflow-x-hidden snap-y snap-mandatory overscroll-contain no-scrollbar select-none relative"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y mandatory',
        }}
      >
        {activeVibes.map((vibe, index) => {
          const { isLiked, count, key: vibeKey } = getVibeLikeData(vibe);
          const isDoubleTapped = doubleTapVibeId === (vibe.id || vibe.slug);
          const userRsvp = userPassMap[vibe.id] || userPassMap[vibe.slug];

          return (
            <section
              key={vibeKey || index}
              data-index={index}
              onClick={(e) => handleMobileCardTap(vibe, e)}
              className="vibe-reel-card relative w-full h-[calc(100dvh-58px-env(safe-area-inset-bottom,0px))] snap-start snap-always shrink-0 flex flex-col justify-between overflow-hidden select-none touch-manipulation"
              style={{
                height: 'calc(100dvh - 58px - env(safe-area-inset-bottom, 0px))',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              {/* Double-tap animated Flame Pop */}
              {isDoubleTapped && (
                <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center animate-in zoom-in-50 fade-in duration-200">
                  <div className="w-20 h-20 rounded-full bg-[#0038A8]/95 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(0,56,168,0.85)] animate-bounce">
                    <Flame className="w-12 h-12 text-white fill-white" />
                  </div>
                </div>
              )}

              {/* Full Screen Visual: Full-screen for AI / Uncropped Fitted for User Poster */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
                {isUserUploadedPoster(vibe.cover_image_url, vibe) ? (
                  <>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60" />

                    {/* Layer 2: True Uncropped Poster with balanced vertical breathing room */}
                    <div className="absolute inset-0 flex items-center justify-center px-4 pt-16 pb-36">
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
                  </>
                ) : (
                  <>
                    {/* AI-Generated / Ambient Cover: Fits Full Screen Seamlessly */}
                    <Image
                      src={vibe.cover_image_url}
                      alt={vibe.title}
                      fill
                      unoptimized
                      priority={index === 0}
                      className="object-cover w-full h-full scale-[1.02]"
                    />
                    {/* Scrim Gradients for text & button legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/50" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
                  </>
                )}
              </div>

              {/* Floating Action Stack (Right side) - Elevated Z-index to z-40 and pointer-events-auto */}
              <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-3.5 pointer-events-auto select-none">
                {/* Host Profile Avatar Bubble */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAskHost(vibe);
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                  title={`Hosted by ${vibe.host_name}`}
                >
                  <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#002B82] to-[#0038A8] shadow-lg">
                    <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden flex items-center justify-center text-white font-bold text-xs">
                      {vibe.originalEvent?.organizer_logo ? (
                        <img src={vibe.originalEvent.organizer_logo} alt={vibe.host_name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{vibe.host_initials || vibe.host_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <div className="-mt-3 w-4 h-4 rounded-full bg-[#0038A8] text-white flex items-center justify-center shadow-xs">
                    <MessageCircle className="w-2.5 h-2.5" />
                  </div>
                </button>

                {/* Flame / Like */}
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
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md ${
                      isLiked
                        ? 'bg-[#0038A8] text-white shadow-[0_0_15px_rgba(0,56,168,0.6)]'
                        : 'bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/70'
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
                  <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-md hover:bg-black/70">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-white shadow-sm">{getVibeCommentsCount(vibe)}</span>
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
                  <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-md hover:bg-black/70">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-white shadow-sm">Share</span>
                </button>

                {/* Info / Details */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    openEventDetails(vibe);
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform touch-manipulation pointer-events-auto select-none"
                  aria-label="View details"
                  title="View full event details"
                >
                  <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-md hover:bg-black/70">
                    <Info className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-white shadow-sm">Info</span>
                </button>
              </div>

              {/* Bottom Overlay Card */}
              <div className="relative z-20 px-4 pr-16 pb-3 pt-6 mt-auto w-full pointer-events-auto bg-gradient-to-t from-black via-black/85 to-transparent space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#0038A8] text-white shadow-xs">
                      {vibe.badge || 'Community pick'}
                    </span>
                    <span className="text-xs text-white/80 font-medium truncate">
                      @{vibe.host_name}
                    </span>
                  </div>

                  <h3
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventDetails(vibe);
                    }}
                    className="text-base sm:text-lg font-black text-white leading-snug line-clamp-2 cursor-pointer active:opacity-80 transition-opacity drop-shadow-md"
                  >
                    {vibe.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-white/85 font-medium truncate drop-shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-[#00D5E8] shrink-0" />
                    <span className="truncate">{vibe.formatted_date_time_venue}</span>
                  </div>
                </div>

                {/* Spots Bar - ONLY shown when host explicitly asked for spots */}
                {vibe.has_spots_limit && (vibe.capacity || 0) > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white/85 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{vibe.going_count}/{vibe.capacity} going</span>
                      </span>
                      <span className="font-bold text-[#00D5E8] flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-[#00D5E8]" />
                        <span>{vibe.spots_left} spots left</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0038A8] to-[#173DAA] rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (vibe.going_count / (vibe.capacity || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons: Join Now & Connect with Host */}
                <div className="flex items-center gap-2 pt-0.5">
                  {userRsvp ? (
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
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuickJoin(vibe);
                      }}
                      className="vibe-join-btn flex-1 py-2.5 px-3 rounded-xl bg-[#0038A8] hover:bg-[#173DAA] active:scale-[0.98] text-xs font-bold flex items-center justify-center gap-1.5 backdrop-blur-md shadow-lg shadow-blue-900/30 cursor-pointer touch-manipulation select-none"
                      style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                    >
                      <Zap className="w-3.5 h-3.5 fill-white text-white" style={{ color: '#FFFFFF', stroke: '#FFFFFF', fill: '#FFFFFF' }} />
                      <span className="vibe-join-text font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Join now</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAskHost(vibe);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 backdrop-blur-md shadow-lg cursor-pointer active:scale-[0.98] transition-all shrink-0"
                    title="Connect with host"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#00D5E8]" />
                    <span>Host</span>
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
        onClose={() => {
          setQuickJoinOpen(false);
          isUserTouching.current = false;
        }}
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
        onViewPass={(rsvp) => {
          setQuickJoinOpen(false);
          openPassModal(rsvp, activeTargetVibe);
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


            {/* ========================================================= */}
      {/* 4. BLURRED PAGE BACKDROP & CATEGORY/CITY DRAWER          */}
      {/* ========================================================= */}
      <AnimatePresence>
        {filterOpen && (
          <>
            {/* Blurred Backdrop covering entire screen */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setFilterOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
            />

            {/* Left Drawer Card (matching reference screenshot) */}
            <motion.aside
              initial={{ x: -340 }}
              animate={{ x: 0 }}
              exit={{ x: -340 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 h-full bg-white dark:bg-[#0D1D35] border-r border-slate-200/90 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.3)] flex flex-col justify-between p-6 select-none overflow-y-auto no-scrollbar"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    CATEGORIES
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                    aria-label="Close categories"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Categories List */}
                <div className="space-y-1.5">
                  {ACTIVITY_FILTERS.map((cat) => {
                    const isSelected = selectedActivity === cat.id;
                    const count = categoryCounts[cat.id] ?? 0;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedActivity(cat.id);
                          setCurrentIndex(0);
                          setFilterOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                          isSelected
                            ? 'category-active-btn bg-[#0038A8] text-white shadow-md shadow-blue-900/30'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white'
                        }`}
                        style={isSelected ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', backgroundColor: '#0038A8' } : undefined}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSelected ? 'bg-sky-300' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          />
                          <span
                            className={`text-xs sm:text-sm ${isSelected ? 'font-bold text-white' : 'font-medium'}`}
                            style={isSelected ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}
                          >
                            {cat.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-neutral-400'
                            }`}
                            style={isSelected ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}
                          >
                            {count}
                          </span>
                          {isSelected && (
                            <Check
                              className="w-4 h-4 stroke-[2.5] text-white shrink-0"
                              style={{ stroke: '#FFFFFF', color: '#FFFFFF' }}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Section 2: FILTER BY CITY */}
                <div className="mt-8">
                  <span className="text-[11px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase mb-3 block">
                    FILTER BY CITY
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {FILTER_CITIES.map((city) => {
                      const isCitySelected =
                        (city.id === 'all' && (activeCity === 'All India' || activeCity === 'All Cities')) ||
                        activeCity.toLowerCase() === city.id.toLowerCase() ||
                        activeCity.toLowerCase() === city.name.toLowerCase();
                      return (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => {
                            setActiveCity(city.id === 'all' ? 'All Cities' : city.name);
                            setCurrentIndex(0);
                            setFilterOpen(false);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                            isCitySelected
                              ? 'city-active-btn bg-[#0038A8] text-white shadow-md shadow-blue-900/30'
                              : 'bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200'
                          }`}
                          style={isCitySelected ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', backgroundColor: '#0038A8' } : undefined}
                        >
                          <span style={isCitySelected ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}>
                            {city.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 3: Bottom Action Button */}
              <div className="pt-6 mt-auto">
                <button
                  type="button"
                  onClick={() => {
                    setFilterOpen(false);
                    setCreateModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#0038A8] hover:bg-[#173DAA] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', backgroundColor: '#0038A8' }}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" style={{ stroke: '#FFFFFF', color: '#FFFFFF' }} />
                  <span
                    className="font-bold text-white"
                    style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                  >
                    Host an Instant Vibe
                  </span>
                </button>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2 font-medium">
                  Free 60-second spontaneous gathering
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Location Modal */}
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelectCity={(city) => {
          setActiveCity(city);
          setLocationModalOpen(false);
        }}
        currentCity={activeCity}
      />
    </div>
  );
}

export default function VibesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] w-full bg-white dark:bg-[#081426] flex flex-col items-center justify-center text-slate-900 dark:text-white">
          <RefreshCw className="w-8 h-8 animate-spin text-[#08B9F5] mb-3" />
          <p className="text-xs font-bold text-slate-500 dark:text-white/60 tracking-wider uppercase">Loading Vibe Stream...</p>
        </div>
      }
    >
      <VibesContent />
    </Suspense>
  );
}
