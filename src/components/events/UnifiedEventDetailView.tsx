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
  Ticket,
  Lock
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full font-sans text-[#0F172A]">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2E8F0]">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discover</span>
        </Link>

        <button
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] transition shadow-xs cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#E8621A]" />
          <span>Share</span>
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Poster & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cover Poster */}
          <div className="relative aspect-[16/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] shadow-sm">
            {event.cover_image_url ? (
              <Image
                src={event.cover_image_url}
                alt={event.title}
                fill
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#F1F5F9] text-[#64748B] text-xs">
                No poster available
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                {event.is_public === false || String(event.is_public) === 'false' ? (
                  <>
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>PRIVATE · INVITE ONLY</span>
                  </>
                ) : event.source_platform ? (
                  `🎟️ ${event.source_platform.toUpperCase()}`
                ) : (
                  'LIVE EVENT'
                )}
              </span>

              {event.external_price_text ? (
                <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-bold text-[#0F172A] shadow-sm">
                  {event.external_price_text}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[11px] font-bold text-[#0F172A] shadow-sm">
                  Free RSVP
                </span>
              )}
            </div>
          </div>

          {/* Event Header Information */}
          <div className="space-y-2.5">
            {(event.is_public === false || String(event.is_public) === 'false') && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-950 font-medium">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Private Gathering:</strong> Unlisted from public discovery. You received exclusive direct invite access from the host.
                </span>
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight leading-tight">
              {event.title}
            </h1>

            {event.tagline && (
              <p className="text-sm font-normal text-[#64748B] leading-relaxed">
                {event.tagline}
              </p>
            )}
          </div>

          {/* Schedule & Location Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Date / Time Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-start gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#E8621A]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">When</div>
                <div className="text-xs font-bold text-[#0F172A] mt-0.5">{formatIST(event.start_at)}</div>
                {event.end_at && (
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Until {formatIST(event.end_at).split('·')[1] || formatIST(event.end_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Location Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-start gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#E8621A]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Where</div>
                <div className="text-xs font-bold text-[#0F172A] truncate mt-0.5">
                  {event.location_name || event.city}
                </div>
                <div className="text-[11px] text-[#64748B] truncate">
                  {event.location_address || `${event.city}, India`}
                </div>
                {event.event_type !== 'online' && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E8621A] hover:underline mt-1"
                  >
                    <span>View on Google Maps</span>
                    <Navigation className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              About This Experience
            </h2>
            <div className="text-xs sm:text-sm font-normal text-[#475569] whitespace-pre-line leading-relaxed">
              {event.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Host Profile Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              {event.organizer_logo ? (
                <Image
                  src={event.organizer_logo}
                  alt={event.organizer_name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover border border-[#E2E8F0]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold">
                  {(event.organizer_name || 'V')[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-[#0F172A]">
                  Hosted by {event.organizer_name || event.source_platform || 'Curated by Vibe'}
                </div>
                <div className="text-[11px] text-[#64748B]">
                  {event.organizer_handle ? `@${event.organizer_handle}` : 'Verified Event Curator'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition cursor-pointer"
            >
              Share Event
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Action & Ticket Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-sm space-y-5 sticky top-24">
            {/* Price & Status Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Pricing</div>
                <div className="text-2xl font-black text-[#0F172A] font-sans">
                  {event.external_price_text || (isExternal ? 'Official Ticketing' : 'Free Entry')}
                </div>
              </div>

              {event.capacity && (
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Availability</div>
                  <div className="text-xs font-bold text-[#E8621A] flex items-center gap-1">
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
                className="w-full py-3.5 px-4 rounded-xl bg-[#0F172A] hover:bg-black text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 group cursor-pointer"
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
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-medium text-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Spot Confirmed · Digital Pass Ready</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRsvpModal(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0F172A] hover:bg-black text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>RSVP Now — Free Entry</span>
              </button>
            )}

            {/* Share Trigger & Security Guarantee */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-xs font-semibold text-[#0F172A] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#E8621A]" />
                <span>Invite Friends / Share Link</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] text-center pt-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowRsvpModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] w-8 h-8 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center transition-colors text-sm font-bold z-10 cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>
            <RSVPForm
              event={event}
              cardClass="border-0 shadow-none p-0 bg-transparent"
              onSuccess={(rsvp) => {
                setConfirmedRsvp(rsvp);
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
