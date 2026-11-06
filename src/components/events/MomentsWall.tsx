'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Star, Zap, ArrowRight } from 'lucide-react';
import { MEMORIES_COLUMNS, MemoryCardItem } from '@/data/memoriesWallData';

export default function MomentsWall() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Butter-smooth continuous auto-scroll animation with infinite wrap
  useEffect(() => {
    if (!isClient) return;
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    const speed = 0.75; // Pixels per frame

    const step = () => {
      if (!isHoveredRef.current && !isDraggingRef.current && container) {
        container.scrollLeft += speed;

        // Wrap around at the midpoint (since columns are duplicated 2x)
        const halfWidth = container.scrollWidth / 2;
        if (halfWidth > 0 && container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isClient]);

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftStartRef.current = container.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    container.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Button manual scroll handlers
  const scrollByAmount = (offset: number) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Duplicated list of columns for seamless infinite scroll
  const duplicatedColumns = [...MEMORIES_COLUMNS, ...MEMORIES_COLUMNS];

  return (
    <div className="memories-wrapper w-full py-10 sm:py-14 my-6 select-none overflow-hidden relative transition-colors duration-300">
      {/* Ambient Soft Pinkish / Peach Accents */}
      <div className="pointer-events-none absolute -top-20 left-1/4 w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(244,114,182,0.18),transparent_70%)] blur-3xl -z-0" />
      <div className="pointer-events-none absolute -bottom-20 right-1/4 w-[500px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.18),transparent_70%)] blur-3xl -z-0" />

      {/* 1. Header Section */}
      <div className="memories-header text-center mb-8 px-4 relative z-10">
        <h2 className="memories-title text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#07133A] dark:text-white tracking-tight leading-tight">
          The Moments That Make Vibe.
        </h2>
        <p className="memories-subtitle text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 mt-2 font-medium">
          Real people. Spontaneous hangouts. Unforgettable moments.
        </p>
      </div>

      {/* 2. Marquee / Image Wall Root */}
      <div
        className="memories-marquee-root relative w-full group/memories"
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          handleMouseUpOrLeave();
        }}
      >
        {/* Soft Left Edge Gradient Fade */}
        <div
          className="memories-edge-left pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-36 z-10 rounded-l-[28px] transition-opacity duration-300"
          style={{
            background:
              'linear-gradient(to right, #F5F3FF 0%, rgba(245, 243, 255, 0.85) 40%, rgba(245, 243, 255, 0) 100%)',
          }}
        />

        {/* Soft Right Edge Gradient Fade */}
        <div
          className="memories-edge-right pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-36 z-10 rounded-r-[28px] transition-opacity duration-300"
          style={{
            background:
              'linear-gradient(to left, #FFE7E3 0%, rgba(255, 231, 227, 0.85) 40%, rgba(255, 231, 227, 0) 100%)',
          }}
        />

        {/* Floating Left Button */}
        <button
          type="button"
          onClick={() => scrollByAmount(-340)}
          aria-label="Scroll memories left"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 dark:bg-[#111318]/95 hover:bg-white text-slate-700 dark:text-slate-200 hover:text-[#0066F5] shadow-md border border-slate-200/90 dark:border-white/10 flex items-center justify-center opacity-0 group-hover/memories:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Floating Right Button */}
        <button
          type="button"
          onClick={() => scrollByAmount(340)}
          aria-label="Scroll memories right"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 dark:bg-[#111318]/95 hover:bg-white text-slate-700 dark:text-slate-200 hover:text-[#0066F5] shadow-md border border-slate-200/90 dark:border-white/10 flex items-center justify-center opacity-0 group-hover/memories:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-xs"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Continuous Horizontal Scroll Track */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          className="memories-main-container select-none"
          style={{
            overflowX: 'scroll',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: 'grab',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            className="memories-columns-container"
            style={{
              display: 'flex',
              gap: '22px',
              width: 'max-content',
            }}
          >
            {duplicatedColumns.map((col, colIdx) => (
              <div
                key={`mem-col-${colIdx}`}
                className="memories-column"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  flexShrink: 0,
                  width: '228px',
                  justifyContent: 'center',
                }}
              >
                {col.map((card, cardIdx) => (
                  <SingleMemoryCard key={`card-${colIdx}-${cardIdx}`} card={card} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SingleMemoryCard({ card }: { card: MemoryCardItem }) {
  const isTall = card.isTall;
  const isReview = card.type === 'review';
  const heightClass = isTall ? 'memories-card-tall' : 'memories-card-short';

  if (isReview) {
    return (
      <div
        className={`memories-card memories-card-review ${heightClass} relative rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg group bg-white border border-slate-100 flex flex-col justify-center`}
      >
        {/* Review Card Content */}
        <div className="memories-card-review-content flex-1 flex flex-col justify-between p-4">
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            {/* 5 Stars */}
            <div className="memories-stars flex gap-1 justify-center mb-2">
              {[...Array(card.stars || 5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            {/* Review Quote */}
            <p className="memories-review-text text-xs sm:text-sm font-semibold text-slate-800 italic line-clamp-4 leading-relaxed">
              &quot;{card.reviewText}&quot;
            </p>
          </div>

          {/* User Info bottom */}
          <div className="memories-user-info flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
            {card.avatar && (
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                <Image
                  src={card.avatar}
                  alt={card.userName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <div className="memories-user-name text-xs font-bold text-slate-800 truncate">
                {card.userName}
              </div>
              <div className="memories-user-time text-[10px] text-slate-400">
                {card.userTime}
              </div>
            </div>
          </div>
        </div>

        {/* Hover Event Overlay */}
        <div className="memories-event-info absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl z-20 text-center">
          <div className="memories-event-icon w-10 h-10 mb-2 flex items-center justify-center bg-white/20 rounded-xl border border-white/40 text-white">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="memories-event-name font-bold text-sm sm:text-base text-white leading-tight mb-1">
            {card.eventName}
          </div>
          {card.eventLocation && (
            <div className="memories-event-location text-xs text-white/90 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-white/80 shrink-0" />
              <span className="truncate max-w-[180px]">{card.eventLocation}</span>
            </div>
          )}
          <Link
            href="/vibes"
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08B9F5] hover:bg-[#0066F5] text-white text-[11px] font-bold shadow-md transition-all active:scale-95"
          >
            <span>View in Vibe Instant</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Photo Card
  return (
    <div
      className={`memories-card ${heightClass} relative rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-2xl group bg-slate-900 border border-white/15`}
    >
      {/* Background Photo */}
      {card.image && (
        <Image
          src={card.image}
          alt={card.userName || card.eventName}
          fill
          unoptimized
          className="memories-card-image object-cover group-hover:scale-105 group-hover:blur-sm transition-all duration-300"
        />
      )}

      {/* Default Bottom Overlay: Avatar + Name + Time */}
      <div className="memories-card-overlay absolute bottom-0 left-0 right-0 p-3 flex items-center gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:opacity-0 transition-opacity duration-200 z-10">
        {card.avatar && (
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/70 shrink-0">
            <Image
              src={card.avatar}
              alt={card.userName}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          <div className="memories-user-name-light text-xs font-bold text-white drop-shadow truncate">
            {card.userName}
          </div>
          <div className="memories-user-time-light text-[10px] text-white/80 drop-shadow">
            {card.userTime}
          </div>
        </div>
      </div>

      {/* Hover Event Overlay */}
      <div className="memories-event-info absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/55 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl z-20 text-center">
        <div className="memories-event-icon w-10 h-10 mb-2 flex items-center justify-center bg-white/20 rounded-xl border border-white/40 text-white">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div className="memories-event-name font-bold text-sm sm:text-base text-white leading-tight mb-1">
          {card.eventName}
        </div>
        {card.eventLocation && (
          <div className="memories-event-location text-xs text-white/90 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3 text-white/80 shrink-0" />
            <span className="truncate max-w-[180px]">{card.eventLocation}</span>
          </div>
        )}
        <Link
          href="/vibes"
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08B9F5] hover:bg-[#0066F5] text-white text-[11px] font-bold shadow-md transition-all active:scale-95"
        >
          <span>View in Vibe Instant</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
