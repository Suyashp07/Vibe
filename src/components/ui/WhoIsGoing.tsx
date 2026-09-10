'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Users } from 'lucide-react';
import { getEventRSVPs, subscribeToStore } from '@/lib/store';
import { RSVPItem } from '@/types';

interface WhoIsGoingProps {
  eventId: string;
  maxDisplay?: number;
  isOwner?: boolean;
  innerCardClass?: string;
  textSecondary?: string;
  textMuted?: string;
  borderClass?: string;
  accentColor?: string;
}

export default function WhoIsGoing({
  eventId,
  maxDisplay = 12,
  isOwner = false,
  innerCardClass,
  textSecondary,
  textMuted,
  borderClass,
  accentColor
}: WhoIsGoingProps) {
  const [rsvps, setRsvps] = useState<RSVPItem[]>(() => getEventRSVPs(eventId));

  useEffect(() => {
    const update = () => {
      setRsvps(getEventRSVPs(eventId));
    };
    const unsubscribe = subscribeToStore(update);
    return () => unsubscribe();
  }, [eventId]);

  const confirmedRsvps = rsvps.filter(r => r.status === 'confirmed');
  const displayed = confirmedRsvps.slice(0, maxDisplay);
  const remainingCount = Math.max(0, confirmedRsvps.length - maxDisplay);

  if (confirmedRsvps.length === 0) {
    if (isOwner) {
      return (
        <div className={`p-4 rounded-xl text-center space-y-1.5 border border-dashed ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-3/50'}`}>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: accentColor || '#00F0FF' }}>
            <Users className="w-3.5 h-3.5" />
            <span>Attendee Directory</span>
          </div>
          <p className={`text-xs ${textMuted || 'text-ink-muted'} leading-relaxed`}>
            No guest RSVPs confirmed yet. Share your event link to start collecting guest registrations!
          </p>
        </div>
      );
    }

    return (
      <div className={`p-4 rounded-xl border border-dashed text-center text-xs leading-relaxed ${borderClass || 'border-border'} ${innerCardClass || 'bg-surface-3/50'} ${textMuted || 'text-ink-muted'}`}>
        No RSVPs yet — be the first to register and claim your spot!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between text-xs font-semibold ${textSecondary || 'text-ink-secondary'}`}>
        <span className="uppercase tracking-wider">Who's Going ({confirmedRsvps.length})</span>
        <span className="font-medium" style={{ color: accentColor || '#E8621A' }}>Verified Guests</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {displayed.map((rsvp, idx) => {
          const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rsvp.name)}&backgroundColor=1A1A2E,0F3460,E8621A,C9A84C`;
          return (
            <div
              key={rsvp.id || idx}
              className="group relative flex items-center justify-center"
              title={`${rsvp.name} · Confirmed`}
            >
              <div className={`w-10 h-10 rounded-full border-2 border-white/20 shadow-sm overflow-hidden ${innerCardClass || 'bg-surface-3'} transition-transform hover:scale-110 hover:z-10 hover:shadow-md cursor-pointer`}>
                <Image
                  src={avatarUrl}
                  alt={rsvp.name}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1.5 hidden group-hover:block z-20 px-2.5 py-1 bg-black/90 text-white text-[11px] font-medium rounded-md whitespace-nowrap shadow-elevated border border-white/10">
                {rsvp.name}
                <div className="text-[9px] text-amber-300 font-normal">Confirmed Guest</div>
              </div>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div className={`w-10 h-10 rounded-full border-2 border-white/20 font-bold text-xs flex items-center justify-center shadow-sm ${innerCardClass || 'bg-surface-3 text-ink-secondary'}`}>
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}
