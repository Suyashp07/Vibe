'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight } from 'lucide-react';
import { EventItem } from '@/types';
import { getPosterSources } from '@/lib/posters/posterSources';

export interface EventHeroSlideProps {
  event: EventItem;
  priority?: boolean;
}

function formatSpotlightDate(startAt?: string) {
  if (!startAt) return 'LIVE EVENT';
  try {
    const d = new Date(startAt);
    if (isNaN(d.getTime())) return 'LIVE EVENT';
    
    // e.g. "Sat, 7 Nov • 3:30 PM"
    const weekday = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });
    const day = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' });
    const month = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
    
    return `${weekday}, ${day} ${month} ${year} • ${time}`;
  } catch {
    return 'LIVE EVENT';
  }
}

export default function EventHeroSlide({
  event,
  priority = false,
}: EventHeroSlideProps) {
  const poster = getPosterSources(event);
  const targetLink = `/${event.slug}`;
  const priceText = event.external_price_text || (event.capacity ? 'Limited spots' : undefined);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] lg:grid-cols-[1.18fr_0.82fr] items-center gap-6 sm:gap-10 lg:gap-14">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Clean District-Style Natural Typography                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col justify-center items-start space-y-3 sm:space-y-4 text-left order-2 md:order-1">
        {/* Date Row (District-style clean neutral text) */}
        <div className="district-hero-date text-xs sm:text-sm font-semibold tracking-wide">
          {formatSpotlightDate(event.start_at)}
        </div>

        {/* Title: 100% visible, crisp high-contrast text */}
        <Link href={targetLink} className="block group/title">
          <h2 className="district-hero-title font-black text-2xl sm:text-3xl lg:text-5xl leading-[1.15] tracking-tight group-hover/title:opacity-85 transition-opacity line-clamp-3">
            {event.title}
          </h2>
        </Link>

        {/* Venue Location */}
        <div className="district-hero-venue text-sm sm:text-base lg:text-lg font-bold flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#0038A8] dark:text-[#08B9F5] shrink-0" />
          <span className="truncate max-w-[340px] sm:max-w-md">
            {event.location_name || 'Live Venue'}, {event.city || 'India'}
          </span>
        </div>

        {/* Price / Entry details */}
        {priceText && (
          <div className="district-hero-price text-sm sm:text-base font-extrabold tracking-tight">
            {priceText.toLowerCase().includes('onwards') ? priceText : `${priceText} onwards`}
          </div>
        )}

        {/* Tagline / Short description */}
        {(event.tagline || event.description) && (
          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm line-clamp-2 leading-relaxed max-w-lg font-normal">
            {event.tagline || event.description}
          </p>
        )}

        {/* CTA Button: Solid District-Style Pill */}
        <div className="pt-2 sm:pt-4 w-full sm:w-auto">
          <Link
            href={targetLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-3 sm:py-3.5 rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer text-center"
          >
            <span>Book tickets</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: Natural Floating Poster (Never Cropped, Soft Shadow)        */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-center md:justify-end w-full order-1 md:order-2">
        <Link
          href={targetLink}
          className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] h-[300px] sm:h-[380px] lg:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-slate-200/80 dark:border-white/10 group/poster cursor-pointer transition-transform duration-300 hover:scale-[1.015] bg-slate-100/90 dark:bg-[#0A1224]/90 flex items-center justify-center"
        >
          {/* Subtle Ambient Backing Inside Poster Card */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <Image
              src={poster.hero}
              alt=""
              fill
              sizes="120px"
              className="object-cover scale-125 blur-2xl opacity-40 dark:opacity-45 saturate-125 transform-gpu"
              priority={false}
            />
            <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
          </div>

          {/* Full Poster Image with Contain: Zero Cropping */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-2.5 sm:p-3">
            <Image
              src={poster.hero}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 85vw, (max-width: 1200px) 45vw, 500px"
              priority={priority}
              placeholder={poster.blur ? 'blur' : 'empty'}
              blurDataURL={poster.blur}
              className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.2)] rounded-xl sm:rounded-2xl transition-transform duration-500 group-hover/poster:scale-[1.02]"
            />
          </div>
        </Link>
      </div>
    </div>
  );
}
