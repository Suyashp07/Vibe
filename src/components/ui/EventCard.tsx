'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Users, Flame, ArrowUpRight } from 'lucide-react';
import { EventItem } from '@/types';
import { formatIST, getEventRSVPs } from '@/lib/store';

interface EventCardProps {
  event: EventItem;
  showStatus?: boolean;
  distanceKm?: number | null;
}

export default function EventCard({ event, showStatus = true, distanceKm }: EventCardProps) {
  const rsvps = getEventRSVPs(event.id);
  const count = rsvps.length;
  const isNearlyFull = event.capacity && (event.capacity - count) <= 8 && (event.capacity - count) > 0;

  const isExternal = event.source_type === 'external';
  const rawTicketUrl = event.external_ticket_url?.trim();
  const normalizedTicketUrl = rawTicketUrl
    ? (rawTicketUrl.startsWith('http://') || rawTicketUrl.startsWith('https://') ? rawTicketUrl : `https://${rawTicketUrl}`)
    : '';
  const hasExternalLink = Boolean(isExternal && normalizedTicketUrl);

  const cardContent = (
    <>
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden bg-surface-3">
        <Image
          src={event.cover_image_url}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand/80 via-brand/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {isExternal ? (
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/25 bg-black/75 text-white backdrop-blur-md shadow-sm inline-flex items-center gap-1">
              <span>🎟️ {event.source_platform ? event.source_platform.toUpperCase() : 'EXTERNAL'}</span>
              <ArrowUpRight className="w-3 h-3 text-white/80" />
            </span>
          ) : (
            <div />
          )}

          {event.external_price_text ? (
            <span className="text-[11px] font-bold bg-white/95 text-brand px-2.5 py-1 rounded-full shadow-sm">
              {event.external_price_text}
            </span>
          ) : isExternal ? (
            <span className="text-[11px] font-bold bg-white/95 text-brand px-2.5 py-1 rounded-full shadow-sm">
              Official Site ↗
            </span>
          ) : isNearlyFull ? (
            <span className="flex items-center gap-1 text-[11px] font-bold bg-accent-light text-accent border border-accent/20 px-2.5 py-1 rounded-full shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-accent" />
              Only {event.capacity! - count} spots left
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold bg-black/40 text-white backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              <Users className="w-3 h-3 text-gold" />
              {count} going
            </span>
          )}
        </div>

        {/* Bottom City & Event Type overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 font-medium">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-accent" />
            {event.city} · {event.event_type}
          </span>
          {typeof distanceKm === 'number' && (
            <span className="bg-brand/85 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 border border-amber-400/30 shadow-xs">
              {distanceKm < 1 ? '< 1 km away' : `${Math.round(distanceKm)} km away`}
            </span>
          )}
        </div>
      </div>

      {/* Card Details */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Date row in IST */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] mb-2">
            <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{formatIST(event.start_at)}</span>
          </div>

          {/* Event Title */}
          <h3 className="font-display font-black text-xl text-ink leading-snug group-hover:text-accent transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Tagline */}
          <p className="text-xs sm:text-sm font-normal text-[#64748B] mt-1.5 line-clamp-2 leading-relaxed">
            {event.tagline}
          </p>
        </div>

        {/* Organizer & Action */}
        <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {event.organizer_logo ? (
              <Image
                src={event.organizer_logo}
                alt={event.organizer_name}
                width={26}
                height={26}
                className="rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                {(event.organizer_name || event.source_platform || 'V')[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-xs font-medium text-ink-secondary truncate max-w-[120px]">
              {event.organizer_name || (event.source_platform ? `Via ${event.source_platform}` : 'Curated by Vibe')}
            </span>
          </div>

          {hasExternalLink ? (
            <span className="text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
              Book on {event.source_platform ? event.source_platform.toUpperCase() : 'Partner'}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="text-xs font-semibold text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
              RSVP on Vibe →
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (hasExternalLink) {
    return (
      <a
        href={normalizedTicketUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block bg-surface rounded-2xl border border-border overflow-hidden hover-lift transition-all duration-200 shadow-card flex flex-col h-full cursor-pointer"
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link
      href={`/${event.slug}`}
      className="group block bg-surface rounded-2xl border border-border overflow-hidden hover-lift transition-all duration-200 shadow-card flex flex-col h-full"
    >
      {cardContent}
    </Link>
  );
}
