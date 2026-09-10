'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Plus,
  Copy,
  Download,
  Users,
  BarChart2,
  Settings,
  Sparkles,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
  Flame,
  FileText,
  Search,
  Filter,
  Check,
  Vote,
  Lock,
  ArrowRight,
  Building2,
  ShieldCheck,
  Ticket,
  Trash2,
  Trophy,
  X,
  Share2,
  Heart,
  RefreshCw,
  CheckCheck
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import {
  getEvents,
  getRSVPs,
  saveEvent,
  deleteEvent,
  syncEventsWithSupabase,
  saveOrganizer,
  subscribeToStore,
  INITIAL_ORGANIZERS,
  formatIST,
  getDatePolls,
  saveDatePoll,
  deleteDatePoll,
  getFollowers,
  getFollowerCount,
  approveWaitlistGuest,
  rejectWaitlistGuest,
  approveAllWaitlist
} from '@/lib/store';
import { EventItem, RSVPItem, Profile, DatePoll, FollowerItem } from '@/types';
import { useAuth, updateAuthProfile } from '@/lib/auth';
import SocialBannerModal from '@/components/banner/SocialBannerModal';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

export default function OrganizerDashboard() {
  const { profile, loading, isLoggedIn, isOrganizer } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'past' | 'draft'>('all');
  const [activeNav, setActiveNav] = useState<'events' | 'polls' | 'guests' | 'community' | 'brand'>('events');
  const [selectedEventForBanners, setSelectedEventForBanners] = useState<EventItem | null>(null);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [showSampleEvents, setShowSampleEvents] = useState(false);
  const [followers, setFollowers] = useState<FollowerItem[]>([]);
  const [followerSearch, setFollowerSearch] = useState('');

  // Dynamic Date Polls State
  const [polls, setPolls] = useState<DatePoll[]>([]);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>([
    'Friday, Nov 14 · 8:00 PM IST',
    'Saturday, Nov 15 · 6:00 PM IST'
  ]);
  const [pollToast, setPollToast] = useState<string | null>(null);
  const [copiedPollSlug, setCopiedPollSlug] = useState<string | null>(null);
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);

  // Delete & Supabase Sync State
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [eventToast, setEventToast] = useState<string | null>(null);
  const [isSyncingWithDb, setIsSyncingWithDb] = useState(false);

  // Active Organizer state derived strictly from authenticated user
  const [organizer, setOrganizer] = useState<Profile>(() => {
    return {
      id: profile?.id || 'org-temp',
      role: 'organizer',
      name: profile?.name || 'Organizer',
      handle: profile?.handle || profile?.name?.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'organizer',
      bio: profile?.bio || '',
      logo_url: profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile?.name || 'Organizer')}`,
      brand_color: profile?.brand_color || '#E8621A',
      brand_font: profile?.brand_font || 'Playfair Display',
      email: profile?.email || '',
      created_at: new Date().toISOString()
    };
  });

  // Guest list filters
  const [guestSearch, setGuestSearch] = useState('');
  const [guestEventFilter, setGuestEventFilter] = useState('all');
  const [guestStatusFilter, setGuestStatusFilter] = useState<'all' | 'confirmed' | 'waitlisted' | 'cancelled'>('all');

  // Brand preset state
  const [brandColor, setBrandColor] = useState(profile?.brand_color || '#E8621A');
  const [brandFont, setBrandFont] = useState(profile?.brand_font || 'Playfair Display');
  const [brandName, setBrandName] = useState(profile?.name || 'Organizer');
  const [brandHandle, setBrandHandle] = useState(profile?.handle || 'organizer');
  const [brandBio, setBrandBio] = useState(profile?.bio || '');
  const [brandLogo, setBrandLogo] = useState(profile?.avatar_url || '');
  const [brandSaveToast, setBrandSaveToast] = useState(false);
  const [guestToast, setGuestToast] = useState<string | null>(null);

  const handleApproveGuest = (g: RSVPItem) => {
    approveWaitlistGuest(g.id);
    setGuestToast(`✓ Approved ${g.name}! Digital admission pass unlocked and confirmation email sent.`);
    setTimeout(() => setGuestToast(null), 4000);

    const ev = events.find(e => e.id === g.event_id);
    if (ev) {
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rsvp_confirmed',
          to: g.email,
          guestName: g.name,
          event: ev
        })
      }).catch(console.warn);
    }
  };

  const handleRejectGuest = (g: RSVPItem) => {
    rejectWaitlistGuest(g.id);
    setGuestToast(`Declined request for ${g.name}.`);
    setTimeout(() => setGuestToast(null), 4000);
  };

  const handleApproveAllWaitlist = () => {
    const pending = rsvps.filter(g => g.status === 'waitlisted');
    approveAllWaitlist();
    setGuestToast(`✓ Successfully approved all ${pending.length} waitlisted guests! Passes unlocked.`);
    setTimeout(() => setGuestToast(null), 4000);

    pending.forEach(g => {
      const ev = events.find(e => e.id === g.event_id);
      if (ev) {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rsvp_confirmed',
            to: g.email,
            guestName: g.name,
            event: ev
          })
        }).catch(console.warn);
      }
    });
  };

  const handleManualSync = async () => {
    setIsSyncingWithDb(true);
    try {
      await syncEventsWithSupabase();
      setEvents(getEvents());
      setEventToast('Events successfully synchronized with Supabase.');
      setTimeout(() => setEventToast(null), 3500);
    } catch (e) {
      console.error(e);
      setEventToast('Failed to sync events with Supabase.');
      setTimeout(() => setEventToast(null), 3500);
    } finally {
      setIsSyncingWithDb(false);
    }
  };

  useEffect(() => {
    const loadData = () => {
      setEvents(getEvents());
      setRsvps(getRSVPs());
      setPolls(getDatePolls());
      const orgKey = profile?.handle || profile?.id || organizer?.handle || organizer?.id;
      if (orgKey) {
        setFollowers(getFollowers(orgKey));
      }
    };
    loadData();

    // Auto-sync with Supabase on mount to prune deleted events
    syncEventsWithSupabase().then(() => {
      loadData();
    }).catch(() => {});


    if (profile) {
      const activeOrg: Profile = {
        id: profile.id,
        role: 'organizer',
        name: profile.name || 'Organizer',
        handle: profile.handle || profile.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'organizer',
        bio: profile.bio || '',
        logo_url: profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'Organizer')}`,
        brand_color: profile.brand_color || '#E8621A',
        brand_font: profile.brand_font || 'Playfair Display',
        email: profile.email,
        created_at: new Date().toISOString()
      };
      setOrganizer(activeOrg);
      setBrandName(activeOrg.name);
      setBrandHandle(activeOrg.handle);
      setBrandBio(activeOrg.bio || '');
      setBrandLogo(activeOrg.logo_url || '');
      setBrandColor(activeOrg.brand_color || '#E8621A');
      setBrandFont(activeOrg.brand_font || 'Playfair Display');
      setFollowers(getFollowers(activeOrg.handle || activeOrg.id));
    }

    const unsub = subscribeToStore(loadData);
    return () => unsub();
  }, [profile]);

  // If loading session
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-2">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  // Guard: User must be signed in to access Organizer Dashboard
  if (!isLoggedIn || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-2">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto px-4 sm:px-6 py-16 flex items-center justify-center w-full">
          <div className="bg-surface rounded-2xl p-8 border border-border shadow-elevated text-center space-y-6 animate-in fade-in zoom-in-95 w-full">
            <div className="w-16 h-16 rounded-2xl bg-brand text-gold mx-auto flex items-center justify-center shadow-sm">
              <Building2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent bg-accent-light px-3 py-1 rounded-full">
                <Lock className="w-3.5 h-3.5" /> Organizer Portal
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-ink">
                Sign in to Your Organizer Dashboard
              </h1>
              <p className="text-xs text-ink-secondary max-w-sm mx-auto leading-relaxed">
                Please sign in with your email to access your hosted events roster, attendee guest directory, date polls, and brand presets.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login?redirect=/dashboard&role=organizer"
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-btn border border-border bg-surface hover:bg-surface-3 text-ink font-bold text-xs transition-all"
                >
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/signup?redirect=/dashboard&role=organizer"
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-sm hover-lift transition-all"
                >
                  <span>Sign Up Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-center gap-4 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  Supabase Verified
                </span>
                <span>·</span>
                <span>India-First Platform</span>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Guard: If logged in as guest attendee, provide prompt to switch to organizer
  if (profile.role === 'guest') {
    return (
      <div className="min-h-screen flex flex-col bg-surface-2">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto px-4 sm:px-6 py-16 flex items-center justify-center w-full">
          <div className="bg-surface rounded-2xl p-8 border border-border shadow-elevated text-center space-y-6 animate-in fade-in zoom-in-95 w-full">
            <div className="w-16 h-16 rounded-2xl bg-brand text-gold mx-auto flex items-center justify-center shadow-sm">
              <Ticket className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink-muted bg-surface-3 px-3 py-1 rounded-full">
                Logged in as Guest ({profile.email})
              </span>
              <h1 className="font-display font-black text-2xl text-ink">
                Become an Organizer
              </h1>
              <p className="text-xs text-ink-secondary max-w-sm mx-auto leading-relaxed">
                Your account is currently set as a Guest Attendee. Would you like to host events and access organizer features?
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={async () => {
                  await updateAuthProfile({ role: 'organizer' });
                  window.location.reload();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-sm hover-lift transition-all"
              >
                <Building2 className="w-4 h-4" />
                <span>Enable Host / Organizer Access</span>
              </button>

              <Link
                href="/guest"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-btn border border-border bg-surface hover:bg-surface-3 text-ink font-bold text-xs transition-all"
              >
                <span>Go to My Guest RSVPs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Filter events strictly to THIS organizer's hosted events
  const isDemoHost = Boolean(profile.isDemo && profile.handle === 'swaniki');
  const myEvents = events.filter(e => {
    if (showSampleEvents || isDemoHost) return true;
    return (
      e.organizer_id === profile.id ||
      (profile.handle && e.organizer_handle?.toLowerCase() === profile.handle.toLowerCase()) ||
      (profile.email && e.organizer_id?.toLowerCase() === profile.email.toLowerCase())
    );
  });



  const myEventIds = new Set(myEvents.map(e => e.id));
  const myRsvps = rsvps.filter(r => myEventIds.has(r.event_id));

  const totalRsvps = myRsvps.length;
  const liveCount = myEvents.filter(e => e.status === 'live').length;
  const upcomingCount = myEvents.filter(e => new Date(e.start_at).getTime() >= Date.now() && e.status !== 'draft').length;

  const handleDuplicate = (event: EventItem) => {
    const duplicated: EventItem = {
      ...event,
      id: `evt-${Date.now()}`,
      slug: `${event.slug}-copy-${Math.floor(10 + Math.random() * 90)}`,
      title: `${event.title} (Copy)`,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    saveEvent(duplicated);
  };

  const handleExportCSV = (event?: EventItem) => {
    const targetRsvps = event ? myRsvps.filter(r => r.event_id === event.id) : myRsvps;
    const headers = ['Guest Name', 'Email', 'Phone', 'Event Title', 'Status', 'Plus One', 'Dietary', 'Registered At'];
    const rows = targetRsvps.map(r => {
      const ev = myEvents.find(e => e.id === r.event_id);
      return [
        r.name,
        r.email,
        r.phone,
        ev?.title || 'Unknown Event',
        r.status,
        r.plus_one_name || 'None',
        r.custom_responses?.dietary || 'None',
        r.created_at
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = event ? `${event.slug}-guests.csv` : 'vibe-all-guests.csv';
    link.click();
  };

  const handleExportFollowersCSV = () => {
    const headers = ['Follower Name', 'Email', 'Joined Date'];
    const rows = followers.map(f => [
      f.follower_name,
      f.follower_email,
      f.created_at
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${organizer.handle}-community-followers.csv`;
    link.click();
  };

  const handleSaveBrandPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = brandHandle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 'organizer';
    const updated: Profile = {
      ...organizer,
      name: brandName.trim(),
      handle: cleanHandle,
      bio: brandBio.trim(),
      logo_url: brandLogo.trim(),
      brand_color: brandColor,
      brand_font: brandFont
    };
    setOrganizer(updated);
    saveOrganizer(updated);
    await updateAuthProfile({
      name: brandName.trim(),
      handle: cleanHandle,
      bio: brandBio.trim(),
      avatar_url: brandLogo.trim(),
      brand_color: brandColor,
      brand_font: brandFont,
      onboarded: true
    });
    setBrandSaveToast(true);
    setTimeout(() => setBrandSaveToast(false), 3500);
  };

  // Filter events according to activeTab
  const filteredEvents = myEvents.filter(e => {
    if (activeTab === 'all') return true;
    if (activeTab === 'live') return e.status === 'live';
    if (activeTab === 'draft') return e.status === 'draft';
    if (activeTab === 'upcoming') {
      return new Date(e.start_at).getTime() >= Date.now() && e.status !== 'draft';
    }
    if (activeTab === 'past') {
      return new Date(e.start_at).getTime() < Date.now() || e.status === 'past';
    }
    return true;
  });

  // Filter guests according to search and filters
  const filteredGuests = myRsvps.filter(r => {
    const ev = myEvents.find(e => e.id === r.event_id);
    const matchesSearch =
      r.name.toLowerCase().includes(guestSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(guestSearch.toLowerCase()) ||
      r.phone.includes(guestSearch) ||
      (ev?.title || '').toLowerCase().includes(guestSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (guestEventFilter !== 'all' && r.event_id !== guestEventFilter) return false;
    if (guestStatusFilter !== 'all' && r.status !== guestStatusFilter) return false;
    return true;
  });

  const datePolls = getDatePolls();

  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar (240px wide equivalent) */}
          <aside className="lg:col-span-3 bg-brand text-white rounded-2xl p-5 shadow-card space-y-6 self-start">
            {/* Organizer Profile Header */}
            <div className="flex items-center gap-3 pb-5 border-b border-white/10">
              {organizer.logo_url ? (
                <Image
                  src={organizer.logo_url}
                  alt={organizer.name}
                  width={44}
                  height={44}
                  className="rounded-xl object-cover border border-white/20 w-11 h-11 bg-surface-3"
                  unoptimized
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-surface/20 flex items-center justify-center font-display font-bold text-lg text-white">
                  {organizer.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-display font-bold text-base text-white truncate">
                  {organizer.name}
                </h3>
                <span className="text-xs text-gold font-mono block truncate">
                  @{organizer.handle}
                </span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveNav('events')}
                className={`relative w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors text-left z-10 ${
                  activeNav === 'events'
                    ? 'text-white font-black'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {activeNav === 'events' && (
                  <motion.div
                    layoutId="sidebarActiveNav"
                    className="absolute inset-0 bg-accent rounded-xl -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Calendar className="w-4 h-4 shrink-0" />
                <span>My Events</span>
              </button>

              <Link
                href="/create"
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all text-left group hover-lift"
              >
                <div className="w-5 h-5 rounded-md bg-gold/20 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span>Create Event</span>
                <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-gold/20 text-gold uppercase font-bold">New</span>
              </Link>

              <button
                onClick={() => setActiveNav('polls')}
                className={`relative w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors text-left z-10 ${
                  activeNav === 'polls'
                    ? 'text-white font-black'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {activeNav === 'polls' && (
                  <motion.div
                    layoutId="sidebarActiveNav"
                    className="absolute inset-0 bg-accent rounded-xl -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <BarChart2 className="w-4 h-4 shrink-0" />
                <span>Date Polls</span>
              </button>

              <button
                onClick={() => setActiveNav('guests')}
                className={`relative w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors text-left z-10 ${
                  activeNav === 'guests'
                    ? 'text-white font-black'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {activeNav === 'guests' && (
                  <motion.div
                    layoutId="sidebarActiveNav"
                    className="absolute inset-0 bg-accent rounded-xl -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Users className="w-4 h-4 shrink-0" />
                <span>Guest Lists</span>
                {rsvps.filter(r => r.status === 'waitlisted').length > 0 && (
                  <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-400 text-brand font-black animate-pulse">
                    {rsvps.filter(r => r.status === 'waitlisted').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveNav('community')}
                className={`relative w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors text-left z-10 ${
                  activeNav === 'community'
                    ? 'text-white font-black'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {activeNav === 'community' && (
                  <motion.div
                    layoutId="sidebarActiveNav"
                    className="absolute inset-0 bg-accent rounded-xl -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Heart className="w-4 h-4 shrink-0" />
                <span>Followers</span>
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">
                  {followers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveNav('brand')}
                className={`relative w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors text-left z-10 ${
                  activeNav === 'brand'
                    ? 'text-white font-black'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {activeNav === 'brand' && (
                  <motion.div
                    layoutId="sidebarActiveNav"
                    className="absolute inset-0 bg-accent rounded-xl -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Settings className="w-4 h-4 shrink-0" />
                <span>Profile & Brand Preset</span>
              </button>

              <Link
                href={`/${organizer.handle}`}
                target="_blank"
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition-all text-left group"
              >
                <ExternalLink className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                <span className="truncate">Public Profile (/{organizer.handle})</span>
              </Link>
            </nav>

            <div className="pt-4 border-t border-white/10">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 block mb-2">
                Brand Preset Active
              </span>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                  style={{ backgroundColor: organizer.brand_color || '#E8621A' }}
                />
                <span className="truncate font-mono">Hex: {organizer.brand_color || '#E8621A'}</span>
              </div>
            </div>
          </aside>

          {/* Right Main Dashboard Area */}
          <main className="lg:col-span-9 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface rounded-2xl p-6 border border-border shadow-card">
              <div>
                <h1 className="font-display font-black text-2xl sm:text-3xl text-ink">
                  Good afternoon, {organizer.name} 👋
                </h1>
                <p className="text-xs text-ink-muted mt-1">
                  Here is your event performance across India in IST (Asia/Kolkata)
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncingWithDb}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-btn bg-surface-2 border border-border text-ink hover:bg-surface-3 font-bold text-xs shadow-xs hover-lift transition-all"
                  title="Reconcile latest events with Supabase database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-accent ${isSyncingWithDb ? 'animate-spin' : ''}`} />
                  <span>{isSyncingWithDb ? 'Syncing...' : 'Sync Supabase'}</span>
                </button>

                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-sm hover-lift transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>Create Event</span>
                </Link>
              </div>

            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.04 }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                className="bg-surface rounded-2xl p-5 border border-border shadow-card space-y-1 hover:shadow-elevated shadow-hover-bloom transition-all"
              >
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="text-xs uppercase font-bold tracking-wider">Hosted Experiences</span>
                  <Calendar className="w-4 h-4 text-accent" />
                </div>
                <div className="font-display font-black text-3xl text-brand">
                  <AnimatedNumber value={myEvents.length} />
                </div>
                <div className="text-[11px] text-success font-medium">5 bespoke templates</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.08 }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                onClick={() => {
                  setGuestEventFilter('all');
                  setActiveNav('guests');
                }}
                className="bg-surface rounded-2xl p-5 border border-border shadow-card space-y-1 cursor-pointer hover:border-brand/40 hover:shadow-elevated shadow-hover-bloom transition-all group"
              >
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="text-xs uppercase font-bold tracking-wider group-hover:text-brand transition-colors">Total RSVPs Tracked</span>
                  <Users className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-display font-black text-3xl text-brand">
                  <AnimatedNumber value={totalRsvps} />
                </div>
                <div className="text-[11px] text-accent font-medium flex items-center justify-between">
                  <span>Live Supabase sync</span>
                  <span className="text-[10px] uppercase font-bold text-brand group-hover:underline">View Guests →</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.12 }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                onClick={() => setActiveNav('community')}
                className="bg-surface rounded-2xl p-5 border border-border shadow-card space-y-1 cursor-pointer hover:border-accent/40 hover:shadow-elevated shadow-hover-bloom transition-all group"
              >
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="text-xs uppercase font-bold tracking-wider group-hover:text-accent transition-colors">Community Followers</span>
                  <Heart className="w-4 h-4 text-accent fill-accent/20 group-hover:scale-110 transition-transform" />
                </div>
                <div className="font-display font-black text-3xl text-brand">
                  <AnimatedNumber value={followers.length} />
                </div>
                <div className="text-[11px] text-accent font-medium flex items-center justify-between">
                  <span>Following @{organizer.handle}</span>
                  <span className="text-[10px] uppercase font-bold text-accent group-hover:underline">View →</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.16 }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                className="bg-surface rounded-2xl p-5 border border-border shadow-card space-y-1 hover:shadow-elevated shadow-hover-bloom transition-all"
              >
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="text-xs uppercase font-bold tracking-wider">Upcoming & Live</span>
                  <Flame className="w-4 h-4 text-accent" />
                </div>
                <div className="font-display font-black text-3xl text-brand">
                  <AnimatedNumber value={upcomingCount} />
                </div>
                <div className="text-[11px] text-ink-muted font-medium">{liveCount} currently active</div>
              </motion.div>
            </div>

            {/* Main Nav Section Transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNav}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* SECTION 1: MY EVENTS ROSTER */}
                {activeNav === 'events' && (
              <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <h2 className="font-display font-bold text-xl text-ink">
                    Your Event Roster
                  </h2>

                  {/* 5 Filter tabs from Master Prompt: All · Live · Upcoming · Past · Draft */}
                  <div className="flex flex-wrap rounded-lg border border-border bg-surface-2 p-1 relative">
                    {(['all', 'live', 'upcoming', 'past', 'draft'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors z-10 ${
                          activeTab === tab
                            ? 'text-brand font-black'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        {activeTab === tab && (
                          <motion.div
                            layoutId="dashboardFilterTab"
                            className="absolute inset-0 bg-surface rounded shadow-sm -z-10"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Cards List */}
                <div className="space-y-4">
                  {myEvents.length === 0 ? (
                    <div className="bg-surface-2 rounded-xl p-10 border border-border text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand mx-auto flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-accent" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-display font-bold text-lg text-ink">
                          You haven&apos;t created any events yet
                        </h3>
                        <p className="text-xs text-ink-muted max-w-sm mx-auto">
                          Launch your first experience with our AI-powered wizard, social banner studio, and 5 Indian aesthetic templates.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link
                          href="/create"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-sm hover-lift transition-all"
                        >
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <span>Create Your First Event</span>
                        </Link>
                        <button
                          onClick={() => setShowSampleEvents(!showSampleEvents)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-btn border border-border bg-surface hover:bg-surface-3 text-ink text-xs font-semibold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-accent" />
                          <span>{showSampleEvents ? 'Hide Demo Events' : 'Preview with Sample Events'}</span>
                        </button>
                      </div>
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="py-12 text-center text-ink-muted text-xs">
                      No events match the selected &quot;{activeTab}&quot; tab filter.
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filteredEvents.map(evt => {
                        const evtRsvps = myRsvps.filter(r => r.event_id === evt.id);
                        return (
                          <motion.div
                            layout
                            key={evt.id}
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                            className="p-4 rounded-xl border border-border bg-surface-2 hover:bg-surface hover:shadow-card hover-lift transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-4">
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-surface-3 flex-shrink-0 border border-border">
                                <Image src={evt.cover_image_url} alt={evt.title} fill className="object-cover" unoptimized />
                              </div>

                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                    evt.status === 'live'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : evt.status === 'draft'
                                      ? 'bg-surface-3 text-ink-muted'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {evt.status}
                                  </span>
                                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                                    {evt.template}
                                  </span>
                                  <span className="text-xs text-ink-muted">· {evt.city}</span>
                                </div>

                                <h3 className="font-display font-bold text-base text-ink truncate">
                                  {evt.title}
                                </h3>

                                <div className="flex items-center gap-3 text-xs text-ink-muted">
                                  <span>📅 {formatIST(evt.start_at)}</span>
                                  <span>·</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setGuestEventFilter(evt.id);
                                      setActiveNav('guests');
                                    }}
                                    className="font-semibold text-brand hover:text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    title="Click to view attendee roster for this event"
                                  >
                                    <Users className="w-3.5 h-3.5 text-accent" />
                                    <span>{evtRsvps.length} {evtRsvps.length === 1 ? 'RSVP' : 'RSVPs'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Quick actions: View, Guests, Banners, Copy, Export CSV */}
                            <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setGuestEventFilter(evt.id);
                                  setActiveNav('guests');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-mid text-white text-xs font-bold transition-all shadow-xs hover-lift cursor-pointer"
                                title="View and manage guest roster for this event"
                              >
                                <Users className="w-3.5 h-3.5 text-gold" />
                                <span>Guests ({evtRsvps.length})</span>
                              </button>

                              <Link
                                href={`/${evt.slug}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-ink hover:bg-surface-3 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </Link>

                              <button
                                onClick={() => {
                                  setSelectedEventForBanners(evt);
                                  setBannerModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold-light border border-gold/30 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-gold" />
                                <span>Banners</span>
                              </button>

                              <button
                                onClick={() => handleDuplicate(evt)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-ink hover:bg-surface-3 transition-colors"
                                title="Duplicate as new event"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </button>

                              <button
                                onClick={() => handleExportCSV(evt)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-ink hover:bg-surface-3 transition-colors"
                                title="Export Guest List to CSV"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>CSV</span>
                              </button>

                              <button
                                onClick={() => setEventToDelete(evt)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors cursor-pointer"
                                title="Delete this event from Vibe and Supabase database"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 2: INTERACTIVE GUEST LISTS MANAGEMENT */}
            {activeNav === 'guests' && (
              <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <h2 className="font-display font-bold text-xl text-ink">
                      Master Guest Directory
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Showing {filteredGuests.length} attendee records across all active experiences
                    </p>
                  </div>

                  <button
                    onClick={() => handleExportCSV()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-brand hover:bg-brand-mid text-white text-xs font-bold transition-all shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export All Guests CSV</span>
                  </button>
                </div>

                {/* Guest Action Toast */}
                {guestToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold animate-fade-in shadow-xs flex items-center justify-between">
                    <span>{guestToast}</span>
                    <button onClick={() => setGuestToast(null)} className="text-emerald-700 hover:text-emerald-900">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Pending Waitlist Requests Alert Banner */}
                {rsvps.filter(r => r.status === 'waitlisted').length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                        <Clock className="w-5 h-5 text-amber-700" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                          <span>{rsvps.filter(r => r.status === 'waitlisted').length} Waitlist Request(s) Awaiting Host Approval</span>
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                        </div>
                        <p className="text-xs text-amber-800/90 mt-0.5">
                          Accept waiting guests to allocate spots, generate their digital admission pass, and notify them via email.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleApproveAllWaitlist}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Accept All ({rsvps.filter(r => r.status === 'waitlisted').length})</span>
                    </button>
                  </div>
                )}

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, email, or +91 phone..."
                      value={guestSearch}
                      onChange={e => setGuestSearch(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-input bg-surface-2 border border-border focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <select
                      value={guestEventFilter}
                      onChange={e => setGuestEventFilter(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-input bg-surface-2 border border-border"
                    >
                      <option value="all">All Events ({events.length})</option>
                      {events.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex rounded-lg border border-border bg-surface-2 p-1 text-xs font-semibold">
                    {(['all', 'confirmed', 'waitlisted', 'cancelled'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setGuestStatusFilter(st)}
                        className={`flex-1 py-1 capitalize rounded transition-all ${
                          guestStatusFilter === st
                            ? 'bg-surface text-brand shadow-xs font-bold'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guests Table */}
                <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-2 border-b border-border text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                      <tr>
                        <th className="p-3.5">Attendee</th>
                        <th className="p-3.5">Event</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Details</th>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredGuests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-ink-muted">
                            No attendees found matching search and filters.
                          </td>
                        </tr>
                      ) : (
                        filteredGuests.map(g => {
                          const ev = events.find(e => e.id === g.event_id);
                          return (
                            <tr key={g.id} className="hover:bg-surface-2/60 transition-colors">
                              <td className="p-3.5">
                                <div className="font-bold text-ink">{g.name}</div>
                                <div className="text-[11px] text-ink-muted">{g.email}</div>
                                <div className="text-[11px] font-mono text-ink-secondary mt-0.5">🇮🇳 {g.phone}</div>
                              </td>
                              <td className="p-3.5">
                                <div className="font-semibold text-ink truncate max-w-[200px]">
                                  {ev?.title || 'Unknown Event'}
                                </div>
                                <div className="text-[10px] text-accent font-medium">{ev?.city}</div>
                              </td>
                              <td className="p-3.5">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  g.status === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : g.status === 'waitlisted'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {g.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-[11px] text-ink-secondary">
                                {g.plus_one_name && <div>+1: <strong>{g.plus_one_name}</strong></div>}
                                {g.custom_responses?.dietary && <div>Diet: {g.custom_responses.dietary}</div>}
                                {!g.plus_one_name && !g.custom_responses?.dietary && <span className="text-ink-muted">None</span>}
                              </td>
                              <td className="p-3.5 text-[11px] text-ink-muted whitespace-nowrap">
                                {new Date(g.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="p-3.5 text-right whitespace-nowrap">
                                {g.status === 'waitlisted' ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleApproveGuest(g)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
                                      title="Accept request and issue admission pass"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Accept</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectGuest(g)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all"
                                      title="Decline request"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                ) : g.status === 'confirmed' ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Confirmed</span>
                                    </span>
                                    <button
                                      onClick={() => handleRejectGuest(g)}
                                      className="text-[10px] text-ink-muted hover:text-red-600 transition-colors ml-1"
                                      title="Cancel attendee pass"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-ink-muted italic">Cancelled</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 3: DYNAMIC DATE SCHEDULING POLLS */}
            {activeNav === 'polls' && (() => {
              const myPolls = polls.filter(p =>
                p.organizer_handle === organizer.handle ||
                p.organizer_id === organizer.id ||
                (!isDemoHost && p.organizer_handle === profile?.handle) ||
                p.organizer_handle === 'suyash_pandey'
              );

              // If organizer has no polls yet, include sample poll so they see how it works
              const displayedPolls = myPolls.length > 0 ? myPolls : polls;

              const handleCreatePoll = async (e: React.FormEvent) => {
                e.preventDefault();
                if (!pollTitle.trim()) return;
                const validOptions = pollOptions.filter(o => o.trim().length > 0);
                if (validOptions.length < 2) {
                  alert('Please provide at least 2 date options for community voting.');
                  return;
                }

                setIsSubmittingPoll(true);
                const baseSlug = pollTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 35);
                const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

                const newPoll: DatePoll = {
                  id: `poll-${Date.now()}`,
                  organizer_id: organizer.id,
                  organizer_name: organizer.name,
                  organizer_handle: organizer.handle,
                  title: pollTitle.trim(),
                  slug: uniqueSlug,
                  description: pollDescription.trim() || undefined,
                  options: validOptions.map((opt, idx) => ({
                    id: `opt-${Date.now()}-${idx}`,
                    date_label: opt.trim(),
                    votes: []
                  })),
                  created_at: new Date().toISOString()
                };

                await saveDatePoll(newPoll);
                setIsSubmittingPoll(false);
                setShowCreatePollModal(false);
                setPollTitle('');
                setPollDescription('');
                setPollOptions(['Friday, Nov 14 · 8:00 PM IST', 'Saturday, Nov 15 · 6:00 PM IST']);
                setPollToast('✨ Date poll created & live! Share the link with your community to gather votes.');
                setTimeout(() => setPollToast(null), 5000);
              };

              const handleCopyPollLink = (pollSlug: string) => {
                if (typeof window !== 'undefined') {
                  const url = `${window.location.origin}/poll/${pollSlug}`;
                  navigator.clipboard.writeText(url);
                  setCopiedPollSlug(pollSlug);
                  setTimeout(() => setCopiedPollSlug(null), 2500);
                }
              };

              const handleConvertWinnerToEvent = (poll: DatePoll) => {
                let winner = poll.options[0];
                poll.options.forEach(opt => {
                  if (opt.votes.length > (winner?.votes?.length || 0)) {
                    winner = opt;
                  }
                });
                router.push(`/create?title=${encodeURIComponent(poll.title)}&date=${encodeURIComponent(winner.date_label)}`);
              };

              const handleDeletePoll = async (pollId: string) => {
                if (confirm('Are you sure you want to delete this date scheduling poll?')) {
                  await deleteDatePoll(pollId);
                  setPollToast('Date poll deleted.');
                  setTimeout(() => setPollToast(null), 3000);
                }
              };

              return (
                <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h2 className="font-display font-bold text-xl text-ink">
                        Date Scheduling Polls
                      </h2>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Poll your community on &quot;What date works?&quot; and auto-convert the winning date into an official event.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCreatePollModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-all shadow-sm hover-lift"
                      >
                        <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span>Create Date Poll</span>
                      </button>
                    </div>
                  </div>

                  {pollToast && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{pollToast}</span>
                    </div>
                  )}

                  {displayedPolls.length === 0 ? (
                    <div className="p-8 text-center bg-surface-2 rounded-xl border border-dashed border-border space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-accent-light text-accent mx-auto flex items-center justify-center shadow-xs">
                        <Vote className="w-6 h-6" />
                      </div>
                      <h3 className="font-display font-bold text-base text-ink">No Date Polls Created Yet</h3>
                      <p className="text-xs text-ink-muted max-w-sm mx-auto">
                        Never guess attendee availability. Gather votes on multiple dates and times before booking your venue.
                      </p>
                      <button
                        onClick={() => setShowCreatePollModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Your First Date Poll</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {displayedPolls.map(poll => {
                        const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
                        let winner = poll.options[0];
                        poll.options.forEach(opt => {
                          if (opt.votes.length > (winner?.votes?.length || 0)) {
                            winner = opt;
                          }
                        });
                        const hasVotes = totalVotes > 0;

                        return (
                          <div key={poll.id} className="p-5 rounded-2xl border border-border bg-surface-2 space-y-4 shadow-xs">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-accent bg-accent-light px-2.5 py-0.5 rounded-full">
                                    Active Date Poll · {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                                  </span>
                                  {hasVotes && (
                                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
                                      <Trophy className="w-3 h-3 text-amber-500" />
                                      Top Pick: {winner.date_label.split('·')[0]}
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-display font-bold text-lg text-ink mt-1.5">
                                  {poll.title}
                                </h3>
                                {poll.description && (
                                  <p className="text-xs text-ink-secondary mt-1">{poll.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                <button
                                  onClick={() => handleConvertWinnerToEvent(poll)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-mid transition-all shadow-xs"
                                  title="Auto-fill event creation wizard with winning date"
                                >
                                  <Trophy className="w-3.5 h-3.5 text-gold" />
                                  <span>Convert to Event →</span>
                                </button>

                                {/* WhatsApp Share */}
                                <a
                                  href={`https://wa.me/?text=${encodeURIComponent(`Hey! Help us choose the best date for "${poll.title}":\n\n${typeof window !== 'undefined' ? window.location.origin : ''}/poll/${poll.slug}`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all shadow-xs"
                                  title="Share poll directly on WhatsApp"
                                >
                                  <span>WhatsApp</span>
                                </a>

                                <button
                                  onClick={() => handleCopyPollLink(poll.slug)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-ink hover:bg-surface-3 transition-colors"
                                  title="Copy public voting link"
                                >
                                  {copiedPollSlug === poll.slug ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-success" />
                                      <span className="text-success font-bold">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Share2 className="w-3.5 h-3.5" />
                                      <span>Copy Link</span>
                                    </>
                                  )}
                                </button>

                                <Link
                                  href={`/poll/${poll.slug}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface border border-border text-ink-secondary hover:text-ink hover:bg-surface-3 transition-colors text-xs font-semibold"
                                  title="Open live public voting page in new tab"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-accent" />
                                </Link>

                                {poll.id !== 'poll-1' && (
                                  <button
                                    onClick={() => handleDeletePoll(poll.id)}
                                    className="p-1.5 rounded-lg text-ink-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Delete Poll"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Public Poll URL Strip */}
                            <div className="p-2.5 rounded-xl bg-surface border border-border flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono text-[11px] text-ink-muted shrink-0">Public Voting Page:</span>
                                <Link
                                  href={`/poll/${poll.slug}`}
                                  target="_blank"
                                  className="font-mono text-accent text-[11px] truncate hover:underline"
                                >
                                  /poll/{poll.slug}
                                </Link>
                              </div>
                              <button
                                onClick={() => handleCopyPollLink(poll.slug)}
                                className="text-xs font-semibold text-accent hover:underline shrink-0"
                              >
                                {copiedPollSlug === poll.slug ? 'Copied URL!' : 'Copy'}
                              </button>
                            </div>

                            {/* Options percentage breakdown */}
                            <div className="space-y-2.5 pt-2 border-t border-border">
                              {poll.options.map(opt => {
                                const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                const isLeader = hasVotes && opt.id === winner.id;

                                return (
                                  <div key={opt.id} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-semibold text-ink flex items-center gap-1.5">
                                        {opt.date_label}
                                        {isLeader && (
                                          <span className="text-[10px] text-amber-600 font-bold bg-amber-100/60 px-1.5 py-0.2 rounded">
                                            Leading
                                          </span>
                                        )}
                                      </span>
                                      <span className="font-mono text-accent font-bold">
                                        {pct}% ({opt.votes.length} {opt.votes.length === 1 ? 'vote' : 'votes'})
                                      </span>
                                    </div>
                                    <div className="w-full bg-surface-3 h-2.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-500 ${isLeader ? 'bg-brand' : 'bg-accent'}`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CREATE DATE POLL MODAL */}
                  {showCreatePollModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                      <div className="bg-surface rounded-2xl max-w-lg w-full p-6 border border-border shadow-elevated space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-accent-light text-accent flex items-center justify-center">
                              <Vote className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-display font-bold text-lg text-ink">Create Date Scheduling Poll</h3>
                              <p className="text-[11px] text-ink-muted">Crowdsource attendee availability in seconds</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCreatePollModal(false)}
                            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <form onSubmit={handleCreatePoll} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                              Poll Title / Event Question *
                            </label>
                            <input
                              type="text"
                              required
                              value={pollTitle}
                              onChange={e => setPollTitle(e.target.value)}
                              placeholder="e.g. Next Tech Mixer: Which Friday works best?"
                              className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:outline-none focus:border-accent"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                              Description / Context (Optional)
                            </label>
                            <textarea
                              rows={2}
                              value={pollDescription}
                              onChange={e => setPollDescription(e.target.value)}
                              placeholder="e.g. We are planning a 20-person mixer in Indiranagar. Vote for your preferred date and time!"
                              className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:outline-none focus:border-accent"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                                Date & Time Options (Min 2) *
                              </label>
                              <span className="text-[10px] text-ink-muted">
                                {pollOptions.length} of 6 slots
                              </span>
                            </div>

                            <div className="space-y-2">
                              {pollOptions.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="w-5 text-center text-xs font-mono font-bold text-ink-muted">
                                    {idx + 1}.
                                  </span>
                                  <input
                                    type="text"
                                    required
                                    value={opt}
                                    onChange={e => {
                                      const next = [...pollOptions];
                                      next[idx] = e.target.value;
                                      setPollOptions(next);
                                    }}
                                    placeholder={`e.g. Friday, Nov ${14 + idx * 7} · 8:00 PM IST`}
                                    className="flex-1 text-xs px-3 py-2 rounded-input bg-surface-2 border border-border focus:outline-none focus:border-accent"
                                  />
                                  {pollOptions.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPollOptions(pollOptions.filter((_, i) => i !== idx));
                                      }}
                                      className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Remove Option"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>

                            {pollOptions.length < 6 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSlot = `Friday, Nov ${21 + pollOptions.length * 2} · 7:30 PM IST`;
                                  setPollOptions([...pollOptions, nextSlot]);
                                }}
                                className="mt-2 text-xs text-accent font-bold hover:underline inline-flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Another Date Option</span>
                              </button>
                            )}
                          </div>

                          <div className="p-3 rounded-xl bg-surface-2 border border-border text-[11px] text-ink-muted flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                            <span>
                              Anyone can vote via your public poll link without needing an account. Once votes roll in, convert the winner into an official event with 1 click!
                            </span>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                            <button
                              type="button"
                              onClick={() => setShowCreatePollModal(false)}
                              className="px-4 py-2 rounded-btn border border-border text-xs font-semibold text-ink hover:bg-surface-2 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingPoll || !pollTitle.trim()}
                              className="px-5 py-2 rounded-btn bg-accent hover:bg-accent-dark text-white text-xs font-bold shadow-sm hover-lift transition-all disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {isSubmittingPoll ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Vote className="w-3.5 h-3.5" />
                                  <span>Launch Date Poll</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* SECTION: COMMUNITY & FOLLOWERS */}
            {activeNav === 'community' && (
              <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <h2 className="font-display font-bold text-xl text-ink flex items-center gap-2">
                      <Heart className="w-5 h-5 text-accent fill-accent/20" />
                      <span>Community & Followers ({followers.length})</span>
                    </h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Supporters who follow @{organizer.handle} on Vibe to receive notifications when you launch new events
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportFollowersCSV}
                      disabled={followers.length === 0}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-btn border border-border bg-surface hover:bg-surface-2 text-xs font-bold text-ink transition-colors disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-accent" />
                      <span>Export CSV</span>
                    </button>

                    <Link
                      href={`/${organizer.handle}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-btn bg-accent hover:bg-accent-dark text-xs font-bold text-white shadow-sm transition-all"
                    >
                      <span>Share Follow Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Filter */}
                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search followers by name or email..."
                    value={followerSearch}
                    onChange={(e) => setFollowerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-surface-2 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                {/* Follower List */}
                {followers.filter(f => 
                  f.follower_name.toLowerCase().includes(followerSearch.toLowerCase()) ||
                  f.follower_email.toLowerCase().includes(followerSearch.toLowerCase())
                ).length === 0 ? (
                  <div className="text-center py-12 bg-surface-2 rounded-xl border border-dashed border-border space-y-3">
                    <Users className="w-10 h-10 text-ink-muted/40 mx-auto" />
                    <p className="font-display font-bold text-sm text-ink">
                      {followers.length === 0 ? 'No followers yet' : 'No matching followers found'}
                    </p>
                    <p className="text-xs text-ink-muted max-w-sm mx-auto">
                      Share your public organizer profile at <span className="font-mono text-accent">/{organizer.handle}</span> so guests can follow your upcoming experiences.
                    </p>
                    <Link
                      href={`/${organizer.handle}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-brand text-white text-xs font-bold hover:bg-brand-mid transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gold" />
                      <span>View Public Profile</span>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-2 text-ink-secondary border-b border-border uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="px-4 py-3">Follower</th>
                          <th className="px-4 py-3">Email Address</th>
                          <th className="px-4 py-3">Joined Community</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {followers
                          .filter(f => 
                            f.follower_name.toLowerCase().includes(followerSearch.toLowerCase()) ||
                            f.follower_email.toLowerCase().includes(followerSearch.toLowerCase())
                          )
                          .map((f) => (
                            <tr key={f.id} className="hover:bg-surface-2/60 transition-colors">
                              <td className="px-4 py-3 font-semibold text-ink flex items-center gap-3">
                                <Image
                                  src={f.follower_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.follower_name)}`}
                                  alt={f.follower_name}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 rounded-xl object-cover bg-surface border border-border shrink-0"
                                />
                                <span>{f.follower_name}</span>
                              </td>
                              <td className="px-4 py-3 font-mono text-ink-secondary">{f.follower_email}</td>
                              <td className="px-4 py-3 text-ink-muted">
                                {new Date(f.created_at).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: PROFILE & BRAND PRESET EDITOR */}
            {activeNav === 'brand' && (
              <div className="bg-surface rounded-2xl p-6 border border-border shadow-card space-y-6">
                <div className="border-b border-border pb-4">
                  <h2 className="font-display font-bold text-xl text-ink">
                    Organizer Profile & Brand Presets
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Set your brand accent color, logo, and typography once. Click &quot;Apply my brand&quot; during event creation to auto-brand all events.
                  </p>
                </div>

                {brandSaveToast && (
                  <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Brand presets and profile saved! Ready for 1-click auto-application in wizard.</span>
                  </div>
                )}

                <form onSubmit={handleSaveBrandPreset} className="space-y-5 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                        Organizer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={brandName}
                        onChange={e => setBrandName(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                        Handle (URL Slug) *
                      </label>
                      <div className="flex items-center">
                        <span className="text-xs px-3 py-2.5 rounded-l-input bg-surface-3 border border-r-0 border-border text-ink-muted">
                          /
                        </span>
                        <input
                          type="text"
                          required
                          value={brandHandle}
                          onChange={e => setBrandHandle(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-r-input bg-surface-2 border border-border focus:outline-none focus:border-accent font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                      Bio / Tagline
                    </label>
                    <textarea
                      rows={2}
                      value={brandBio}
                      onChange={e => setBrandBio(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 rounded-input bg-surface-2 border border-border focus:outline-none focus:border-accent resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                        Logo Image URL
                      </label>
                      <input
                        type="url"
                        value={brandLogo}
                        onChange={e => setBrandLogo(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                        Brand Accent Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={brandColor}
                          onChange={e => setBrandColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                        />
                        <input
                          type="text"
                          value={brandColor}
                          onChange={e => setBrandColor(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-input bg-surface-2 border border-border font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                      Default Brand Font Pairing
                    </label>
                    <select
                      value={brandFont}
                      onChange={e => setBrandFont(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-input bg-surface-2 border border-border"
                    >
                      <option value="Playfair Display">Playfair Display (Editorial Luxury)</option>
                      <option value="Fraunces">Fraunces (Warm & Intimate)</option>
                      <option value="Inter">Inter (Sharp & Modern)</option>
                      <option value="Cal Sans">Cal Sans (Bold & High Voltage)</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-brand hover:bg-brand-mid text-white font-bold text-xs shadow-sm hover-lift transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-gold" />
                      <span>Save Brand Preset</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Delete Event Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface rounded-2xl p-6 border border-border shadow-elevated max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ink">Delete Event</h3>
                <p className="text-xs text-ink-muted">Permanent database removal</p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-ink font-semibold">&ldquo;{eventToDelete.title}&rdquo;</strong>?
              This will remove the event, its RSVPs, and social banner routes from both Vibe and the Supabase database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingEvent}
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 rounded-btn bg-surface border border-border text-xs font-semibold text-ink hover:bg-surface-2 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingEvent}
                onClick={async () => {
                  setIsDeletingEvent(true);
                  try {
                    await deleteEvent(eventToDelete.id, eventToDelete.slug);
                    setEventToast(`Event "${eventToDelete.title}" deleted.`);
                    setTimeout(() => setEventToast(null), 4000);
                  } catch (err) {
                    console.error('Delete error:', err);
                  } finally {
                    setIsDeletingEvent(false);
                    setEventToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-btn bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                {isDeletingEvent ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Event Toast Notification */}
      {eventToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-4 py-2.5 rounded-xl shadow-elevated text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{eventToast}</span>
        </div>
      )}

      {/* Social Banner Generation Modal */}
      {selectedEventForBanners && (
        <SocialBannerModal
          event={selectedEventForBanners}
          isOpen={bannerModalOpen}
          onClose={() => setBannerModalOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
}
