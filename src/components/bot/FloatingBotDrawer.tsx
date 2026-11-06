'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import BotCreateSection from '@/components/events/BotCreateSection';

interface FloatingBotDrawerProps {
  defaultOpen?: boolean;
}

export default function FloatingBotDrawer({ defaultOpen = false }: FloatingBotDrawerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && window.location.search.includes('open_bot=1')) {
      setIsOpen(true);
    }

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    const handleToggle = () => setIsOpen((prev) => !prev);

    window.addEventListener('vibe:open_bot_drawer', handleOpen);
    window.addEventListener('vibe:close_bot_drawer', handleClose);
    window.addEventListener('vibe:toggle_bot_drawer', handleToggle);

    // Keyboard support: Escape to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('vibe:open_bot_drawer', handleOpen);
      window.removeEventListener('vibe:close_bot_drawer', handleClose);
      window.removeEventListener('vibe:toggle_bot_drawer', handleToggle);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Lock body scroll only when drawer is active on mobile
  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.removeProperty('overflow');
    }
    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FLOATING ACTION BUTTON (Small Symbol of Bot, No Words)                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-20 right-4 sm:bottom-7 sm:right-7 z-40 pointer-events-auto"
          >
            <button
              id="vt-bot"
              type="button"
              onClick={() => setIsOpen(true)}
              className="group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-[#0038A8] via-[#0D47A1] to-[#002570] hover:from-[#0044CC] hover:to-[#0038A8] text-white shadow-[0_8px_24px_rgba(0,56,168,0.45)] hover:shadow-[0_12px_32px_rgba(0,56,168,0.6)] border border-white/25 active:scale-90 hover:scale-105 transition-all duration-300 cursor-pointer backdrop-blur-md"
              title="Vibe Event Bot"
              aria-label="Vibe Event Bot"
            >
              {/* Subtle ambient ripple ring */}
              <span className="absolute -inset-1 rounded-full bg-[#0038A8]/30 animate-ping pointer-events-none opacity-40 duration-1000" />

              {/* Bot symbol only */}
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-12 transition-transform duration-300 stroke-[2.2]" />

              {/* Small online green indicator dot */}
              <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0038A8] shadow-xs" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. COMPACT FLOATING DIALOG (Opens only required content, no wasted space)  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center sm:items-end justify-center sm:justify-end p-3 sm:p-6 pointer-events-none">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer pointer-events-auto"
              aria-hidden="true"
            />

            {/* Compact Floating Dialog: ONLY takes required height, cut from top, no wasted bottom space */}
            <motion.aside
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350, mass: 0.7 }}
              className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-[760px] h-auto max-h-[88vh] bg-white dark:bg-[#070D1B] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/15 shadow-[0_20px_60px_rgba(0,10,30,0.55)] flex flex-col z-10 overflow-hidden pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Vibe Event Bot"
            >
              {/* Top Header Bar */}
              <div className="shrink-0 px-5 sm:px-6 py-3 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-[#091224]/90 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#0038A8] to-[#002570] flex items-center justify-center text-white shadow-sm border border-white/20">
                    <Bot className="w-4 h-4 stroke-[2.2]" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white dark:border-[#070D1B]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-950 dark:text-white tracking-tight">
                        Vibe Event Bot
                      </h3>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Message on WhatsApp or Telegram · Live in 60s
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close dialog"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Scrollable Content (Fit to content height, no wasted bottom space) */}
              <div className="overflow-y-auto overscroll-contain px-4 sm:px-6 py-3.5 bot-drawer-view">
                <BotCreateSection />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

