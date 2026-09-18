'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Heart,
  Flame,
  MessageCircle,
  Ticket,
  Share2,
  MapPin,
  Info,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Zap,
  ExternalLink,
  ChevronUp,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventItem } from '@/types';
import { cheerFlashVibe, getRSVPs } from '@/lib/store';
import QuickJoinModal from './QuickJoinModal';

interface VibeReelCardProps {
  event: EventItem;
  isActive: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  index: number;
  total: number;
}

export default function VibeReelCard({
  event,
  isActive,
  onPrev,
  onNext,
  index,
  total,
}: VibeReelCardProps) {
  const [cheers, setCheers] = useState(event.vibe_cheers_count || 12);
  const [hasCheered, setHasCheered] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Instagram-style double-tap on card to cheer / like
  const handleCardDoubleTap = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;

    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      handleCheer();
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Check if user already RSVP'd for this event
  useEffect(() => {
    try {
      const rsvps = getRSVPs();
      const joined = rsvps.some(
        (r) => r.event_id === event.id || (event.slug && r.event_slug === event.slug)
      );
      setHasJoined(joined);
    } catch {}
  }, [event.id, event.slug]);

  // Handle cheer / vibe check with confetti
  const handleCheer = () => {
    const nextCount = cheerFlashVibe(event.id);
    setCheers(nextCount || cheers + 1);
    setHasCheered(true);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x: 0.9, y: 0.5 },
        colors: ['#F97316', '#EC4899', '#FBBF24'],
      });
    } catch {}
  };

  // Handle share
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/vibes?event=${event.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Flash Vibe: ${event.title}`,
          text: `Check out this spontaneous flash meetup: ${event.title} in ${event.city}! Claim a spot in 1 tap:`,
          url: shareUrl,
        });
        return;
      } catch (e) {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    } catch {}
  };

  // Host WhatsApp direct chat link
  const hostPhone = (event.whatsapp_host_phone || '919820011223').replace(/[^0-9]/g, '');
  const chatText = `Hey ${event.organizer_name || 'Host'}! I saw your Vibe "${event.title}" on Vibe Reels and would love to join!`;
  const whatsappChatUrl = `https://wa.me/${hostPhone}?text=${encodeURIComponent(chatText)}`;

  // Google maps URL
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.location_name}, ${event.city}`
  )}`;

  // Format relative start time
  const formatStartTime = () => {
    try {
      const start = new Date(event.start_at);
      const now = new Date();
      const diffHrs = Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60));

      if (diffHrs <= 0) return '🔥 Happening Right Now';
      if (diffHrs === 1) return '⏳ Starts in ~1 hour';
      if (diffHrs < 24) return `⚡ Today in ~${diffHrs} hours`;
      return `📅 ${start.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}`;
    } catch {
      return '⚡ Tonight';
    }
  };

  // Calculate spots progress
  const limit = event.spots_limit || 12;
  const filled = Math.min(event.spots_filled || 6, limit);
  const remaining = Math.max(0, limit - filled);
  const percent = Math.round((filled / limit) * 100);

  // Activity icon/emoji
  const activityEmojis: Record<string, string> = {
    cricket: '🏏',
    football: '⚽',
    badminton: '🏸',
    pickleball: '🏓',
    coffee: '☕',
    games: '🎲',
    music: '🎸',
    sprint: '💻',
    other: '⚡',
  };
  const emoji = activityEmojis[event.flash_activity || 'other'] || '⚡';

  return (
    <div
      onClick={handleCardDoubleTap}
      className="relative w-full h-full snap-start snap-always flex flex-col justify-between overflow-hidden select-none bg-black cursor-pointer"
    >
      {/* Background Image with Dark Reels Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          src={event.cover_image_url}
          alt={event.title}
          fill
          priority={index === 0}
          className="object-cover object-center scale-105 transition-transform duration-700"
        />
        {/* Dark film overlay for typography readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40" />

        {/* Dynamic ambient color glow from event accent */}
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: event.theme?.custom_accent || '#E8621A' }}
        />
      </div>

      {/* Floating Instagram-style Heart/Flame on Double Tap */}
      {showHeartAnim && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-300">
          <div className="w-28 h-28 rounded-full bg-[#E8621A]/80 backdrop-blur-xl border border-white/40 flex items-center justify-center text-white shadow-2xl shadow-[#E8621A]/60 animate-bounce">
            <Flame className="w-16 h-16 fill-white drop-shadow-lg" />
          </div>
        </div>
      )}

      {/* Top Bar of the Card (with proper clearance below the floating header) */}
      <div className="relative z-10 pt-16 sm:pt-20 px-4 sm:px-6 pb-2 flex items-center justify-between">
        {/* Flash Vibe Badge */}
        <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-[#E8621A] text-white flex items-center gap-1.5 shadow-lg shadow-[#E8621A]/30">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>FLASH VIBE</span>
        </span>

        {/* Reel Counter */}
        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/70 border border-white/10">
          {index + 1} / {total}
        </span>
      </div>

      {/* Right Side: Reels Action Column */}
      <div className="absolute right-3 sm:right-5 bottom-24 sm:bottom-28 z-20 flex flex-col items-center gap-4">
        {/* 1. Cheer / Vibe Check */}
        <button
          type="button"
          onClick={handleCheer}
          className="group flex flex-col items-center gap-1 cursor-pointer focus:outline-none"
          title="Vibe Check / Cheer"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90 ${
              hasCheered
                ? 'bg-[#E8621A] border-[#E8621A] text-white scale-110 shadow-lg shadow-[#E8621A]/40'
                : 'bg-black/50 border-white/20 text-white hover:bg-black/70 hover:scale-105'
            }`}
          >
            <Flame className={`w-6 h-6 ${hasCheered ? 'fill-white animate-bounce' : ''}`} />
          </div>
          <span className="text-[11px] font-black text-white drop-shadow-md">
            {cheers}
          </span>
        </button>

        {/* 2. Chat with Host on WhatsApp */}
        <a
          href={whatsappChatUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center gap-1 cursor-pointer"
          title="Chat with Host on WhatsApp"
        >
          <div className="w-12 h-12 rounded-full bg-[#25D366]/90 hover:bg-[#25D366] text-black border border-white/20 flex items-center justify-center backdrop-blur-xl transition-all hover:scale-105 active:scale-90 shadow-lg shadow-[#25D366]/30">
            <MessageCircle className="w-6 h-6 fill-black" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-md">Host</span>
        </a>

        {/* 3. Instant RSVP Button */}
        <button
          type="button"
          onClick={() => setJoinModalOpen(true)}
          className="group flex flex-col items-center gap-1 cursor-pointer"
          title="Quick Join / RSVP"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90 ${
              hasJoined
                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-black/50 border-white/20 text-white hover:bg-black/70 hover:scale-105'
            }`}
          >
            {hasJoined ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Ticket className="w-6 h-6" />
            )}
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-md">
            {hasJoined ? 'Joined' : 'Join'}
          </span>
        </button>

        {/* 4. Share */}
        <button
          type="button"
          onClick={handleShare}
          className="group flex flex-col items-center gap-1 cursor-pointer"
          title="Share Flash Vibe"
        >
          <div className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-xl transition-all hover:scale-105 active:scale-90">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-md">Share</span>
        </button>

        {/* 5. Google Maps */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center gap-1 cursor-pointer"
          title="Directions on Google Maps"
        >
          <div className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-xl transition-all hover:scale-105 active:scale-90">
            <MapPin className="w-5 h-5 text-[#E8621A]" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-md">Maps</span>
        </a>

        {/* 6. Info / Details toggle */}
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="group flex flex-col items-center gap-1 cursor-pointer"
          title="View Event Details"
        >
          <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-xl transition-all">
            <Info className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Bottom Content Area: Event Details & Action */}
      <div className="relative z-10 p-4 sm:p-6 max-w-lg pb-6 sm:pb-8">
        {/* Host Pill with WhatsApp tag */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#E8621A] to-purple-500 overflow-hidden border border-white/30 shrink-0">
            {event.organizer_logo ? (
              <img
                src={event.organizer_logo}
                alt={event.organizer_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                {event.organizer_name?.slice(0, 1) || 'H'}
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-white truncate drop-shadow-md">
            {event.organizer_name}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
            via WhatsApp Bridge
          </span>
        </div>

        {/* Event Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2 drop-shadow-lg tracking-tight">
          {event.title}
        </h2>

        {/* Activity, Time & Venue Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-white/90 border border-white/15 font-bold flex items-center gap-1.5 capitalize">
            <span>{emoji}</span>
            <span>{event.flash_activity || 'Meetup'}</span>
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[#FF8C42] border border-white/10 font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatStartTime()}</span>
          </span>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white/90 hover:text-white border border-white/10 font-medium flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-[#E8621A]" />
            <span className="truncate max-w-[180px]">{event.location_name}</span>
          </a>
        </div>

        {/* Tagline / Blurb */}
        <p className="text-xs sm:text-sm text-white/80 line-clamp-2 mb-3 leading-relaxed drop-shadow-sm">
          {event.tagline || event.description}
        </p>

        {/* Spots Progress Bar */}
        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-2.5 mb-4 max-w-sm">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#E8621A]" />
              <span>{filled}/{limit} spots filled</span>
            </span>
            <span className={`text-[11px] font-black ${remaining <= 3 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {remaining > 0 ? `⚡ ${remaining} spots left!` : 'Full House'}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E8621A] to-[#FF8C42] rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Primary CTA: Glowing Join Button */}
        <div className="flex items-center gap-2.5 max-w-sm">
          <button
            type="button"
            onClick={() => setJoinModalOpen(true)}
            className={`flex-1 py-3 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
              hasJoined
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 text-white shadow-[#E8621A]/40'
            }`}
          >
            {hasJoined ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>You're Attending!</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>⚡ I'm In — Claim Free Spot</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Slide-up Full Details Drawer */}
      {detailsOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl p-6 flex flex-col justify-between animate-in slide-in-from-bottom duration-300 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E8621A]">
                ⚡ Flash Vibe Details
              </span>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-2xl font-black text-white mb-2">{event.title}</h3>
            <p className="text-xs text-white/60 mb-5">{event.tagline}</p>

            <div className="space-y-4 text-sm text-white/80">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
                  About this Meetup
                </h4>
                <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
                  Location & Meetup Spot
                </h4>
                <p className="text-xs text-white font-semibold">{event.location_name}</p>
                <p className="text-xs text-white/60">{event.location_address}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#E8621A] hover:underline font-bold mt-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Open in Google Maps</span>
                </a>
              </div>

              {event.faq && event.faq.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">
                    Quick Rules & FAQ
                  </h4>
                  <div className="space-y-2">
                    {event.faq.map((item, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-xs font-bold text-white mb-0.5">{item.q}</p>
                        <p className="text-xs text-white/70">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDetailsOpen(false);
                setJoinModalOpen(true);
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] text-white font-bold text-xs"
            >
              ⚡ Claim Your Spot Now
            </button>
            <a
              href={whatsappChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-[#25D366] text-black font-bold text-xs flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>Chat Host</span>
            </a>
          </div>
        </div>
      )}

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-2">
          ✅ Link copied to clipboard! Share with your squad.
        </div>
      )}

      {/* Quick Join Modal */}
      <QuickJoinModal
        event={event}
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => setHasJoined(true)}
      />
    </div>
  );
}
