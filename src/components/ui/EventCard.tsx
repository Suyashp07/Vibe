'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Calendar, ArrowUpRight, Heart } from 'lucide-react';
import { EventItem } from '@/types';
import { formatIST } from '@/lib/store';

interface EventCardProps {
  event: EventItem;
  showStatus?: boolean;
  distanceKm?: number | null;
  userCity?: string;
  activeMoods?: string[];
  activeCategory?: string;
  onTagClick?: (tag: string, type: 'mood' | 'category' | 'source') => void;
}

export default function EventCard({
  event,
  showStatus = true,
  distanceKm,
  userCity,
  activeMoods = [],
  activeCategory = 'All',
  onTagClick,
}: EventCardProps) {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Initialize wishlist status from localStorage and listen to updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('vibe_wishlist') || '[]');
        setIsWishlisted(saved.includes(event.id) || (event.slug && saved.includes(event.slug)));
      } catch (e) {
        // ignore storage errors
      }

      const handleUpdate = (e: Event) => {
        const customEvent = e as CustomEvent<{ eventId: string; isWishlisted: boolean }>;
        if (customEvent.detail && (customEvent.detail.eventId === event.id || customEvent.detail.eventId === event.slug)) {
          setIsWishlisted(customEvent.detail.isWishlisted);
        }
      };

      window.addEventListener('vibe:wishlist-updated', handleUpdate);
      return () => window.removeEventListener('vibe:wishlist-updated', handleUpdate);
    }
  }, [event.id, event.slug]);

  // Wishlist toggle handler
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = !isWishlisted;
    setIsWishlisted(next);
    if (typeof window !== 'undefined') {
      try {
        const saved: string[] = JSON.parse(localStorage.getItem('vibe_wishlist') || '[]');
        const updated = next
          ? Array.from(new Set([...saved, event.id]))
          : saved.filter((id: string) => id !== event.id && id !== event.slug);
        localStorage.setItem('vibe_wishlist', JSON.stringify(updated));

        window.dispatchEvent(
          new CustomEvent('vibe:wishlist-updated', {
            detail: {
              eventId: event.id,
              eventTitle: event.title,
              isWishlisted: next,
            },
          })
        );
      } catch (e) {
        // ignore storage errors
      }
    }
  };

  // Card click navigation
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button[data-no-nav="true"]') || target.closest('a')) {
      return;
    }
    router.push(`/${event.slug}`);
  };

  // Source Platform Pill (Top-left, ultra-clean)
  const isExternal = event.source_type === 'external';
  const sourceLabel = event.source_platform
    ? event.source_platform.toUpperCase()
    : isExternal
    ? 'PARTNER'
    : 'VIBE';

  // Format Price in elegant bold text with small "onwards"
  const renderPrice = () => {
    const raw = (event.external_price_text || '').trim();
    const isFree =
      (event as any).is_free ||
      !raw ||
      raw.toLowerCase().includes('free') ||
      raw === '₹0' ||
      raw === '0';

    if (isFree) {
      return (
        <span className="font-extrabold text-base text-[#07133A] dark:text-white">
          Free
        </span>
      );
    }

    const hasOnwards = raw.toLowerCase().includes('onwards');
    const cleanAmount = raw.replace(/onwards/i, '').trim();

    return (
      <div className="flex items-baseline gap-1">
        <span className="font-extrabold text-base text-[#07133A] dark:text-white">
          {cleanAmount}
        </span>
        {hasOnwards && (
          <span className="text-xs font-normal text-slate-400">
            onwards
          </span>
        )}
      </div>
    );
  };

  // Date & Time in clear uppercase IST
  const formattedDate = formatIST(event.start_at).toUpperCase();

  // Venue & City Location display
  const locationDisplay = event.location_name
    ? `${event.location_name}, ${event.city || 'India'}`
    : event.city || 'India';

  return (
    <div
      onClick={handleCardClick}
      data-cursor="view"
      className="event-card group relative rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-white/10 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08),0_8px_10px_-6px_rgba(15,23,42,0.05)] hover:shadow-[0_20px_35px_-5px_rgba(15,23,42,0.16),0_10px_15px_-5px_rgba(15,23,42,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer select-none"
    >
      {/* Image Thumbnail (Top) - Aspect 16/10 with minimal badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          src={event.cover_image_url}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Top-Left: Ultra-clean Source Pill */}
        <div className="absolute top-3 left-3 pointer-events-none z-10">
          <span
            className="event-source-badge bg-black/75 backdrop-blur-md text-white font-semibold text-[11px] px-2.5 py-1 rounded-full shadow-sm"
            style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
          >
            {sourceLabel}
          </span>
        </div>

        {/* Top-Right: Floating Wishlist Heart Button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            data-no-nav="true"
            onClick={handleWishlistToggle}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-900 backdrop-blur-md shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWishlisted
                  ? 'fill-rose-500 text-rose-500 stroke-rose-500'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Card Body (Bottom, clean spacing) */}
      <div className="event-card-body p-4 flex flex-col justify-between flex-1">
        <div>
          {/* Row 1: Date & Time in clear blue/slate uppercase */}
          <div className="text-xs font-bold text-[#0038A8] dark:text-[#38bdf8] tracking-wide flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#0038A8] dark:text-[#38bdf8] shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>

          {/* Row 2: Event Title */}
          <h3 className="font-bold text-lg text-[#07133A] dark:text-white leading-snug line-clamp-2 mt-1 mb-1.5 group-hover:text-[#0038A8] dark:group-hover:text-[#38bdf8] transition-colors">
            {event.title}
          </h3>

          {/* Row 3: Venue & City */}
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 line-clamp-1 mb-3">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{locationDisplay}</span>
          </div>
        </div>

        {/* Row 4: Footer Row with Price & View Details Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between mt-auto">
          {renderPrice()}
          <button
            type="button"
            onClick={handleCardClick}
            className="event-card-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-[#0038A8] text-slate-700 hover:text-white dark:bg-slate-800 dark:hover:bg-[#0038A8] dark:text-slate-200 dark:hover:text-white transition-all duration-200 cursor-pointer"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
