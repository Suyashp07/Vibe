'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  ChevronDown,
  Plus,
  Ticket,
  Compass,
  Calendar,
  CalendarDays,
  CalendarPlus,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  Layers,
  Bot,
  Music,
  Smile,
  Laptop,
  GraduationCap,
  Users,
  Utensils,
  Zap,
  X,
  Download,
  MessageCircle,
  Send,
  ArrowUpRight,
  Sun,
  Moon
} from 'lucide-react';
import { triggerPWAInstall } from '@/components/pwa/PWARegister';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, setLocalAuthSession, AuthProfile, getInitials, isSyntheticAvatar } from '@/lib/auth';
import { syncEventsWithSupabase, getRSVPs, getUserConfirmedPasses } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';
import LocationModal from '@/components/location/LocationModal';
import AuthModal from '@/components/auth/AuthModal';
import { getUserCity, INDIAN_CITIES } from '@/lib/location';
import BrandLogo from '@/components/common/BrandLogo';
import Magnetic from '@/components/common/MagneticButton';
import ThemeToggle from '@/components/common/ThemeToggle';
import { useTheme } from '@/components/common/ThemeContext';
import { ADMIN_BASE_PATH } from '@/lib/adminConstants';
import { useMobileGestures } from '@/hooks/useMobileGestures';

interface NavbarProps {
  bottomNavOnly?: boolean;
  hideTopOnMobile?: boolean;
}

export default function Navbar({ bottomNavOnly = false, hideTopOnMobile = false }: NavbarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoggedIn, isStaff, signOut } = useAuth();
  const { theme } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isLight = !mounted || theme === 'light';
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [activeCity, setActiveCity] = useState<string>('All India');
  const [confirmedPassCount, setConfirmedPassCount] = useState(0);
  const [imageError, setImageError] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);
  const { gestureFeedback } = useMobileGestures({
    navRef,
    enableGlobalSwipe: false, // Never intercept vertical content scrolling on page
  });

  useEffect(() => {
    setImageError(false);
  }, [profile?.avatar_url]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Derive region / state for District-style location display
  const activeState = React.useMemo(() => {
    const normalized = activeCity.toLowerCase().trim();
    if (INDIAN_CITIES[normalized]?.state) {
      return INDIAN_CITIES[normalized].state;
    }
    const found = Object.values(INDIAN_CITIES).find(
      (c) => c.name.toLowerCase() === normalized || normalized.includes(c.name.toLowerCase())
    );
    if (found?.state) return found.state;
    return activeCity === 'All India' ? 'India' : 'Maharashtra';
  }, [activeCity]);

  useEffect(() => {
    setMounted(true);
    const city = getUserCity() || 'All India';
    setActiveCity(city);

    // Calculate user's active confirmed passes count strictly from real user stat
    const updatePasses = async () => {
      try {
        const userEmail = (
          profile?.email ||
          (typeof window !== 'undefined'
            ? localStorage.getItem('vibe_guest_email') ||
              localStorage.getItem('vibe_user_email') ||
              ''
            : '')
        ).trim().toLowerCase();
        if (!userEmail) {
          setConfirmedPassCount(0);
          return;
        }

        // 1. Initial compute from deduplicated local cache
        const localPasses = getUserConfirmedPasses(userEmail);
        setConfirmedPassCount(localPasses.length);

        // 2. Fetch fresh real stats from Supabase API
        const res = await fetch(`/api/rsvps/list?email=${encodeURIComponent(userEmail)}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.rsvps && Array.isArray(data.rsvps)) {
            const now = Date.now();
            const seenEvents = new Set<string>();
            const realCount = data.rsvps.filter((r: any) => {
              if (r.status !== 'confirmed') return false;
              // Exclude expired past events to strictly match the digital wallet active passes
              if (r.events?.start_at) {
                const startTime = new Date(r.events.start_at).getTime();
                if (!isNaN(startTime) && startTime < now) return false;
              }
              const eventKey = r.event_id || r.event_slug;
              if (eventKey) {
                if (seenEvents.has(eventKey)) return false;
                seenEvents.add(eventKey);
              }
              return true;
            }).length;
            setConfirmedPassCount(realCount);
          }
        }
      } catch {
        setConfirmedPassCount(0);
      }
    };

    updatePasses();

    const handleCityChange = () => {
      setActiveCity(getUserCity() || 'All India');
    };

    const handleOpenLocationModal = () => {
      setLocationModalOpen(true);
    };

    const handlePassesUpdated = () => {
      updatePasses();
    };

    window.addEventListener('vibe:location_changed', handleCityChange);
    window.addEventListener('vibe:open_location_modal', handleOpenLocationModal);
    window.addEventListener('vibe:rsvp_updated', handlePassesUpdated);
    window.addEventListener('storage', handlePassesUpdated);
    return () => {
      window.removeEventListener('vibe:location_changed', handleCityChange);
      window.removeEventListener('vibe:open_location_modal', handleOpenLocationModal);
      window.removeEventListener('vibe:rsvp_updated', handlePassesUpdated);
      window.removeEventListener('storage', handlePassesUpdated);
    };
  }, [profile?.email]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-close auth modal if user is logged in
  useEffect(() => {
    if (isLoggedIn && authModalOpen) {
      setAuthModalOpen(false);
    }
  }, [isLoggedIn, authModalOpen]);



  const isNavActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Guest';



  return (
    <>
      {!bottomNavOnly && (
        <header className={`sticky top-0 z-40 bg-white/95 dark:bg-[#081426]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 shadow-xs text-slate-900 dark:text-white transition-colors ${
          hideTopOnMobile ? 'hidden md:block' : ''
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-4 relative">
            {/* Left: Brand Logo (Vibe. by Swaniki) */}
            <div className="flex items-center shrink-0">
              <BrandLogo />
            </div>

            {/* Center: Refined Capsule Navigation (Discover •, Instant ⚡, Bot, Dashboard) */}
            <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 lg:gap-7 px-5 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-[#EDF2F7]/70 dark:bg-white/[0.05] backdrop-blur-md shadow-xs">
              {/* Feature 1: Discover */}
              <Link
                href="/"
                className={`relative py-1 text-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                  pathname === '/' || pathname.startsWith('/discover')
                    ? 'text-slate-950 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white font-medium'
                }`}
              >
                <span>Discover</span>
                {(pathname === '/' || pathname.startsWith('/discover')) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0066F5] dark:bg-[#08B9F5] inline-block shrink-0" />
                )}
              </Link>

              {/* Feature 2: Instant ⚡ */}
              <Link
                id="vt-instant"
                href="/vibes"
                className={`relative py-1 text-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                  pathname.startsWith('/vibes') || pathname.startsWith('/vibe')
                    ? 'text-slate-950 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white font-medium'
                }`}
              >
                <span>Instant</span>
                <Zap className="w-3.5 h-3.5 fill-[#FF8442] text-[#FF8442] shrink-0" />
              </Link>

              {/* Feature 3: Bot */}
              <Link
                id="vt-bot"
                href="/bot"
                className={`relative py-1 text-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                  pathname.startsWith('/bot')
                    ? 'text-slate-950 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white font-medium'
                }`}
              >
                <span>Bot</span>
                {pathname.startsWith('/bot') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0066F5] dark:bg-[#08B9F5] inline-block shrink-0" />
                )}
              </Link>

              {/* Feature 4: Dashboard */}
              <Link
                href="/dashboard"
                className={`relative py-1 text-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                  pathname.startsWith('/dashboard')
                    ? 'text-slate-950 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white font-medium'
                }`}
                title="Dashboard"
              >
                <span>Dashboard</span>
                {pathname.startsWith('/dashboard') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0066F5] dark:bg-[#08B9F5] inline-block shrink-0" />
                )}
              </Link>
            </nav>

            {/* Right: Actions (Location, Download icon, + Host, Profile) */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Mobile Standalone Blue Location Pin */}
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#0066F5] dark:text-[#08B9F5] hover:bg-blue-50 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                title={`Current city: ${activeCity} - Tap to change`}
                aria-label={`Change location (${activeCity})`}
              >
                <MapPin className="w-5 h-5 stroke-[2] text-[#0066F5] dark:text-[#08B9F5]" />
              </button>

              {/* Mobile Top Bot Button (replaces black '+' button) */}
              <Link
                id="vt-bot-mobile"
                href="/bot"
                className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50/80 dark:bg-white/10 text-[#0066F5] dark:text-[#08B9F5] hover:bg-blue-100 dark:hover:bg-white/15 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0 border border-blue-100 dark:border-white/10"
                title="Create with Bot"
                aria-label="Create with Bot"
              >
                <Bot className="w-5 h-5 stroke-[2]" />
              </Link>

              {/* Desktop Location Selector (Right side, matching screenshot) */}
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-slate-700 dark:text-neutral-300 hover:text-[#0066F5] dark:hover:text-[#08B9F5] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer text-left group"
                title="Change location"
              >
                <MapPin className="w-4 h-4 text-[#0066F5] dark:text-[#08B9F5] shrink-0" />
                <span className="text-xs sm:text-sm font-medium max-w-[120px] truncate">
                  {activeCity === 'All India' ? 'India' : activeCity}
                </span>
              </button>

              {/* Desktop Download App Icon Button */}
              <button
                type="button"
                onClick={() => triggerPWAInstall()}
                className="vibe-download-btn hidden md:inline-flex w-9 h-9 sm:w-10 sm:h-10 rounded-full items-center justify-center text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                title="Download App"
                aria-label="Download App"
              >
                <Download className="w-4 h-4 stroke-[2.2] shrink-0 text-slate-700 dark:text-neutral-200" />
              </button>

              {/* Desktop Full + Host Button */}
              <Magnetic pullFactor={0.35}>
                <Link
                  id="vt-host"
                  href="/create"
                  className="vibe-host-btn hidden md:inline-flex items-center gap-1.5 px-4 sm:px-4.5 py-1.5 sm:py-2 rounded-full bg-[#0066F5] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shrink-0"
                  style={{ color: '#FFFFFF', backgroundColor: '#0066F5' }}
                  title="Host an event"
                >
                  <Plus className="w-4 h-4 stroke-[2.8] shrink-0 text-white" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                  <span className="font-bold text-white" style={{ color: '#FFFFFF' }}>Host</span>
                </Link>
              </Magnetic>

              {/* User Auth Profile (Hi, Guest / Hi, Name) */}
              {mounted && isLoggedIn && profile ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-colors cursor-pointer flex items-center justify-center overflow-hidden ${
                      isLight
                        ? 'border border-black/10 bg-black/5 hover:bg-black/10'
                        : 'border border-white/20 bg-white/10 hover:bg-white/20'
                    }`}
                    title={profile.name}
                  >
                    {profile.avatar_url && !imageError && !isSyntheticAvatar(profile.avatar_url) ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.name || 'User Profile'}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#08B9F5] text-black font-extrabold flex items-center justify-center text-xs tracking-tight">
                        {getInitials(profile.name, profile.email)}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu matching target UI */}
                  {dropdownOpen && (
                    <div className={`absolute right-0 mt-2 w-72 rounded-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl transition-colors ${
                      isLight
                        ? 'bg-white border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.12)] text-slate-900'
                        : 'bg-[#111113] border border-white/10 shadow-2xl text-white'
                    }`}>
                      {/* Top Header: Avatar + Name + Email */}
                      <div className="flex items-center gap-3 px-1 py-1 mb-2">
                        <div className="w-11 h-11 rounded-full bg-[#08B9F5] text-black font-extrabold flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-sm">
                          {profile.avatar_url && !imageError && !isSyntheticAvatar(profile.avatar_url) ? (
                            <Image
                              src={profile.avatar_url}
                              alt={profile.name || 'User Profile'}
                              width={44}
                              height={44}
                              className="object-cover w-full h-full"
                              onError={() => setImageError(true)}
                            />
                          ) : (
                            getInitials(profile.name, profile.email)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold truncate leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {profile.name}
                          </p>
                          {profile.email && (
                            <p className={`text-xs truncate leading-tight mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                              {profile.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Main Navigation Items */}
                      <div className="space-y-0.5 py-1">
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors text-sm font-medium cursor-pointer ${
                            isLight
                              ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                              : 'text-neutral-200 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          <User className={`w-4 h-4 stroke-[1.8] ${isLight ? 'text-slate-500' : 'text-neutral-300'}`} />
                          <span>My profile &amp; brand</span>
                        </Link>

                        <Link
                          href="/passes"
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-xl transition-colors text-sm font-medium cursor-pointer ${
                            isLight
                              ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                              : 'text-neutral-200 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Ticket className={`w-4 h-4 stroke-[1.8] ${isLight ? 'text-slate-500' : 'text-neutral-300'}`} />
                            <span>Passes &amp; bookings</span>
                          </div>
                          {confirmedPassCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-[#08B9F5] text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                              {confirmedPassCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors text-sm font-medium cursor-pointer ${
                            isLight
                              ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                              : 'text-neutral-200 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          <LayoutDashboard className={`w-4 h-4 stroke-[1.8] ${isLight ? 'text-slate-500' : 'text-neutral-300'}`} />
                          <span>Host dashboard</span>
                        </Link>

                        <Link
                          href="/create"
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors text-sm font-medium cursor-pointer ${
                            isLight
                              ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                              : 'text-neutral-200 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          <Plus className={`w-4 h-4 stroke-[2] ${isLight ? 'text-slate-500' : 'text-neutral-300'}`} />
                          <span>Create new event</span>
                        </Link>

                        {isStaff && (
                          <Link
                            href={ADMIN_BASE_PATH}
                            onClick={() => setDropdownOpen(false)}
                            className={`flex items-center gap-3 px-2.5 py-2 rounded-xl text-[#08B9F5] transition-colors text-sm font-medium cursor-pointer ${
                              isLight ? 'hover:bg-sky-50' : 'hover:bg-white/[0.06]'
                            }`}
                          >
                            <ShieldCheck className="w-4 h-4 text-[#08B9F5] stroke-[1.8]" />
                            <span>Admin workstation</span>
                          </Link>
                        )}
                      </div>

                      {/* FIND EVENTS IN CHAT Section */}
                      <div className="pt-3 pb-2 px-1">
                        <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${isLight ? 'text-slate-400' : 'text-neutral-400'}`}>
                          FIND EVENTS IN CHAT
                        </p>
                      </div>

                      {/* Side-by-side WhatsApp & Telegram buttons */}
                      <div className="grid grid-cols-2 gap-2 px-0.5 pb-2">
                        <a
                          href={`https://wa.me/919183123093?text=${encodeURIComponent('Vibe/Events')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-xs font-semibold group cursor-pointer ${
                            isLight
                              ? 'border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-950 shadow-xs'
                              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 text-white'
                          }`}
                          title="Open WhatsApp Bot"
                        >
                          <div className="flex items-center gap-2">
                            <MessageCircle className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-[#08B9F5]'} group-hover:scale-110 transition-transform`} />
                            <span className={isLight ? 'text-emerald-950 font-bold' : 'text-white'}>
                              WhatsApp
                            </span>
                          </div>
                          <ArrowUpRight className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-[#08B9F5]'} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`} />
                        </a>

                        <a
                          href="https://t.me/VibeCurator_bot?start=Vibe_Events"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-xs font-semibold group cursor-pointer ${
                            isLight
                              ? 'border-sky-200 bg-sky-50/80 hover:bg-sky-100 hover:border-sky-300 text-sky-950 shadow-xs'
                              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 text-white'
                          }`}
                          title="Open Telegram Bot"
                        >
                          <div className="flex items-center gap-2">
                            <Send className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-[#08B9F5]'} group-hover:scale-110 transition-transform`} />
                            <span className={isLight ? 'text-sky-950 font-bold' : 'text-white'}>
                              Telegram
                            </span>
                          </div>
                          <ArrowUpRight className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-[#08B9F5]'} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform`} />
                        </a>
                      </div>

                      {/* Theme Toggle in profile menu */}
                      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.08] px-1 pb-1">
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-neutral-300">
                          <span className="flex items-center gap-2">
                            <Sun className="w-3.5 h-3.5 text-amber-500 dark:hidden" />
                            <Moon className="w-3.5 h-3.5 text-sky-400 hidden dark:block" />
                            <span>Theme Mode</span>
                          </span>
                          <ThemeToggle />
                        </div>
                      </div>

                      {/* Sign out */}
                      <div className={`pt-2 border-t px-0.5 ${isLight ? 'border-slate-100' : 'border-white/[0.08]'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            signOut();
                          }}
                          className={`flex items-center gap-3 px-2.5 py-2 text-sm rounded-xl w-full transition-colors font-medium cursor-pointer ${
                            isLight
                              ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          <LogOut className={`w-4 h-4 stroke-[1.8] ${isLight ? 'text-slate-400 group-hover:text-rose-500' : 'text-neutral-400'}`} />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('signin');
                    setAuthModalOpen(true);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs active:scale-95" 
                  title="Sign In"
                  aria-label="Sign In or View Profile"
                >
                  <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2] text-slate-700 dark:text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      )}

      {/* Floating Gesture Navigation HUD Feedback */}
      <AnimatePresence>
        {gestureFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`md:hidden fixed bottom-18 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-1.5 rounded-full backdrop-blur-xl border text-xs font-bold flex items-center gap-2 ${
              isLight
                ? 'bg-white/95 border-black/15 text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.12)]'
                : 'bg-black/90 border-white/20 text-white shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#08B9F5] animate-pulse" />
            <span className="tracking-tight">{gestureFeedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile WebApp Fixed Bottom Navigation Bar (Theme Adaptive with Swipe Gestures) */}
      <nav
        ref={navRef}
        aria-label="Mobile Web App Navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md px-3 py-1.5 flex items-center justify-around pb-[max(env(safe-area-inset-bottom),0.5rem)] select-none touch-manipulation transition-colors duration-200 ${
          isLight
            ? 'bg-white/95 border-t border-black/10 text-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]'
            : 'bg-[#0A0A0A]/95 border-t border-white/10 text-white shadow-2xl'
        }`}
      >
        {/* 1. Discover Tab */}
        <Link
          href="/"
          className={`relative flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
            (pathname === '/' || pathname.startsWith('/discover'))
              ? 'text-[#08B9F5] font-black nav-active'
              : isLight
              ? 'text-slate-500 hover:text-slate-900'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Compass className={`w-5 h-5 ${pathname === '/' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] tracking-tight mobile-nav-label">Discover</span>
          {(pathname === '/' || pathname.startsWith('/discover')) && (
            <motion.span
              layoutId="mobile-nav-pill"
              className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-[#08B9F5] shadow-[0_0_8px_rgba(8,185,245,0.9)]"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
        </Link>

        {/* 2. ⚡ Vibe Instant Tab */}
        <Link
          id="vt-instant-mobile"
          href="/vibes"
          className={`relative flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
            pathname.startsWith('/vibes') || pathname.startsWith('/vibe')
              ? 'text-[#08B9F5] font-black nav-active'
              : isLight
              ? 'text-slate-500 hover:text-[#08B9F5]'
              : 'text-white/60 hover:text-[#08B9F5]'
          }`}
        >
          <div className="relative">
            <Zap className={`w-5 h-5 ${pathname.startsWith('/vibes') || pathname.startsWith('/vibe') ? 'fill-[#08B9F5]' : ''}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#08B9F5] animate-ping" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mobile-nav-label">Instant</span>
          {(pathname.startsWith('/vibes') || pathname.startsWith('/vibe')) && (
            <motion.span
              layoutId="mobile-nav-pill"
              className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-[#08B9F5] shadow-[0_0_8px_rgba(8,185,245,0.9)]"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
        </Link>

        {/* 3. Floating Center + Host Button */}
        <Link
          id="vt-host-mobile"
          href="/create"
          className="relative flex flex-col items-center -mt-4 group"
          title="Host an event"
        >
          <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border-2 center-host-ring ${
            isLight
              ? 'border-white shadow-[0_4px_16px_rgba(8,185,245,0.35)]'
              : 'border-[#0A0A0A]'
          } ${
            pathname.startsWith('/create') ? 'bg-gradient-to-tr from-[#08B9F5] to-[#00D5E8] ring-2 ring-[#08B9F5]/50' : 'bg-[#08B9F5]'
          }`}>
            <Plus className="w-5 h-5 stroke-[3] text-white" />
          </div>
          <span className={`text-[10px] font-bold mt-0.5 center-host-label ${
            isLight ? 'text-slate-800' : 'text-white'
          }`}>+ Host</span>
          {pathname.startsWith('/create') && (
            <motion.span
              layoutId="mobile-nav-pill"
              className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-[#08B9F5] shadow-[0_0_8px_rgba(8,185,245,0.9)]"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
        </Link>


        {/* 4. Host Dashboard Tab */}
        <Link
          href="/dashboard"
          className={`relative flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
            pathname.startsWith('/dashboard')
              ? 'text-[#08B9F5] font-bold nav-active'
              : isLight
              ? 'text-slate-500 hover:text-slate-900'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mobile-nav-label">Dashboard</span>
          {pathname.startsWith('/dashboard') && (
            <motion.span
              layoutId="mobile-nav-pill"
              className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-[#08B9F5] shadow-[0_0_8px_rgba(8,185,245,0.9)]"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
        </Link>

        {/* 5. Passes Tab */}
        <Link
          href="/passes"
          className={`relative flex flex-col items-center gap-1 py-1 px-2.5 transition-colors ${
            pathname.startsWith('/passes') || pathname.startsWith('/guest')
              ? 'text-[#08B9F5] font-black nav-active'
              : isLight
              ? 'text-slate-500 hover:text-slate-900'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="relative">
            <Ticket className={`w-5 h-5 ${pathname.startsWith('/passes') || pathname.startsWith('/guest') ? 'text-[#08B9F5]' : ''}`} />
            {confirmedPassCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#08B9F5] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {confirmedPassCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mobile-nav-label">Passes</span>
          {(pathname.startsWith('/passes') || pathname.startsWith('/guest')) && (
            <motion.span
              layoutId="mobile-nav-pill"
              className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-[#08B9F5] shadow-[0_0_8px_rgba(8,185,245,0.9)]"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}
        </Link>
      </nav>

      {/* Modals */}
      <LocationModal isOpen={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
        redirectUrl={typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : pathname}
      />
    </>
  );
}
