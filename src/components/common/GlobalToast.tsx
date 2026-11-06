'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Check, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastData {
  id: number;
  message: string;
  detail?: string;
  type: 'saved' | 'removed' | 'info';
  actionHref?: string;
  actionLabel?: string;
}

export default function GlobalToast() {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleWishlistUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        eventId: string;
        eventTitle?: string;
        isWishlisted: boolean;
      }>;
      const { eventTitle, isWishlisted } = customEvent.detail || {};

      clearTimeout(timer);

      setToast({
        id: Date.now(),
        message: isWishlisted ? 'Event saved' : 'Event removed from saved',
        detail: eventTitle || undefined,
        type: isWishlisted ? 'saved' : 'removed',
        actionHref: isWishlisted ? '/profile/saved' : undefined,
        actionLabel: isWishlisted ? 'View saved events' : undefined,
      });

      timer = setTimeout(() => {
        setToast(null);
      }, 3500);
    };

    const handleGenericToast = (e: Event) => {
      const customEvent = e as CustomEvent<{
        message: string;
        detail?: string;
        type?: 'saved' | 'removed' | 'info';
        actionHref?: string;
        actionLabel?: string;
      }>;
      const { message, detail, type = 'info', actionHref, actionLabel } = customEvent.detail || {};

      clearTimeout(timer);

      setToast({
        id: Date.now(),
        message: message || 'Notification',
        detail,
        type,
        actionHref,
        actionLabel,
      });

      timer = setTimeout(() => {
        setToast(null);
      }, 3500);
    };

    window.addEventListener('vibe:wishlist-updated', handleWishlistUpdate);
    window.addEventListener('vibe:toast', handleGenericToast);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('vibe:wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('vibe:toast', handleGenericToast);
    };
  }, []);

  return (
    <div className="fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-[999999] pointer-events-none px-4 w-full max-w-md flex justify-center">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/95 dark:bg-[#07133A]/95 text-slate-900 dark:text-white border border-slate-200/90 dark:border-white/15 shadow-xl shadow-black/15 backdrop-blur-md"
          >
            {/* Leading Icon */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === 'saved'
                  ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400'
                  : 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400'
              }`}
            >
              {toast.type === 'saved' ? (
                <Heart className="w-3.5 h-3.5 fill-current stroke-[2.2]" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </div>

            {/* Message Content */}
            <div className="flex flex-col text-left min-w-0 pr-1">
              <span className="text-xs font-bold leading-tight truncate">
                {toast.message}
              </span>
              {toast.detail && (
                <span className="text-[11px] text-slate-500 dark:text-white/60 truncate max-w-[200px] sm:max-w-[260px]">
                  {toast.detail}
                </span>
              )}
            </div>

            {/* Action Link (e.g., "View in profile") */}
            {toast.actionHref && (
              <Link
                href={toast.actionHref}
                onClick={() => setToast(null)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0038A8] dark:text-[#38bdf8] hover:underline shrink-0 ml-1 cursor-pointer"
              >
                <span>{toast.actionLabel || 'View'}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white transition-colors shrink-0 cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

