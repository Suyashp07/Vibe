'use client';

import React from 'react';
import { Flame, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EventItem } from '@/types';

interface StatusBannerProps {
  event: EventItem;
  confirmedRsvpCount?: number;
  isUserWaitlisted?: boolean;
}

export default function StatusBanner({
  event,
  confirmedRsvpCount = 0,
  isUserWaitlisted = false
}: StatusBannerProps) {
  // 1. Check if current user is on waitlist
  if (isUserWaitlisted) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-warning-bg border border-warning/30 text-warning text-xs font-bold shadow-xs animate-in fade-in">
        <CheckCircle2 className="w-4 h-4 text-warning shrink-0" />
        <span>✅ You are on the waitlist (We will notify you if a spot opens)</span>
      </div>
    );
  }

  // 2. Capacity & Spots Left logic
  const capacity = event.capacity;
  const isFull = capacity ? confirmedRsvpCount >= capacity : false;
  const spotsLeft = capacity ? Math.max(0, capacity - confirmedRsvpCount) : null;

  // 3. Date Proximity logic
  const now = new Date();
  const eventDate = new Date(event.start_at);
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine Primary Badge to show
  if (isFull) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-warning-bg border border-warning/30 text-warning text-xs font-bold shadow-xs">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
        <span>⚡ Full Capacity · Waitlist Active</span>
      </div>
    );
  }

  if (spotsLeft !== null && spotsLeft <= 5 && spotsLeft > 0) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-light border border-accent/30 text-accent text-xs font-bold shadow-xs animate-pulse">
        <Flame className="w-4 h-4 text-accent shrink-0" />
        <span>🔥 Only {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left</span>
      </div>
    );
  }

  if (diffDays === 0) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-bold shadow-xs">
        <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>⚡ Happening Today in {event.city}!</span>
      </div>
    );
  }

  if (diffDays === 1) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold shadow-xs backdrop-blur-md">
        <Calendar className="w-4 h-4 text-gold shrink-0" />
        <span>📅 Tomorrow · {event.city}</span>
      </div>
    );
  }

  if (diffDays > 1 && diffDays <= 5) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold shadow-xs backdrop-blur-md">
        <Calendar className="w-4 h-4 text-gold shrink-0" />
        <span>📅 In {diffDays} days · {event.city}</span>
      </div>
    );
  }

  return null;
}
