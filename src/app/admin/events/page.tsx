'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  MapPin,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import EventEditModal from '@/components/admin/EventEditModal';
import { calculateEventSurety } from '@/lib/eventSurety';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'review' | 'live' | 'all' | 'external'>('review');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/events');
      if (!res.ok) throw new Error('Failed to load events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Compute counts
  const draftsCount = useMemo(
    () => events.filter((e) => (e.status || '').toLowerCase() === 'draft').length,
    [events]
  );
  const liveCount = useMemo(
    () =>
      events.filter(
        (e) => (e.status || '').toLowerCase() === 'live' || (e.status || '').toLowerCase() === 'published'
      ).length,
    [events]
  );
  const externalCount = useMemo(
    () => events.filter((e) => e.is_external || e.source_type === 'external' || e.external_ticket_url).length,
    [events]
  );

  // Fast Instant (Optimistic) Status Toggle
  const handleToggleStatus = async (event: any) => {
    const isCurrentlyLive =
      (event.status || '').toLowerCase() === 'live' || (event.status || '').toLowerCase() === 'published';
    const newStatus: 'live' | 'draft' = isCurrentlyLive ? 'draft' : 'live';

    // 1. Optimistic instant local update (0ms lag!)
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, status: newStatus, is_public: newStatus === 'live' } : e
      )
    );

    showToast(newStatus === 'live' ? `✓ "${event.title}" published live!` : `Moved "${event.title}" to draft.`);

    // 2. Background server sync
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          updates: { status: newStatus, is_public: newStatus === 'live' },
        }),
      });

      if (!res.ok) {
        // Revert on error
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, status: event.status, is_public: event.is_public } : e))
        );
        showToast('Error syncing status change to server.');
      }
    } catch {
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, status: event.status, is_public: event.is_public } : e))
      );
      showToast('Network error updating status.');
    }
  };

  // Fast Instant (Optimistic) Delete
  const handleDelete = async (event: any) => {
    if (!confirm(`Are you sure you want to permanently delete "${event.title}"?`)) return;

    // 1. Optimistic local removal (0ms lag!)
    const previousEvents = [...events];
    setEvents((prev) => prev.filter((e) => e.id !== event.id));
    showToast(`Deleted "${event.title}".`);

    // 2. Background server delete
    try {
      const res = await fetch(`/api/admin/events?id=${event.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setEvents(previousEvents);
        showToast('Failed to delete event on server.');
      }
    } catch {
      setEvents(previousEvents);
      showToast('Network error deleting event.');
    }
  };

  // Fast Instant (Optimistic) Save Modal Updates
  const handleSaveModal = async (updates: Record<string, any>) => {
    if (!selectedEvent) return;

    const eventId = selectedEvent.id;
    const prevEvent = { ...selectedEvent };

    // 1. Optimistic update
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e))
    );
    setSelectedEvent(null);
    showToast('Event details updated successfully.');

    // 2. Background server update
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          updates,
        }),
      });
      if (!res.ok) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? prevEvent : e))
        );
        showToast('Failed to save updates to server.');
      }
    } catch {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? prevEvent : e))
      );
      showToast('Network error saving updates.');
    }
  };

  // Instant Client Filtering
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const isLive = (e.status || '').toLowerCase() === 'live' || (e.status || '').toLowerCase() === 'published';
      const isDraft = (e.status || '').toLowerCase() === 'draft';
      const isExt = Boolean(e.is_external || e.source_type === 'external' || e.external_ticket_url);

      if (activeTab === 'review' && !isDraft) return false;
      if (activeTab === 'live' && !isLive) return false;
      if (activeTab === 'external' && !isExt) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.title?.toLowerCase().includes(q) ||
          e.venue_name?.toLowerCase().includes(q) ||
          e.location_name?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.slug?.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [events, activeTab, search]);

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl border border-white/10 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
            Events & Approvals
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            1-Click approval queue, live status toggles, and metadata curation
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            title="Refresh events"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/create"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8621A] hover:bg-[#D9530D] text-xs font-bold text-white transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </Link>
        </div>
      </div>

      {/* 3 Quick-Click Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Needs Review Card */}
        <button
          onClick={() => setActiveTab('review')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'review'
              ? 'bg-amber-500/15 border-amber-500/40 shadow-sm shadow-amber-500/10'
              : 'bg-[#0B0F19] border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Needs Review</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                draftsCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{draftsCount}</span>
            <span className="text-[11px] text-zinc-500">awaiting approval</span>
          </div>
        </button>

        {/* Live Events Card */}
        <button
          onClick={() => setActiveTab('live')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'live'
              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-[#0B0F19] border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Live on Vibe</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{liveCount}</span>
            <span className="text-[11px] text-zinc-500">publicly listed</span>
          </div>
        </button>

        {/* Total Events Card */}
        <button
          onClick={() => setActiveTab('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-zinc-800 border-zinc-700'
              : 'bg-[#0B0F19] border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Total Catalog</span>
            <span className="text-[10px] text-zinc-500 font-mono">{externalCount} external</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{events.length}</span>
            <span className="text-[11px] text-zinc-500">all events</span>
          </div>
        </button>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0F19] p-2 rounded-2xl border border-zinc-800/80">
        {/* 4 Clean Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'review'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Review Queue</span>
            {draftsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black">
                {draftsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'live'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Live Events</span>
            <span className="text-[10px] text-zinc-400">({liveCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>All Events</span>
            <span className="text-[10px] text-zinc-400">({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('external')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'external'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>External</span>
            <span className="text-[10px] text-zinc-400">({externalCount})</span>
          </button>
        </div>

        {/* Fast Instant Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search events, venue, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Events Table Container */}
      <div className="bg-[#0B0F19] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl">
        {loading && events.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
            <div className="w-6 h-6 rounded-full border-2 border-[#E8621A] border-t-transparent animate-spin" />
            <span className="text-xs font-mono">Loading events...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-medium space-y-2">
            <p>No events found in this view.</p>
            {activeTab === 'review' && (
              <p className="text-emerald-400 text-xs font-semibold">
                ✓ All submissions are up to date and approved!
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/70 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800/80">
                <tr>
                  <th className="py-3 px-4 font-semibold">Event</th>
                  <th className="py-3 px-4 font-semibold">Schedule & Location</th>
                  <th className="py-3 px-4 font-semibold">Ticketing</th>
                  <th className="py-3 px-4 font-semibold">Surety & Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredEvents.map((event) => {
                  const surety = calculateEventSurety(event);
                  const isDraft = (event.status || '').toLowerCase() === 'draft';
                  const isLive =
                    (event.status || '').toLowerCase() === 'live' ||
                    (event.status || '').toLowerCase() === 'published';

                  return (
                    <tr key={event.id} className="hover:bg-zinc-800/25 transition-colors">
                      {/* Column 1: Event & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-zinc-900 overflow-hidden shrink-0 border border-zinc-800 relative">
                            {event.cover_image || event.cover_image_url ? (
                              <img
                                src={event.cover_image || event.cover_image_url}
                                alt={event.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-600 font-mono font-bold">
                                NO IMG
                              </div>
                            )}
                          </div>
                          <div className="max-w-[240px] min-w-0">
                            <div className="font-bold text-white truncate hover:text-[#E8621A] transition-colors text-xs">
                              {event.title || 'Untitled Event'}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate font-mono mt-0.5">
                              /{event.slug}
                            </div>
                            {event.ai_generated && isDraft && (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[9px] font-mono font-semibold mt-1">
                                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                <span>AI Ingested</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Schedule & Location */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="text-zinc-200 font-medium truncate">
                            {event.date || (event.start_at ? event.start_at.split('T')[0] : 'TBA')}
                            {event.time ? ` · ${event.time}` : ''}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#E8621A] shrink-0" />
                            <span>{event.venue_name || event.city || 'India'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Ticketing & Platform */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="font-bold text-emerald-400 font-mono text-xs">
                            {event.price_inr ? `₹${event.price_inr}` : event.external_price_text || 'Free Entry'}
                          </div>
                          <div>
                            {event.is_external ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                                {event.source_platform || event.platform || 'External'}
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8621A]/10 text-[#FF8442] border border-[#E8621A]/20 font-mono">
                                Vibe RSVP
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Surety & 1-Click Fast Approval Action */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {/* Surety Score Badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${surety.badgeColor}`}
                            title={`Event completeness: ${surety.filledCount}/${surety.totalCount} fields verified`}
                          >
                            <ShieldCheck className="w-3 h-3 shrink-0" />
                            <span>{surety.score}% Surety</span>
                          </span>

                          {/* 1-Click Status Action */}
                          {isDraft ? (
                            <button
                              onClick={() => handleToggleStatus(event)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white shadow-sm shadow-emerald-950/40 transition cursor-pointer"
                              title="Click to instantly approve & publish live"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve Live</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(event)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
                              title="Click to revert to Draft"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Live</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/${event.slug}`}
                            target="_blank"
                            title="Preview Event Page"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => setSelectedEvent(event)}
                            title="Quick Edit Details"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-[#E8621A] hover:bg-zinc-800 transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(event)}
                            title="Delete Event"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fast Quick Edit Modal */}
      {selectedEvent && (
        <EventEditModal
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
}
