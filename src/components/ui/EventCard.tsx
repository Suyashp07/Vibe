'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Users, Flame } from 'lucide-react';
import { EventItem } from '@/types';
import { formatIST, getEventRSVPs } from '@/lib/store';

interface EventCardProps {
  event: EventItem;
  showStatus?: boolean;
}

export default function EventCard({ event, showStatus = true }: EventCardProps) {
  const rsvps = getEventRSVPs(event.id);
  const count = rsvps.length;
  const isNearlyFull = event.capacity && (event.capacity - count) <= 8 && (event.capacity - count) > 0;

  // Template tag styling
  const templateBadgeStyles: Record<string, string> = {
    grove: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    sprint: 'bg-orange-50 text-orange-800 border-orange-200',
    bloom: 'bg-rose-50 text-rose-800 border-rose-200',
    vertex: 'bg-slate-100 text-slate-800 border-slate-300',
    ember: 'bg-amber-50 text-amber-900 border-amber-200',
  };

  return (
    <Link
      href={`/${event.slug}`}
      className="group block bg-surface rounded-2xl border border-border overflow-hidden hover-lift transition-all duration-200 shadow-card flex flex-col h-full"
    >
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
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md ${templateBadgeStyles[event.template] || 'bg-white/90 text-brand'}`}>
            {event.template}
          </span>

          {isNearlyFull ? (
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
        </div>
      </div>

      {/* Card Details */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Date row in IST */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-accent mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatIST(event.start_at)}</span>
          </div>

          {/* Event Title */}
          <h3 className="font-display font-black text-xl text-ink leading-snug group-hover:text-accent transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Tagline */}
          <p className="font-tagline italic text-sm text-ink-secondary mt-1.5 line-clamp-2 leading-relaxed">
            {event.tagline}
          </p>
        </div>

        {/* Organizer & Live Hype Pill */}
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
                {event.organizer_name[0]}
              </div>
            )}
            <span className="text-xs font-medium text-ink-secondary truncate max-w-[120px]">
              {event.organizer_name}
            </span>
          </div>

          <span className="text-xs font-semibold text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}
