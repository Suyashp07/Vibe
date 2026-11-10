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
  const isLandscape = Boolean(poster.aspectRatio && poster.aspectRatio > 1.25);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-[0.82fr_1.18fr] lg:grid-cols-[0.78fr_1.22fr] items-center gap-6 sm:gap-8 lg:gap-12">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Sleek, Substantially Reduced Natural Typography              */}
      {/* ========================================================================= */}
      <div className="flex flex-col justify-center items-start space-y-2.5 sm:space-y-3.5 text-left order-2 md:order-1 max-w-md">
        {/* Date Row (District-style clean neutral text) */}
        <div className="district-hero-date text-xs sm:text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          {formatSpotlightDate(event.start_at)}
        </div>

        {/* Title: 100% visible, crisp, compact high-contrast text */}
        <Link href={targetLink} className="block group/title">
          <h2 className="district-hero-title font-black text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-[1.2] tracking-tight group-hover/title:opacity-85 transition-opacity line-clamp-2">
            {event.title}
          </h2>
        </Link>

        {/* Venue Location */}
        <div className="district-hero-venue text-xs sm:text-sm font-semibold text-slate-600 dark:text-neutral-300 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#0038A8] dark:text-[#08B9F5] shrink-0" />
          <span className="truncate max-w-[280px] sm:max-w-xs md:max-w-sm">
            {event.location_name || 'Live Venue'}, {event.city || 'India'}
          </span>
        </div>

        {/* Price / Entry details */}
        {priceText && (
          <div className="district-hero-price text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
            {priceText.toLowerCase().includes('onwards') ? priceText : `${priceText} onwards`}
          </div>
        )}

        {/* CTA Button: Solid District-Style Pill */}
        <div className="pt-2 sm:pt-3 w-full sm:w-auto">
          <Link
            href={targetLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer text-center"
          >
            <span>Book tickets</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: Grand, Prominent Floating Poster (Larger & Visually Pure)   */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-center md:justify-end w-full order-1 md:order-2">
        <Link
          href={targetLink}
          className={`relative w-full ${
            isLandscape
              ? 'max-w-[480px] sm:max-w-[580px] lg:max-w-[660px] h-[220px] sm:h-[300px] lg:h-[350px]'
              : 'max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] h-[300px] sm:h-[380px] lg:h-[420px]'
          } rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-slate-200/80 dark:border-white/10 group/poster cursor-pointer transition-transform duration-300 hover:scale-[1.015] bg-slate-100/90 dark:bg-[#0A1224]/90 flex items-center justify-center`}
        >
          {/* Subtle Ambient Backing Inside Poster Card */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <Image
              src={poster.hero}
              alt=""
              fill
              sizes="120px"
              className="object-cover scale-150 blur-3xl opacity-40 dark:opacity-45 saturate-150 transform-gpu"
              priority={false}
            />
            <div className="absolute inset-0 bg-white/15 dark:bg-black/25" />
          </div>

          {/* Full Poster Image with Contain: Zero Cropping */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-2 sm:p-3">
            <Image
              src={poster.hero}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 95vw, (max-width: 1200px) 55vw, 660px"
              priority={priority}
              placeholder={poster.blur ? 'blur' : 'empty'}
              blurDataURL={poster.blur}
              className="object-contain drop-shadow-[0_10px_26px_rgba(0,0,0,0.22)] rounded-xl sm:rounded-2xl transition-transform duration-500 group-hover/poster:scale-[1.02]"
            />
          </div>
        </Link>
      </div>
    </div>
  );
}
