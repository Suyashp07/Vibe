'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Calendar,
  Plus,
  Compass,
  User,
  LogIn,
  LogOut,
  ChevronDown,
  Building2,
  Ticket,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { syncEventsWithSupabase } from '@/lib/store';

export default function Navbar() {
  const pathname = usePathname();
  const { profile, isLoggedIn, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isNavActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    // Global two-way sync: automatically reconciles events and prunes deleted rows from Supabase
    syncEventsWithSupabase().catch(() => {});
  }, []);


  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface-2/90 border-b border-border/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0 py-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand flex items-center justify-center text-surface shadow-sm group-hover:bg-accent transition-colors duration-200 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-display font-black text-lg sm:text-xl tracking-tight text-brand leading-tight whitespace-nowrap">
              Vibe <span className="font-tagline italic text-accent font-normal text-base sm:text-lg">by Swaniki</span>
            </span>
            <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-ink-muted leading-tight mt-0.5 whitespace-nowrap">
              Whitelabel Events
            </span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-3/60 p-1 rounded-full border border-border">
          <Link
            href="/discover"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isNavActive('/discover')
                ? 'bg-surface text-brand shadow-sm font-semibold'
                : 'text-ink-secondary hover:text-ink hover:bg-surface/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-accent" />
              Discover
            </span>
          </Link>

          <Link
            href="/dashboard"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isNavActive('/dashboard')
                ? 'bg-surface text-brand shadow-sm font-semibold'
                : 'text-ink-secondary hover:text-ink hover:bg-surface/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-mid" />
              Organizer
            </span>
          </Link>

          <Link
            href="/guest"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isNavActive('/guest')
                ? 'bg-surface text-brand shadow-sm font-semibold'
                : 'text-ink-secondary hover:text-ink hover:bg-surface/50'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-ink-secondary" />
              My RSVPs
            </span>
          </Link>
        </nav>

        {/* Right CTA Actions & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/create"
            className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-accent to-accent-dark text-white text-xs font-bold px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-btn shadow-sm hover-lift transition-all border border-accent/20"
          >
            <div className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="hidden sm:inline">Create Event</span>
            <span className="sm:hidden">Host</span>
            <span className="hidden sm:inline-block text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Free
            </span>
          </Link>

          {/* User Auth State */}
          {mounted && isLoggedIn && profile ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-full border border-border bg-surface hover:bg-surface-3 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-xs">
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
                <span className="text-xs font-semibold text-ink hidden lg:inline-block max-w-[100px] truncate">
                  {profile.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-ink-muted mr-1" />
              </button>

              {/* Profile Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface border border-border shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="text-xs font-bold text-ink truncate">{profile.name}</p>
                    <p className="text-[11px] text-ink-muted truncate">{profile.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent-light/60 text-accent font-semibold">
                      {profile.role === 'organizer' ? (
                        <>
                          <Building2 className="w-3 h-3" />
                          <span>Host Account</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-3 h-3" />
                          <span>Guest Account</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink hover:bg-surface-2 transition-colors font-medium"
                    >
                      <Calendar className="w-4 h-4 text-brand-mid" />
                      <span>Organizer Command</span>
                    </Link>

                    {profile.role === 'organizer' && (
                      <>
                        <Link
                          href={`/${profile.handle || 'swaniki'}`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink hover:bg-surface-2 transition-colors font-medium"
                        >
                          <Building2 className="w-4 h-4 text-accent" />
                          <span>My Public Page (/{profile.handle || 'swaniki'})</span>
                        </Link>

                        <Link
                          href="/onboarding"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink hover:bg-surface-2 transition-colors font-medium"
                        >
                          <Sparkles className="w-4 h-4 text-gold" />
                          <span>Brand Preset & Logo</span>
                        </Link>
                      </>
                    )}

                    <Link
                      href="/guest"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink hover:bg-surface-2 transition-colors font-medium"
                    >
                      <Ticket className="w-4 h-4 text-accent" />
                      <span>My RSVPs & Tickets</span>
                    </Link>

                    <Link
                      href="/create"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink hover:bg-surface-2 transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>Create New Event</span>
                    </Link>
                  </div>

                  <div className="border-t border-border pt-1 mt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        await signOut();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-semibold text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-btn border border-border bg-surface hover:bg-surface-3 text-ink transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-accent" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-btn bg-brand hover:bg-brand-mid text-white shadow-xs hover-lift transition-all"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-border bg-surface text-ink hover:bg-surface-3 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-accent" /> : <Menu className="w-5 h-5 text-ink" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface/98 backdrop-blur-xl px-4 py-4 space-y-3 shadow-elevated animate-in slide-in-from-top-2 duration-200">
          <nav className="space-y-1">
            <Link
              href="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isNavActive('/discover')
                  ? 'bg-accent-light text-accent font-bold'
                  : 'text-ink hover:bg-surface-2'
              }`}
            >
              <Compass className="w-4 h-4 text-accent" />
              <span>Discover Events</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isNavActive('/dashboard')
                  ? 'bg-accent-light text-accent font-bold'
                  : 'text-ink hover:bg-surface-2'
              }`}
            >
              <Calendar className="w-4 h-4 text-brand-mid" />
              <span>Organizer Dashboard</span>
            </Link>

            <Link
              href="/guest"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isNavActive('/guest')
                  ? 'bg-accent-light text-accent font-bold'
                  : 'text-ink hover:bg-surface-2'
              }`}
            >
              <Ticket className="w-4 h-4 text-ink-secondary" />
              <span>My RSVPs & Tickets</span>
            </Link>

            <Link
              href="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-accent hover:bg-accent-light transition-all"
            >
              <Sparkles className="w-4 h-4 text-gold" />
              <span>Create New Event</span>
            </Link>
          </nav>

          {/* Mobile Auth actions */}
          <div className="pt-2 border-t border-border">
            {mounted && isLoggedIn && profile ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {profile.name?.slice(0, 2).toUpperCase() || 'US'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">{profile.name}</p>
                    <p className="text-[11px] text-ink-muted truncate">{profile.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 p-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-border bg-surface text-xs font-bold text-ink text-center hover:bg-surface-3 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-accent" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand text-xs font-bold text-white text-center hover:bg-brand-mid transition-colors shadow-xs"
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
