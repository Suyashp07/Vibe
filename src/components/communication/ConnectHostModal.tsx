'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MessageCircle,
  Phone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
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
 * ConnectHostModal: Enables direct contact with the verified event host
 * via WhatsApp direct chat, phone call, or copyable number.
 */
export default function ConnectHostModal({
  event,
  isOpen,
  onClose,
}: ConnectHostModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const hostPhone =
    (event as any)?.theme?.whatsapp_host_phone ||
    (event as any)?.whatsapp_host_phone ||
    (event as any)?.organizer_phone ||
    (event as any)?.host_phone ||
    '917019996099';

  const cleanPhone = String(hostPhone).replace(/[^0-9]/g, '');
  const displayPhone =
    cleanPhone.length === 12 && cleanPhone.startsWith('91')
      ? `+91 ${cleanPhone.slice(2, 7)} ${cleanPhone.slice(7)}`
      : `+${cleanPhone}`;

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi ${hostName}, I'm reaching out about "${eventTitle}" on Vibe!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(displayPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

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
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5500]/20 to-emerald-500/20 border border-[#FF5500]/40 flex items-center justify-center mx-auto text-[#FF5500] shadow-[0_0_30px_rgba(255,85,0,0.3)]">
              <MessageCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-black" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Organizer</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Contact with Host
          </h2>
          <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto">
            Connect directly with <strong className="text-white/90">{hostName}</strong> for questions or coordination on <span className="text-white/80 italic">&quot;{eventTitle}&quot;</span>.
          </p>
        </div>

        {/* Contact Actions */}
        <div className="my-5 space-y-3 relative z-10">
          {/* Primary Channel: WhatsApp Direct */}
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 flex items-center justify-between transition-all shadow-lg shadow-emerald-950/40 hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-10 h-10 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 fill-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-950">Chat on WhatsApp</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-950 text-emerald-300">
                    Fastest
                  </span>
                </div>
                <p className="text-xs font-medium text-emerald-950/90">
                  Instant direct message with host
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform shrink-0 mr-1" />
          </button>

          {/* Direct Phone / Call Bar */}
          <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-white/80">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Host Phone:</span>
              <span className="font-mono font-bold text-white">{displayPhone}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPhone}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/15 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <a
                href={`tel:${cleanPhone}`}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white font-medium text-xs transition-all cursor-pointer relative z-10"
        >
          <span>Close</span>
        </button>
      </div>
    </div>
  );

  return mounted ? createPortal(modalBody, document.body) : null;
}
