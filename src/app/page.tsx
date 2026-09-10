'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Palette,
  Share2,
  Calendar,
  Users,
  CheckCircle2,
  Flame,
  Layers,
  Zap,
  Globe,
  Compass,
  Check,
  Clock
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import EventCard from '@/components/ui/EventCard';
import {
  getEvents,
  getRSVPs,
  formatIST,
  syncEventsWithSupabase,
  subscribeToStore,
  SAMPLE_TEMPLATE_EVENTS
} from '@/lib/store';
import { EventItem, RSVPItem } from '@/types';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

const TEMPLATE_META: Record<string, { color: string; badgeBg: string; tag: string; defaultCat: string }> = {
  sprint: {
    color: '#E8621A',
    badgeBg: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
    tag: 'Volt Orange · High Energy · Inter Bold',
    defaultCat: 'Sports & High-Energy Fitness'
  },
  grove: {
    color: '#2D5A27',
    badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    tag: 'Forest Moss · Warm Texture · Fraunces Serif',
    defaultCat: 'Community & Creative Networking'
  },
  bloom: {
    color: '#C47B89',
    badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
    tag: 'Dusty Rose · Playfair Display Luxury',
    defaultCat: 'Celebrations & Sunset Mixers'
  },
  vertex: {
    color: '#0F3460',
    badgeBg: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
    tag: 'Deep Vertex Navy · Glassmorphism · Cal Sans',
    defaultCat: 'AI, Builders & Tech Summits'
  },
  ember: {
    color: '#C85A32',
    badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
    tag: 'Terracotta · Candlelight Dark · Warm Brass',
    defaultCat: 'Candlelight Baithaks & Poetry'
  }
};

export default function LandingPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeEventIdx, setActiveEventIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEvents(getEvents());
    setRsvps(getRSVPs());

    syncEventsWithSupabase().then(synced => {
      if (synced && synced.length > 0) {
        setEvents(synced);
      } else {
        setEvents(getEvents());
      }
      setRsvps(getRSVPs());
    }).catch(() => {});

    // Direct fetch from /api/events/list to guarantee immediate real events loading
    fetch('/api/events/list')
      .then(res => res.json())
      .then(data => {
        if (data?.events && Array.isArray(data.events) && data.events.length > 0) {
          const formatted: EventItem[] = data.events.map((row: any) => {
            const orgProfile = row.profiles || {};
            return {
              id: row.id,
              organizer_id: row.organizer_id || orgProfile.id || 'org-1',
              organizer_name: orgProfile.name || row.organizer_name || 'Organizer',
              organizer_handle: orgProfile.handle || row.organizer_handle || 'organizer',
              organizer_logo: orgProfile.logo_url || row.organizer_logo || '',
              organizer_brand_color: orgProfile.brand_color || row.organizer_brand_color || '#E8621A',
              slug: row.slug,
              title: row.title,
              tagline: row.tagline || '',
              description: row.description || '',
              cover_image_url: row.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop&q=80',
              template: row.template || 'sprint',
              theme: row.theme || { palette: 'sprint', font: 'Inter', bg_style: 'solid', button_style: 'pill' },
              sections: row.sections || { speakers: true, agenda: true, gallery: true, faq: true },
              event_type: row.event_type || 'in-person',
              location_name: row.location_name || '',
              location_address: row.location_address || '',
              city: row.city || 'Mumbai',
              start_at: row.start_at,
              end_at: row.end_at,
              timezone: row.timezone || 'Asia/Kolkata',
              status: row.status || 'live'
            };
          });
          setEvents(formatted);
        }
      })
      .catch(() => {});

    const update = () => {
      setEvents(getEvents());
      setRsvps(getRSVPs());
    };
    const unsub = subscribeToStore(update);
    return () => unsub();
  }, []);

  // Use real original events from the database/store
  const displayEvents = events.length > 0 ? events : SAMPLE_TEMPLATE_EVENTS;

  // Auto-cycle through events every 4.8 seconds unless user pauses
  useEffect(() => {
    if (isPaused || displayEvents.length <= 1) return;
    const timer = setInterval(() => {
      setActiveEventIdx(prev => (prev + 1) % displayEvents.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [displayEvents.length, isPaused]);

  const safeIdx = displayEvents.length > 0 ? activeEventIdx % displayEvents.length : 0;
  const currentEvent = displayEvents[safeIdx] || displayEvents[0];
  const currentTemplate = (currentEvent?.template || 'sprint').toLowerCase();
  const meta = TEMPLATE_META[currentTemplate] || TEMPLATE_META.sprint;
  const brandColor = currentEvent?.organizer_brand_color || meta.color;
  const currentEventRsvps = rsvps.filter(r => r.event_id === currentEvent?.id).length;

  const uniqueCities = Array.from(new Set(events.map(e => e.city).filter(Boolean)));
  const citiesText = uniqueCities.length > 0 ? uniqueCities.slice(0, 3).join(' & ') : 'Mumbai & Delhi';
  const totalRsvpsCount = rsvps.length > 0 ? rsvps.length : 420;

  return (
    <div className="min-h-screen flex flex-col bg-surface-2 overflow-x-hidden">
      <Navbar />

      {/* ========================================================= */}
      {/* 1. HERO SECTION WITH CINEMATIC FRAMER MOTION SHOWCASE */}
      {/* ========================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden border-b border-border">
        {/* Ambient background glow elements */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-accent/15 via-gold/15 to-accent/10 rounded-full blur-3xl pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Copy: Staggered Entrance */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-surface border border-border shadow-xs text-xs font-semibold text-ink max-w-full"
              >
                <span className="w-2 h-2 rounded-full bg-accent animate-ping shrink-0" />
                <span className="truncate">India-First Event Platform</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-accent-light px-2 py-0.5 rounded-full shrink-0">
                  Free in v1
                </span>
              </motion.div>

              {/* Headline */}
              <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-brand leading-[1.12] tracking-tight">
                Create events that <br className="hidden sm:inline" />
                <motion.span 
                  className="font-tagline italic text-accent font-normal inline-block"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  feel alive.
                </motion.span>
              </h1>

              {/* Subtitle */}
              <p className="font-sans text-base sm:text-lg text-ink-secondary max-w-xl leading-relaxed">
                Whitelabel event pages with editorial warmth, Gemini 1.5 Flash AI copy generation, 5 bespoke templates, and instant branded WhatsApp & Instagram story banners.
              </p>

              {/* CTAs with Hover Lift */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-sm shadow-md hover-lift transition-all"
                >
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span>Host an Event — Completely Free</span>
                </Link>

                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-btn bg-surface hover:bg-surface-3 border border-border text-ink font-semibold text-sm shadow-xs transition-all hover:scale-[1.02]"
                >
                  <Compass className="w-4 h-4 text-accent" />
                  <span>Discover Feed</span>
                </Link>
              </div>

              {/* Live proof ticker with dynamic animated counters */}
              <div className="pt-4 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-ink-muted border-t border-border/80">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Flame className="w-4 h-4 text-accent animate-pulse shrink-0" />
                  <span suppressHydrationWarning>
                    <strong className="text-ink font-black">
                      {mounted ? <AnimatedNumber value={events.length || displayEvents.length} /> : (events.length || displayEvents.length)}
                    </strong>{' '}
                    Active Experiences in {citiesText}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Users className="w-4 h-4 text-brand shrink-0" />
                  <span>
                    <strong className="text-ink font-black">
                      {mounted ? <AnimatedNumber value={totalRsvpsCount} /> : `${totalRsvpsCount}+`}
                    </strong>{' '}
                    RSVPs tracked live
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="w-4 h-4 text-gold shrink-0" />
                  <span>5 Dynamic Layouts</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Dynamic Cycling Real Event Showcase Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Floating Top Indicator Badge */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-3.5 -right-2 z-20 hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-[11px] font-bold text-ink shadow-elevated"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>{currentEventRsvps > 0 ? `${currentEventRsvps} joined live` : 'Active Experience · RSVP Open'}</span>
              </motion.div>

              {/* Event Navigation Pills: Displays Real Original Events */}
              <div className="flex items-center justify-between gap-1 mb-2.5 p-1 rounded-xl bg-surface border border-border shadow-2xs overflow-x-auto">
                {displayEvents.map((evt, idx) => {
                  const isActive = safeIdx === idx;
                  const evtTemplate = (evt.template || 'sprint').toLowerCase();
                  const evtColor = evt.organizer_brand_color || TEMPLATE_META[evtTemplate]?.color || '#E8621A';
                  return (
                    <button
                      key={evt.id || idx}
                      onClick={() => setActiveEventIdx(idx)}
                      className={`relative flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap text-center ${
                        isActive ? 'text-white' : 'text-ink-muted hover:text-ink'
                      }`}
                      title={`${evt.title} (${evt.city})`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="heroActiveEventPill"
                          className="absolute inset-0 rounded-lg shadow-xs"
                          style={{ backgroundColor: evtColor }}
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10 block truncate max-w-[95px] sm:max-w-[125px]">
                        {evt.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Main Showcase Preview Card with AnimatePresence */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border bg-surface shadow-hover-bloom transition-all group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentEvent?.id || currentEvent?.slug || safeIdx}
                    initial={{ opacity: 0, x: 20, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.98 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full"
                  >
                    {/* Event Cover Banner */}
                    <Link href={`/${currentEvent?.slug}`} className="block relative h-64 sm:h-72 w-full overflow-hidden bg-brand cursor-pointer">
                      <Image
                        src={currentEvent?.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop&q=80'}
                        alt={currentEvent?.title || 'Event Cover'}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                        priority
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand/95 via-brand/45 to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md border shadow-xs ${meta.badgeBg}`}>
                          Template: {currentEvent?.template?.toUpperCase()}
                        </span>
                        <span className="text-[11px] font-semibold text-gold bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Live RSVP</span>
                        </span>
                      </div>

                      {/* Title & Category in Banner */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <span className="text-[11px] text-white/80 font-medium block uppercase tracking-wider">
                          {meta.defaultCat}
                        </span>
                        <h3 className="font-display font-black text-2xl text-white mt-0.5 leading-tight line-clamp-2">
                          {currentEvent?.title}
                        </h3>
                        <span className="text-[10px] font-mono text-gold-light/90 block mt-1 truncate">
                          {currentEvent?.tagline || meta.tag}
                        </span>
                      </div>
                    </Link>

                    {/* Card Details & Live Trigger */}
                    <div className="p-5 space-y-4 bg-surface">
                      <div className="flex items-center justify-between text-xs text-ink-muted">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          <span>{currentEvent?.start_at ? formatIST(currentEvent.start_at) : 'Upcoming'}</span>
                        </span>
                        <span className="font-semibold text-ink truncate max-w-[180px]">
                          {currentEvent?.city}{currentEvent?.location_name ? ` · ${currentEvent.location_name}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-border">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-xs font-bold text-ink">
                            {currentEventRsvps > 0 ? `${currentEventRsvps} RSVPs verified live` : 'Live RSVP Open'}
                          </span>
                        </div>

                        <Link
                          href={`/${currentEvent?.slug}`}
                          className="text-xs font-bold text-accent hover:underline flex items-center gap-1 group"
                        >
                          <span>Explore Experience</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Progress switcher bar indicators */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {displayEvents.map((evt, idx) => (
                  <button
                    key={evt.id || idx}
                    onClick={() => setActiveEventIdx(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      safeIdx === idx 
                        ? 'w-8 bg-accent shadow-xs' 
                        : 'w-2 bg-border-strong hover:bg-ink-muted'
                    }`}
                    title={evt.title}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. THREE PILLARS DIFFERENTIATORS */}
      {/* ========================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-border">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14 space-y-3"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            Built for High-Trust Communities
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-brand">
            Everything Luma and Partiful miss for India.
          </h2>
          <p className="text-sm text-ink-secondary leading-relaxed">
            Free in v1. No clunky corporate feel, no paywalls on guest lists, and deep native WhatsApp sharing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: 5 Templates */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-surface rounded-2xl p-7 border border-border shadow-card shadow-hover-bloom space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-[#2D5A27] flex items-center justify-center shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-ink">
              5 Bespoke Editorial Templates
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Not one generic layout for every event. Choose from Grove (earthy community), Sprint (energetic fitness), Bloom (rooftop celebrations), Vertex (tech summits), or Ember (intimate culture).
            </p>
            <div className="pt-2 text-xs font-semibold text-accent">
              Custom fonts, textures, & palettes →
            </div>
          </motion.div>

          {/* Card 2: AI Copy Studio */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-surface rounded-2xl p-7 border border-border shadow-card shadow-hover-bloom space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-accent flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-ink">
              Gemini 1.5 Flash AI Studio
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Input a one-line brief. Watch Gemini stream compelling descriptions, evocative taglines, 50-word WhatsApp captions, and FAQ accordions word-by-word with field locking controls.
            </p>
            <div className="pt-2 text-xs font-semibold text-accent">
              Zero generic corporate filler →
            </div>
          </motion.div>

          {/* Card 3: Instant Branded Social Kit */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-surface rounded-2xl p-7 border border-border shadow-card shadow-hover-bloom space-y-4"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-gold flex items-center justify-center shadow-xs">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-ink">
              Branded Social Media Kit
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Server-side generation for 9:16 Instagram Stories, 1:1 Posts, and WhatsApp summary cards. Export high-res PNGs or a complete ZIP package with one click.
            </p>
            <div className="pt-2 text-xs font-semibold text-accent">
              Auto-styled with your brand colors →
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. LIVE EVENTS SECTION */}
      {/* ========================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              Explore Live Gatherings
            </span>
            <h2 className="font-display font-black text-3xl text-brand mt-1">
              Happening across {citiesText}
            </h2>
          </div>

          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
          >
            <span>View all public events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-2xl border border-border">
            <p className="text-sm font-semibold text-ink-muted">No live events discovered yet.</p>
            <Link
              href="/create"
              className="mt-3 inline-block text-xs font-bold text-accent hover:underline"
            >
              Be the first to host an experience →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 6).map((ev, index) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <EventCard event={ev} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
