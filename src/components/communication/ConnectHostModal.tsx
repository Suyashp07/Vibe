'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle2,
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
 * ConnectHostModal: Displays an Upcoming Feature announcement modal
 * for direct host contact throughout the platform, disabling the live feature for now.
 */
export default function ConnectHostModal({
  event,
  isOpen,
  onClose,
}: ConnectHostModalProps) {
  const [mounted, setMounted] = useState(false);

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

  const eventTitle = event?.title || 'this event';
  const hostName = event?.organizer_name || 'Event Host';

  const modalBody = (
    <div
      className="dark-dialog fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        className="dark-dialog-content relative w-full max-w-md bg-[#0E1118] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer z-50 pointer-events-auto border border-white/10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 pointer-events-none" />
        </button>

        {/* Centered Graphic Header */}
        <div className="text-center pt-2 pb-1 relative z-10">
          <div className="relative inline-block mb-3.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5500]/20 to-amber-500/15 border border-[#FF5500]/40 flex items-center justify-center mx-auto text-[#FF5500] shadow-[0_0_30px_rgba(255,85,0,0.3)]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-black" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upcoming Feature</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Direct Host Messaging
          </h2>
          <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto">
            Direct connection with <strong className="text-white/90">{hostName}</strong> for <span className="text-white/80 italic">"{eventTitle}"</span> is coming soon!
          </p>
        </div>

        {/* Feature Preview Cards */}
        <div className="my-5 space-y-2.5 relative z-10">
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white">100% Anti-Spam & Private</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Your phone number and personal info remain 100% hidden and secure.</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-xl bg-[#FF5500]/15 border border-[#FF5500]/30 text-[#FF5500] flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white">Real-Time Host Q&A</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Instant clarifications on venue directions, dress code, timing, and entry guidelines.</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white">Pass-Linked Coordination</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Your confirmed passes automatically authenticate your questions with the host.</p>
            </div>
          </div>
        </div>

        {/* Disabled Notice */}
        <div className="py-2.5 px-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2 text-xs text-amber-300 font-medium mb-4 relative z-10">
          <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Feature disabled during private rollout</span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#FF8C42] hover:opacity-95 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-[#FF5500]/25 active:scale-[0.98] relative z-10 flex items-center justify-center gap-2"
        >
          <span>Got it</span>
        </button>
      </div>
    </div>
  );

  return mounted ? createPortal(modalBody, document.body) : null;
}
