'use client';

import React, { useState } from 'react';
import { Megaphone, AlertTriangle, ChevronDown, ChevronUp, Bell, Clock } from 'lucide-react';
import { EventAnnouncement } from '@/types';
import { formatIST } from '@/lib/store';

interface AnnouncementBannerProps {
  announcements: EventAnnouncement[];
  brandColor?: string;
}

export default function AnnouncementBanner({
  announcements,
  brandColor = '#E8621A'
}: AnnouncementBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!announcements || announcements.length === 0) return null;

  const urgentAnnouncements = announcements.filter(a => a.is_urgent);
  const primaryAnnouncement = urgentAnnouncements[0] || announcements[0];
  const hasMultiple = announcements.length > 1;

  return (
    <div className="w-full mb-6 transition-all">
      <div 
        className={`rounded-2xl border transition-all overflow-hidden ${
          primaryAnnouncement.is_urgent
            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-lg shadow-amber-500/5'
            : 'bg-stone-50 dark:bg-stone-900/90 border-stone-200 dark:border-stone-800 shadow-sm'
        }`}
      >
        {/* Top Header Strip */}
        <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1">
            <div 
              className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                primaryAnnouncement.is_urgent
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
              }`}
            >
              {primaryAnnouncement.is_urgent ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Megaphone className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  className={`text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    primaryAnnouncement.is_urgent
                      ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {primaryAnnouncement.is_urgent ? 'Urgent Host Notice' : 'Host Announcement'}
                </span>
                <span className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatIST(primaryAnnouncement.created_at)}
                </span>
              </div>

              <h4 className="font-bold text-base text-stone-900 dark:text-white leading-snug">
                {primaryAnnouncement.title}
              </h4>

              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap pt-0.5">
                {primaryAnnouncement.message}
              </p>
            </div>
          </div>

          {hasMultiple && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition shrink-0 flex items-center gap-1"
            >
              <span>{announcements.length} updates</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Collapsible secondary announcements */}
        {expanded && hasMultiple && (
          <div className="border-t border-stone-200 dark:border-stone-800/80 divide-y divide-stone-100 dark:divide-stone-800/60 bg-stone-100/50 dark:bg-stone-950/40 p-4 sm:p-5 space-y-4">
            <h5 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Previous Host Updates
            </h5>
            {announcements.slice(1).map(ann => (
              <div key={ann.id} className="pt-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 dark:text-white">
                    {ann.title}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {formatIST(ann.created_at)}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                  {ann.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
