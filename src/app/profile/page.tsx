'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Ticket,
  Zap,
  Edit3,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Crown,
  Code2,
  Sparkles,
  Camera,
  Upload,
  Globe,
  Plus,
  ArrowRight,
  LogOut,
  Sliders,
  Bell,
  Heart,
  LayoutDashboard,
  ExternalLink,
  QrCode,
  Clock,
  ChevronRight,
  RefreshCw,
  Search,
  Lock,
  MessageCircle,
} from 'lucide-react';

import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import AuthModal from '@/components/auth/AuthModal';
import DigitalPassModal from '@/components/ui/DigitalPassModal';
import {
  useAuth,
  updateAuthProfile,
  signInWithGoogle,
  getInitials,
  isSyntheticAvatar,
  resolveAvatarUrl,
} from '@/lib/auth';
import {
  getEvents,
  getRSVPs,
  getFlashVibeEvents,
  isFlashVibeLiked,
  toggleFlashVibeLike,
} from '@/lib/store';
import { getUserCity, INDIAN_CITIES } from '@/lib/location';
import { EventItem, RSVPItem } from '@/types';
import { ADMIN_BASE_PATH } from '@/lib/adminConstants';
import { getPassSerialNumber } from '@/lib/ticketSecurity';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
];

const BRAND_COLORS = [
  { name: 'Sprint Orange', hex: '#FF5500' },
  { name: 'Warm Amber', hex: '#FF8C42' },
  { name: 'Cyber Neon', hex: '#00F0FF' },
  { name: 'Amethyst Violet', hex: '#8B5CF6' },
  { name: 'Emerald Forest', hex: '#10B981' },
  { name: 'Rose Blossom', hex: '#F43F5E' },
];

const BRAND_FONTS = [
  { id: 'Playfair Display', label: 'Playfair Display (Editorial & Elegant)' },
  { id: 'Fraunces', label: 'Fraunces (Curated & Warm Artisanal)' },
  { id: 'Inter', label: 'Inter (Modern & Clean Tech)' },
];

type ProfileTab = 'overview' | 'passes' | 'vibes' | 'liked' | 'settings';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, user, isLoggedIn, loading: authLoading, isStaff, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'passes' || tabParam === 'vibes' || tabParam === 'liked' || tabParam === 'settings') {
      return tabParam;
    }
    if (searchParams.get('edit') === 'true') {
      return 'settings';
    }
    return 'overview';
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Digital Pass Modal state
  const [selectedPass, setSelectedPass] = useState<{ rsvp: RSVPItem; event: EventItem } | null>(null);

  // Form editing states
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#FF5500');
  const [brandFont, setBrandFont] = useState('Inter');
  const [whatsappNotify, setWhatsappNotify] = useState(true);
  const [emailNotify, setEmailNotify] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Data collections
  const [allEvents, setAllEvents] = useState<EventItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return getEvents();
      } catch {
        return [];
      }
    }
    return [];
  });

  const [allRsvps, setAllRsvps] = useState<RSVPItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return getRSVPs();
      } catch {
        return [];
      }
    }
    return [];
  });

  // Sync profile form when profile changes
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setHandle(profile.handle || (profile.email ? profile.email.split('@')[0] : ''));
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
      setBrandColor(profile.brand_color || '#FF5500');
      setBrandFont(profile.brand_font || 'Inter');
      if (profile.avatar_url && !isSyntheticAvatar(profile.avatar_url)) {
        setAvatarUrl(profile.avatar_url);
      }
    }
    const currentCity = getUserCity();
    if (currentCity) setCity(currentCity);
  }, [profile]);

  // Load events & RSVPs
  useEffect(() => {
    setAllEvents(getEvents());
    setAllRsvps(getRSVPs());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const effectiveEmail = (
    profile?.email ||
    user?.email ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('vibe_user_email') || localStorage.getItem('vibe_guest_email') || ''
      : '')
  ).trim().toLowerCase();

  // User's booked passes
  const userPasses = useMemo(() => {
    if (!effectiveEmail) return [];
    const now = Date.now();
    return allRsvps
      .filter((r) => r.email && r.email.trim().toLowerCase() === effectiveEmail && r.status === 'confirmed')
      .map((r) => {
        const ev = allEvents.find((e) => e.id === r.event_id || e.slug === r.event_id || e.id === r.event_slug || e.slug === r.event_slug);
        const fallbackEvent: EventItem = {
          id: r.event_id || 'ev-1',
          slug: r.event_slug || 'vibe-event',
          title: (r as any).event_title || 'Vibe Community Meetup',
          organizer_id: 'org-1',
          organizer_name: 'Vibe Host',
          organizer_handle: 'vibe',
          organizer_logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          organizer_brand_color: '#FF5500',
          cover_image_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
          start_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          location_name: 'Café Mokaroma',
          city: 'Mumbai',
          status: 'live',
          capacity: 20,
          spots_filled: 12,
        } as EventItem;
        return {
          rsvp: r,
          event: ev || fallbackEvent,
        };
      });
  }, [allRsvps, allEvents, effectiveEmail]);

  // User's hosted vibes
  const hostedVibes = useMemo(() => {
    if (!profile) return [];
    return allEvents.filter((e) => {
      const matchId = profile.id && e.organizer_id === profile.id;
      const matchHandle = profile.handle && e.organizer_handle?.toLowerCase() === profile.handle.toLowerCase();
      const matchEmail = profile.email && (e as any).organizer_email?.toLowerCase() === profile.email.toLowerCase();
      return matchId || matchHandle || matchEmail;
    });
  }, [allEvents, profile]);

  // Liked vibes
  const likedVibes = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const all = [...getFlashVibeEvents(), ...allEvents];
    const seen = new Set<string>();
    return all.filter((v) => {
      const key = v.id || v.slug;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return isFlashVibeLiked(v.id, v.slug);
    });
  }, [allEvents]);

  // Handle avatar upload via file picker
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      showToast('Image is too large. Please select a file under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        showToast('Photo selected! Click Save to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    try {
      const { data, error } = await updateAuthProfile({
        name: name.trim(),
        handle: cleanHandle,
        bio: bio.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl || undefined,
        brand_color: brandColor,
        brand_font: brandFont,
      });

      if (error) {
        showToast(error.message || 'Failed to update profile');
      } else {
        showToast('Profile updated successfully!');
        try {
          confetti({
            particleCount: 35,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#FF5500', '#FF8C42', '#38BDF8'],
          });
        } catch {}
      }
    } catch {
      showToast('Profile updated locally.');
    } finally {
      setIsSaving(false);
    }
  };

  // Share profile link
  const handleShareProfile = async () => {
    const targetHandle = profile?.handle || handle || 'user';
    const profileUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/@${targetHandle}`
      : `https://vibe.swaniki.com/@${targetHandle}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${name || 'Host'} on Vibe`,
          text: `Check out ${name || 'Host'}'s profile and community events on Vibe`,
          url: profileUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      showToast('Profile link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Derive role badge details
  const roleBadge = useMemo(() => {
    if (!profile) {
      return {
        label: 'Community Guest',
        className: 'bg-white/10 text-white/80 border-white/20',
        icon: User,
      };
    }
    const cleanEmail = (profile.email || '').toLowerCase().trim();
    if (cleanEmail === 'pandeysuyash100@gmail.com') {
      return {
        label: 'Developer Admin',
        className: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        icon: Code2,
      };
    }
    if (cleanEmail === 'mail.jaiswal@gmail.com') {
      return {
        label: 'Owner Admin',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        icon: Crown,
      };
    }
    if (profile.role === 'super_admin') {
      return {
        label: 'Super Admin',
        className: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        icon: ShieldCheck,
      };
    }
    if (profile.role === 'curator') {
      return {
        label: 'Curator',
        className: 'bg-[#FF5500]/15 text-[#FF5500] border-[#FF5500]/30',
        icon: Sparkles,
      };
    }
    if (profile.role === 'organizer' || hostedVibes.length > 0) {
      return {
        label: 'Verified Host',
        className: 'bg-[#FF5500]/15 text-[#FF5500] border-[#FF5500]/30',
        icon: Zap,
      };
    }
    return {
      label: 'Community Member',
      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
    };
  }, [profile, hostedVibes.length]);

  const RoleIcon = roleBadge.icon;

  // Unauthenticated Guest View
  if (!authLoading && !isLoggedIn && !profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col justify-between">
        <Navbar />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <div className="w-full rounded-3xl bg-[#121215] border border-white/10 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF5500]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 rounded-full bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 mx-auto flex items-center justify-center mb-6 shadow-xl">
              <User className="w-10 h-10" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Your Vibe Profile & Wallet
            </h1>
            <p className="text-neutral-400 text-sm sm:text-base max-w-lg mx-auto mt-3 leading-relaxed">
              Sign in to manage your verified community identity, view your booked entry passes, track hosted vibes, and personalize your host brand.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto my-8 text-left">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <Ticket className="w-5 h-5 text-[#FF5500] mb-2" />
                <h4 className="text-xs font-bold text-white">Digital Passes</h4>
                <p className="text-[11px] text-neutral-400 mt-1">Instant QR codes and coordinates for all your booked vibes.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <Zap className="w-5 h-5 text-[#FF8C42] mb-2" />
                <h4 className="text-xs font-bold text-white">Host Reputation</h4>
                <p className="text-[11px] text-neutral-400 mt-1">Host profile, community reviews, and event performance analytics.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <Heart className="w-5 h-5 text-rose-400 mb-2" />
                <h4 className="text-xs font-bold text-white">Saved Vibes</h4>
                <p className="text-[11px] text-neutral-400 mt-1">Bookmarks and favorites from Vibe Instant in one central space.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('signin');
                  setAuthModalOpen(true);
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-[#FF5500] to-[#E04B00] hover:brightness-110 active:scale-95 text-white text-sm font-bold shadow-[0_0_25px_rgba(255,85,0,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Sign In to Your Profile</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await signInWithGoogle();
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-4 text-xs text-neutral-400">
              <Link href="/passes" className="hover:text-white transition flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Lookup guest ticket passes</span>
              </Link>
              <span>·</span>
              <Link href="/vibes" className="hover:text-white transition">
                <span>Explore Vibe Instant</span>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authModalMode}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col justify-between selection:bg-[#FF5500]/30 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Toast notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#18181B] border border-white/20 text-white text-xs font-bold shadow-2xl backdrop-blur-xl flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================= */}
        {/* 1. HERO PROFILE BANNER                                    */}
        {/* ========================================================= */}
        <div className="relative rounded-3xl bg-[#121215] border border-white/10 overflow-hidden shadow-2xl">
          {/* Ambient Glow Header */}
          <div
            className="h-32 sm:h-44 w-full relative transition-colors duration-500"
            style={{
              background: `linear-gradient(135deg, ${brandColor}40 0%, #121215 85%)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#121215]/40 to-[#121215]" />

            {/* Quick Share / Public Link Pill (Top Right) */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareProfile}
                className="px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white/90 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Share profile link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Share Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white/90 hover:text-white transition cursor-pointer"
                title="Edit profile settings"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Profile Identity Content */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              {/* Avatar Frame with Upload Trigger */}
              <div className="relative group shrink-0">
                <div
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-[#121215] bg-[#18181B] shadow-2xl overflow-hidden flex items-center justify-center relative"
                  style={{ borderColor: '#121215' }}
                >
                  {avatarUrl && !isSyntheticAvatar(avatarUrl) ? (
                    <Image
                      src={avatarUrl}
                      alt={name || 'Profile Avatar'}
                      width={128}
                      height={128}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white text-3xl font-black"
                      style={{ backgroundColor: brandColor }}
                    >
                      {getInitials(name || profile?.name, effectiveEmail)}
                    </div>
                  )}

                  {/* Hover Overlay to Change Avatar */}
                  <label
                    htmlFor="avatar-file-upload"
                    className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white"
                  >
                    <Camera className="w-6 h-6 mb-1 text-white/90" />
                    <span className="text-[10px] font-bold">Change</span>
                  </label>
                  <input
                    id="avatar-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Online / Active Pulse */}
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121215]" />
              </div>

              {/* Names & Badges */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {name || profile?.name || 'Vibe Creator'}
                  </h1>

                  {/* Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${roleBadge.className}`}
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                    <span>{roleBadge.label}</span>
                  </span>
                </div>

                {/* Handle & City */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-neutral-400 font-medium">
                  <span className="text-[#FF5500] font-mono font-bold">
                    @{handle || profile?.handle || 'vibe_member'}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{city}, India</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{effectiveEmail}</span>
                  </span>
                </div>

                {/* Bio Snippet */}
                {bio && (
                  <p className="text-xs sm:text-sm text-neutral-300 max-w-xl line-clamp-2 pt-1 leading-relaxed">
                    {bio}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Actions (Desktop & Mobile) */}
            <div className="flex items-center justify-center gap-2.5 shrink-0 pt-2 sm:pt-0">
              <Link
                href="/create"
                className="px-4 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,85,0,0.35)] transition cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Host a Vibe</span>
              </Link>

              {isStaff && (
                <Link
                  href={ADMIN_BASE_PATH}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
                  <span className="hidden sm:inline">Admin Workstation</span>
                  <span className="sm:hidden">Admin</span>
                </Link>
              )}

              <button
                type="button"
                onClick={() => signOut()}
                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/10 divide-x divide-white/10 bg-white/[0.02]">
            <button
              onClick={() => setActiveTab('passes')}
              className="p-4 text-center hover:bg-white/[0.04] transition group cursor-pointer"
            >
              <div className="text-xl sm:text-2xl font-black text-white group-hover:text-[#FF5500] transition">
                {userPasses.length}
              </div>
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1 mt-0.5">
                <Ticket className="w-3 h-3 text-[#FF5500]" />
                <span>Active Passes</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('vibes')}
              className="p-4 text-center hover:bg-white/[0.04] transition group cursor-pointer"
            >
              <div className="text-xl sm:text-2xl font-black text-white group-hover:text-[#FF8C42] transition">
                {hostedVibes.length}
              </div>
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1 mt-0.5">
                <Zap className="w-3 h-3 text-[#FF8C42]" />
                <span>Hosted Vibes</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('liked')}
              className="p-4 text-center hover:bg-white/[0.04] transition group cursor-pointer"
            >
              <div className="text-xl sm:text-2xl font-black text-white group-hover:text-rose-400 transition">
                {likedVibes.length}
              </div>
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1 mt-0.5">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>Liked Vibes</span>
              </div>
            </button>

            <div className="p-4 text-center bg-white/[0.01]">
              <div className="text-xl sm:text-2xl font-black text-white">
                {city}
              </div>
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Home Turf</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. TAB CONTROLLER NAVIGATION                              */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/10">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'passes', label: `My Passes (${userPasses.length})`, icon: Ticket },
            { id: 'vibes', label: `Hosted Vibes (${hostedVibes.length})`, icon: Zap },
            { id: 'liked', label: `Liked Vibes (${likedVibes.length})`, icon: Heart },
            { id: 'settings', label: 'Edit Profile & Branding', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs sm:text-sm font-bold transition-all relative shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-white border-b-2 border-[#FF5500]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF5500]' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* 3. TAB 1: OVERVIEW & CREDENTIALS                          */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Bio & Community Presence */}
            <div className="md:col-span-2 space-y-6">
              {/* About Me Card */}
              <div className="p-6 rounded-3xl bg-[#121215] border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FF5500]" />
                  <span>About & Community Bio</span>
                </h3>
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-line">
                  {bio ||
                    'No community bio provided yet. Click "Edit Profile & Branding" to write a short introduction about the events you love or host.'}
                </p>
                {!bio && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="text-xs font-bold text-[#FF5500] hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>+ Add bio now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Host Brand Identity Card */}
              <div className="p-6 rounded-3xl bg-[#121215] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF8C42]" />
                    <span>Host Identity & Custom Branding</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="text-xs font-bold text-neutral-400 hover:text-white"
                  >
                    Customize
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[11px] font-semibold text-neutral-400">Accent Color</span>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl shadow-md border border-white/20"
                        style={{ backgroundColor: brandColor }}
                      />
                      <span className="text-xs font-mono font-bold text-white uppercase">{brandColor}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-[11px] font-semibold text-neutral-400">Typography Preset</span>
                    <div className="text-sm font-bold text-white">{brandFont}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-neutral-400">Public Organizer Page</span>
                    <p className="text-xs font-mono text-[#FF5500] font-bold mt-0.5">
                      vibe.swaniki.com/@{handle || 'user'}
                    </p>
                  </div>
                  <Link
                    href={`/@${handle || 'user'}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Col: Verified Contact & Credentials Card */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#121215] border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Account Credentials</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-neutral-400">Account Status</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-neutral-400">Primary Email</span>
                    <span className="font-mono text-white/90 truncate max-w-[140px]">{effectiveEmail}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-neutral-400">Phone / WhatsApp</span>
                    <span className="font-mono text-white/90">{phone || 'Not linked'}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-neutral-400">Membership Tier</span>
                    <span className="font-bold text-[#FF5500]">{roleBadge.label}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#FF5500]" />
                    <span>Open Host Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. TAB 2: MY PASSES & WALLET                              */}
        {/* ========================================================= */}
        {activeTab === 'passes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#FF5500]" />
                  <span>Your Verified Admission Passes</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Dynamic QR passes and admission credentials for confirmed event bookings.
                </p>
              </div>

              <Link
                href="/passes"
                className="text-xs font-bold text-[#FF5500] hover:underline flex items-center gap-1"
              >
                <span>Full Passbook</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {userPasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPasses.map(({ rsvp, event }) => {
                  const serial = rsvp.pass_serial || getPassSerialNumber(rsvp, event);
                  const isCheckedIn = Boolean((rsvp as any).checked_in || (rsvp.status as string) === 'checked_in');
                  return (
                    <div
                      key={rsvp.id}
                      className="rounded-2xl bg-[#121215] border border-white/10 overflow-hidden hover:border-white/20 transition flex flex-col justify-between shadow-lg"
                    >
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#FF5500] uppercase tracking-wider">
                            {event.category || 'Vibe Meetup'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isCheckedIn
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {isCheckedIn ? 'Checked In' : 'Confirmed'}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white line-clamp-1">{event.title}</h4>

                        <div className="space-y-1.5 text-xs text-neutral-400 font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                            <span>
                              {event.start_at
                                ? new Date(event.start_at).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                  })
                                : 'Upcoming'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                            <span className="line-clamp-1">{event.location_name || event.city}</span>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-neutral-400 font-mono">Serial:</span>
                          <span className="text-xs font-mono font-bold text-white">{serial}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white/[0.02] border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setSelectedPass({ rsvp, event })}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E04B00] hover:brightness-110 active:scale-95 text-xs font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>View Entry QR Pass</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl bg-[#121215] border border-white/10 p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">No Active Passes Yet</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                    Book an instant pass on Vibe or RSVP to a community meetup to see your verified digital pass here.
                  </p>
                </div>
                <Link
                  href="/vibes"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF5500] text-xs font-bold text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,85,0,0.35)]"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Browse Instant Vibes</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. TAB 3: HOSTED VIBES & EVENTS                           */}
        {/* ========================================================= */}
        {activeTab === 'vibes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#FF8C42]" />
                  <span>Vibes Hosted by You</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Manage your gatherings, attendee check-ins, and guest lists.
                </p>
              </div>

              <Link
                href="/create"
                className="px-3.5 py-1.5 rounded-xl bg-[#FF5500] text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Host New Vibe</span>
              </Link>
            </div>

            {hostedVibes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hostedVibes.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl bg-[#121215] border border-white/10 overflow-hidden hover:border-white/20 transition flex flex-col justify-between shadow-lg"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-neutral-900">
                      <Image
                        src={
                          event.cover_image_url ||
                          'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80'
                        }
                        alt={event.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-black/30" />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase">
                          {event.status || 'live'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2 flex-1">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{event.title}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-2">
                        {event.description || 'Community gathering on Vibe.'}
                      </p>
                    </div>

                    <div className="p-3 bg-white/[0.02] border-t border-white/10 flex items-center gap-2">
                      <Link
                        href={`/${event.slug || event.id}`}
                        target="_blank"
                        className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white text-center transition"
                      >
                        Public Page
                      </Link>
                      <Link
                        href="/organizer/check-in"
                        className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold transition flex items-center gap-1"
                        title="Scan & check in attendees"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Check-In</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-[#121215] border border-white/10 p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
                  <Zap className="w-6 h-6 text-[#FF8C42]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">You haven't hosted any vibes yet</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                    Bring people together for a turf match, founders coffee, acoustic session, or board game night.
                  </p>
                </div>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF5500] to-[#E04B00] text-xs font-bold text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,85,0,0.35)]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Host your first vibe</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. TAB 4: LIKED VIBES                                     */}
        {/* ========================================================= */}
        {activeTab === 'liked' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-current" />
                <span>Your Saved & Liked Vibes</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Vibes you've cheered on Vibe Instant.
              </p>
            </div>

            {likedVibes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {likedVibes.map((vibe) => (
                  <div
                    key={vibe.id || vibe.slug}
                    className="rounded-2xl bg-[#121215] border border-white/10 overflow-hidden hover:border-white/20 transition flex flex-col justify-between shadow-lg"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-neutral-900">
                      <Image
                        src={vibe.cover_image_url}
                        alt={vibe.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-black/30" />
                      <div className="absolute top-3 right-3">
                        <span className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-rose-400">
                          <Heart className="w-4 h-4 fill-current" />
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-bold text-white line-clamp-1">{vibe.title}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-2">
                        {vibe.description}
                      </p>
                    </div>

                    <div className="p-3 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-neutral-400">{vibe.location_name || vibe.city}</span>
                      <Link
                        href={`/vibes?event=${vibe.slug || vibe.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-xs font-bold text-white transition"
                      >
                        Open Vibe
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-[#121215] border border-white/10 p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-rose-400">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">No liked vibes yet</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                    Tap the flame icon while browsing vibes on Vibe Instant to save them to your profile favorites.
                  </p>
                </div>
                <Link
                  href="/vibes"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF5500] text-xs font-bold text-white hover:brightness-110 shadow-[0_0_15px_rgba(255,85,0,0.35)]"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Discover Vibes</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. TAB 5: EDIT PROFILE & BRANDING                         */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Details */}
              <div className="p-6 rounded-3xl bg-[#121215] border border-white/10 space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#FF5500]" />
                  <span>Public Identity & Details</span>
                </h3>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Full Name / Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name or organization"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#FF5500] transition"
                  />
                </div>

                {/* Handle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Unique Handle</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-mono">
                      @
                    </span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="handle"
                      required
                      className="w-full pl-8 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#FF5500] transition"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Public URL: vibe.swaniki.com/@{handle || 'handle'}
                  </p>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Bio & Tagline</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="Tell the community what kind of vibes you create or love attending..."
                    className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#FF5500] transition resize-none"
                  />
                  <div className="flex justify-end text-[10px] text-neutral-500">
                    {bio.length}/300
                  </div>
                </div>

                {/* Phone & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">WhatsApp / Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-[#FF5500] transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300">Home City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#141418] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#FF5500] transition"
                    >
                      {Object.values(INDIAN_CITIES).map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Host Branding & Presets */}
              <div className="p-6 rounded-3xl bg-[#121215] border border-white/10 space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF8C42]" />
                  <span>Host Branding & Profile Avatar</span>
                </h3>

                {/* Avatar Presets Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-300">Choose Curated Photo or Upload</label>
                  <div className="flex flex-wrap gap-2.5">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition cursor-pointer relative ${
                          avatarUrl === preset ? 'border-[#FF5500] scale-105' : 'border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image src={preset} alt="preset" fill unoptimized className="object-cover" />
                      </button>
                    ))}

                    <label
                      htmlFor="avatar-upload-input"
                      className="w-12 h-12 rounded-2xl border-2 border-dashed border-white/20 hover:border-[#FF5500] transition flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
                      title="Upload custom image"
                    >
                      <Upload className="w-4 h-4" />
                    </label>
                    <input
                      id="avatar-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Brand Color Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-300">Accent Brand Color</label>
                  <div className="flex flex-wrap gap-2.5">
                    {BRAND_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setBrandColor(col.hex)}
                        className={`w-9 h-9 rounded-xl transition cursor-pointer relative flex items-center justify-center border ${
                          brandColor.toLowerCase() === col.hex.toLowerCase()
                            ? 'border-white scale-110 shadow-lg'
                            : 'border-white/10 hover:scale-105'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      >
                        {brandColor.toLowerCase() === col.hex.toLowerCase() && (
                          <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand Font Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-neutral-300">Brand Typography</label>
                  <div className="space-y-2">
                    {BRAND_FONTS.map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setBrandFont(font.id)}
                        className={`w-full p-3 rounded-2xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          brandFont === font.id
                            ? 'bg-[#FF5500]/15 border-[#FF5500] text-[#FF5500]'
                            : 'bg-white/[0.02] border-white/10 text-neutral-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <span>{font.label}</span>
                        {brandFont === font.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications Toggles */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#FF5500]" />
                    <span>Notification Channels</span>
                  </span>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white">WhatsApp Updates</span>
                      <p className="text-[11px] text-neutral-400">Receive verified pass QR codes on WhatsApp</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={whatsappNotify}
                      onChange={(e) => setWhatsappNotify(e.target.checked)}
                      className="accent-[#FF5500] w-4 h-4 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white">Email Digest & Pass Sync</span>
                      <p className="text-[11px] text-neutral-400">Calendar invitations and ticket pass backup</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNotify}
                      onChange={(e) => setEmailNotify(e.target.checked)}
                      className="accent-[#FF5500] w-4 h-4 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E04B00] hover:brightness-110 active:scale-95 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,85,0,0.4)] transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Digital Pass QR Modal */}
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

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0C]" />}>
      <ProfileContent />
    </Suspense>
  );
}
