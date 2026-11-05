'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getFlashVibeEvents, isEventExpired, subscribeToStore } from '@/lib/store';

export interface VibeMomentItem {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string;
}

export interface ColumnPair {
  top: VibeMomentItem;
  topTall: boolean;
  bottom: VibeMomentItem;
  bottomTall: boolean;
}

export default function MomentsWall() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<ColumnPair[]>([]);

  // Load real reel images dynamically from Flash Vibe / Reel section
  useEffect(() => {
    const loadVibes = () => {
      try {
        const flashVibes = getFlashVibeEvents()
          .filter((e) => !isEventExpired(e))
          .filter((e) => Boolean(e.cover_image_url));

        const reelItems: VibeMomentItem[] = flashVibes.map((e) => ({
          id: e.id,
          slug: e.slug || e.id,
          title: e.title || 'Vibe Moment',
          cover_image_url:
            e.cover_image_url ||
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
        }));

        if (reelItems.length === 0) {
          setColumns([]);
          return;
        }

        // Pair real reels into top & bottom columns with alternating heights
        const pairs: ColumnPair[] = [];
        for (let i = 0; i < reelItems.length; i += 2) {
          const isEven = (i / 2) % 2 === 0;
          pairs.push({
            top: reelItems[i],
            topTall: isEven,
            bottom: reelItems[i + 1] || reelItems[0],
            bottomTall: !isEven,
          });
        }

        setColumns(pairs);
      } catch (err) {
        setColumns([]);
      }
    };

    loadVibes();
    const unsub = subscribeToStore(loadVibes);
    return () => unsub();
  }, []);

  // Manual scroll actions: smooth left / right when user clicks arrow buttons
  const handleScrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (columns.length === 0) return null;

  return (
    <section
      className="relative w-full py-10 sm:py-14 overflow-hidden rounded-3xl my-8 transition-colors duration-300"
      style={{
        background:
          'radial-gradient(circle at 50% 30%, rgba(28, 198, 244, 0.16) 0%, rgba(8, 185, 245, 0.05) 55%, transparent 75%), linear-gradient(110deg, #EDF5FF 0%, #E2F0FE 48%, #EBF7FF 100%)',
      }}
    >
      {/* 1. Header Section - Title in a single line */}
      <div className="text-center max-w-3xl mx-auto px-4 mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[38px] font-black text-[#07133A] dark:text-white tracking-tight leading-tight">
          The Moments That Make Vibe.
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Real people. Real experiences. Unforgettable moments.
        </p>
      </div>

      {/* 2. Static / Pure User-Driven Column Wall Container */}
      <div className="relative w-full px-2 sm:px-6">
        {/* Floating Left Arrow Button for manual scrolling */}
        {columns.length > 2 && (
          <button
            type="button"
            onClick={handleScrollLeft}
            aria-label="Scroll moments left"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white text-slate-700 hover:text-[#0066F5] shadow-[0_4px_20px_rgba(0,0,0,0.18)] border border-slate-200/90 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </button>
        )}

        {/* Floating Right Arrow Button for manual scrolling */}
        {columns.length > 2 && (
          <button
            type="button"
            onClick={handleScrollRight}
            aria-label="Scroll moments right"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white text-slate-700 hover:text-[#0066F5] shadow-[0_4px_20px_rgba(0,0,0,0.18)] border border-slate-200/90 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </button>
        )}

        {/* Horizontal Container: 100% STATIC (No CSS/JS auto-scroll, only scrolls on user demand) */}
        <div
          ref={containerRef}
          className="overflow-x-auto scroll-smooth no-scrollbar w-full"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            className="flex items-center gap-4 sm:gap-6 py-2 px-4 sm:px-8 w-max min-w-full justify-start sm:justify-center"
            style={{
              animation: 'none !important',
              transform: 'none !important',
            }}
          >
            {columns.map((col, idx) => (
              <div
                key={`col-${idx}`}
                className="w-[172px] sm:w-[228px] flex flex-col gap-4 sm:gap-6 shrink-0 justify-center"
                style={{
                  animation: 'none !important',
                  transform: 'none !important',
                }}
              >
                {/* Top Card */}
                <MemoriesCard item={col.top} isTall={col.topTall} />

                {/* Bottom Card */}
                <MemoriesCard item={col.bottom} isTall={col.bottomTall} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Individual Pure Photo Card: clean photo at rest, ONLY event title on hover!
function MemoriesCard({ item, isTall }: { item: VibeMomentItem; isTall: boolean }) {
  const heightClass = isTall
    ? 'h-[250px] sm:h-[316px]'
    : 'h-[180px] sm:h-[228px]';

  return (
    <Link
      href={`/vibes?vibe=${encodeURIComponent(item.slug || item.id)}`}
      className={`group relative ${heightClass} w-full rounded-2xl overflow-hidden shadow-[0_8px_25px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.07)] hover:shadow-[0_20px_40px_rgba(15,23,42,0.22)] transition-all duration-300 shrink-0 cursor-pointer bg-slate-900 border border-slate-200/80 dark:border-white/10 block`}
      style={{
        animation: 'none !important',
      }}
    >
      {/* Pure Photo Image - Scales slightly on hover */}
      <Image
        src={item.cover_image_url || ''}
        alt={item.title || 'Vibe Moment'}
        fill
        sizes="(max-width: 640px) 172px, 228px"
        className="object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
      />

      {/* Hover Overlay: ONLY event name is shown! */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex items-center justify-center text-center z-10 pointer-events-none">
        <h4 className="font-extrabold text-xs sm:text-sm text-white leading-snug drop-shadow-md px-2">
          {item.title}
        </h4>
      </div>
    </Link>
  );
}
