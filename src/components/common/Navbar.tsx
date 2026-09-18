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
import { useAuth, setLocalAuthSession, AuthProfile } from '@/lib/auth';
import { syncEventsWithSupabase, getRSVPs } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';
import LocationModal from '@/components/location/LocationModal';
import AuthModal from '@/components/auth/AuthModal';
import { getUserCity, INDIAN_CITIES } from '@/lib/location';
import BrandLogo from '@/components/common/BrandLogo';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmedPassCount, setConfirmedPassCount] = useState(0);

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

  // Close search on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    setMounted(true);
    const city = getUserCity() || 'All India';
    setActiveCity(city);

    // Calculate user's active confirmed passes count for webapp badge
    const updatePasses = () => {
      try {
        const passes = getRSVPs();
        const active = passes.filter((p) => p.status === 'confirmed').length;
        setConfirmedPassCount(active);
      } catch {}
    };

    updatePasses();

    const handleCityChange = () => {
      setActiveCity(getUserCity() || 'All India');
    };

    window.addEventListener('vibe:location_changed', handleCityChange);
    return () => window.removeEventListener('vibe:location_changed', handleCityChange);
  }, []);

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

  // Handle global search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/discover');
    }
  };

  const isNavActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Guest';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-xs">
        {/* District by Zomato Structure: Logo + Location on Left, 3 Core Features in Center, Search + Profile on Right */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
            {/* Left: Brand Logo + Location Selector (District style) */}
            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
              <BrandLogo />

              {/* Location Selector (District by Zomato style: Purple Pin + City & State) */}
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-2.5 px-2.5 py-1 rounded-xl hover:bg-[#F8FAFC] transition-colors cursor-pointer text-left group border border-transparent hover:border-[#E2E8F0]"
                title="Change city location"
              >
                <div className="w-8 h-8 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#7C3AED] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm font-black text-[#0F172A] leading-tight group-hover:text-[#7C3AED] transition-colors max-w-[90px] sm:max-w-[130px] truncate">
                      {activeCity}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[#94A3B8] group-hover:text-[#0F172A] transition-colors shrink-0" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-[#64748B] leading-tight truncate max-w-[85px] sm:max-w-[120px]">
                    {activeState}
                  </span>
                </div>
              </button>
            </div>

            {/* Center: The Three Core Features (Events, Vibe Instant, Host an Event) */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5">
              {/* Feature 1: Events */}
              <Link
                href="/"
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm transition-all ${
                  pathname === '/' || pathname.startsWith('/event')
                    ? 'bg-[#FDF8EE] text-[#9A3412] font-black border border-[#FDE68A]/70 shadow-2xs'
                    : 'text-[#475569] hover:text-[#0F172A] font-bold hover:bg-[#F8FAFC]'
                }`}
              >
                Events
              </Link>

              {/* Feature 2: Vibe Instant */}
              <Link
                href="/vibes"
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm transition-all inline-flex items-center gap-1.5 ${
                  pathname.startsWith('/vibes') || pathname.startsWith('/vibe')
                    ? 'bg-[#FDF8EE] text-[#9A3412] font-black border border-[#FDE68A]/70 shadow-2xs'
                    : 'text-[#475569] hover:text-[#E8621A] font-bold hover:bg-[#F8FAFC]'
                }`}
              >
                <span>Vibe Instant</span>
                <div className="relative inline-flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 fill-[#E8621A] text-[#E8621A] animate-buzz shrink-0" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#E8621A] animate-ping" />
                </div>
              </Link>

              {/* Feature 3: Host an Event */}
              <Link
                href="/create"
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm transition-all ${
                  pathname.startsWith('/create')
                    ? 'bg-[#FDF8EE] text-[#9A3412] font-black border border-[#FDE68A]/70 shadow-2xs'
                    : 'text-[#475569] hover:text-[#0F172A] font-bold hover:bg-[#F8FAFC]'
                }`}
              >
                Host an Event
              </Link>
            </nav>

            {/* Right: Search Icon Button + User Profile Avatar (District style) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Search Icon Trigger */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  searchOpen
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-[#0F172A] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                }`}
                title="Search events, venues, and artists"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </button>

              {/* User Auth Profile (Hi, Guest / Hi, Name) */}
              {mounted && isLoggedIn && profile ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-center justify-center overflow-hidden"
                    title={profile.name}
                  >
                    {profile.avatar_url && !profile.email?.toLowerCase().includes('pandeysuyash100@gmail.com') ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.name}
                        width={36}
                        height={36}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold tracking-tight">
                        {profile.name?.slice(0, 2).toUpperCase() || 'SP'}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#E2E8F0] shadow-lg py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2.5 border-b border-[#F1F5F9]">
                        <p className="text-xs font-bold text-[#0F172A] truncate">{profile.name}</p>
                        <p className="text-[11px] text-[#64748B] truncate">{profile.email}</p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/passes"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors font-medium"
                        >
                          <Ticket className="w-4 h-4 text-[#E8621A]" />
                          <div className="flex items-center justify-between w-full">
                            <span>My Passes & Bookings</span>
                            {confirmedPassCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                {confirmedPassCount}
                              </span>
                            )}
                          </div>
                        </Link>

                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors font-medium"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#64748B]" />
                          <span>Host Dashboard</span>
                        </Link>

                        <Link
                          href="/create"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors font-medium"
                        >
                          <Plus className="w-4 h-4 text-[#64748B]" />
                          <span>Create New Event</span>
                        </Link>

                        {isStaff && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors font-bold border-t border-[#F1F5F9]"
                          >
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span>Admin Queue Workstation</span>
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-[#F1F5F9]">
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            signOut();
                          }}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 w-full transition-colors font-medium cursor-pointer"
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
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
                  title="Sign In"
                >
                  <User className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Search Drawer (District-style focused search) */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 shadow-inner overflow-hidden"
            >
              <div className="max-w-3xl mx-auto flex items-center gap-3">
                <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    autoFocus
                    placeholder={`Search events, concerts, plays, workshops in ${activeCity}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-2xl focus:outline-none focus:border-[#0F172A] text-[#0F172A] shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#0F172A]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="px-3 py-2 text-xs font-bold text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile WebApp Fixed Bottom Navigation Bar (MakeMyTrip & BookMyShow PWA style) */}
      <nav
        aria-label="Mobile Web App Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-3 py-1.5 flex items-center justify-around shadow-lg pb-[max(env(safe-area-inset-bottom),0.5rem)]"
      >
        {/* 1. Events Tab */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            pathname === '/' ? 'text-[#E8621A] font-black' : 'text-[#64748B]'
          }`}
        >
          <CalendarDays className={`w-5 h-5 ${pathname === '/' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] tracking-tight">Events</span>
        </Link>

        {/* 2. ⚡ Vibe Instant Tab */}
        <Link
          href="/vibes"
          className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            pathname.startsWith('/vibes') || pathname.startsWith('/vibe')
              ? 'text-[#E8621A] font-black'
              : 'text-[#64748B] hover:text-[#E8621A]'
          }`}
        >
          <div className="relative">
            <Zap className={`w-5 h-5 ${pathname.startsWith('/vibes') ? 'fill-[#E8621A]' : ''}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E8621A] animate-ping" />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Instant</span>
        </Link>

        {/* 3. Floating Center Host Button */}
        <Link
          href="/create"
          className="flex flex-col items-center -mt-4 group"
          title="Host an Event"
        >
          <div className="w-11 h-11 rounded-full bg-[#0F172A] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border-2 border-white">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-[#0F172A] mt-0.5">Host</span>
        </Link>

        {/* 4. Search Tab */}
        <Link
          href="/discover"
          className={`flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            pathname.startsWith('/discover') ? 'text-[#0F172A] font-bold' : 'text-[#64748B]'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Search</span>
        </Link>

        {/* 5. Passes Tab */}
        <Link
          href="/passes"
          className={`relative flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            pathname.startsWith('/passes') || pathname.startsWith('/guest')
              ? 'text-[#E8621A] font-black'
              : 'text-[#64748B]'
          }`}
        >
          <div className="relative">
            <Ticket className={`w-5 h-5 ${pathname.startsWith('/passes') ? 'text-[#E8621A]' : ''}`} />
            {confirmedPassCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#E8621A] text-white text-[9px] font-bold flex items-center justify-center">
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
