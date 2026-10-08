'use client';

import React from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Layers
} from 'lucide-react';
import { calculateEventSurety } from '@/lib/eventSurety';
import { AdminEvent, isIngestedEvent } from './types';

interface EventApprovalQueueProps {
  events: AdminEvent[];
  loading: boolean;
  statusFilter: string;
  selectedEvent: AdminEvent | null;
  selectedIds: Set<string>;
  savingAction: string | null;
  onSelectEvent: (event: AdminEvent | null) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onApprove: (event: AdminEvent, e?: React.MouseEvent) => void;
  onReject: (event: AdminEvent, e?: React.MouseEvent) => void;
  findDuplicateMatch: (event: AdminEvent) => AdminEvent | undefined;
}

function EventThumbnail({ url, title }: { url?: string; title?: string }) {
  const [imgSrc, setImgSrc] = React.useState(url);
  const [triedProxy, setTriedProxy] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setImgSrc(url);
    setTriedProxy(false);
    setHasError(false);
  }, [url]);

  if (!imgSrc || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center text-[9px] font-bold text-[#94A3B8] bg-[#F1F5F9]">
        {title ? title.slice(0, 2).toUpperCase() : 'NO IMG'}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={title || ''}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        if (!triedProxy && imgSrc && !imgSrc.startsWith('/api/image-proxy') && !imgSrc.startsWith('data:')) {
          setTriedProxy(true);
          setImgSrc(`/api/image-proxy?url=${encodeURIComponent(imgSrc)}`);
        } else {
          setHasError(true);
        }
      }}
      className="w-full h-full object-cover"
    />
  );
}

export default function EventApprovalQueue({
  events,
  loading,
  statusFilter,
  selectedEvent,
  selectedIds,
  savingAction,
  onSelectEvent,
  onToggleSelect,
  onToggleSelectAll,
  onApprove,
  onReject,
  findDuplicateMatch,
}: EventApprovalQueueProps) {
  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#94A3B8]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0A0A0A]" />
        <span className="text-xs font-medium">Loading event queue...</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-24 border border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center text-center p-6">
        <Layers className="w-8 h-8 text-[#CBD5E1] mb-2" />
        <p className="text-sm font-semibold text-[#0A0A0A]">No events in this view</p>
        <p className="text-xs text-[#64748B] mt-1 max-w-xs">
          {statusFilter === 'REVIEW'
            ? 'Great job! The review queue is currently clear.'
            : 'Try selecting another status tab or importing new links.'}
        </p>
      </div>
    );
  }

  const allSelected = events.length > 0 && events.every((e) => selectedIds.has(e.id));

  return (
    <>
      {/* Select All Bar */}
      <div className="flex items-center justify-between px-2 py-1 select-none">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
            className="accent-[#0A0A0A] w-3.5 h-3.5 rounded cursor-pointer"
          />
          <span className="text-[11px] font-medium text-[#64748B]">
            Select all · {events.length} shown
          </span>
        </label>
        <span className="text-[10px] text-[#94A3B8]">Sorted by recent</span>
      </div>

      {/* Queue Cards */}
      <div className="space-y-2">
        {events.map((event) => {
          const isSelected = selectedEvent?.id === event.id;
          const isChecked = selectedIds.has(event.id);
          const duplicate = findDuplicateMatch(event);
          const status = (event.status || '').toLowerCase();
          const isPending = status === 'draft' || status === 'review';
          const isLive = status === 'live' || status === 'published';
          const isRejected = status === 'cancelled' || status === 'rejected';

          const coverImg = event.cover_image_url || event.cover_image || event.image_url;
          const surety = calculateEventSurety(event);

          return (
            <div
              key={event.id}
              onClick={() => onSelectEvent(isSelected ? null : event)}
              className={`group relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#0A0A0A] bg-[#F8FAFC] shadow-sm ring-1 ring-[#0A0A0A]'
                  : 'border-[#E2E8F0] bg-white hover:border-[#0A0A0A] hover:shadow-xs'
              }`}
            >
              {/* Multi-select Checkbox */}
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect(event.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="accent-[#0A0A0A] w-4 h-4 shrink-0 rounded cursor-pointer"
              />

              {/* Poster Thumbnail */}
              <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[#F1F5F9] relative border border-[#E2E8F0]">
                <EventThumbnail url={coverImg} title={event.title} />
              </div>

              {/* Card Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs truncate leading-tight text-[#0A0A0A]">
                    {event.title || event.name || 'Untitled Event'}
                  </h3>
                </div>

                <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                  {event.date || 'TBA'} {event.time ? `· ${event.time}` : ''}
                  {event.venue_name || event.city ? ` · ${event.venue_name || event.city}` : ''}
                </p>

                {/* Badges Bar */}
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  {/* Event Surety Completeness Badge */}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${surety.badgeColor}`}
                    title={`Event completeness: ${surety.score}% (${surety.filledCount}/${surety.totalCount} details verified)`}
                  >
                    <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                    <span>{surety.score}% Surety</span>
                  </span>

                  {isIngestedEvent(event) ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      📥 {event.source_platform || 'Ingested'}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#E8621A]/10 text-[#E8621A] border border-[#E8621A]/20">
                      ⚡ Vibe Specific
                    </span>
                  )}
                  {event.category && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#F1F5F9] text-[#64748B]">
                      {event.category}
                    </span>
                  )}
                  {duplicate && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Dup: {duplicate.title.slice(0, 14)}...
                    </span>
                  )}
                </div>
              </div>

              {/* Status & 1-Click Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {isPending && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => onApprove(event, e)}
                      disabled={savingAction === `approve-${event.id}`}
                      title="1-Click Approve (Publish Live)"
                      className="p-1.5 rounded-full hover:bg-green-50 text-[#94A3B8] hover:text-green-600 transition-colors cursor-pointer"
                    >
                      {savingAction === `approve-${event.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => onReject(event, e)}
                      disabled={savingAction === `reject-${event.id}`}
                      title="1-Click Reject"
                      className="p-1.5 rounded-full hover:bg-red-50 text-[#94A3B8] hover:text-red-500 transition-colors cursor-pointer"
                    >
                      {savingAction === `reject-${event.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                {isLive && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 rounded-full">
                    Live
                  </span>
                )}

                {isRejected && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 rounded-full">
                    Rejected
                  </span>
                )}

                <ChevronRight className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-[#0A0A0A]' : 'text-[#CBD5E1] group-hover:text-[#0A0A0A]'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
