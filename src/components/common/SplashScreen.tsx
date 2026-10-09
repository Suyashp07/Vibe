'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Igniting vibes...');

  useEffect(() => {
    // Quick check: if already shown in this tab session recently, skip or show ultra-fast
    const hasSeen = sessionStorage.getItem('vibe_splash_shown');
    if (hasSeen) {
      setIsVisible(false);
      return;
    }

    // Step 1: Smooth progress animation
    const startTime = Date.now();
    const duration = 1200; // 1.2 seconds total presentation

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct > 35 && pct < 75) {
        setStatusText('Curating live experiences...');
      } else if (pct >= 75 && pct < 100) {
        setStatusText('Welcome to Vibe');
      }

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(() => {
          setIsVisible(false);
          try {
            sessionStorage.setItem('vibe_splash_shown', 'true');
          } catch {}
        }, 250);
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  // Allow clicking anywhere to skip immediately
  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('vibe_splash_shown', 'true');
    } catch {}
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="vibe-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[999999] bg-[#050507] flex flex-col items-center justify-center select-none overflow-hidden cursor-pointer"
        >
          {/* Ambient Lighting Orbs in Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.35, 0.55, 0.35],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[540px] h-[420px] sm:h-[540px] bg-gradient-to-tr from-[#FF5500]/25 via-[#E8621A]/20 to-amber-500/10 rounded-full blur-[110px]"
            />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
          </div>

          {/* Central Animated Brand Badge */}
          <div className="relative z-10 flex flex-col items-center text-center px-4">
            {/* Ripple Pulse Rings */}
            <div className="relative mb-6">
              <motion.div
                animate={{
                  scale: [1, 1.6, 2],
                  opacity: [0.6, 0.25, 0],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[#FF5500] to-amber-500 blur-md pointer-events-none"
              />
              <motion.div
                animate={{
                  scale: [1, 1.35, 1.7],
                  opacity: [0.7, 0.3, 0],
                }}
                transition={{ duration: 1.8, delay: 0.35, repeat: Infinity, ease: 'easeOut' }}
                className="absolute -inset-1.5 rounded-3xl bg-[#FF5500] blur-sm pointer-events-none"
              />

              {/* Glowing Icon Hub */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -12 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#FF5500] via-[#E8621A] to-[#FF8C42] p-[1.5px] shadow-[0_0_50px_rgba(255,85,0,0.5)] flex items-center justify-center"
              >
                <div className="w-full h-full rounded-[22px] bg-[#0A0A0E] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#FF5500]/25 to-transparent" />
                  <motion.div
                    animate={{
                      scale: [1, 1.12, 1],
                      filter: [
                        'drop-shadow(0 0 12px rgba(255,85,0,0.6))',
                        'drop-shadow(0 0 24px rgba(255,140,66,0.9))',
                        'drop-shadow(0 0 12px rgba(255,85,0,0.6))',
                      ],
                    }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-[#FF5500] fill-[#FF5500]" />
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Brand Logo & Name */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
              className="flex items-baseline font-black tracking-tight"
            >
              <span className="text-4xl sm:text-5xl text-white font-sans">vibe</span>
              <motion.span
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="ml-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#FF5500] shadow-[0_0_18px_#FF5500]"
              />
            </motion.div>

            {/* Sub-tagline */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-[10px] sm:text-[11px] font-bold tracking-[0.3em] uppercase text-neutral-400 mt-2 flex items-center gap-1.5"
            >
              <span>BY SWANIKI</span>
              <span className="w-1 h-1 rounded-full bg-neutral-600" />
              <span className="text-[#FF8C42] flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> LIVE PLATFORM
              </span>
            </motion.p>

            {/* Glowing Loading Bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 180 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-8 relative"
            >
              <div className="w-44 sm:w-52 h-1.5 rounded-full bg-white/10 overflow-hidden relative shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF5500] via-[#FF8C42] to-amber-400 shadow-[0_0_12px_rgba(255,85,0,0.8)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>

              {/* Status Message */}
              <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono mt-2.5 px-1">
                <span>{statusText}</span>
                <span className="font-bold text-neutral-400">{progress}%</span>
              </div>
            </motion.div>
          </div>

          {/* Quick Skip Hint at Bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="absolute bottom-6 text-[10px] text-neutral-500 uppercase tracking-widest font-mono"
          >
            Tap anywhere to enter
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
