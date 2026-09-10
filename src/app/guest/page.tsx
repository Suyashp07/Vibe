'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Compass,
  MapPin,
  Download,
  ExternalLink,
  XCircle,
  CheckCircle2,
  Navigation,
  ArrowRight,
  Clock,
  AlertCircle,
  Ticket,
  Search,
  Check,
  Edit2,
  Users,
  Heart,
  Sparkles,
  Building2
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import {
  INITIAL_EVENTS,
  INITIAL_ORGANIZERS,
  getEvents,
  getRSVPs,
  getFollows,
  getOrganizers,
  generateGoogleCalendarUrl,
  downloadICS,
  formatIST,
  subscribeToStore,
  cancelRSVP
} from '@/lib/store';
import { EventItem, RSVPItem, Profile, FollowerItem } from '@/types';
import { useAuth } from '@/lib/auth';
import DigitalPassModal from '@/components/ui/DigitalPassModal';
import FollowButton from '@/components/ui/FollowButton';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

export default function GuestDashboardPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [follows, setFollows] = useState<FollowerItem[]>([]);
  const [organizers, setOrganizers] = useState<Profile[]>(INITIAL_ORGANIZERS);
  const [guestEmail, setGuestEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'following'>('upcoming');
  const [cancelModalRsvp, setCancelModalRsvp] = useState<RSVPItem | null>(null);
  const [selectedPass, setSelectedPass] = useState<{ rsvp: RSVPItem; event: EventItem } | null>(null);

  useEffect(() => {
    setEvents(getEvents());
    setRsvps(getRSVPs());
    setFollows(getFollows());
    setOrganizers(getOrganizers());
    const update = () => {
      setEvents(getEvents());
      setRsvps(getRSVPs());
      setFollows(getFollows());
      setOrganizers(getOrganizers());
    };
    const unsub = subscribeToStore(update);
    return () => unsub();
  }, []);

  useEffect(() => {
    const activeEmail = profile?.email || (typeof window !== 'undefined' ? localStorage.getItem('vibe_guest_email') || '' : '');
    setGuestEmail(activeEmail);
    setEmailInput(activeEmail);
  }, [profile]);

  // Filter events where the guest has RSVP'd
  const guestRsvps = rsvps.filter(r => r.email.toLowerCase() === guestEmail.toLowerCase());
  const allMyPasses = guestRsvps
    .map(r => ({
      rsvp: r,
      event: events.find(e => e.id === r.event_id)
    }))
    .filter((item): item is { rsvp: RSVPItem; event: EventItem } => !!item.event);

  // Filter communities/organizers the guest is following
  const myFollows = follows.filter(f =>
    (guestEmail && f.follower_email?.toLowerCase() === guestEmail.toLowerCase()) ||
    (profile?.id && f.follower_id === profile.id)
  );

  const now = Date.now();
  const upcomingPasses = allMyPasses.filter(({ event }) => new Date(event.start_at).getTime() >= now);
  const pastPasses = allMyPasses.filter(({ event }) => new Date(event.start_at).getTime() < now);

  const displayedPasses = activeTab === 'upcoming' ? upcomingPasses : pastPasses;

  const handleConfirmCancel = () => {
    if (cancelModalRsvp) {
      cancelRSVP(cancelModalRsvp.id);
      setCancelModalRsvp(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface rounded-2xl p-6 border border-border shadow-card">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-accent">
              Guest Portal
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-ink mt-0.5">
              My Events
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-ink-muted">
              {guestEmail ? (
                <>
                  <span>Active attendee:</span>
                  <strong className="text-ink font-semibold">{guestEmail}</strong>
                  <button
                    onClick={() => setIsEditingEmail(!isEditingEmail)}
                    className="text-accent hover:underline text-[11px] font-semibold"
                  >
                    {isEditingEmail ? 'Cancel' : '(Lookup another email)'}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Viewing guest passes:</span>
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="text-accent hover:underline text-xs font-semibold"
                  >
                    Enter your email to find your tickets →
                  </button>
                </div>
              )}
            </div>

            {isEditingEmail && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (emailInput.trim()) {
                    setGuestEmail(emailInput.trim());
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('vibe_guest_email', emailInput.trim());
                    }
                    setIsEditingEmail(false);
                  }
                }}
                className="flex items-center gap-2 mt-3"
              >
                <input
                  type="email"
                  required
                  placeholder="e.g. your-email@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-border bg-surface-2 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-btn bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-all"
                >
                  Find Passes
                </button>
              </form>
            )}
          </div>

          <Link
            href="/discover"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-brand text-white text-xs font-bold hover:bg-brand-mid transition-all shadow-sm"
          >
            <Compass className="w-4 h-4 text-accent" />
            <span>Discover More Events</span>
          </Link>
        </div>

        {/* Tab Navigation: Upcoming / Past / Communities */}
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex gap-2 relative">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors z-10 ${
                activeTab === 'upcoming'
                  ? 'text-white font-black'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {activeTab === 'upcoming' && (
                <motion.div
                  layoutId="guestActiveTab"
                  className="absolute inset-0 bg-brand rounded-xl shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span>Upcoming ({upcomingPasses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors z-10 ${
                activeTab === 'past'
                  ? 'text-white font-black'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {activeTab === 'past' && (
                <motion.div
                  layoutId="guestActiveTab"
                  className="absolute inset-0 bg-brand rounded-xl shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span>Past ({pastPasses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors z-10 ${
                activeTab === 'following'
                  ? 'text-white font-black'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              {activeTab === 'following' && (
                <motion.div
                  layoutId="guestActiveTab"
                  className="absolute inset-0 bg-brand rounded-xl shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span>Communities ({myFollows.length})</span>
            </button>
          </div>

          <span className="text-xs text-ink-muted hidden sm:inline">
            Times displayed in Asia/Kolkata (IST)
          </span>
        </div>

        {/* SECTION 1: COMMUNITIES FOLLOWING TAB */}
        {activeTab === 'following' ? (
          <div className="space-y-6 animate-in fade-in">
            {myFollows.length === 0 ? (
              <div className="bg-surface rounded-2xl p-10 border border-border text-center space-y-3 shadow-card">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand mx-auto flex items-center justify-center">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display font-bold text-ink text-lg">
                  You aren’t following any communities yet
                </h3>
                <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
                  Follow your favorite hosts to get invited to secret pop-ups, founder runs, and early-bird ticket releases.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myFollows.map((fol) => {
                  const matchedOrg = organizers.find(
                    (o) =>
                      (o.handle && fol.organizer_handle && o.handle.toLowerCase() === fol.organizer_handle.toLowerCase()) ||
                      (o.id && fol.organizer_id && o.id === fol.organizer_id)
                  );
                  const orgName = matchedOrg?.name || fol.organizer_handle || 'Community Host';
                  const orgHandle = fol.organizer_handle || matchedOrg?.handle || 'host';

                  return (
                    <div
                      key={fol.id}
                      className="bg-surface rounded-2xl p-5 border border-border shadow-card flex items-center justify-between gap-4 hover-lift transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {matchedOrg?.logo_url ? (
                          <Image
                            src={matchedOrg.logo_url}
                            alt={orgName}
                            width={44}
                            height={44}
                            className="w-11 h-11 rounded-xl object-cover border border-border"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-brand text-gold flex items-center justify-center font-display font-black text-base flex-shrink-0">
                            {orgName[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-ink truncate">{orgName}</h4>
                          <Link
                            href={`/${orgHandle}`}
                            className="text-xs font-mono text-accent hover:underline block truncate"
                          >
                            @{orgHandle}
                          </Link>
                          {matchedOrg?.bio && (
                            <p className="text-[11px] text-ink-muted truncate mt-0.5 max-w-[200px]">
                              {matchedOrg.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                        <Link
                          href={`/${orgHandle}`}
                          className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-xs font-semibold text-ink transition-colors"
                        >
                          Events
                        </Link>
                        <FollowButton
                          organizerId={fol.organizer_id || orgHandle}
                          organizerHandle={orgHandle}
                          organizerName={orgName}
                          variant="pill"
                          showCount={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Curated Recommendations */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <h3 className="font-display font-bold text-base text-ink">
                    Discover Communities to Follow
                  </h3>
                </div>
                <span className="text-xs text-ink-muted">Verified Hosts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizers
                  .filter((org) => !myFollows.some((f) => f.organizer_handle?.toLowerCase() === org.handle.toLowerCase()))
                  .slice(0, 3)
                  .map((org) => (
                    <div
                      key={org.id}
                      className="bg-surface rounded-2xl p-4 border border-border shadow-card flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        {org.logo_url ? (
                          <Image
                            src={org.logo_url}
                            alt={org.name}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-xl object-cover border border-border"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-brand text-gold flex items-center justify-center font-display font-black text-sm flex-shrink-0">
                            {org.name[0]}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-ink truncate">{org.name}</h4>
                          <span className="text-[11px] font-mono text-ink-muted block truncate">
                            @{org.handle}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-ink-secondary line-clamp-2 leading-relaxed">
                        {org.bio || 'Hosting bespoke community experiences and dinners.'}
                      </p>

                      <div className="pt-2 border-t border-border flex items-center justify-between">
                        <Link
                          href={`/${org.handle}`}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          View Profile →
                        </Link>
                        <FollowButton
                          organizerId={org.id}
                          organizerHandle={org.handle}
                          organizerName={org.name}
                          variant="pill"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          /* SECTION 2: LIST OF REGISTERED EVENT PASSES (UPCOMING / PAST) */
          <div className="space-y-4">
          {displayedPasses.length === 0 ? (
            <div className="bg-surface rounded-2xl p-12 border border-border text-center space-y-3 shadow-card">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent mx-auto flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
              <p className="font-display font-bold text-ink text-lg">
                No {activeTab} passes found {guestEmail ? `for ${guestEmail}` : ''}
              </p>
              <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
                {activeTab === 'upcoming'
                  ? 'You haven’t RSVP’d to any upcoming experiences yet. Explore curated design salons, founder runs, and cultural mixers across Mumbai, Delhi, and Bengaluru.'
                  : 'Your past event memories and ticket passes will appear here once you attend.'}
              </p>
              <div className="pt-2">
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-btn bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-all shadow-xs hover-lift"
                >
                  <Compass className="w-4 h-4" />
                  <span>Browse Curated Experiences →</span>
                </Link>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayedPasses.map(({ rsvp, event }) => {
                const isCancelled = rsvp.status === 'cancelled';
                const isWaitlisted = rsvp.status === 'waitlisted';

                return (
                  <motion.div
                    layout
                    key={rsvp.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="bg-surface rounded-2xl p-5 border border-border shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover-lift shadow-hover-bloom transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-surface-3 flex-shrink-0 border border-border">
                        <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isCancelled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3" /> Cancelled Pass
                            </span>
                          ) : isWaitlisted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> Waitlisted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Confirmed Pass
                            </span>
                          )}
                          <span className="text-xs font-mono text-ink-muted">{event.city}</span>
                        </div>

                        <h3 className="font-display font-bold text-lg text-ink">
                          {event.title}
                        </h3>

                        <p className="text-xs text-accent font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {formatIST(event.start_at)}
                        </p>

                        <p className="text-xs text-ink-muted flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {event.location_name}
                        </p>
                      </div>
                    </div>

                    {/* Actions (View, Add to Cal, Directions, Cancel) */}
                    <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${event.location_name}, ${event.location_address}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-ink text-xs font-semibold border border-border transition-colors"
                        title="Get Directions on Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5 text-accent" />
                        <span>Directions</span>
                      </a>

                      {!isCancelled && (
                        <>
                          <a
                            href={generateGoogleCalendarUrl(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-border text-ink text-xs font-semibold transition-colors"
                          >
                            <span>Google Cal</span>
                            <ExternalLink className="w-3 h-3 text-ink-muted" />
                          </a>

                          <button
                            onClick={() => downloadICS(event)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-border text-ink text-xs font-semibold transition-colors"
                            title="Download .ICS file"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>.ICS</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedPass({ rsvp, event })}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs hover-lift cursor-pointer ${
                          isWaitlisted ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-brand text-white hover:bg-brand-mid'
                        }`}
                      >
                        {isWaitlisted ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-200" />
                            <span>Waitlist Status</span>
                          </>
                        ) : (
                          <>
                            <Ticket className="w-3.5 h-3.5 text-gold" />
                            <span>View Pass</span>
                          </>
                        )}
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => setCancelModalRsvp(rsvp)}
                          className="p-1.5 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors text-xs font-semibold"
                          title={isWaitlisted ? 'Leave Waitlist' : 'Cancel this RSVP'}
                        >
                          {isWaitlisted ? 'Leave Waitlist' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Master Prompt Spec: 'Discover more events →' CTA at bottom */}
        <div className="pt-6 border-t border-border flex items-center justify-between bg-surface rounded-2xl p-5 shadow-card">
          <div>
            <h3 className="font-display font-bold text-base text-ink">
              Looking for more cultural gatherings?
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Discover verified founder runs, design salons, and candlelight soirées in your city.
            </p>
          </div>

          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-accent hover:bg-accent-dark text-white text-xs font-bold shadow-xs hover-lift transition-all whitespace-nowrap"
          >
            <span>Discover more events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Cancel RSVP Confirmation Modal */}
      {cancelModalRsvp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-sm w-full p-6 border border-border shadow-elevated space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-ink">
                Cancel your RSVP?
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Your spot will be released to guests on the waitlist. You can re-register anytime if spots remain available.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalRsvp(null)}
                className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-2 transition-colors"
              >
                Keep RSVP
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Yes, Cancel RSVP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Admission Pass Modal */}
      {selectedPass && (
        <DigitalPassModal
          rsvp={selectedPass.rsvp}
          event={selectedPass.event}
          onClose={() => setSelectedPass(null)}
        />
      )}

      <Footer />
    </div>
  );
}
