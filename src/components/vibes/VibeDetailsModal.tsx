'use client';

import React from 'react';
import Image from 'next/image';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Zap,
  Share2,
  MessageCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { EventItem, RSVPItem } from '@/types';

export interface VibeDetailsItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  badge?: string;
  host_name: string;
  host_initials: string;
  host_rating: string;
  host_vibes_count: number;
  formatted_date: string;
  formatted_time: string;
  formatted_date_time_venue: string;
  location_name: string;
  city: string;
  description: string;
  going_count: number;
  capacity?: number;
  spots_left?: number;
  has_spots_limit?: boolean;
  likes_count: number;
  comments_count: number;
  cover_image_url: string;
  originalEvent?: EventItem;
}

interface VibeDetailsModalProps {
  vibe: VibeDetailsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin: (vibe: VibeDetailsItem) => void;
  onConnectHost: (vibe: VibeDetailsItem) => void;
  onShare: (vibe: VibeDetailsItem) => void;
  userRsvp?: RSVPItem | null;
}

export default function VibeDetailsModal({
  vibe,
  isOpen,
  onClose,
  onJoin,
  onConnectHost,
  onShare,
  userRsvp,
}: VibeDetailsModalProps) {
  if (!isOpen || !vibe) return null;

  const mapsQuery = encodeURIComponent(`${vibe.location_name}, ${vibe.city}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const isGoing = Boolean(userRsvp && userRsvp.status === 'confirmed');

  return (
    <div
      className="dark-dialog fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="dark-dialog-content w-full sm:max-w-lg bg-[#12141A] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl text-white relative overflow-hidden max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle accent glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-[#E8621A]/25 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile Pull Bar */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header Bar */}
        <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E8621A] text-white flex items-center gap-1 shadow-xs">
              <Info className="w-3 h-3" />
              <span>Event Details</span>
            </span>
            {vibe.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/10">
                {vibe.badge}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 overscroll-contain">
          {/* Cover & Title Banner with Ambient Backdrop & Contained Poster */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[16/9] w-full shrink-0 shadow-lg bg-black">
            {/* Ambient Blurred Backdrop */}
            <Image
              src={vibe.cover_image_url}
              alt=""
              fill
              unoptimized
              className="object-cover scale-110 blur-xl opacity-40 brightness-50"
              aria-hidden="true"
            />
            {/* Contained uncropped poster */}
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <div className="relative w-full h-full">
                <Image
                  src={vibe.cover_image_url}
                  alt={vibe.title}
                  fill
                  unoptimized
                  className="object-contain drop-shadow-md rounded-lg"
                />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
              <span className="text-[10px] font-black tracking-widest uppercase text-[#FF8C42] block mb-0.5">
                {vibe.category}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white leading-snug drop-shadow-md">
                {vibe.title}
              </h2>
            </div>
          </div>

          {/* Host Card */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#E8621A] to-[#FF8C42] text-white font-black flex items-center justify-center text-sm shadow-md shrink-0 border border-white/20">
                {vibe.host_initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                  <span>{vibe.host_name}</span>
                  <span title="Verified Host" className="inline-flex shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                </div>
                <div className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                  <span className="text-amber-400">★</span>
                  <span>{vibe.host_rating} rating</span>
                  <span>•</span>
                  <span>{vibe.host_vibes_count} vibes hosted</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onConnectHost(vibe);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#FF8C42]" />
              <span>Message</span>
            </button>
          </div>

          {/* Time & Venue Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date & Time */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E8621A]/20 text-[#E8621A] flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-0.5">
                  When
                </p>
                <p className="text-xs font-bold text-white leading-tight">
                  {vibe.formatted_date}
                </p>
                <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-white/50" />
                  <span>{vibe.formatted_time}</span>
                </p>
              </div>
            </div>

            {/* Venue & Location */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-0.5">
                  Where
                </p>
                <p className="text-xs font-bold text-white leading-tight truncate">
                  {vibe.location_name}
                </p>
                <p className="text-xs text-white/70 truncate">
                  {vibe.city}
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#FF8C42] hover:underline font-bold mt-1"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Spots & Community Status */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  {vibe.has_spots_limit && vibe.capacity
                    ? `${vibe.going_count} / ${vibe.capacity} going`
                    : `${vibe.going_count} going`}
                </span>
              </span>
              {vibe.has_spots_limit && vibe.capacity ? (
                <span className="font-bold text-[#FF5500] flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-[#FF5500]" />
                  <span>{vibe.spots_left} spots left</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Open Community Gathering</span>
                </span>
              )}
            </div>

            {vibe.has_spots_limit && (vibe.capacity || 0) > 0 && (
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-[#FF5500] to-[#E8621A] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (vibe.going_count / (vibe.capacity || 1)) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
              <span>About this Vibe</span>
            </h4>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-white/80 leading-relaxed whitespace-pre-line">
              {vibe.description ||
                'A small, easy-going gathering. Come solo or bring friends — connect with the host for real-time meetup coordinates.'}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 border-t border-white/10 bg-[#12141A] flex items-center gap-2.5 shrink-0">
          {/* Join / View Pass Button */}
          {isGoing ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onJoin(vibe);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 shadow-lg active:scale-98 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>You're in · View pass</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onJoin(vibe);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#FF5500] to-[#E8621A] hover:brightness-110 active:scale-[0.98] text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-[#FF5500]/30 cursor-pointer transition-all"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Join now</span>
            </button>
          )}

          {/* Share Button */}
          <button
            type="button"
            onClick={() => onShare(vibe)}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Share vibe"
            aria-label="Share vibe"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
