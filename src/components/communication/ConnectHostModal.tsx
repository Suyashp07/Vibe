'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Send,
  MessageSquare,
  Lock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { EventItem } from '@/types';
import EventConversationModal from '@/components/communication/EventConversationModal';

interface ConnectHostModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  guestEmail?: string;
  guestName?: string;
}

/**
 * ConnectHostModal: Anti-scam, privacy-first communication portal between Host and Admitted Guests.
 * Offers dual channels:
 * 1. Host-controlled Telegram Subgroup (Join-Request gated, phone numbers 100% hidden)
 * 2. Vibe Web Console (In-browser direct messaging for guests without Telegram)
 */
export default function ConnectHostModal({
  event,
  isOpen,
  onClose,
  guestEmail = '',
  guestName = '',
}: ConnectHostModalProps) {
  const [activeView, setActiveView] = useState<'channel_select' | 'web_chat'>('channel_select');

  if (!isOpen || !event) return null;

  // Telegram bot link with deep-linked event payload
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'VibeConsoleBot';
  const telegramJoinUrl = `https://t.me/${telegramBotUsername}?start=event_${event.slug || event.id}`;

  const handleOpenTelegram = () => {
    window.open(telegramJoinUrl, '_blank', 'noopener,noreferrer');
  };

  if (activeView === 'web_chat') {
    return (
      <EventConversationModal
        event={event}
        isOpen={isOpen}
        onClose={() => {
          setActiveView('channel_select');
          onClose();
        }}
        guestEmail={guestEmail}
        guestName={guestName}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0E1118] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-white overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8621A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-Scam • Zero Phone Number Leakage</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Connect with Event Host
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Coordinate with <strong className="text-white/90">{event.title}</strong> organizer. All chats are host-controlled to prevent spam.
          </p>
        </div>

        {/* Dual Communication Options */}
        <div className="space-y-3.5 relative z-10">
          {/* Option 1: Telegram Subgroup */}
          <div
            onClick={handleOpenTelegram}
            className="group relative p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 to-cyan-950/20 hover:from-sky-950/60 hover:to-cyan-950/40 border border-sky-500/30 hover:border-sky-400 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Send className="w-5 h-5 -rotate-12 translate-x-[-1px] translate-y-[1px]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                    Join Vibe Host Console on Telegram
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    @VibeConsoleBot
                  </span>
                </div>

                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Admission requires host approval via Vibe Host Console. Your phone number remains <strong>100% private</strong> and hidden from attendees.
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-sky-400 group-hover:text-sky-300">
                  <span>Open Vibe Host Console in Telegram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Option 2: Vibe Web Console */}
          <div
            onClick={() => setActiveView('web_chat')}
            className="group relative p-4 rounded-2xl bg-gradient-to-r from-[#E8621A]/10 to-amber-950/10 hover:from-[#E8621A]/20 hover:to-amber-950/20 border border-[#E8621A]/30 hover:border-[#E8621A] transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E8621A]/20 text-[#E8621A] border border-[#E8621A]/40 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                    Chat via Vibe Web Console
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#E8621A]/20 text-[#E8621A] border border-[#E8621A]/30">
                    No App Needed
                  </span>
                </div>

                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Don&apos;t have Telegram? Chat directly in this browser window. Host replies sync directly to your screen in real time.
                </p>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#E8621A] group-hover:text-orange-400">
                  <span>Open Web Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust & Safety footer */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>End-to-end moderated gateway</span>
          </div>
          <span className="text-white/30">Auto-expires 48h after event</span>
        </div>
      </div>
    </div>
  );
}

