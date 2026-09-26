'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Flame,
  MessageSquare,
  MessageCircle,
  Share2,
  MapPin,
  Info,
  Clock,
  Users,
  X,
  Sparkles,
  TicketCheck,
  Send,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventItem } from '@/types';
import { isFlashVibeLiked, toggleFlashVibeLike, hasUserRSVP } from '@/lib/store';
import ConnectHostModal from '@/components/communication/ConnectHostModal';
import QuickJoinModal from '@/components/vibes/QuickJoinModal';
import { useAuth } from '@/lib/auth';

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
  const { profile } = useAuth();
  const [cheers, setCheers] = useState<number>(() => {
    return event.vibe_cheers_count ?? event.theme?.vibe_cheers_count ?? 0;
  });
  const [hasCheered, setHasCheered] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? isFlashVibeLiked(event.id, event.slug) : false;
  });
  const [connectHostOpen, setConnectHostOpen] = useState(false);
  const [quickJoinOpen, setQuickJoinOpen] = useState(false);
  const [hasRSVPd, setHasRSVPd] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? Boolean(hasUserRSVP(event.id) || hasUserRSVP(event.slug)) : false;
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Comment state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync like count and status whenever event prop updates or changes
  useEffect(() => {
    setHasCheered(isFlashVibeLiked(event.id, event.slug));
    setCheers(event.vibe_cheers_count ?? event.theme?.vibe_cheers_count ?? 0);
  }, [event.id, event.slug, event.vibe_cheers_count, event.theme?.vibe_cheers_count]);

  // Fetch comment count on mount
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/events/comments?eventId=${encodeURIComponent(event.id)}`);
        if (res.ok) {
          const data = await res.json();
          setCommentCount(data.count || 0);
        }
      } catch {}
    };
    fetchCount();
  }, [event.id]);

  // Fetch full comments when drawer opens
  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/comments?eventId=${encodeURIComponent(event.id)}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setCommentCount(data.count || data.comments?.length || 0);
        setCommentsLoaded(true);
      }
    } catch {
      setCommentsLoaded(true);
    }
  }, [event.id]);

  useEffect(() => {
    if (commentsOpen && !commentsLoaded) {
      loadComments();
    }
  }, [commentsOpen, commentsLoaded, loadComments]);

  // Post a new comment
  const handlePostComment = async () => {
    if (!commentText.trim() || postingComment) return;

    setPostingComment(true);
    try {
      const res = await fetch('/api/events/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          content: commentText.trim(),
          userName: commentName.trim() || profile?.name || 'Guest',
          userEmail: profile?.email || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments((prev) => [data.comment, ...prev]);
          setCommentCount((c) => c + 1);
        }
        setCommentText('');
      }
    } catch {}
    setPostingComment(false);
  };

  // Instagram-style double-tap on card to cheer / like
  const handleCardDoubleTap = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;

    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (!hasCheered) {
        handleCheer();
      } else {
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 900);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // Handle cheer / vibe check with toggle and confetti
  const handleCheer = async () => {
    const result = await toggleFlashVibeLike(event.id, event.slug);
    setCheers(result.count);
    setHasCheered(result.liked);

    if (result.liked) {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { x: 0.9, y: 0.5 },
          colors: ['#F97316', '#EC4899', '#FBBF24'],
        });
      } catch {}
    }
  };

  // Handle share
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/vibes?event=${event.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} in ${event.city}! Contact host:`,
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
      if (diffHrs === 1) return '⏳ Starts in ~1 hr';
      if (diffHrs < 24) return `⚡ Today in ~${diffHrs} hrs`;
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
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />

        {/* Dynamic ambient color glow from event accent */}
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: event.theme?.custom_accent || '#E8621A' }}
        />
      </div>

      {/* Floating Instagram-style Heart/Flame on Double Tap */}
      {showHeartAnim && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-in zoom-in-50 fade-in duration-300">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#E8621A]/85 backdrop-blur-xl border border-white/40 flex items-center justify-center text-white shadow-2xl shadow-[#E8621A]/60 animate-bounce">
            <Flame className="w-14 h-14 sm:w-16 sm:h-16 fill-white drop-shadow-lg" />
          </div>
        </div>
      )}

      {/* Top Bar Clearance */}
      <div className="relative z-10 pt-16 sm:pt-20 px-4 sm:px-6 pb-2 flex items-center justify-end">
        {/* Reel Counter */}
        <span className="text-[10px] sm:text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white/80 border border-white/10">
          {index + 1} / {total}
        </span>
      </div>

      {/* Right Side: Streamlined Reels Action Rail */}
      <div className="absolute right-3 sm:right-4 bottom-20 sm:bottom-24 z-20 flex flex-col items-center gap-3.5">
        {/* 1. Cheer / Vibe Check */}
        <button
          type="button"
          onClick={handleCheer}
          className="group flex flex-col items-center gap-1 cursor-pointer focus:outline-none"
          title={hasCheered ? "Liked! (Click to unlike)" : "Like / Cheer"}
        >
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-90 ${
              hasCheered
                ? 'bg-[#E8621A] border-[#E8621A] text-white scale-105 shadow-lg shadow-[#E8621A]/40'
                : 'bg-black/50 border-white/20 text-white hover:bg-black/70 hover:scale-105'
            }`}
          >
            <Flame className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${hasCheered ? 'fill-white scale-110' : ''}`} />
          </div>
          <span className={`text-[11px] font-black drop-shadow-md transition-colors ${hasCheered ? 'text-[#FF8C42]' : 'text-white'}`}>
            {cheers}
          </span>
        </button>

        {/* 2. Share */}
        <button
          type="button"
          onClick={handleShare}
          className="group flex flex-col items-center gap-1 cursor-pointer"
          title="Share"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-xl transition-all hover:scale-105 active:scale-90">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-white drop-shadow-md">Share</span>
        </button>

        {/* 3. Google Maps */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center gap-1 cursor-pointer"
          title="Directions on Google Maps"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-xl transition-all hover:scale-105 active:scale-90">
            <MapPin className="w-5 h-5 text-[#E8621A]" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-white drop-shadow-md">Maps</span>
        </a>

        {/* 4. Comments */}
        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          className="group flex flex-col items-center gap-1 cursor-pointer"
          title="Comments"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-xl transition-all hover:scale-105 active:scale-90">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-white drop-shadow-md">
            {commentCount || 0}
          </span>
        </button>

        {/* 5. Info / Details toggle */}
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="group flex flex-col items-center gap-1 cursor-pointer"
          title="View Event Details"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-xl transition-all">
            <Info className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Bottom Content Area: Event Details & Spread Contact Host Button */}
      <div className="relative z-10 p-4 sm:p-5 w-full max-w-lg pb-5 sm:pb-6">
        {/* Host Info */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#E8621A] to-purple-500 overflow-hidden border border-white/30 shrink-0">
            {event.organizer_logo ? (
              <img
                src={event.organizer_logo}
                alt={event.organizer_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                {event.organizer_name?.slice(0, 1) || 'H'}
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-white truncate drop-shadow-md">
            {event.organizer_name}
          </span>
        </div>

        {/* Event Title */}
        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2 drop-shadow-lg tracking-tight line-clamp-2">
          {event.title}
        </h2>

        {/* Activity, Time & Venue Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-lg bg-white/10 backdrop-blur-md text-white/90 border border-white/15 font-bold flex items-center gap-1 capitalize">
            <span>{emoji}</span>
            <span>{event.flash_activity || 'Meetup'}</span>
          </span>

          <span className="px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[#FF8C42] border border-white/10 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatStartTime()}</span>
          </span>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white/90 hover:text-white border border-white/10 font-medium flex items-center gap-1 transition-colors truncate max-w-[160px]"
          >
            <MapPin className="w-3 h-3 text-[#E8621A] shrink-0" />
            <span className="truncate">{event.location_name}</span>
          </a>
        </div>

        {/* Tagline / Blurb */}
        <p className="text-xs text-white/80 line-clamp-2 mb-2.5 leading-relaxed drop-shadow-sm">
          {event.tagline || event.description}
        </p>

        {/* Spots Progress Bar */}
        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-2 mb-3 max-w-sm">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#E8621A]" />
              <span>{filled}/{limit} spots filled</span>
            </span>
            <span className={`text-[10px] font-black ${remaining <= 3 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {remaining > 0 ? `⚡ ${remaining} spots left` : 'Full House'}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E8621A] to-[#FF8C42] rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* RSVP-Gated CTA: "I'm In" before RSVP, "Ask Host" after */}
        <div className="w-full pr-12 sm:pr-14 flex gap-2">
          {!hasRSVPd ? (
            /* Primary CTA: Quick Join / RSVP */
            <button
              type="button"
              onClick={() => setQuickJoinOpen(true)}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#E8621A]/35 transition-all cursor-pointer"
              title="Join this event"
            >
              <Sparkles className="w-4 h-4 text-white shrink-0" />
              <span>I'm In ⚡</span>
            </button>
          ) : (
            /* After RSVP: Show confirmed badge + unlocked chat */
            <>
              <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0">
                <TicketCheck className="w-4 h-4" />
                <span>Joined</span>
              </div>
              <button
                type="button"
                onClick={() => setConnectHostOpen(true)}
                className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#E8621A]/35 transition-all cursor-pointer"
                title="Ask Host"
              >
                <MessageSquare className="w-4 h-4 text-white shrink-0" />
                <span>Ask Host 💬</span>
              </button>
            </>
          )}
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
                ⚡ Event Details
              </span>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">{event.title}</h3>
            <p className="text-xs text-white/60 mb-5">{event.tagline}</p>

            <div className="space-y-4 text-xs sm:text-sm text-white/80">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                  About this Meetup
                </h4>
                <p className="text-xs text-white/80 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
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
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">
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

          <div className="pt-4 border-t border-white/10 flex items-center gap-3">
            {!hasRSVPd ? (
              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(false);
                  setQuickJoinOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#E8621A]/30"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>I'm In ⚡ — Reserve My Spot</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(false);
                  setConnectHostOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#E8621A]/30"
              >
                <MessageSquare className="w-4 h-4 text-white" />
                <span>Ask Host 💬</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Share Toast Notification */}
      {shareToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-2">
          ✅ Link copied to clipboard!
        </div>
      )}

      {/* Quick Join / RSVP Modal */}
      <QuickJoinModal
        event={event}
        isOpen={quickJoinOpen}
        onClose={() => setQuickJoinOpen(false)}
        onSuccess={() => {
          setHasRSVPd(true);
          setQuickJoinOpen(false);
        }}
      />

      {/* ========== COMMENTS DRAWER ========== */}
      {commentsOpen && (
        <div className="absolute inset-0 z-50 flex flex-col" onClick={(e) => { if (e.target === e.currentTarget) setCommentsOpen(false); }}>
          {/* Backdrop */}
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setCommentsOpen(false)} />

          {/* Drawer */}
          <div className="bg-[#0D0F14] border-t border-white/10 rounded-t-3xl max-h-[65vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Handle + Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E8621A]/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-[#E8621A]" />
                </div>
                <span className="text-sm font-black text-white">
                  Comments <span className="text-white/50 font-normal">({commentCount})</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCommentsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 no-scrollbar min-h-[120px] max-h-[35vh]">
              {!commentsLoaded ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#E8621A]" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/40 text-xs">No comments yet. Be the first! 🎉</p>
                </div>
              ) : (
                comments.map((cmt) => (
                  <div key={cmt.id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8621A] to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {(cmt.user_name || 'G')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {cmt.user_name || 'Guest'}
                        </span>
                        <span className="text-[10px] text-white/30 shrink-0">
                          {new Date(cmt.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed mt-0.5 break-words">
                        {cmt.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="px-4 py-3 border-t border-white/10 bg-[#0D0F14]">
              {/* Name field (only if not logged in) */}
              {!profile?.name && (
                <input
                  type="text"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 mb-2 focus:outline-none focus:border-[#E8621A]/50"
                />
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePostComment();
                    }
                  }}
                  placeholder="Add a comment..."
                  maxLength={500}
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#E8621A]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={handlePostComment}
                  disabled={!commentText.trim() || postingComment}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-90 disabled:opacity-40 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
                >
                  {postingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-white/20 mt-1 text-right">{commentText.length}/500</p>
            </div>
          </div>
        </div>
      )}

      {/* Connect with Host Modal (only accessible after RSVP) */}
      {hasRSVPd && (
        <ConnectHostModal
          event={event}
          isOpen={connectHostOpen}
          onClose={() => setConnectHostOpen(false)}
          guestEmail={profile?.email}
          guestName={profile?.name}
        />
      )}
    </div>
  );
}
