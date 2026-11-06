'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventItem } from '@/types';
import EventHeroSlide from './EventHeroSlide';

export interface EventHeroProps {
  events: EventItem[];
  autoAdvanceInterval?: number;
}

export default function EventHero({ events, autoAdvanceInterval = 6000 }: EventHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = events.length;

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

  // Keyboard navigation: Left and Right arrow keys with focus-visible
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

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Spotlight Featured Events"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="w-full relative focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#08B9F5] rounded-3xl select-none"
    >
      <div className="relative w-full">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={currentEvent.id}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
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
              slideIndex={currentIndex}
              totalSlides={total}
              onPrev={handlePrev}
              onNext={handleNext}
              onSelectSlide={handleSelectSlide}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

