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
  Lock,
  MessageSquare
} from 'lucide-react';
import { EventItem, RSVPItem, EventAnnouncement } from '@/types';
import { formatIST, getRSVPsByEvent, getAnnouncements, subscribeToStore } from '@/lib/store';
import { getLocalAuthSession, useAuth } from '@/lib/auth';
import RSVPForm from '@/components/ui/RSVPForm';
import ShareEventModal from '@/components/events/ShareEventModal';
import AnnouncementBanner from '@/components/communication/AnnouncementBanner';
import AuthModal from '@/components/auth/AuthModal';
import EventConversationModal from '@/components/communication/EventConversationModal';

function ResponsiveEventPoster({ src, title }: { src?: string; title: string }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [triedProxy, setTriedProxy] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setTriedProxy(false);
    setHasError(false);
  }, [src]);

  if (!currentSrc || hasError) {
    return (
      <div className="flex items-center justify-center h-full bg-[#111114] text-white/50 text-xs">
        No poster available
      </div>
    );
  }

  const handleError = () => {
    if (!triedProxy && currentSrc && !currentSrc.startsWith('/api/image-proxy') && !currentSrc.startsWith('data:')) {
      setTriedProxy(true);
      setCurrentSrc(`/api/image-proxy?url=${encodeURIComponent(currentSrc)}`);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Ambient Blurred Backdrop for widescreen, banner or vertical flyers */}
      <img
        src={currentSrc}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-45 brightness-75 select-none pointer-events-none"
      />
      {/* Crystal Clear Poster fitting any aspect ratio without cropping text/faces */}
      <img
        src={currentSrc}
        alt={title}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={handleError}
        className="relative max-h-full max-w-full object-contain z-10 drop-shadow-xl"
      />
    </div>
  );
}

interface UnifiedEventDetailViewProps {
  event: EventItem;
}

export default function UnifiedEventDetailView({ event }: { event: EventItem }) {
  const { isLoggedIn, profile, user } = useAuth();
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [confirmedRsvp, setConfirmedRsvp] = useState<RSVPItem | null>(null);
  const [announcements, setAnnouncements] = useState<EventAnnouncement[]>([]);

  const handleAskHostClick = () => {
    const session = getLocalAuthSession();
    if (isLoggedIn || user || profile || session?.email) {
      setShowConversationModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

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

  useEffect(() => {
    setAnnouncements(getAnnouncements(event.id));
    const unsub = subscribeToStore(() => {
      setAnnouncements(getAnnouncements(event.id));
    });
    return () => unsub();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 sm:py-10 w-full font-sans text-white">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Discover</span>
        </Link>

        <button
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-[#0D0D10] hover:bg-[#111114] text-xs font-bold text-white transition shadow-xs cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#FF5500]" />
          <span>Share</span>
        </button>
      </div>

      {/* Host Announcements Banner */}
      <AnnouncementBanner
        announcements={announcements}
        brandColor={event.organizer_brand_color}
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
        {/* Left Column: Poster & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          {/* Cover Poster */}
          <div className="relative aspect-[16/9] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0D0D10] border border-white/10 shadow-sm">
            <ResponsiveEventPoster src={event.cover_image_url} title={event.title} />

            {/* Badges Overlay */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider shadow-sm flex items-center gap-1.5 border border-white/10">
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
                <span className="px-3 py-1 rounded-full bg-[#0D0D10]/90 backdrop-blur-md text-[11px] font-bold text-white shadow-sm border border-white/15">
                  {event.external_price_text}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-[#0D0D10]/90 backdrop-blur-md text-[11px] font-bold text-white shadow-sm border border-white/15">
                  Free RSVP
                </span>
              )}
            </div>
          </div>

          {/* Event Header Information */}
          <div className="space-y-2.5">
            {(event.is_public === false || String(event.is_public) === 'false') && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300 font-medium">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Private Gathering:</strong> Unlisted from public discovery. You received exclusive direct invite access from the host.
                </span>
              </div>
            )}

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              {event.title}
            </h1>

            {event.tagline && (
              <p className="text-sm font-normal text-white/60 leading-relaxed">
                {event.tagline}
              </p>
            )}
          </div>

          {/* Schedule & Location Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Date / Time Card */}
            <div className="p-4 rounded-2xl bg-[#0D0D10] border border-white/10 flex items-start gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#111114] border border-white/10 text-white flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#FF5500]" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">When</div>
                <div className="text-xs font-bold text-white mt-0.5">{formatIST(event.start_at)}</div>
                {event.end_at && (
                  <div className="text-[11px] text-white/50 mt-0.5">
                    Until {formatIST(event.end_at).split('·')[1] || formatIST(event.end_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Location Card */}
            <div className="p-4 rounded-2xl bg-[#0D0D10] border border-white/10 flex items-start gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#111114] border border-white/10 text-white flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#FF5500]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Where</div>
                <div className="text-xs font-bold text-white truncate mt-0.5">
                  {event.location_name || event.city}
                </div>
                <div className="text-[11px] text-white/50 truncate">
                  {event.location_address || `${event.city}, India`}
                </div>
                {event.event_type !== 'online' && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF5500] hover:underline mt-1"
                  >
                    <span>View on Google Maps</span>
                    <Navigation className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-[#0D0D10] rounded-2xl p-6 border border-white/10 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/40">
              About This Experience
            </h2>
            <div className="text-xs sm:text-sm font-normal text-white/80 whitespace-pre-line leading-relaxed">
              {event.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Host Profile Card */}
          <div className="p-4 rounded-2xl bg-[#0D0D10] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              {event.organizer_logo ? (
                <Image
                  src={event.organizer_logo}
                  alt={event.organizer_name || 'Organizer'}
                  width={42}
                  height={42}
                  className="rounded-full object-cover border border-white/20 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#111114] border border-white/10 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {(event.organizer_name || 'V')[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  Hosted by {event.organizer_name || event.source_platform || 'Curated by Vibe'}
                </div>
                <div className="text-[11px] text-white/40 truncate">
                  {event.organizer_handle ? `@${event.organizer_handle}` : 'Verified Event Curator'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-white/10">
              <button
                onClick={handleAskHostClick}
                className="py-2 px-3 sm:py-1.5 sm:px-3.5 rounded-xl bg-[#111114] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white hover:text-[#FF5500] transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Send a direct question to the organizer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                <span>Ask Host</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="py-2 px-3 sm:py-1.5 sm:px-3.5 rounded-xl border border-white/10 bg-[#111114] hover:bg-white/10 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5 text-white/60 shrink-0" />
                <span>Share Event</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Action & Ticket Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          <div className="bg-[#0D0D10] rounded-2xl p-5 sm:p-6 border border-white/10 shadow-sm space-y-4 sm:space-y-5 sticky top-24">
            {/* Price & Status Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Pricing</div>
                <div className="text-2xl font-black text-white font-sans">
                  {event.external_price_text || (isExternal ? 'Official Ticketing' : 'Free Entry')}
                </div>
              </div>

              {event.capacity && (
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">Availability</div>
                  <div className="text-xs font-bold text-[#FF5500] flex items-center gap-1">
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
                className="w-full py-3.5 px-4 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold text-xs transition shadow-lg shadow-[#FF5500]/25 flex items-center justify-center gap-2 group cursor-pointer"
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
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-medium text-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Spot Confirmed · Digital Pass Ready</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowRsvpModal(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold text-xs transition shadow-lg shadow-[#FF5500]/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>RSVP Now — Free Entry</span>
              </button>
            )}

            {/* Share Trigger, Ask Host & Security Guarantee */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleAskHostClick}
                className="w-full py-2.5 rounded-xl border border-white/10 bg-[#111114] hover:bg-white/10 hover:border-[#FF5500]/50 text-xs font-semibold text-white hover:text-[#FF5500] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Ask Host a Question</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="w-full py-2.5 rounded-xl border border-white/10 bg-[#111114] hover:bg-white/10 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Invite Friends / Share Link</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/50 text-center pt-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant confirmation • Verified listing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean RSVP Modal if native event */}
      {!isExternal && showRsvpModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRsvpModal(false);
          }}
        >
          <div className="relative w-full max-w-md bg-[#0D0D10] rounded-3xl border border-white/15 p-6 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto text-white">
            <button
              onClick={() => setShowRsvpModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-sm font-bold z-10 cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>
            <RSVPForm
              event={event}
              cardClass="border-0 shadow-none p-0 bg-transparent text-white"
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

      {/* Auth Modal for Unauthenticated Guests */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={() => {
          setShowAuthModal(false);
          setShowConversationModal(true);
        }}
      />

      {/* Vibe Host ↔ Guest Communication Gateway Modal */}
      <EventConversationModal
        event={event}
        isOpen={showConversationModal}
        onClose={() => setShowConversationModal(false)}
        guestName={profile?.name || user?.user_metadata?.full_name}
        guestEmail={user?.email || profile?.email}
      />
    </div>
  );
}
