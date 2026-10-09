'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const STORAGE_KEY = 'vibe_splash_seen';
const DISPLAY_DURATION_MS = 2000;
const FADE_DURATION_S = 0.5;

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [skipExitAnimation, setSkipExitAnimation] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Ignore sessionStorage exceptions (e.g. private mode restrictions)
    }
  }, []);

  useEffect(() => {
    // Check if splash screen was already shown in this tab session
    try {
      const hasSeen = sessionStorage.getItem(STORAGE_KEY);
      if (hasSeen) {
        setSkipExitAnimation(true);
        setIsVisible(false);
        return;
      }
    } catch {
      // If sessionStorage fails, continue to show splash once
    }

    // Auto-dismiss after ~2 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, DISPLAY_DURATION_MS);

    // Keyboard support: allow ESC to skip immediately
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

  // Lock page scroll while visible, restore immediately upon dismissal
  useEffect(() => {
    if (!isVisible) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      return;
    }

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isVisible]);

  const effectiveDuration = shouldReduceMotion || skipExitAnimation ? 0 : FADE_DURATION_S;

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
          className="fixed inset-0 z-[999999] bg-[#0F172A] flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden px-4"
        >
          {/* Soft orange radial glow behind the logo (#E8621A) */}
          <motion.div
            aria-hidden="true"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: [1, 1.08, 1],
                    opacity: [0.75, 1, 0.75],
                  }
            }
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] md:w-[520px] md:h-[520px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(232, 98, 26, 0.28) 0%, rgba(232, 98, 26, 0.10) 45%, rgba(15, 23, 42, 0) 70%)',
              filter: 'blur(35px)',
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

            {/* Small uppercase "BY SWANIKI" in gray letter-spaced text */}
            <p className="text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 mt-3 sm:mt-3.5">
              BY SWANIKI
            </p>

            {/* Tagline: "Good people. Real connections." */}
            <p className="text-sm sm:text-base font-normal text-slate-300 mt-4 sm:mt-5 tracking-wide">
              Good people. Real connections.
            </p>

            {/* Thin animated loading bar under the tagline */}
            <div
              className="w-48 sm:w-56 h-[2px] bg-slate-800/80 rounded-full overflow-hidden mt-6 sm:mt-7 relative"
              role="progressbar"
              aria-label="Loading Vibe"
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 1.9, ease: [0.25, 0.1, 0.25, 1] }
                }
                className="h-full bg-[#E8621A] rounded-full shadow-[0_0_8px_rgba(232,98,26,0.7)]"
              />
            </div>
          </div>

          {/* Subtle dismiss hint at bottom */}
          <div className="absolute bottom-6 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-slate-500 font-mono pointer-events-none opacity-60">
            Tap anywhere to enter
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
