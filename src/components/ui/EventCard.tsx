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
      className="group relative bg-[#0D0D10] rounded-2xl border border-white/10 overflow-hidden hover:border-[#FF5500]/50 hover:shadow-[0_0_30px_rgba(255,85,0,0.15)] transition-all duration-300 flex flex-col h-full cursor-pointer select-none text-white"
    >
      {/* Cover Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-black">
        <Image
          src={event.cover_image_url}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D10] via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {hasExternalLink ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/20 bg-black/70 text-white backdrop-blur-md inline-flex items-center gap-1 shadow-sm">
              <span>{event.source_platform ? event.source_platform.toUpperCase() : 'PARTNER'}</span>
              <ArrowUpRight className="w-2.5 h-2.5 text-[#FF5500]" />
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/15 bg-black/60 text-white/90 backdrop-blur-md">
              Selling fast
            </span>
          )}

          {count > 0 ? (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-black/60 text-white backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/15">
              <Users className="w-3 h-3 text-[#FF5500]" />
              {count} going
            </span>
          ) : (
            <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/70">
              <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
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
            className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer z-10 backdrop-blur-md ${
              activeCategory.toLowerCase() === tags.category.toLowerCase()
                ? 'bg-[#FF5500] text-white ring-2 ring-[#FF5500]/40'
                : 'bg-black/75 hover:bg-[#FF5500] text-white border border-white/20 hover:scale-105'
            }`}
            title={`Filter by ${tags.category}`}
          >
            {tags.category}
          </button>
        )}

        {/* Bottom Right Distance Badge */}
        {typeof distanceKm === 'number' && (
          <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-amber-400/30 shadow-xs pointer-events-none">
            {distanceKm < 1 ? '< 1 km away' : `${Math.round(distanceKm)} km away`}
          </span>
        )}
      </div>

      {/* Card Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-[#0D0D10]">
        <div>
          {/* Date & Time row in IST */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/50 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>{formatIST(event.start_at)}</span>
          </div>

          {/* Event Title */}
          <h3 className="font-display font-black text-lg sm:text-xl text-white leading-snug group-hover:text-[#FF5500] transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Venue Location */}
          <div className="flex items-center gap-1 text-xs text-white/50 mt-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#FF5500]/70 shrink-0" />
            <span className="truncate">{event.location_name || event.city}</span>
          </div>

          {/* Price Display */}
          <div className="mt-2.5 text-sm font-black text-white flex items-center justify-between">
            <span className="text-[#FF5500]">
              {event.external_price_text || (isExternal ? 'Tickets on Partner' : 'Free Entry')}
            </span>
          </div>

          {/* Tags Filter Row (Source, Price, Verified, Moods) */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/10">
            {/* 1. Source / Ticketing Partner Tag */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onTagClick?.(tags.sourceKey, 'source');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition-all cursor-pointer hover:scale-105 active:scale-95"
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
                  ? 'bg-[#FF5500] text-white shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
              }`}
              title={`Filter ${tags.priceTag} events`}
            >
              {tags.priceTag}
            </button>

            {/* 3. Verified Badge */}
            {tags.isVerified && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                Verified
              </span>
            )}

            {/* 4. Mood / Sub-category Tags */}
            {tags.moodTags.slice(0, 2).map((tag) => {
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
                      ? 'bg-[#FF5500] text-white shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'
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
        <div className="pt-3.5 mt-3.5 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/40 truncate max-w-[150px]">
            {event.city} · {event.event_type}
          </span>
          <span className="text-xs font-bold text-white group-hover:text-[#FF5500] transition-colors inline-flex items-center gap-1">
            <span>Explore</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
}
