'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Ticket,
  Lock,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react';
import { EventItem, RSVPItem, EventAnnouncement } from '@/types';
import { getRSVPsByEvent, getAnnouncements, subscribeToStore } from '@/lib/store';
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
      {/* Ambient Blurred Backdrop */}
      <img
        src={currentSrc}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-45 brightness-75 select-none pointer-events-none"
      />
      {/* Crystal Clear Poster fitting any aspect ratio without cropping */}
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

function formatWhenDate(dateStr?: string) {
  if (!dateStr) {
    return {
      dateText: 'THU, 15 OCT · 7:00 PM',
      tzText: 'India Standard Time',
    };
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return {
        dateText: dateStr,
        tzText: 'India Standard Time',
      };
    }
    const weekday = d.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }).toUpperCase();
    const day = d.toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' });
    const month = d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }).toUpperCase();
    const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).toUpperCase();
    return {
      dateText: `${weekday}, ${day} ${month} · ${time}`,
      tzText: 'India Standard Time',
    };
  } catch {
    return {
      dateText: 'THU, 15 OCT · 7:00 PM',
      tzText: 'India Standard Time',
    };
  }
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
    setShowConversationModal(true);
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

  const { dateText, tzText } = formatWhenDate(event.start_at);

  const cityName = event.city || 'Mumbai';
  const categoryName = (event as any).category || 'Music';
  const venueTitle = event.location_name || `${cityName}`;
  const mapQuery = encodeURIComponent(`${event.location_name || ''} ${event.city || ''}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const rawTitle = (event.title || 'Sameera Bharadwaj, live').trim();
  const cleanTitle = rawTitle.endsWith('.') ? rawTitle.slice(0, -1) : rawTitle;

  const hostName = event.organizer_name || 'Swaniki Social';
  const hostBio = (event as any).organizer_bio || (event.organizer_handle ? `@${event.organizer_handle}` : 'Bringing people together');
  const hostInitials = (hostName.split(' ').map((w) => w[0]).join('') || 'SS').slice(0, 2).toUpperCase();

  const isPrivate = event.is_public === false || String(event.is_public) === 'false';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 w-full font-sans text-white">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to discover</span>
        </Link>

        <button
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share event</span>
        </button>
      </div>

      {/* Host Announcements Banner */}
      <AnnouncementBanner
        announcements={announcements}
        brandColor={event.organizer_brand_color}
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Left Column: Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cover Poster */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#0D0D10] border border-white/10 shadow-lg">
            <ResponsiveEventPoster src={event.cover_image_url} title={event.title} />

            {/* Badges Overlay */}
            <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none z-20">
              <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-semibold text-white shadow-sm flex items-center gap-1.5 border border-white/10">
                {isPrivate ? (
                  <>
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Private</span>
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="w-3 h-3 text-white/80" />
                    <span>{categoryName}</span>
                  </>
                )}
              </span>

              <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-semibold text-white shadow-sm border border-white/10">
                Selling fast
              </span>
            </div>
          </div>

          {/* Event Header Information */}
          <div className="space-y-1.5">
            {/* Category · City Meta */}
            <div className="text-xs text-white/50 font-medium tracking-wide">
              {categoryName} · {cityName}
            </div>

            {/* Title with styled period */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {cleanTitle}
              <span className="text-[#FF5500]">.</span>
            </h1>

            {/* Tagline */}
            <p className="text-sm font-normal text-white/60 leading-relaxed pt-0.5">
              {event.tagline || 'A good time, with good people.'}
            </p>
          </div>

          {/* Schedule & Location Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Date / Time Card */}
            <div className="p-4 rounded-2xl bg-[#0D0D10] border border-white/10 flex items-start gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#23150F] border border-[#FF5500]/20 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#FF5500]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">WHEN</div>
                <div className="text-xs sm:text-sm font-bold text-white mt-0.5">{dateText}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{tzText}</div>
              </div>
            </div>

            {/* Location Card */}
            <div className="p-4 rounded-2xl bg-[#0D0D10] border border-white/10 flex items-start gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#23150F] border border-[#FF5500]/20 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#FF5500]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">WHERE</div>
                <div className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                  {venueTitle}
                </div>
                {event.event_type !== 'online' && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#FF5500] hover:underline mt-0.5 cursor-pointer"
                  >
                    <span>View on map</span>
                    <span className="text-xs">↗</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="pt-2 space-y-2.5">
            <h2 className="text-base sm:text-lg font-bold text-white">About this Vibe</h2>
            <div className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal whitespace-pre-line">
              {event.description ||
                'An evening of soulful music under the open sky. Join Sameera Bharadwaj for a live performance that brings familiar favourites and fresh sounds together. Bring your friends, find your spot, and let the night unfold.'}
            </div>
          </div>

          {/* Host Profile Row */}
          <div className="border-t border-white/10 pt-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3">
              YOUR HOST
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {event.organizer_logo ? (
                  <Image
                    src={event.organizer_logo}
                    alt={hostName}
                    width={40}
                    height={40}
                    className="rounded-full object-cover border border-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1E1714] border border-[#FF5500]/20 text-[#FF5500] flex items-center justify-center text-xs font-bold shrink-0">
                    {hostInitials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white truncate">
                    {hostName}
                  </div>
                  <div className="text-[11px] sm:text-xs text-white/50 truncate">
                    {hostBio}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAskHostClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/15 bg-[#111114] hover:bg-white/10 text-xs font-semibold text-white transition cursor-pointer shrink-0"
                title="Message host (Upcoming feature)"
              >
                <MessageSquare className="w-3.5 h-3.5 text-white/70" />
                <span>Message</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-300 font-medium">Soon</span>
              </button>
            </div>
          </div>

          {/* Before You Arrive Checklist */}
          <div className="border-t border-white/10 pt-5 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white">Before you arrive</h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/70">
                <Clock className="w-4 h-4 text-[#FF5500] shrink-0" />
                <span>Doors open 30 minutes before the event.</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/70">
                <Ticket className="w-4 h-4 text-[#FF5500] shrink-0" />
                <span>Keep your guest pass handy at the entrance.</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/70">
                <MessageSquare className="w-4 h-4 text-[#FF5500] shrink-0" />
                <span>Have a question? Your host is a message away.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Card (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-[#0D0D10] rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl sticky top-24 space-y-5">
            {/* Top Status */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Spots available</span>
              </div>
              <Ticket className="w-4 h-4 text-white/40" />
            </div>

            {/* Header */}
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Your spot is waiting.
              </h3>
              <p className="text-xs sm:text-sm text-white/50 mt-1">
                Make a plan worth showing up for.
              </p>
            </div>

            {/* Pricing */}
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-white font-sans">
                  {event.external_price_text || (isExternal ? 'Official Ticketing' : '₹499')}
                </span>
                {!isExternal && (
                  <span className="text-xs text-white/50 font-normal">per person</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400/90 mt-2 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>1 guest pass · Instant confirmation</span>
              </div>
            </div>

            {/* CTA Button */}
            {isExternal && normalizedTicketUrl ? (
              <a
                href={normalizedTicketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E8621A] hover:brightness-110 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-[#FF5500]/25 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Ticket className="w-4 h-4" />
                <span>Book Tickets on {event.source_platform ? event.source_platform.toUpperCase() : 'Official Site'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            ) : confirmedRsvp ? (
              <button
                onClick={() => setShowRsvpModal(true)}
                className="w-full py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>View Your Confirmed Pass & QR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowRsvpModal(true)}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E8621A] hover:brightness-110 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-[#FF5500]/25 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Ticket className="w-4 h-4" />
                <span>Reserve your spot</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}

            <div className="text-[11px] text-white/40 text-center">
              Sample event · No payment or booking
            </div>

            <div className="border-t border-white/10" />

            {/* Attendees Social Proof */}
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-amber-600/90 border-2 border-[#0D0D10] text-[9px] font-bold text-white flex items-center justify-center">
                  AG
                </div>
                <div className="w-6 h-6 rounded-full bg-rose-600/90 border-2 border-[#0D0D10] text-[9px] font-bold text-white flex items-center justify-center">
                  RK
                </div>
                <div className="w-6 h-6 rounded-full bg-teal-600/90 border-2 border-[#0D0D10] text-[9px] font-bold text-white flex items-center justify-center">
                  NM
                </div>
                <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-[#0D0D10] text-[9px] font-bold text-white/70 flex items-center justify-center">
                  +00
                </div>
              </div>
              <span className="text-xs font-medium text-white/70">
                {Math.max(128, confirmedCount)} people going
              </span>
            </div>

            {/* Secondary Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handleAskHostClick}
                className="w-full py-2.5 px-4 rounded-xl border border-white/10 bg-[#111114] hover:bg-white/10 text-xs font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer"
                title="Ask the host (Upcoming feature)"
              >
                <MessageSquare className="w-3.5 h-3.5 text-white/70" />
                <span>Ask the host</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-300 font-medium">Soon</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-white/10 bg-[#111114] hover:bg-white/10 text-xs font-semibold text-white transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-white/70" />
                <span>Invite a friend</span>
              </button>
            </div>

            {/* Direct Connection Guarantee */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400/90 text-center pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Direct connection with your host</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clean RSVP Modal */}
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
