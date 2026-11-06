'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Heart,
  ArrowLeft,
  Compass,
  ArrowRight,
  User,
  Ticket,
  Search,
  Loader2,
  Trash2,
  Sparkles
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import EventCard from '@/components/ui/EventCard';
import { getEvents, syncEventsWithSupabase } from '@/lib/store';
import { EventItem } from '@/types';
import { useAuth } from '@/lib/auth';

export default function SavedEventsPage() {
  const { profile } = useAuth();
  const [savedEvents, setSavedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load saved events from localStorage wishlist
  const loadSavedEvents = async () => {
    if (typeof window === 'undefined') return;
    try {
      const savedIds: string[] = JSON.parse(localStorage.getItem('vibe_wishlist') || '[]');
      if (!savedIds || savedIds.length === 0) {
        setSavedEvents([]);
        setLoading(false);
        return;
      }

      let all = getEvents();
      if (!all || all.length === 0) {
        all = await syncEventsWithSupabase();
      }

      const filtered = (all || []).filter(
        (e) => savedIds.includes(e.id) || (e.slug && savedIds.includes(e.slug))
      );
      setSavedEvents(filtered);
    } catch (err) {
      console.error('Error loading saved events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedEvents();

    const handleWishlistUpdated = () => {
      loadSavedEvents();
    };

    window.addEventListener('vibe:wishlist-updated', handleWishlistUpdated);
    window.addEventListener('storage', handleWishlistUpdated);

    return () => {
      window.removeEventListener('vibe:wishlist-updated', handleWishlistUpdated);
      window.removeEventListener('storage', handleWishlistUpdated);
    };
  }, []);

  // Filtered by search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return savedEvents;
    const q = searchQuery.toLowerCase().trim();
    return savedEvents.filter(
      (e) =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.city || '').toLowerCase().includes(q) ||
        (e.location_name || (e as any).venue_name || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
    );
  }, [savedEvents, searchQuery]);

  // Clear all saved items
  const handleClearAll = () => {
    if (typeof window === 'undefined') return;
    if (!confirm('Are you sure you want to remove all saved events?')) return;
    localStorage.setItem('vibe_wishlist', JSON.stringify([]));
    window.dispatchEvent(new Event('vibe:wishlist-updated'));
    setSavedEvents([]);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F8] dark:bg-[#060A1C] text-[#07133A] dark:text-[#F3F4F6] flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0038A8] dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to profile</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0038A8] dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover more events</span>
          </Link>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="pb-8 border-b border-slate-200/90 dark:border-white/[0.08] mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>YOUR WISHLIST · SAVED EXPERIENCES</span>
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#07133A] dark:text-white flex items-baseline">
              Liked &amp; saved events<span className="text-rose-500">.</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-0.5 max-w-xl leading-relaxed">
              Events you&apos;ve bookmarked to attend or keep an eye on. View details, book tickets, or manage your wishlist anytime.
            </p>
          </div>

          {/* Stat Pill */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div>
                <p className="text-lg font-black text-[#07133A] dark:text-white leading-none">
                  {savedEvents.length}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Saved {savedEvents.length === 1 ? 'event' : 'events'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section Navigation Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8 pb-4 border-b border-slate-200/90 dark:border-white/[0.08]">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-white/10 text-rose-600 dark:text-rose-400 border border-slate-200/90 dark:border-white/15 shadow-xs"
            >
              <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
              <span>Saved events ({savedEvents.length})</span>
            </span>

            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-[#0038A8] hover:bg-white/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal profile &amp; privacy</span>
            </Link>

            <Link
              href="/passes"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-[#0038A8] hover:bg-white/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Passes &amp; bookings</span>
            </Link>
          </div>

          {/* Action button: clear all if events present */}
          {savedEvents.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Clear all saved events"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear list</span>
            </button>
          )}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <span className="text-sm font-medium">Loading your saved events...</span>
          </div>
        ) : savedEvents.length === 0 ? (
          /* Empty State */
          <div className="p-8 sm:p-16 rounded-3xl border border-dashed border-slate-300 dark:border-white/10 text-center bg-white dark:bg-white/[0.02] shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Heart className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#07133A] dark:text-white mb-2">
              No saved events yet
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              When exploring gatherings, concerts, stand-up comedy, or workshops, tap the heart icon on any event card to save it here for easy access anytime.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0038A8] hover:bg-[#173DAA] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-900/20 hover:brightness-110 transition cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Explore upcoming vibes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Event Grid with Live Search Filter */
          <div className="space-y-6">
            {/* Search within saved events */}
            {savedEvents.length > 2 && (
              <div className="relative max-w-sm">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved events by title, venue, or city..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.08] text-[#07133A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#0038A8] shadow-xs transition"
                />
              </div>
            )}

            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                No saved events matched &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
