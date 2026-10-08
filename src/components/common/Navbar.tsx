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
  Music,
  Smile,
  Laptop,
  GraduationCap,
  Users,
  Utensils,
  Zap,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, setLocalAuthSession, AuthProfile, getInitials, isSyntheticAvatar } from '@/lib/auth';
import { syncEventsWithSupabase, getRSVPs } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';
import LocationModal from '@/components/location/LocationModal';
import AuthModal from '@/components/auth/AuthModal';
import { getUserCity, INDIAN_CITIES } from '@/lib/location';
import BrandLogo from '@/components/common/BrandLogo';
import Magnetic from '@/components/common/MagneticButton';
import ThemeToggle from '@/components/common/ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoggedIn, isStaff, signOut } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [activeCity, setActiveCity] = useState<string>('All India');
  const [confirmedPassCount, setConfirmedPassCount] = useState(0);
  const [imageError, setImageError] = useState(false);

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

    // Calculate user's active confirmed passes count for webapp badge
    const updatePasses = () => {
      try {
        const userEmail =
          profile?.email ||
          (typeof window !== 'undefined' ? localStorage.getItem('vibe_guest_email') : null);
        if (!userEmail) {
          setConfirmedPassCount(0);
          return;
        }
        const passes = getRSVPs();
        const target = userEmail.toLowerCase().trim();
        const active = passes.filter(
          (p) => p.status === 'confirmed' && (p.email || '').toLowerCase().trim() === target
        ).length;
        setConfirmedPassCount(active);
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
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 shadow-lg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-6 relative">
            {/* Left: Brand Logo + Location Selector */}
            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
              <BrandLogo />

              {/* Location Selector (Matching reference image: Orange Pin + City dropdown) */}
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer text-left group"
                title="Change city location"
              >
                <div className="w-6 h-6 rounded-full bg-[#FF5500]/15 text-[#FF5500] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5500]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white transition-colors max-w-[90px] sm:max-w-[130px] truncate">
                    {activeCity}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors shrink-0" />
                </div>
              </button>
            </div>

            {/* Center: The Three Core Features matching reference image: Discover, Vibe Instant, Host dashboard */}
            <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 lg:gap-2">
              {/* Feature 1: Discover (Active state with orange underline like image) */}
              <Link
                href="/"
                className={`relative px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-all flex items-center gap-1.5 text-center cursor-pointer ${
                  pathname === '/' || pathname.startsWith('/discover')
                    ? 'text-white font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Compass className={`w-3.5 h-3.5 ${pathname === '/' || pathname.startsWith('/discover') ? 'text-[#FF5500]' : 'text-white/40'}`} />
                <span>Discover</span>
                {(pathname === '/' || pathname.startsWith('/discover')) && (
                  <span className="absolute -bottom-2.5 left-3 right-3 h-[2px] bg-[#FF5500] rounded-full shadow-[0_0_8px_#FF5500]" />
                )}
              </Link>

              {/* Feature 2: Vibe Instant */}
              <Link
                href="/vibes"
                className={`relative px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-all inline-flex items-center gap-1.5 text-center cursor-pointer ${
                  pathname.startsWith('/vibes') || pathname.startsWith('/vibe')
                    ? 'text-white font-bold'
                    : 'text-white/60 hover:text-[#FF5500] hover:bg-white/5'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-[#FF5500] text-[#FF5500] animate-buzz shrink-0" />
                <span>Vibe Instant</span>
                {(pathname.startsWith('/vibes') || pathname.startsWith('/vibe')) && (
                  <span className="absolute -bottom-2.5 left-3 right-3 h-[2px] bg-[#FF5500] rounded-full shadow-[0_0_8px_#FF5500]" />
                )}
              </Link>

              {/* Feature 3: Host dashboard */}
              <Link
                href="/dashboard"
                className={`relative px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-all inline-flex items-center gap-1.5 text-center cursor-pointer ${
                  pathname.startsWith('/dashboard')
                    ? 'text-white font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                title="Host dashboard"
              >
                <LayoutDashboard className={`w-3.5 h-3.5 ${pathname.startsWith('/dashboard') ? 'text-[#FF5500]' : 'text-white/40'}`} />
                <span>Host dashboard</span>
                {pathname.startsWith('/dashboard') && (
                  <span className="absolute -bottom-2.5 left-3 right-3 h-[2px] bg-[#FF5500] rounded-full shadow-[0_0_8px_#FF5500]" />
                )}
              </Link>
            </nav>

            {/* Right: Passes Icon + Primary CTA "+ Host an event" + Search & Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Passes shortcut icon */}
              <Link
                href="/passes"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white relative"
                title="My Passes & Bookings"
              >
                <Ticket className="w-4 h-4" />
                {confirmedPassCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF5500] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {confirmedPassCount}
                  </span>
                )}
              </Link>

              {/* Dark and Light Mode Theme Toggle */}
              <ThemeToggle />

              {/* Primary Action Button: + Host an event (Matching reference image with Magnetic Pull) */}
              <Magnetic pullFactor={0.35}>
                <Link
                  href="/create"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(255,85,0,0.35)] transition-all cursor-pointer hover:scale-[1.03] active:scale-95"
                  title="Host an event"
                >
                  <Plus className="w-4 h-4 stroke-[2.8]" />
                  <span>Host an event</span>
                </Link>
              </Magnetic>

              {/* User Auth Profile (Hi, Guest / Hi, Name) */}
              {mounted && isLoggedIn && profile ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-colors cursor-pointer flex items-center justify-center overflow-hidden"
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
                      <div className="w-full h-full bg-[#FF5500] text-white flex items-center justify-center text-xs font-bold tracking-tight">
                        {getInitials(profile.name, profile.email)}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu (Dark theme) */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#111114] border border-white/15 shadow-2xl py-2 z-50 text-white animate-in fade-in zoom-in-95 backdrop-blur-md">
                      <div className="px-4 py-2.5 border-b border-white/10">
                        <p className="text-xs font-bold text-white truncate">{profile.name}</p>
                        <p className="text-[11px] text-white/50 truncate">{profile.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/passes"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/90 hover:bg-white/10 transition-colors font-medium"
                        >
                          <Ticket className="w-4 h-4 text-[#FF5500]" />
                          <div className="flex items-center justify-between w-full">
                            <span>My Passes & Bookings</span>
                            {confirmedPassCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30">
                                {confirmedPassCount}
                              </span>
                            )}
                          </div>
                        </Link>

                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/90 hover:bg-white/10 transition-colors font-medium"
                        >
                          <LayoutDashboard className="w-4 h-4 text-white/60" />
                          <span>Host Dashboard</span>
                        </Link>

                        <Link
                          href="/create"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-white/90 hover:bg-white/10 transition-colors font-medium"
                        >
                          <Plus className="w-4 h-4 text-[#FF5500]" />
                          <span>Create New Event</span>
                        </Link>

                        {isStaff && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#FF5500] hover:bg-white/10 transition-colors font-bold border-t border-white/10"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#FF5500]" />
                            <span>Admin Workstation</span>
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            signOut();
                          }}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 w-full transition-colors font-medium cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
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
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Sign In"
                >
                  <User className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile WebApp Fixed Bottom Navigation Bar (Dark Styled) */}
      <nav
        aria-label="Mobile Web App Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-white/10 px-3 py-1.5 flex items-center justify-around shadow-2xl pb-[max(env(safe-area-inset-bottom),0.5rem)] text-white"
      >
        {/* 1. Discover Tab */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            pathname === '/' ? 'text-[#FF5500] font-black' : 'text-white/60 hover:text-white'
          }`}
        >
          <Compass className={`w-5 h-5 ${pathname === '/' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] tracking-tight">Discover</span>
        </Link>

        {/* 2. ⚡ Vibe Instant Tab */}
        <Link
          href="/vibes"
          className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            pathname.startsWith('/vibes') || pathname.startsWith('/vibe')
              ? 'text-[#FF5500] font-black'
              : 'text-white/60 hover:text-[#FF5500]'
          }`}
        >
          <div className="relative">
            <Zap className={`w-5 h-5 ${pathname.startsWith('/vibes') ? 'fill-[#FF5500]' : ''}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF5500] animate-ping" />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Instant</span>
        </Link>

        {/* 3. Floating Center + Host Button */}
        <Link
          href="/create"
          className="flex flex-col items-center -mt-4 group"
          title="Host an event"
        >
          <div className="w-11 h-11 rounded-full bg-[#FF5500] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border-2 border-[#0A0A0A]">
            <Plus className="w-5 h-5 stroke-[3]" />
          </div>
          <span className="text-[10px] font-bold text-white mt-0.5">+ Host</span>
        </Link>

        {/* 4. Host Dashboard Tab */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            pathname.startsWith('/dashboard') ? 'text-[#FF5500] font-bold' : 'text-white/60 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </Link>

        {/* 5. Passes Tab */}
        <Link
          href="/passes"
          className={`relative flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            pathname.startsWith('/passes') || pathname.startsWith('/guest')
              ? 'text-[#FF5500] font-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="relative">
            <Ticket className={`w-5 h-5 ${pathname.startsWith('/passes') ? 'text-[#FF5500]' : ''}`} />
            {confirmedPassCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#FF5500] text-white text-[9px] font-bold flex items-center justify-center">
                {confirmedPassCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Passes</span>
        </Link>
      </nav>

      {/* Modals */}
      <LocationModal isOpen={locationModalOpen} onClose={() => setLocationModalOpen(false)} />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </>
  );
}
