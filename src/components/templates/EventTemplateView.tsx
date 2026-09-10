'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  ExternalLink,
  Navigation,
  Flame,
  CheckCircle2,
  Users,
  Video,
  Globe,
  Download,
  ShieldCheck,
  Eye,
  Lock,
  Zap,
  BookOpen,
  Terminal,
  Disc3,
  Compass,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { EventItem } from '@/types';
import { formatIST, getRSVPsByEvent, subscribeToStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import LiveCounter from '@/components/ui/LiveCounter';
import WhoIsGoing from '@/components/ui/WhoIsGoing';
import GuestComments from '@/components/ui/GuestComments';
import RSVPForm from '@/components/ui/RSVPForm';
import ShareBar from '@/components/ui/ShareBar';
import StatusBanner from '@/components/ui/StatusBanner';
import SocialBannerModal from '@/components/banner/SocialBannerModal';
import FollowButton from '@/components/ui/FollowButton';
import EventGuestListModal from '@/components/ui/EventGuestListModal';

interface EventTemplateViewProps {
  event: EventItem;
}

export default function EventTemplateView({ event }: EventTemplateViewProps) {
  const { profile } = useAuth();
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showGuestListModal, setShowGuestListModal] = useState(false);
  const [showGuestPreview, setShowGuestPreview] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [confirmedCount, setConfirmedCount] = useState<number>(() => {
    return getRSVPsByEvent(event.id).filter(r => r.status === 'confirmed').length;
  });
  const [waitlistCount, setWaitlistCount] = useState<number>(() => {
    return getRSVPsByEvent(event.id).filter(r => r.status === 'waitlisted').length;
  });

  const isOwner = Boolean(
    profile && (
      (profile.id && profile.id === event.organizer_id) ||
      (profile.handle && event.organizer_handle && profile.handle.toLowerCase() === event.organizer_handle.toLowerCase()) ||
      (profile.email && profile.email.toLowerCase() === event.organizer_id?.toLowerCase())
    )
  );

  React.useEffect(() => {
    const update = () => {
      const list = getRSVPsByEvent(event.id);
      setConfirmedCount(list.filter(r => r.status === 'confirmed').length);
      setWaitlistCount(list.filter(r => r.status === 'waitlisted').length);
    };
    update();
    const unsub = subscribeToStore(update);
    return () => unsub();
  }, [event.id]);

  // Bespoke editorial template design tokens
  const templateConfig = {
    grove: {
      name: 'Grove',
      category: 'Community & Networking',
      heroBadgeText: '✦ COMMUNITY SALON · EDITION N° 2026',
      heroBadgeIcon: BookOpen,
      pageBg: 'bg-[#F9F7F2] text-stone-900',
      heroBg: 'bg-gradient-to-br from-[#122818] via-[#0E2013] to-[#08130B] text-white',
      heroGlow: 'from-emerald-500/15 via-transparent to-transparent',
      accentColor: '#2D5A27',
      accentBorder: 'border-emerald-500/30',
      titleFont: 'font-tagline text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-sm',
      taglineFont: 'font-tagline italic text-lg sm:text-xl md:text-2xl text-emerald-200/95 max-w-3xl leading-relaxed',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      metaPill: 'bg-white/10 hover:bg-white/15 text-white border-white/20',
      // Cards & Content
      cardClass: 'bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-[0_4px_24px_rgba(45,90,39,0.06)]',
      innerCardClass: 'bg-[#F5F2EA] rounded-2xl p-4 border border-stone-200/80 text-stone-800',
      headingClass: 'font-tagline font-bold text-xl text-[#142E1B]',
      textSecondary: 'text-stone-600',
      textMuted: 'text-stone-500',
      borderClass: 'border-stone-200',
      buttonPrimary: 'bg-[#2D5A27] hover:bg-[#23471E] text-white font-bold rounded-full shadow-md hover-lift transition-all',
      hostBorder: 'border-emerald-700/40'
    },
    sprint: {
      name: 'Sprint',
      category: 'Athletic & High Voltage',
      heroBadgeText: '⚡ HIGH VOLTAGE RUN & SPRINT',
      heroBadgeIcon: Zap,
      pageBg: 'bg-[#0B0C10] text-white',
      heroBg: 'bg-gradient-to-br from-[#1A0C05] via-[#100702] to-[#070301] text-white',
      heroGlow: 'from-orange-500/30 via-orange-600/10 to-transparent',
      accentColor: '#E8621A',
      accentBorder: 'border-orange-500/40',
      titleFont: 'font-sans text-4xl sm:text-6xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none',
      taglineFont: 'font-sans font-bold uppercase tracking-wider text-base sm:text-lg md:text-xl text-orange-400 max-w-3xl',
      badgeBg: 'bg-orange-500 text-black font-black uppercase tracking-wider',
      metaPill: 'bg-[#181B26] text-orange-200 border-orange-500/40 font-mono text-xs uppercase',
      // Cards & Content
      cardClass: 'bg-[#13151F] rounded-xl p-6 sm:p-8 border border-orange-500/30 shadow-[0_8px_32px_rgba(232,98,26,0.12)] text-white',
      innerCardClass: 'bg-[#1A1D2B] rounded-lg p-4 border border-orange-500/20 text-slate-200',
      headingClass: 'font-sans font-black uppercase italic tracking-tight text-xl text-white flex items-center gap-2',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
      borderClass: 'border-orange-500/25',
      buttonPrimary: 'bg-gradient-to-r from-[#E8621A] to-[#FF7700] hover:from-[#D45510] text-white font-black uppercase tracking-wider rounded-lg shadow-[0_4px_20px_rgba(232,98,26,0.4)] hover-lift transition-all',
      hostBorder: 'border-orange-500/40'
    },
    bloom: {
      name: 'Bloom',
      category: 'Celebrations & Social',
      heroBadgeText: '✦ SOIRÉE & SUPPER CLUB ✦',
      heroBadgeIcon: Sparkles,
      pageBg: 'bg-[#FAF4F7] text-stone-900',
      heroBg: 'bg-gradient-to-br from-[#301124] via-[#1F0A17] to-[#12050D] text-white',
      heroGlow: 'from-rose-500/25 via-pink-500/10 to-transparent',
      accentColor: '#C47B89',
      accentBorder: 'border-rose-400/40',
      titleFont: 'font-display italic font-black text-4xl sm:text-5xl md:text-6xl text-white leading-tight tracking-tight drop-shadow-sm',
      taglineFont: 'font-display italic text-lg sm:text-xl md:text-2xl text-rose-200/95 max-w-3xl leading-relaxed',
      badgeBg: 'bg-rose-950/70 text-rose-200 border-rose-400/40 backdrop-blur-md',
      metaPill: 'bg-white/10 hover:bg-white/20 text-rose-100 border-rose-300/30 backdrop-blur-md',
      // Cards & Content
      cardClass: 'bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-[0_12px_40px_rgba(196,123,137,0.08)]',
      innerCardClass: 'bg-[#FFF8FA] rounded-2xl p-4 border border-rose-100/90 text-stone-800',
      headingClass: 'font-display italic font-bold text-xl text-[#301124]',
      textSecondary: 'text-stone-600',
      textMuted: 'text-stone-500',
      borderClass: 'border-rose-200/80',
      buttonPrimary: 'bg-gradient-to-r from-[#C47B89] to-[#D98A99] hover:from-[#B56E7C] text-white font-bold rounded-full shadow-[0_4px_20px_rgba(196,123,137,0.3)] hover-lift transition-all',
      hostBorder: 'border-rose-400/40'
    },
    vertex: {
      name: 'Vertex',
      category: 'Tech Summit & Hacker Grid',
      heroBadgeText: '[ DEV // SUMMIT // 2026 ]',
      heroBadgeIcon: Terminal,
      pageBg: 'bg-[#060913] text-slate-100',
      heroBg: 'bg-gradient-to-br from-[#0B1528] via-[#070D1A] to-[#03060C] text-slate-100',
      heroGlow: 'from-sky-500/20 via-cyan-500/10 to-transparent',
      accentColor: '#00F0FF',
      accentBorder: 'border-cyan-500/40',
      titleFont: 'font-sans text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight',
      taglineFont: 'font-mono text-sm sm:text-base md:text-lg text-cyan-300/90 max-w-3xl leading-relaxed',
      badgeBg: 'bg-sky-950/80 text-cyan-300 border-cyan-500/50 font-mono text-xs uppercase tracking-widest',
      metaPill: 'bg-[#0A1222] text-sky-200 border-sky-500/30 font-mono text-xs',
      // Cards & Content
      cardClass: 'bg-[#0C1322] rounded-lg p-6 sm:p-8 border border-sky-500/30 shadow-[0_8px_32px_rgba(0,240,255,0.08)] text-slate-100',
      innerCardClass: 'bg-[#070D18] rounded-md p-4 border border-sky-500/20 text-slate-200 font-mono text-xs',
      headingClass: 'font-sans font-black tracking-tight text-xl text-cyan-400 flex items-center gap-2',
      textSecondary: 'text-slate-300',
      textMuted: 'text-slate-400',
      borderClass: 'border-sky-500/25',
      buttonPrimary: 'bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold uppercase tracking-wider rounded-md shadow-[0_0_20px_rgba(0,240,255,0.35)] hover-lift transition-all',
      hostBorder: 'border-cyan-500/40'
    },
    ember: {
      name: 'Ember',
      category: 'Culture & Acoustic Lounge',
      heroBadgeText: 'SIDE A · LIVE ACOUSTIC & WORDS',
      heroBadgeIcon: Disc3,
      pageBg: 'bg-[#FAF5ED] text-stone-900',
      heroBg: 'bg-gradient-to-br from-[#2D140B] via-[#1C0B05] to-[#0F0502] text-white',
      heroGlow: 'from-amber-500/25 via-orange-600/10 to-transparent',
      accentColor: '#C85A32',
      accentBorder: 'border-amber-500/40',
      titleFont: 'font-tagline text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-normal drop-shadow-sm',
      taglineFont: 'font-tagline italic text-lg sm:text-xl md:text-2xl text-amber-200 max-w-3xl leading-relaxed',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      metaPill: 'bg-white/10 hover:bg-white/15 text-amber-100 border-amber-400/30 font-serif',
      // Cards & Content
      cardClass: 'bg-[#FFFDF9] rounded-2xl p-6 sm:p-8 border border-amber-200/80 shadow-[0_8px_28px_rgba(200,90,50,0.07)]',
      innerCardClass: 'bg-[#F5ECE0] rounded-xl p-4 border border-amber-200/60 text-stone-800',
      headingClass: 'font-tagline font-bold text-xl text-[#2D140B]',
      textSecondary: 'text-stone-600',
      textMuted: 'text-stone-500',
      borderClass: 'border-amber-200/80',
      buttonPrimary: 'bg-[#C85A32] hover:bg-[#B34D28] text-white font-bold rounded-xl shadow-[0_4px_16px_rgba(200,90,50,0.3)] hover-lift transition-all',
      hostBorder: 'border-amber-500/40'
    }
  }[event.template] || {
    name: 'Grove',
    category: 'Community Gathering',
    heroBadgeText: '✦ COMMUNITY EVENT',
    heroBadgeIcon: Sparkles,
    pageBg: 'bg-[#F9F7F4] text-stone-900',
    heroBg: 'bg-brand text-white',
    heroGlow: 'from-accent/20 via-transparent to-transparent',
    accentColor: '#E8621A',
    accentBorder: 'border-accent/40',
    titleFont: 'font-display text-4xl sm:text-5xl md:text-6xl font-black text-white',
    taglineFont: 'font-tagline italic text-lg sm:text-xl text-white/90',
    badgeBg: 'bg-white/15 text-white border-white/20',
    metaPill: 'bg-white/10 text-white border-white/15',
    cardClass: 'bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-card',
    innerCardClass: 'bg-surface-2 rounded-xl p-4 border border-border text-ink',
    headingClass: 'font-display font-bold text-xl text-ink',
    textSecondary: 'text-ink-secondary',
    textMuted: 'text-ink-muted',
    borderClass: 'border-border',
    buttonPrimary: 'bg-brand hover:bg-brand-mid text-white font-bold rounded-xl',
    hostBorder: 'border-border'
  };

  const HeroBadgeIcon = templateConfig.heroBadgeIcon;

  // Google Maps embed URL
  const mapSearchParts = [
    event.location_name,
    event.location_address,
    event.district ? `${event.district} District` : '',
    event.city,
    event.state,
    event.pincode,
    'India'
  ].filter(Boolean).map(s => s?.trim()).filter(Boolean);

  const mapSearchText = Array.from(new Set(mapSearchParts)).join(', ');
  const mapQuery = encodeURIComponent(mapSearchText);
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directMapsUrl = event.maps_url?.trim() || `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const directNavUrl = event.maps_url?.trim() || `https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`;

  return (
    <div className={`min-h-screen ${templateConfig.pageBg} pb-24 transition-colors duration-300`}>
      {/* Sticky Host Admin Toolbar */}
      {isOwner && (
        <aside
          aria-label="Host Admin Toolbar"
          className="sticky top-0 z-40 bg-brand text-white border-b border-white/15 px-4 py-2.5 shadow-md backdrop-blur-md"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white tracking-wide">
                Host Mode ({event.template.toUpperCase()} Template Active)
              </span>
              <span className="hidden sm:inline text-white/50">|</span>
              <span className="hidden sm:inline font-mono text-gold">
                {confirmedCount} RSVPs Confirmed {event.capacity ? `/ ${event.capacity}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGuestListModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold border border-white/20 transition-all cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-gold" />
                <span>View RSVPs & Guests</span>
              </button>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent hover:bg-accent-dark text-white font-semibold transition-all"
              >
                <span>Dashboard</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </aside>
      )}

      {/* 1. Full-Bleed Bespoke Hero Section */}
      <section className={`relative overflow-hidden ${templateConfig.heroBg} pt-12 pb-20 md:pt-16 md:pb-28 border-b border-black/20`}>
        {/* Cover Art Backdrop */}
        <div className="absolute inset-0 z-0">
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            priority
            unoptimized
            className="object-cover opacity-25 filter blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
          <div className={`absolute inset-0 bg-gradient-to-tr ${templateConfig.heroGlow}`} />
        </div>

        {/* Ambient Top Laser Accent Line */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: templateConfig.accentColor }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row: Host Pill, Template Badge & Story Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Link
                href={`/${event.organizer_handle}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-semibold text-white transition-colors"
              >
                {event.organizer_logo && (
                  <Image
                    src={event.organizer_logo}
                    alt={event.organizer_name}
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                  />
                )}
                <span>Hosted by {event.organizer_name}</span>
              </Link>

              <FollowButton
                organizerId={event.organizer_id}
                organizerHandle={event.organizer_handle}
                organizerName={event.organizer_name}
                organizerLogo={event.organizer_logo}
                variant="hero"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full border ${templateConfig.badgeBg}`}>
                <HeroBadgeIcon className="w-3.5 h-3.5" />
                <span>{templateConfig.heroBadgeText}</span>
              </div>

              <button
                onClick={() => setShowBannerModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Share Banners</span>
              </button>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-4 max-w-4xl">
            <div>
              <StatusBanner event={event} confirmedRsvpCount={confirmedCount} />
            </div>

            <h1 className={templateConfig.titleFont}>
              {event.title}
            </h1>

            <p className={templateConfig.taglineFont}>
              {event.tagline}
            </p>

            {/* Quick Metadata Strip */}
            <div className="pt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-sm font-medium">
              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border ${templateConfig.metaPill}`}>
                <CalendarIcon className="w-4 h-4 text-amber-300" />
                <span>{formatIST(event.start_at)}</span>
              </div>

              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border ${templateConfig.metaPill}`}>
                <MapPin className="w-4 h-4 text-amber-300" />
                <span>{event.location_name} · {event.city}</span>
              </div>

              <LiveCounter
                eventId={event.id}
                capacity={event.capacity}
                className="bg-white/15 text-white border-white/25 backdrop-blur-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Page Content Grid */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        {/* Full-width Template-Adaptive ShareBar */}
        <div className="mb-8">
          <ShareBar
            event={event}
            onOpenBanners={() => setShowBannerModal(true)}
            cardClass={templateConfig.cardClass}
            innerCardClass={templateConfig.innerCardClass}
            borderClass={templateConfig.borderClass}
            textClass={templateConfig.headingClass}
            textSecondaryClass={templateConfig.textSecondary}
            textMutedClass={templateConfig.textMuted}
            accentColor={templateConfig.accentColor}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Event Narrative, Schedule, FAQs, Comments */}
          <div className="lg:col-span-7 space-y-8">
            {/* Event Description Card */}
            <div className={`${templateConfig.cardClass} space-y-4`}>
              <div className={`flex items-center justify-between border-b ${templateConfig.borderClass} pb-3.5`}>
                <h2 className={templateConfig.headingClass}>
                  About This Experience
                </h2>
                {event.ai_generated && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded-full border border-accent/20">
                    <Sparkles className="w-3 h-3" /> AI-Assisted Narrative
                  </span>
                )}
              </div>

              <div className={`prose text-[16px] leading-relaxed whitespace-pre-line ${templateConfig.textSecondary}`}>
                {event.description}
              </div>
            </div>

            {/* Featured Speakers & Hosts */}
            {event.sections.speakers && event.speakers && event.speakers.length > 0 && (
              <div className={`${templateConfig.cardClass} space-y-4`}>
                <h3 className={`border-b ${templateConfig.borderClass} pb-3.5 ${templateConfig.headingClass}`}>
                  Featured Speakers & Hosts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers.map((sp) => (
                    <div key={sp.id} className={`flex items-center gap-3.5 p-3.5 ${templateConfig.innerCardClass}`}>
                      <Image
                        src={sp.avatar}
                        alt={sp.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <h4 className="font-bold text-sm">{sp.name}</h4>
                        <p className={`text-xs ${templateConfig.textMuted}`}>{sp.role}</p>
                        {sp.company && (
                          <p className="text-[11px] font-semibold text-accent mt-0.5">{sp.company}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule / Agenda */}
            {event.sections.agenda && event.agenda && event.agenda.length > 0 && (
              <div className={`${templateConfig.cardClass} space-y-4`}>
                <h3 className={`border-b ${templateConfig.borderClass} pb-3.5 ${templateConfig.headingClass}`}>
                  Event Schedule & Run of Show
                </h3>
                <div className="space-y-3">
                  {event.agenda.map((ag) => (
                    <div key={ag.id} className={`flex items-start gap-4 p-3.5 ${templateConfig.innerCardClass}`}>
                      <div
                        className="px-2.5 py-1 rounded-md text-white font-mono text-xs font-bold whitespace-nowrap shadow-xs"
                        style={{ backgroundColor: templateConfig.accentColor }}
                      >
                        {ag.time}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{ag.title}</h4>
                        {ag.description && (
                          <p className={`text-xs mt-0.5 leading-relaxed ${templateConfig.textSecondary}`}>
                            {ag.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Directions Card */}
            <div className={`${templateConfig.cardClass} space-y-4`}>
              <div className={`flex items-center justify-between border-b ${templateConfig.borderClass} pb-3.5`}>
                <h3 className={templateConfig.headingClass}>
                  Location & Directions
                </h3>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${templateConfig.innerCardClass}`}>
                  {[event.district ? `${event.district} District` : '', event.state, 'India'].filter(Boolean).join(' · ')}
                </span>
              </div>

              <div>
                <div className="font-bold text-base">{event.location_name}</div>
                <div className={`text-xs mt-0.5 ${templateConfig.textSecondary}`}>{event.location_address}</div>
                {(event.district || event.state || event.pincode) && (
                  <div className={`text-xs mt-2 flex flex-wrap items-center gap-2 ${templateConfig.textMuted}`}>
                    {event.district && <span className={`px-2 py-0.5 rounded border ${templateConfig.innerCardClass}`}>District: <strong>{event.district}</strong></span>}
                    {event.state && <span className={`px-2 py-0.5 rounded border ${templateConfig.innerCardClass}`}>State: <strong>{event.state}</strong></span>}
                    {event.pincode && <span className={`px-2 py-0.5 rounded border ${templateConfig.innerCardClass}`}>PIN: <strong>{event.pincode}</strong></span>}
                  </div>
                )}
                {event.online_link && (
                  <div className="mt-2 text-xs text-accent font-semibold flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> Virtual link sent upon pass confirmation
                  </div>
                )}
              </div>

              {event.event_type !== 'online' && (
                <div className="space-y-3 pt-2">
                  <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-border shadow-inner">
                    <iframe
                      title={`Google Maps embed for ${event.location_name}`}
                      src={mapsEmbedUrl}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <a
                      href={directMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-mid text-white text-xs font-bold hover-lift transition-all shadow-sm"
                    >
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      View in Google Maps
                    </a>

                    <a
                      href={directNavUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold hover-lift transition-all ${templateConfig.innerCardClass}`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-accent" />
                      Get Directions
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Accordion */}
            {event.sections.faq && event.faq && event.faq.length > 0 && (
              <div className={`${templateConfig.cardClass} space-y-3`}>
                <h3 className={`border-b ${templateConfig.borderClass} pb-3.5 ${templateConfig.headingClass}`}>
                  Frequently Asked Questions
                </h3>
                <div className="space-y-2.5">
                  {event.faq.map((item, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div key={index} className={`rounded-xl border overflow-hidden ${templateConfig.borderClass}`}>
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          className={`w-full flex items-center justify-between p-3.5 text-left transition-colors ${templateConfig.innerCardClass}`}
                        >
                          <span className="font-semibold text-xs">{item.q}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
                        </button>
                        {isOpen && (
                          <div className={`p-4 text-xs leading-relaxed border-t ${templateConfig.borderClass} ${templateConfig.textSecondary}`}>
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Guest Discussion Thread */}
            <GuestComments
              eventId={event.id}
              cardClass={templateConfig.cardClass}
              innerCardClass={templateConfig.innerCardClass}
              borderClass={templateConfig.borderClass}
              headingClass={templateConfig.headingClass}
              textSecondary={templateConfig.textSecondary}
              textMuted={templateConfig.textMuted}
              accentColor={templateConfig.accentColor}
              buttonPrimary={templateConfig.buttonPrimary}
            />
          </div>

          {/* Right Column: RSVP Form / Host Control & Attendees */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-6">
              {/* Host Control Center Card */}
              {isOwner ? (
                <>
                  <div className={`${templateConfig.cardClass} space-y-5 relative overflow-hidden`}>
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: templateConfig.accentColor }}
                    />

                    <div className={`flex items-center justify-between border-b ${templateConfig.borderClass} pb-3`}>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: templateConfig.accentColor }}>
                          Host Control Center
                        </span>
                      </div>
                      <span className={`text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-full border ${templateConfig.innerCardClass}`}>
                        Organizer View
                      </span>
                    </div>

                    <div>
                      <span className={`text-xs font-semibold uppercase tracking-wider block ${templateConfig.textMuted}`}>
                        Total RSVPs Tracked
                      </span>
                      <div className="font-display font-black text-3xl sm:text-4xl mt-0.5" style={{ color: templateConfig.accentColor }}>
                        {confirmedCount}{' '}
                        <span className={`text-sm font-sans font-medium ${templateConfig.textMuted}`}>
                          / {event.capacity || '∞'} Confirmed
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${templateConfig.textSecondary}`}>
                        You are viewing your own event as organizer. You have full guest management controls and instant roster export.
                      </p>
                    </div>

                    {waitlistCount > 0 && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>{waitlistCount} Waitlist Request{waitlistCount === 1 ? '' : 's'}</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950">
                            Awaiting Review
                          </span>
                        </div>
                        <p className={`text-[11px] leading-snug ${templateConfig.textSecondary}`}>
                          Guests are on the waitlist. You can review and accept their requests to unlock their admission passes.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowGuestListModal(true)}
                          className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Review & Accept Waitlist ({waitlistCount}) →</span>
                        </button>
                      </div>
                    )}

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowGuestListModal(true)}
                        className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 ${templateConfig.buttonPrimary}`}
                      >
                        <Users className="w-4 h-4" />
                        <span>View Attendee Roster ({confirmedCount})</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href="/dashboard"
                          className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${templateConfig.innerCardClass}`}
                        >
                          <span>Full Dashboard</span>
                          <ExternalLink className="w-3.5 h-3.5 text-accent" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setShowGuestPreview(!showGuestPreview)}
                          className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${templateConfig.innerCardClass}`}
                        >
                          <span>{showGuestPreview ? 'Hide Guest Form' : 'Test Guest Form'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {showGuestPreview && (
                    <div className="space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between px-1 text-[11px]">
                        <span className={templateConfig.textMuted}>Attendee Form Testing</span>
                        <span className="text-accent font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Mode
                        </span>
                      </div>
                      <RSVPForm
                        event={event}
                        cardClass={templateConfig.cardClass}
                        innerCardClass={templateConfig.innerCardClass}
                        borderClass={templateConfig.borderClass}
                        headingClass={templateConfig.headingClass}
                        textSecondary={templateConfig.textSecondary}
                        textMuted={templateConfig.textMuted}
                        accentColor={templateConfig.accentColor}
                        buttonPrimary={templateConfig.buttonPrimary}
                      />
                    </div>
                  )}
                </>
              ) : (
                /* Regular Attendee View: RSVP Form */
                <RSVPForm
                  event={event}
                  cardClass={templateConfig.cardClass}
                  innerCardClass={templateConfig.innerCardClass}
                  borderClass={templateConfig.borderClass}
                  headingClass={templateConfig.headingClass}
                  textSecondary={templateConfig.textSecondary}
                  textMuted={templateConfig.textMuted}
                  accentColor={templateConfig.accentColor}
                  buttonPrimary={templateConfig.buttonPrimary}
                />
              )}

              {/* Who's Going Avatar Grid */}
              <div className={templateConfig.cardClass}>
                <WhoIsGoing
                  eventId={event.id}
                  isOwner={isOwner}
                  innerCardClass={templateConfig.innerCardClass}
                  textSecondary={templateConfig.textSecondary}
                  textMuted={templateConfig.textMuted}
                  borderClass={templateConfig.borderClass}
                  accentColor={templateConfig.accentColor}
                />
              </div>

              {/* Host & Community Card */}
              <div className={`${templateConfig.cardClass} space-y-3.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {event.organizer_logo ? (
                      <Image
                        src={event.organizer_logo}
                        alt={event.organizer_name}
                        width={44}
                        height={44}
                        className="rounded-xl object-cover border border-white/20 shadow-sm"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-brand text-gold flex items-center justify-center font-display font-black text-sm shadow-sm">
                        {event.organizer_name[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm">{event.organizer_name}</h4>
                      <Link
                        href={`/${event.organizer_handle}`}
                        className="text-xs font-mono opacity-80 hover:underline"
                        style={{ color: templateConfig.accentColor }}
                      >
                        @{event.organizer_handle}
                      </Link>
                    </div>
                  </div>

                  <FollowButton
                    organizerId={event.organizer_id}
                    organizerHandle={event.organizer_handle}
                    organizerName={event.organizer_name}
                    variant="pill"
                  />
                </div>

                <div className={`flex items-center justify-between pt-2.5 border-t ${templateConfig.borderClass} text-xs ${templateConfig.textMuted}`}>
                  <span>Verified Event Host</span>
                  <Link
                    href={`/${event.organizer_handle}`}
                    className="font-semibold hover:underline inline-flex items-center gap-1"
                    style={{ color: templateConfig.accentColor }}
                  >
                    <span>All Events</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Social Share Banner Modal */}
      <SocialBannerModal
        event={event}
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
      />

      {/* Host Attendee Roster & Guest List Modal */}
      {isOwner && (
        <EventGuestListModal
          event={event}
          isOpen={showGuestListModal}
          onClose={() => setShowGuestListModal(false)}
        />
      )}
    </div>
  );
}
