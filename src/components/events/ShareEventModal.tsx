'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  Share2,
  Calendar,
  MessageCircle,
  Send,
  Twitter,
  ExternalLink
} from 'lucide-react';
import { EventItem } from '@/types';

interface ShareEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
}

export default function ShareEventModal({
  isOpen,
  onClose,
  event,
}: ShareEventModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const eventUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${event.slug}`
    : `https://vibe-seven-pied.vercel.app/${event.slug}`;

  const shareText = `Check out "${event.title}" on Vibe! ${event.tagline || ''}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback prompt
      window.prompt('Copy this event link:', eventUrl);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n\n👉 Details & RSVP: ${eventUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTelegram = () => {
    const url = encodeURIComponent(eventUrl);
    const text = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const handleTwitter = () => {
    const url = encodeURIComponent(eventUrl);
    const text = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const handleGoogleCalendar = () => {
    try {
      const start = new Date(event.start_at).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const end = event.end_at
        ? new Date(event.end_at).toISOString().replace(/-|:|\.\d\d\d/g, '')
        : new Date(new Date(event.start_at).getTime() + 7200000).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const title = encodeURIComponent(event.title);
      const details = encodeURIComponent(`${event.tagline || ''}\n\nEvent Link: ${eventUrl}`);
      const location = encodeURIComponent(event.location_address || event.city || '');

      const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
      window.open(calUrl, '_blank');
    } catch (e) {
      console.warn('Calendar error:', e);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-elevated overflow-hidden my-auto text-ink relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent-light text-accent flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Share Experience</h3>
              <p className="text-[11px] text-ink-muted">Invite friends and community members</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-3 text-ink-muted hover:text-ink transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Direct Copy Bar */}
          <div>
            <label className="block text-[11px] font-bold text-ink-secondary mb-1.5">
              Event Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={eventUrl}
                className="flex-1 text-xs font-mono bg-surface-2 border border-border px-3 py-2.5 rounded-xl text-ink truncate focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand hover:bg-accent text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Sharing Channels */}
          <div>
            <label className="block text-[11px] font-bold text-ink-secondary mb-2">
              Quick Share
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="p-3 rounded-xl border border-border hover:border-emerald-400 bg-surface hover:bg-emerald-50/40 text-left transition flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink group-hover:text-emerald-700">WhatsApp</div>
                  <div className="text-[10px] text-ink-muted">Send to chats</div>
                </div>
              </button>

              {/* Telegram */}
              <button
                onClick={handleTelegram}
                className="p-3 rounded-xl border border-border hover:border-sky-400 bg-surface hover:bg-sky-50/40 text-left transition flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink group-hover:text-sky-700">Telegram</div>
                  <div className="text-[10px] text-ink-muted">Share to channels</div>
                </div>
              </button>

              {/* Twitter / X */}
              <button
                onClick={handleTwitter}
                className="p-3 rounded-xl border border-border hover:border-zinc-400 bg-surface hover:bg-zinc-50 text-left transition flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Twitter className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">Twitter / X</div>
                  <div className="text-[10px] text-ink-muted">Post an update</div>
                </div>
              </button>

              {/* Google Calendar */}
              <button
                onClick={handleGoogleCalendar}
                className="p-3 rounded-xl border border-border hover:border-amber-400 bg-surface hover:bg-amber-50/40 text-left transition flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink group-hover:text-amber-700">Add to Cal</div>
                  <div className="text-[10px] text-ink-muted">Google Calendar</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
