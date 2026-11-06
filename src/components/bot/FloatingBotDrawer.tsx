'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles, MessageSquare, Send, ExternalLink } from 'lucide-react';
import BotCreateSection from '@/components/events/BotCreateSection';

interface FloatingBotDrawerProps {
  defaultOpen?: boolean;
}

export default function FloatingBotDrawer({ defaultOpen = false }: FloatingBotDrawerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

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
      {/* 1. FLOATING ACTION BUTTON (Right corner of Discover screen)               */}
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
              type="button"
              onClick={() => setIsOpen(true)}
              className="group relative flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#0038A8] via-[#0D47A1] to-[#002D80] hover:from-[#0044CC] hover:to-[#0038A8] text-white shadow-[0_12px_32px_rgba(0,56,168,0.45)] hover:shadow-[0_16px_40px_rgba(0,56,168,0.6)] border border-white/25 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-md"
              title="Open Vibe Event Bot"
              aria-label="Open Vibe Event Bot"
            >
              {/* Subtle ambient ripple ring */}
              <span className="absolute -inset-1 rounded-full bg-[#0038A8]/30 animate-ping pointer-events-none opacity-40 duration-1000" />

              {/* Bot Icon with Live Pulse Indicator */}
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 shrink-0">
                <Bot className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0038A8] shadow-xs" />
              </div>

              {/* Typography / Label */}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xs sm:text-sm font-black tracking-tight text-white drop-shadow-xs">
                    Vibe Bot
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    Live
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-medium text-white/80 tracking-normal mt-0.5">
                  Host in 60s
                </span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. ANIMATED SLIDE-OVER DRAWER (From right part of the screen)             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              aria-hidden="true"
            />

            {/* Slide-over Drawer Sheet */}
            <motion.aside
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className="relative w-full max-w-[620px] h-full bg-white dark:bg-[#070D1B] border-l border-slate-200 dark:border-white/10 shadow-[0_0_60px_rgba(0,10,30,0.6)] flex flex-col z-10 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Vibe Event Bot"
            >
              {/* Drawer Top Header */}
              <div className="shrink-0 px-5 sm:px-7 py-4 border-b border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#091224]/90 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0038A8] to-[#002570] flex items-center justify-center text-white shadow-md border border-white/20">
                    <Bot className="w-5 h-5" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-[#070D1B]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
                        Vibe Event Bot
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Message on WhatsApp or Telegram · Live in 60s
                    </p>
                  </div>
                </div>

                {/* Close Drawer Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close drawer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4 sm:py-6 bot-drawer-view">
                <BotCreateSection />
              </div>

              {/* Drawer Bottom Quick Action Bar */}
              <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200/90 dark:border-white/10 bg-slate-50/95 dark:bg-[#081224]/95 backdrop-blur-md flex items-center gap-2.5">
                <a
                  href="https://wa.me/919183123093?text=Vibe%2FEvents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 text-center"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Open WhatsApp</span>
                </a>

                <a
                  href="https://t.me/VibeCurator_bot?start=Vibe_Events"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 text-center"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Open Telegram</span>
                </a>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

