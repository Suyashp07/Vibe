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
  Zap
} from 'lucide-react';
import { useAuth, setLocalAuthSession, AuthProfile } from '@/lib/auth';
import { syncEventsWithSupabase, getRSVPs } from '@/lib/store';
import { getSupabaseClient } from '@/lib/supabase';
import LocationModal from '@/components/location/LocationModal';
import AuthModal from '@/components/auth/AuthModal';
import { getUserCity } from '@/lib/location';

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
  const [confirmedPassCount, setConfirmedPassCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

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
        {/* Tier 1: Main Header Bar (MakeMyTrip & BookMyShow style) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
            {/* Left: Brand Logo (District by Zomato style: Vibe over BY SWANIKI with V turning orange on hover) */}
            <div className="flex items-center shrink-0">
              <Link
                href="/"
                className="flex flex-col group select-none py-0.5"
                title="Vibe by Swaniki"
              >
                <span className="font-display font-black text-2xl sm:text-[28px] text-[#0F172A] tracking-tight leading-none">
                  <span className="transition-colors duration-200 group-hover:text-[#E8621A]">V</span>
                  <span>ibe</span>
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-black tracking-[0.22em] text-[#E8621A] uppercase leading-none pt-1">
                  BY SWANIKI
                </span>
              </Link>
            </div>

            {/* Center: Global Search Bar (BookMyShow style) */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 max-w-xl mx-2 hidden sm:block relative"
            >
              <div className="relative flex items-center w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search for events, plays, concerts, workshops, and venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] focus:bg-white transition-all text-[#0F172A] placeholder:text-[#94A3B8]"
                />
              </div>
            </form>

            {/* Right: City Selector & User Menu & Host Action */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Vibe Instant Flash Meetups CTA */}
              <Link
                href="/vibes"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  pathname.startsWith('/vibes') || pathname.startsWith('/vibe')
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-gradient-to-r from-[#E8621A] to-[#FF8C42] text-white hover:opacity-95 shadow-[#E8621A]/20'
                }`}
                title="Vibe Instant: Spontaneous Flash Meetups"
              >
                <Zap className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span>⚡ Vibe Instant</span>
              </Link>

              {/* Location Picker (MakeMyTrip / BookMyShow City dropdown) */}
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
                title="Change city location"
              >
                <MapPin className="w-3.5 h-3.5 text-[#E8621A] shrink-0" />
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{activeCity}</span>
                <ChevronDown className="w-3 h-3 text-[#94A3B8] shrink-0" />
              </button>

              {/* Host / Create Event CTA */}
              <Link
                href="/create"
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <CalendarPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Host Event</span>
              </Link>

              {/* User Auth Profile (Hi, Guest / Hi, Name) */}
              {mounted && isLoggedIn && profile ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                      {profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={profile.name}
                          width={28}
                          height={28}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span>{profile.name?.slice(0, 2).toUpperCase() || 'US'}</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-[#0F172A] hidden sm:inline-block max-w-[100px] truncate">
                      Hi, {firstName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
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
                          href="/dashboard?tab=passes"
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode('signin');
                      setAuthModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Hi, Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
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
          href="/dashboard?tab=passes"
          className={`relative flex flex-col items-center gap-1 py-1 px-2 transition-colors ${
            pathname.includes('guest') || (pathname === '/dashboard' && confirmedPassCount > 0)
              ? 'text-[#0F172A] font-bold'
              : 'text-[#64748B]'
          }`}
        >
          <div className="relative">
            <Ticket className="w-5 h-5" />
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
