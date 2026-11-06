'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EventItem } from '@/types';
import { getPosterSources } from '@/lib/posters/posterSources';
import EventHeroSlide from './EventHeroSlide';

export interface EventHeroProps {
  events: EventItem[];
  autoAdvanceInterval?: number;
}

export default function EventHero({ events, autoAdvanceInterval = 6500 }: EventHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = events?.length || 0;

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleSelectSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Keyboard navigation: Left and Right arrow keys
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    },
    [handleNext, handlePrev]
  );

  // Auto-advance loop (paused when hovered or touched)
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setTimeout(() => {
      handleNext();
    }, autoAdvanceInterval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPaused, total, autoAdvanceInterval, handleNext]);

  if (!events || events.length === 0) return null;

  const currentEvent = events[currentIndex] || events[0];
  const currentPoster = getPosterSources(currentEvent);

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Spotlight Featured Events"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="w-full relative focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0038A8] rounded-3xl select-none overflow-hidden bg-slate-50/90 dark:bg-[#070D1B]/90 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.04)] dark:shadow-2xl transition-colors duration-300"
    >
      {/* ========================================================================= */}
      {/* SOFT AMBIENT BLURRED BACKDROP (District-style soft natural atmosphere)     */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <Image
          src={currentPoster.hero}
          alt=""
          fill
          sizes="120px"
          className="object-cover scale-150 blur-3xl opacity-20 dark:opacity-30 saturate-150 transform-gpu transition-all duration-700"
          priority={false}
        />
        {/* Soft natural gradient overlay fading seamlessly into the page */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/40 dark:from-[#070D1B]/95 dark:via-[#070D1B]/85 dark:to-[#070D1B]/50" />
      </div>

      {/* ========================================================================= */}
      {/* DISTRICT-STYLE LEFT & RIGHT NAVIGATION ARROWS                             */}
      {/* ========================================================================= */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="hidden sm:flex absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white shadow-md border border-slate-200/80 dark:border-white/10 items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
            aria-label="Previous event"
            title="Previous event"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="hidden sm:flex absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white shadow-md border border-slate-200/80 dark:border-white/10 items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
            aria-label="Next event"
            title="Next event"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </>
      )}

      {/* ========================================================================= */}
      {/* SLIDE CONTENT CONTAINER (Left text + Right floating poster)               */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full px-4 sm:px-14 lg:px-20 pt-6 sm:pt-12 pb-5 sm:pb-6">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentEvent.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -40 || info.velocity.x < -300) {
                handleNext();
              } else if (info.offset.x > 40 || info.velocity.x > 300) {
                handlePrev();
              }
            }}
            className="w-full cursor-grab active:cursor-grabbing"
          >
            <EventHeroSlide
              event={currentEvent}
              priority={currentIndex === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* DISTRICT-STYLE CENTERED BOTTOM CAROUSEL DOTS                              */}
      {/* ========================================================================= */}
      {total > 1 && (
        <div className="relative z-20 flex items-center justify-center gap-1.5 pb-6">
          {events.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === i
                  ? 'w-6 bg-slate-900 dark:bg-white shadow-xs'
                  : 'w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-white/30 dark:hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
