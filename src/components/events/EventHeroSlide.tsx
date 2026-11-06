'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ArrowRight, Zap } from 'lucide-react';
import { EventItem } from '@/types';
import { getPosterSources, getDarkenedDominantColor } from '@/lib/posters/posterSources';

export interface EventHeroSlideProps {
  event: EventItem;
  priority?: boolean;
  slideIndex: number;
  totalSlides: number;
  onPrev?: () => void;
  onNext?: () => void;
  onSelectSlide?: (idx: number) => void;
}

function formatSpotlightDate(startAt?: string) {
  if (!startAt) return 'LIVE EVENT';
  try {
    const d = new Date(startAt);
    if (isNaN(d.getTime())) return 'LIVE EVENT';
    const weekday = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' }).toUpperCase();
    const day = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric' });
    const month = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' }).toUpperCase();
    const time = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    return `${weekday}, ${day} ${month} • ${time}`;
  } catch {
    return 'LIVE EVENT';
  }
}

export default function EventHeroSlide({
  event,
  priority = false,
  slideIndex,
  totalSlides,
  onPrev,
  onNext,
  onSelectSlide,
}: EventHeroSlideProps) {
  const poster = getPosterSources(event);
  const targetLink = `/${event.slug}`;
  const darkBgColor = getDarkenedDominantColor(poster.dominantColor, '#0b1535');

  // Mobile aspect ratio clamp:
  // Between 4:5 (portrait, 0.8) and 4:3 (landscape, 1.3333). Fallback to 4/3.
  const rawRatio = poster.aspectRatio || (4 / 3);
  const clampedMobileRatio = Math.min(4 / 3, Math.max(4 / 5, rawRatio));

  return (
    <div
      className="w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl transition-all duration-300"
      style={{
        backgroundColor: darkBgColor,
      }}
    >
      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (md and up): 2-Column Grid (Info Left, Poster Right)        */}
      {/* ========================================================================= */}
      <div className="hidden md:grid md:grid-cols-[1fr_1.2fr] min-h-[500px] lg:min-h-[520px] relative overflow-hidden">
        {/* Container Ambient Blurred Backdrop */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <Image
            src={poster.hero}
            alt=""
            fill
            sizes="120px"
            className="object-cover scale-125 blur-3xl brightness-40 saturate-125 opacity-40 transform-gpu"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/35" />
        </div>

        {/* LEFT COLUMN: Info Content (Never Overlaps Poster Artwork) */}
        <div className="relative z-10 flex flex-col justify-between p-8 lg:p-12 text-white">
          <div className="space-y-4">
            {/* Badge Row */}
            <div className="inline-flex">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm whitespace-nowrap">
                <Zap className="w-3.5 h-3.5 fill-[#08B9F5] text-[#08B9F5] shrink-0" />
                <span>IN THE SPOTLIGHT</span>
              </span>
            </div>

            {/* Event Meta: Date & Venue */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-200/90 text-xs sm:text-sm font-semibold drop-shadow-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#08B9F5] shrink-0" />
                <span className="uppercase tracking-wide">{formatSpotlightDate(event.start_at)}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                <MapPin className="w-4 h-4 text-[#08B9F5] shrink-0" />
                <span className="truncate">{event.location_name || 'Live Venue'}, {event.city || 'India'}</span>
              </div>
            </div>

            {/* Title (Max 2-3 lines) */}
            <Link href={targetLink} className="block group/title">
              <h2 className="font-extrabold text-3xl lg:text-4xl leading-tight tracking-tight text-white group-hover/title:text-[#08B9F5] transition-colors line-clamp-3 drop-shadow-md">
                {event.title}
              </h2>
            </Link>

            {/* Tagline / Description */}
            <p className="text-slate-200/80 text-sm lg:text-base line-clamp-3 leading-relaxed max-w-md font-normal">
              {event.tagline || event.description || 'Live music, cultural programs, sports & spontaneous meetups. Join the experience.'}
            </p>
          </div>

          {/* Action CTA Button */}
          <div className="pt-6">
            <Link
              href={targetLink}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full bg-[#0038A8] hover:bg-[#173DAA] text-white text-sm font-extrabold shadow-lg shadow-blue-900/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Find your spot</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Full Poster with Blurred Backdrop + Contain */}
        <div className="relative z-10 flex items-center justify-center p-6 lg:p-8 overflow-hidden h-full min-h-[460px]">
          {/* Subtle Inner Blurred Poster Backdrop */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <Image
              src={poster.hero}
              alt=""
              fill
              sizes="200px"
              className="object-cover scale-125 blur-2xl brightness-50 saturate-125 opacity-70 transform-gpu"
              priority={false}
            />
            <div className="absolute inset-0 bg-black/25" />
          </div>

          {/* Foreground Full Poster (Never Cropped) */}
          <Link
            href={targetLink}
            className="relative w-full h-[440px] flex items-center justify-center rounded-2xl overflow-hidden cursor-pointer group/poster"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={poster.hero}
                alt={event.title}
                fill
                sizes="(max-width: 1024px) 50vw, 600px"
                priority={priority}
                placeholder={poster.blur ? 'blur' : 'empty'}
                blurDataURL={poster.blur}
                className="object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.6)] group-hover/poster:scale-[1.02] transition-transform duration-500 ease-out"
              />
            </div>
          </Link>

          {/* Desktop Carousel Indicators & Controls Capsule (Bottom-Right of Poster Column) */}
          {totalSlides > 1 && (
            <div className="absolute bottom-5 right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-xl select-none">
              <div className="flex items-center gap-1.5 px-1">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectSlide?.(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      slideIndex === i ? 'w-5 bg-white shadow-xs' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Chevrons */}
              <div className="flex items-center gap-1 pl-1 border-l border-white/20">
                <button
                  type="button"
                  onClick={onPrev}
                  className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Previous slide"
                >
                  <span className="text-xs">‹</span>
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  aria-label="Next slide"
                >
                  <span className="text-xs">›</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (below md): Stacked Poster on Top, Solid Info Panel Below   */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col w-full">
        {/* 1. TOP POSTER AREA (Clamped Aspect Ratio, NEVER Cuts Artwork) */}
        <div
          className="relative w-full overflow-hidden bg-black flex items-center justify-center select-none"
          style={{ aspectRatio: `${clampedMobileRatio}` }}
        >
          {/* Blurred Background Layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <Image
              src={poster.card}
              alt=""
              fill
              sizes="120px"
              className="object-cover scale-125 blur-2xl brightness-50 saturate-125 opacity-70 transform-gpu"
              priority={false}
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Foreground Full Poster Artwork */}
          <Link href={targetLink} className="relative w-full h-full flex items-center justify-center p-2.5">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={poster.card}
                alt={event.title}
                fill
                sizes="100vw"
                priority={priority}
                placeholder={poster.blur ? 'blur' : 'empty'}
                blurDataURL={poster.blur}
                className="object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
              />
            </div>
          </Link>

          {/* Mobile Carousel Indicators (At Bottom of Poster Area, never over info text) */}
          {totalSlides > 1 && (
            <div className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-md">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSelectSlide?.(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    slideIndex === i ? 'w-4 bg-white' : 'w-1 bg-white/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* 2. SOLID INFO PANEL BELOW (High-contrast, never covers artwork) */}
        <div
          className="p-5 flex flex-col gap-3.5 text-white"
          style={{ backgroundColor: darkBgColor }}
        >
          {/* Badge: Strictly single line, whitespace-nowrap, never wraps even at 320px */}
          <div className="flex items-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap shrink-0">
              <Zap className="w-3 h-3 fill-[#08B9F5] text-[#08B9F5] shrink-0" />
              <span>IN THE SPOTLIGHT</span>
            </span>
          </div>

          {/* Event Meta */}
          <div className="flex flex-col gap-1 text-slate-200 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#08B9F5] shrink-0" />
              <span className="uppercase tracking-wide">{formatSpotlightDate(event.start_at)}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#08B9F5] shrink-0" />
              <span className="truncate">{event.location_name || 'Live Venue'}, {event.city || 'India'}</span>
            </div>
          </div>

          {/* Title */}
          <Link href={targetLink} className="block">
            <h2 className="font-extrabold text-2xl leading-tight tracking-tight text-white line-clamp-2">
              {event.title}
            </h2>
          </Link>

          {/* Description */}
          <p className="text-slate-300 text-sm line-clamp-2 leading-relaxed font-normal">
            {event.tagline || event.description || 'Live music, cultural programs, sports & spontaneous meetups.'}
          </p>

          {/* CTA Button: Min height 44px for accessibility touch targets */}
          <div className="pt-1">
            <Link
              href={targetLink}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#0038A8] hover:bg-[#173DAA] text-white text-sm font-bold shadow-md transition-all active:scale-95"
            >
              <span>Find your spot</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

