'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Calendar, Users, ArrowUpRight } from 'lucide-react';
import { EventItem } from '@/types';
import { formatIST, getEventRSVPs } from '@/lib/store';
import { getEventDisplayTags } from '@/lib/eventTags';

interface EventCardProps {
  event: EventItem;
  showStatus?: boolean;
  distanceKm?: number | null;
  activeMoods?: string[];
  activeCategory?: string;
  onTagClick?: (tag: string, type: 'mood' | 'category' | 'source') => void;
}

export default function EventCard({
  event,
  showStatus = true,
  distanceKm,
  activeMoods = [],
  activeCategory = 'All',
  onTagClick,
}: EventCardProps) {
  const router = useRouter();
  const rsvps = getEventRSVPs(event.id);
  const count = rsvps.length;

  const isExternal = event.source_type === 'external';
  const rawTicketUrl = event.external_ticket_url?.trim();
  const normalizedTicketUrl = rawTicketUrl
    ? rawTicketUrl.startsWith('http://') || rawTicketUrl.startsWith('https://')
      ? rawTicketUrl
      : `https://${rawTicketUrl}`
    : '';
  const hasExternalLink = Boolean(isExternal && normalizedTicketUrl);

  const tags = getEventDisplayTags(event);

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click came from a button, tag or link, do not navigate card
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }

    if (hasExternalLink) {
      window.open(normalizedTicketUrl, '_blank', 'noopener,noreferrer');
    } else {
      router.push(`/${event.slug}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#CBD5E1] hover:shadow-lg transition-all duration-200 flex flex-col h-full cursor-pointer select-none"
    >
      {/* Cover Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-surface-3">
        <Image
          src={event.cover_image_url}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {hasExternalLink ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md inline-flex items-center gap-1">
              <span>{event.source_platform ? event.source_platform.toUpperCase() : 'PARTNER'}</span>
              <ArrowUpRight className="w-2.5 h-2.5 text-white/80" />
            </span>
          ) : (
            <div />
          )}

          {count > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-black/50 text-white backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15">
              <Users className="w-3 h-3 text-amber-400" />
              {count} going
            </span>
          )}
        </div>

        {/* Bottom Left Category Badge (Clickable filter) */}
        {tags.category && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onTagClick?.(tags.category, 'category');
            }}
            className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer z-10 ${
              activeCategory.toLowerCase() === tags.category.toLowerCase()
                ? 'bg-[#0F172A] text-white ring-2 ring-white/30'
                : 'bg-white/95 hover:bg-white text-[#0F172A] hover:scale-105'
            }`}
            title={`Filter by ${tags.category}`}
          >
            {tags.category}
          </button>
        )}

        {/* Bottom Right Distance Badge */}
        {typeof distanceKm === 'number' && (
          <span className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-amber-400/30 shadow-xs pointer-events-none">
            {distanceKm < 1 ? '< 1 km away' : `${Math.round(distanceKm)} km away`}
          </span>
        )}
      </div>

      {/* Card Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Date & Time row in IST */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>{formatIST(event.start_at)}</span>
          </div>

          {/* Event Title */}
          <h3 className="font-display font-black text-lg sm:text-xl text-[#0F172A] leading-snug group-hover:text-accent transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Venue Location */}
          <div className="flex items-center gap-1 text-xs text-[#64748B] mt-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <span className="truncate">{event.location_name || event.city}</span>
          </div>

          {/* Price Display */}
          <div className="mt-2 text-sm font-black text-[#0F172A]">
            {event.external_price_text || (isExternal ? 'Tickets on Official Partner' : 'Free Entry')}
          </div>

          {/* Tags Filter Row (Source, Price, Verified, Moods) */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#F1F5F9]">
            {/* 1. Source / Ticketing Partner Tag */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onTagClick?.(tags.sourceKey, 'source');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title={`Filter by ${tags.sourceLabel}`}
            >
              {tags.sourceLabel}
            </button>

            {/* 2. Paid / Free Tag */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onTagClick?.(tags.priceTag, 'mood');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                activeMoods.includes(tags.priceTag)
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#475569] border border-[#E2E8F0]'
              }`}
              title={`Filter ${tags.priceTag} events`}
            >
              {tags.priceTag}
            </button>

            {/* 3. Verified Badge */}
            {tags.isVerified && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                Verified
              </span>
            )}

            {/* 4. Mood / Sub-category Tags */}
            {tags.moodTags.map((tag) => {
              const isActive = activeMoods.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onTagClick?.(tag, 'mood');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    isActive
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#475569] border border-[#E2E8F0]'
                  }`}
                  title={`Filter by ${tag}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-3.5 mt-3.5 border-t border-[#F1F5F9] flex items-center justify-between">
          <span className="text-xs text-[#94A3B8] truncate max-w-[150px]">
            {event.city} · {event.event_type}
          </span>
          {hasExternalLink ? (
            <span className="text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Book on {event.source_platform ? event.source_platform.toUpperCase() : 'Partner'}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="text-xs font-bold text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
              View Details →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
