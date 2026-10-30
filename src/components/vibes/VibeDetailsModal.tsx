'use client';

import React from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Zap,
  Share2,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Info,
} from 'lucide-react';
import { EventItem, RSVPItem } from '@/types';
import StructuredDescription from '@/components/vibes/StructuredDescription';

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
        className="dark-dialog-content w-full sm:max-w-lg bg-[#141416] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl text-white relative overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-[#FF5500]/25 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile Pull Bar */}
        <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header Bar */}
        <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FF5500] text-white flex items-center gap-1 shadow-xs">
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

        {/* Scrollable Body - Exact same structure as Desktop Details Panel */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* 1. Host Identity Card (Identical to Right-side tab) */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#3D251A] text-[#FF8542] border border-white/10 flex items-center justify-center font-bold text-sm shrink-0">
              {vibe.host_initials || 'H'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{vibe.host_name || 'Organizer'}</h4>
              <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                <span className="text-amber-400">★</span>
                <span>{vibe.host_rating || '4.9'} · {vibe.host_vibes_count || 5} vibes hosted</span>
              </p>
            </div>
          </div>

          {/* 2. Category Tag & Headline (Identical to Right-side tab) */}
          <div>
            <span className="text-xs font-mono font-bold tracking-wider text-[#FF5500] uppercase">
              {vibe.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1 leading-tight">
              {vibe.title}
            </h2>
          </div>

          {/* 3. Specs List (Identical to Right-side tab) */}
          <div className="space-y-2 text-xs font-medium text-neutral-300 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>{vibe.formatted_date}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>{vibe.formatted_time}</span>
            </div>
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="truncate">{vibe.location_name}</span>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#FF8542] hover:underline font-bold shrink-0 flex items-center gap-1"
              >
                <span>Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 4. Structured Description (In separate lines) */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              About this Vibe
            </h4>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <StructuredDescription description={vibe.description} />
            </div>
          </div>

          {/* 5. Spots Capacity Bar (Identical to Right-side tab) */}
          {vibe.has_spots_limit && (vibe.capacity || 0) > 0 && (
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{vibe.going_count}/{vibe.capacity} going</span>
                </span>
                <span className="font-bold text-[#FF5500] flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-[#FF5500]" />
                  <span>{vibe.spots_left} spots left</span>
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF5500] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (vibe.going_count / (vibe.capacity || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 6. Action Buttons Footer (Identical to Right-side tab) */}
        <div className="p-4 border-t border-white/10 bg-[#141416] flex items-center gap-2.5 shrink-0">
          {/* Join / View Pass Button */}
          {isGoing ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onJoin(vibe);
              }}
              className="flex-1 py-3 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold text-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-98"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>You&apos;re in · View pass</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onJoin(vibe);
              }}
              className="flex-1 py-3 px-3.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E8621A] hover:brightness-110 active:scale-[0.98] text-xs font-bold text-white transition-all shadow-[0_0_20px_rgba(255,85,0,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Join now</span>
            </button>
          )}

          {/* Connect with Host Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onConnectHost(vibe);
            }}
            className="py-3 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer backdrop-blur-md hover:scale-[1.02] active:scale-98 shrink-0"
            title="Connect with host"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#FF8C42]" />
            <span>Connect with host</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => onShare(vibe)}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
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
