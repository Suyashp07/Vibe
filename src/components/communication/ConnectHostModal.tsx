'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MessageCircle,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Bell,
} from 'lucide-react';
import { EventItem } from '@/types';

interface ConnectHostModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  guestEmail?: string;
  guestName?: string;
}

/**
 * ConnectHostModal: Displays an announcement popup indicating that
 * the "Connect with Host" feature will be available soon.
 */
export default function ConnectHostModal({
  event,
  isOpen,
  onClose,
}: ConnectHostModalProps) {
  const [mounted, setMounted] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const eventTitle = event?.title || 'this vibe';
  const hostName = event?.organizer_name || 'Event Host';
  const locationName = event?.location_name || event?.city || 'Venue';

  const modalBody = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#0D1017] border border-slate-200 dark:border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-900 dark:text-white overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#08B9F5]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200 dark:bg-white/10 dark:hover:bg-white/20 active:scale-95 flex items-center justify-center dark:text-white/70 dark:hover:text-white transition-all cursor-pointer z-50 pointer-events-auto border dark:border-white/10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 pointer-events-none" />
        </button>

        {/* Centered Graphic Header */}
        <div className="text-center pt-2 pb-1 relative z-10">
          <div className="relative inline-block mb-3.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#08B9F5]/20 via-amber-500/20 to-[#075CE5]/10 border border-[#08B9F5]/40 flex items-center justify-center mx-auto text-[#08B9F5] shadow-[0_0_30px_rgba(8,185,245,0.35)]">
              <MessageCircle className="w-8 h-8 text-[#08B9F5] dark:text-[#00D5E8]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span>Coming Soon</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">
            Connect with Host
          </h2>
          <p className="text-xs text-amber-700 dark:text-amber-200/90 font-medium mt-1">
            This feature will be available soon!
          </p>
        </div>

        {/* Informative Card */}
        <div className="my-5 p-4 rounded-2xl bg-slate-50 dark:bg-gradient-to-br dark:from-white/[0.06] dark:to-white/[0.02] border border-slate-200 dark:border-white/10 text-left relative z-10 space-y-3">
          <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
            Direct real-time coordination with <strong className="text-slate-900 dark:text-white font-semibold">{hostName}</strong> is arriving in the upcoming Vibe release!
          </p>

          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
            Soon, you will be able to message the host directly, get live updates about venue spots, entry instructions, and coordinate meetups with fellow attendees.
          </p>

          {/* Event Context Pill */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 truncate max-w-[200px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#08B9F5]" />
              <span className="truncate text-slate-900 dark:text-white font-medium">{eventTitle}</span>
            </div>
            <div className="text-amber-600 dark:text-amber-400 font-mono text-[10px] uppercase font-bold shrink-0">
              Verified Host
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2 relative z-10">
          <button
            type="button"
            onClick={() => {
              setNotified(true);
              setTimeout(() => {
                onClose();
              }, 1200);
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#08B9F5] to-[#075CE5] hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#08B9F5]/25 transition-all cursor-pointer"
          >
            {notified ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>We'll notify you!</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-white fill-white/20" />
                <span>Notify me when it's live</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/60 dark:hover:text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modalBody, document.body) : null;
}

