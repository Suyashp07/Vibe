'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const STORAGE_KEY = 'vibe_splash_seen';
const DISPLAY_DURATION_MS = 650; // Snappy 650ms intro on first-ever visit
const FADE_DURATION_S = 0.28;

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore storage exceptions
    }
  }, []);

  useEffect(() => {
    // Only show on first-ever visit in current session/browser
    try {
      const hasSeenSession = sessionStorage.getItem(STORAGE_KEY);
      const hasSeenLocal = localStorage.getItem(STORAGE_KEY);
      if (hasSeenSession || hasSeenLocal) {
        return;
      }
    } catch {
      return;
    }

    setIsVisible(true);

    const timer = setTimeout(() => {
      handleDismiss();
    }, DISPLAY_DURATION_MS);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDismiss]);

  const effectiveDuration = shouldReduceMotion ? 0 : FADE_DURATION_S;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="vibe-splash-screen"
          role="dialog"
          aria-modal="true"
          aria-label="Vibe intro screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: effectiveDuration, ease: 'easeOut' }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[999999] bg-[#050505]/95 backdrop-blur-2xl flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden px-4"
        >
          {/* Soft orange radial glow behind the logo (#E8621A) */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(232, 98, 26, 0.22) 0%, rgba(232, 98, 26, 0.05) 50%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />

          {/* Central content container */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Wordmark: "vibe." in Outfit Bold with "i" and "." in #E8621A */}
            <h1
              className="text-6xl sm:text-7xl md:text-8xl tracking-tight leading-none select-none flex items-baseline justify-center"
              style={{
                fontFamily: 'var(--font-outfit), Outfit, sans-serif',
                fontWeight: 700,
              }}
            >
              <span className="text-white">v</span>
              <span className="text-[#E8621A]">i</span>
              <span className="text-white">be</span>
              <span className="text-[#E8621A]">.</span>
            </h1>

            {/* Small uppercase "BY SWANIKI" */}
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 mt-2 sm:mt-2.5">
              BY SWANIKI
            </p>

            {/* Tagline */}
            <p className="text-xs sm:text-sm font-normal text-slate-300 mt-3 tracking-wide">
              Good people. Real connections.
            </p>

            {/* Thin animated loading bar under the tagline */}
            <div
              className="w-40 sm:w-48 h-[2px] bg-white/10 rounded-full overflow-hidden mt-5 relative"
              role="progressbar"
              aria-label="Loading Vibe"
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
                }
                className="h-full bg-[#E8621A] rounded-full shadow-[0_0_8px_rgba(232,98,26,0.7)]"
              />
            </div>
          </div>

          <div className="absolute bottom-6 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono pointer-events-none opacity-60">
            Tap anywhere to enter
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
