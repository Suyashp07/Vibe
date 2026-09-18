'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  X,
  MessageCircle,
  MessageSquare,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  MapPin,
  Sparkles,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventItem } from '@/types';
import EventConversationModal from '@/components/communication/EventConversationModal';
import { formatIST } from '@/lib/store';

interface ConnectHostModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  guestEmail?: string;
  guestName?: string;
}

export default function ConnectHostModal({
  event,
  isOpen,
  onClose,
  guestEmail = '',
  guestName = ''
}: ConnectHostModalProps) {
  const [copied, setCopied] = useState(false);
  const [showInAppChat, setShowInAppChat] = useState(false);

  if (!isOpen || !event) return null;

  // If in-app chat is active, delegate directly to EventConversationModal
  if (showInAppChat) {
    return (
      <EventConversationModal
        event={event}
        isOpen={true}
        onClose={() => {
          setShowInAppChat(false);
          onClose();
        }}
        guestEmail={guestEmail}
        guestName={guestName}
      />
    );
  }

  // Determine host phone & WhatsApp direct link
  const rawPhone = event.whatsapp_host_phone || '916264984285';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const displayPhone = cleanPhone.length === 12 && cleanPhone.startsWith('91')
    ? `+91 ${cleanPhone.slice(2, 7)} ${cleanPhone.slice(7)}`
    : `+${cleanPhone}`;

  const defaultGreeting = `Hi ${event.organizer_name || 'Host'}! I saw your event "${event.title}" on Vibe and would like to connect / have a question.`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultGreeting)}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(displayPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl z-10 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="relative px-6 pt-6 pb-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <MessageCircle className="w-4 h-4 fill-emerald-400" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>Connect to Host</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-xs text-slate-400">Direct & secure organizer communication</p>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Event & Host Highlight Card */}
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-start gap-3.5">
              {/* Host Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E8621A] to-amber-500 overflow-hidden flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md">
                {event.organizer_logo ? (
                  <Image
                    src={event.organizer_logo}
                    alt={event.organizer_name || 'Host'}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (event.organizer_name || 'H')[0]?.toUpperCase()
                )}
              </div>

              {/* Host & Event Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-bold text-white truncate">
                    {event.organizer_name || 'Verified Event Organizer'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Host
                  </span>
                </div>

                <p className="text-xs font-semibold text-amber-300 truncate mb-1.5">
                  {event.title}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  {event.start_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formatIST(event.start_at)}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-[#E8621A]" />
                    <span className="truncate">{event.city}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Channels */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Choose contact channel
              </p>

              {/* Channel 1: WhatsApp Direct (Primary) */}
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
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-slate-950 text-emerald-300">
                        Fastest
                      </span>
                    </div>
                    <p className="text-xs font-medium text-emerald-950/90">
                      Direct WhatsApp message with instant reply
                    </p>
                  </div>
                </div>

                <ExternalLink className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition-transform shrink-0 mr-1" />
              </button>

              {/* Channel 2: In-App Message on Vibe (Interactive Gateway) */}
              <button
                type="button"
                onClick={() => setShowInAppChat(true)}
                className="w-full p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-white flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-10 h-10 rounded-xl bg-slate-700/80 text-amber-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-white">Ask Question on Vibe</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300">
                        In-App
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Private chat gateway without sharing phone number
                    </p>
                  </div>
                </div>

                <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform shrink-0 mr-1" />
              </button>
            </div>

            {/* Direct Phone / Copy bar */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Host Phone:</span>
                <span className="font-mono font-bold text-white">{displayPhone}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <a
                  href={`tel:${cleanPhone}`}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* Privacy Guarantee Footer */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Verified organizer communication · Powered by Vibe Bridge</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
