'use client';

import React, { useEffect, useState } from 'react';
import { Users, Flame } from 'lucide-react';
import { getEventRSVPs, subscribeToStore } from '@/lib/store';
import { subscribeToEventRealtime } from '@/lib/supabase';

interface LiveCounterProps {
  eventId: string;
  capacity?: number;
  className?: string;
}

export default function LiveCounter({ eventId, capacity, className = '' }: LiveCounterProps) {
  const [count, setCount] = useState<number>(() => getEventRSVPs(eventId).length);
  const [isPopping, setIsPopping] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const current = getEventRSVPs(eventId).length;
      if (current !== count) {
        setCount(current);
        setIsPopping(true);
        setTimeout(() => setIsPopping(false), 400);
      }
    };

    const unsubscribeLocal = subscribeToStore(update);
    const unsubscribeRealtime = subscribeToEventRealtime(eventId, () => {
      setCount((prev) => prev + 1);
      setIsPopping(true);
      setTimeout(() => setIsPopping(false), 400);
    });

    return () => {
      unsubscribeLocal();
      unsubscribeRealtime();
    };
  }, [eventId, count]);

  const remaining = capacity ? Math.max(0, capacity - count) : null;
  const isUrgent = remaining !== null && remaining <= 8 && remaining > 0;

  return (
    <div className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-surface border border-border shadow-sm text-sm font-medium ${className}`}>
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
      </span>

      <div className={`flex items-center gap-1.5 transition-transform duration-200 ${isPopping ? 'scale-110 font-bold text-accent' : 'text-ink'}`}>
        <Users className="w-4 h-4 text-brand" />
        <span>
          <strong className="text-ink font-bold">{count}</strong>
          {capacity ? ` / ${capacity}` : ''} RSVPs
        </span>
      </div>

      {isUrgent && (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-accent bg-accent-light px-2 py-0.5 rounded-full border border-accent/20">
          <Flame className="w-3 h-3 fill-accent" />
          Only {remaining} left!
        </span>
      )}
    </div>
  );
}
