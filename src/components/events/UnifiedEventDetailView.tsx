'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  Users,
  CheckCircle2,
  ArrowUpRight,
  Navigation,
  Globe,
  Flame,
  ArrowLeft,
  Building2,
  Ticket
} from 'lucide-react';
import { EventItem, RSVPItem } from '@/types';
import { formatIST, getRSVPsByEvent } from '@/lib/store';
import { getLocalAuthSession } from '@/lib/auth';
import RSVPForm from '@/components/ui/RSVPForm';
import ShareEventModal from '@/components/events/ShareEventModal';

interface UnifiedEventDetailViewProps {
  event: EventItem;
}

export default function UnifiedEventDetailView({ event }: { event: EventItem }) {
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [confirmedRsvp, setConfirmedRsvp] = useState<RSVPItem | null>(null);

  // Check if current attendee already has a confirmed RSVP for this event
  useEffect(() => {
    const session = getLocalAuthSession();
    if (session?.email) {
      const allRsvps = getRSVPsByEvent(event.id);
      const match = allRsvps.find((r) => r.email?.toLowerCase() === session.email?.toLowerCase());
      if (match) {
        setConfirmedRsvp(match);
      }
    }
  }, [event.id]);

  const rsvps = getRSVPsByEvent(event.id);
  const confirmedCount = rsvps.filter((r) => r.status === 'confirmed').length;

  const isExternal = event.source_type === 'external';
  const rawTicketUrl = event.external_ticket_url?.trim();
  const normalizedTicketUrl = rawTicketUrl
    ? rawTicketUrl.startsWith('http://') || rawTicketUrl.startsWith('https://')
      ? rawTicketUrl
      : `https://${rawTicketUrl}`
    : '';

  const mapQuery = encodeURIComponent(`${event.location_name || ''} ${event.city || ''}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discover</span>
        </Link>

        <button
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border bg-surface hover:bg-surface-3 text-xs font-bold text-ink transition shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5 text-accent" />
          <span>Share</span>
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Poster & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cover Poster */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-surface-3 border border-border shadow-card">
            {event.cover_image_url ? (
              <Image
                src={event.cover_image_url}
                alt={event.title}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-surface-3 text-ink-muted text-xs">
                No poster available
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider shadow-sm">
                {event.source_platform ? `🎟️ ${event.source_platform.toUpperCase()}` : '🌿 VIBE EVENT'}
              </span>

              {event.external_price_text && (
                <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-bold text-brand shadow-sm">
                  {event.external_price_text}
                </span>
              )}
            </div>
          </div>

          {/* Event Header Information */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black text-brand tracking-tight font-sans leading-tight">
              {event.title}
            </h1>

            {event.tagline && (
              <p className="text-sm font-medium text-ink-secondary leading-relaxed">
                {event.tagline}
              </p>
            )}
          </div>

          {/* Schedule & Location Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Date / Time Card */}
            <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-accent-light text-accent flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">When</div>
                <div className="text-xs font-bold text-ink mt-0.5">{formatIST(event.start_at)}</div>
                {event.end_at && (
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    Until {formatIST(event.end_at).split('·')[1] || formatIST(event.end_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Location Card */}
            <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-lg bg-accent-light text-accent flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Where</div>
                <div className="text-xs font-bold text-ink truncate mt-0.5">
                  {event.location_name || event.city}
                </div>
                <div className="text-[11px] text-ink-muted truncate">
                  {event.location_address || `${event.city}, India`}
                </div>
                {event.event_type !== 'online' && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline mt-1"
                  >
                    <span>View on Google Maps</span>
                    <Navigation className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              About This Experience
            </h2>
            <div className="text-xs font-medium text-ink-secondary whitespace-pre-line leading-relaxed">
              {event.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Host Profile Card */}
          <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              {event.organizer_logo ? (
                <Image
                  src={event.organizer_logo}
                  alt={event.organizer_name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold">
                  {(event.organizer_name || 'V')[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-ink">
                  Hosted by {event.organizer_name || event.source_platform || 'Curated by Vibe'}
                </div>
                <div className="text-[11px] text-ink-muted">
                  {event.organizer_handle ? `@${event.organizer_handle}` : 'Verified Event Curator'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-3 py-1.5 rounded-xl border border-border hover:bg-surface-3 text-xs font-semibold text-ink transition"
            >
              Share Event
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Action & Ticket Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-5 sticky top-24">
            {/* Price & Status Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Price</div>
                <div className="text-xl font-black text-brand font-sans">
                  {event.external_price_text || (isExternal ? 'Official Ticketing' : 'Free Entry')}
                </div>
              </div>

              {event.capacity && (
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Availability</div>
                  <div className="text-xs font-bold text-accent flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{Math.max(0, event.capacity - confirmedCount)} spots left</span>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            {isExternal && normalizedTicketUrl ? (
              <a
                href={normalizedTicketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-brand hover:bg-accent text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 group"
              >
                <span>Book Tickets on {event.source_platform ? event.source_platform.toUpperCase() : 'Official Site'}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ) : confirmedRsvp ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowRsvpModal(true)}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>View Your Confirmed Pass &amp; QR</span>
                </button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium text-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Spot Confirmed · Digital Pass Ready</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRsvpModal(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-brand hover:bg-accent text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>RSVP Now — Free Entry</span>
              </button>
            )}

            {/* Share Trigger & Security Guarantee */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-3 text-xs font-semibold text-ink transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-accent" />
                <span>Invite Friends / Share Link</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted text-center pt-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                <span>Instant confirmation • Verified listing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean RSVP Modal if native event */}
      {!isExternal && showRsvpModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRsvpModal(false);
          }}
        >
          <div className="relative w-full max-w-md bg-surface rounded-2xl border border-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRsvpModal(false)}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink text-sm font-bold p-1 z-10"
              aria-label="Close modal"
            >
              ✕
            </button>
            <RSVPForm
              event={event}
              onSuccess={(rsvp) => {
                setConfirmedRsvp(rsvp);
                // Keep showRsvpModal open so the confirmation screen ('step' === 'success')
                // with attendee name, digital pass, calendar links, and organizer follow card
                // opens/remains visible automatically right after RSVP is created!
              }}
            />
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareEventModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        event={event}
      />
    </div>
  );
}
