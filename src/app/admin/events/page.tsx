'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  Tag,
  MapPin,
  Clock,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import EventEditModal from '@/components/admin/EventEditModal';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'bot_drafts' | 'drafts' | 'live' | 'external' | 'vibe'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/events');
      if (!res.ok) throw new Error('Failed to load events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleToggleStatus = async (event: any) => {
    const isLive = event.status === 'live' || event.status === 'published';
    const newStatus = isLive ? 'draft' : 'live';
    setActionLoading(`status-${event.id}`);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          updates: { status: newStatus },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update status');
      }
      await fetchEvents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (event: any) => {
    if (!confirm(`Are you sure you want to permanently delete "${event.title}"?`)) return;
    setActionLoading(`del-${event.id}`);
    try {
      const res = await fetch(`/api/admin/events?id=${event.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete event');
      }
      await fetchEvents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveModal = async (updates: Record<string, any>) => {
    if (!selectedEvent) return;
    const res = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedEvent.id,
        updates,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update event');
    }
    await fetchEvents();
  };

  // Filter pipeline
  const filteredEvents = events.filter((e) => {
    const isLive = e.status === 'live' || e.status === 'published';
    if (activeTab === 'bot_drafts' && !(e.status === 'draft' && e.ai_generated)) return false;
    if (activeTab === 'drafts' && e.status !== 'draft') return false;
    if (activeTab === 'live' && !isLive) return false;
    if (activeTab === 'external' && !e.is_external) return false;
    if (activeTab === 'vibe' && e.is_external) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.title?.toLowerCase().includes(q) ||
        e.venue_name?.toLowerCase().includes(q) ||
        e.location_name?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q) ||
        e.slug?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const botDraftsCount = events.filter((e) => e.status === 'draft' && e.ai_generated).length;
  const draftsCount = events.filter((e) => e.status === 'draft').length;
  const liveCount = events.filter((e) => e.status === 'live' || e.status === 'published').length;
  const externalCount = events.filter((e) => e.is_external).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-display">
            Events Management & Review
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Admin verification queue, metadata overrides, pricing curation & publishing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/create"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#E8621A] to-[#FF8442] text-xs font-semibold text-white shadow-lg shadow-orange-500/20"
          >
            + New Event
          </Link>
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0B0F19] p-2.5 rounded-2xl border border-zinc-800/80">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('bot_drafts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'bot_drafts'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Bot Ingestions</span>
            {botDraftsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
                {botDraftsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'drafts'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>All Drafts</span>
            {draftsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                {draftsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'live'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Live ({liveCount})
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'external'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            External ({externalCount})
          </button>
          <button
            onClick={() => setActiveTab('vibe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === 'vibe'
                ? 'bg-[#E8621A]/20 text-[#FF8442] border border-[#E8621A]/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Native RSVP ({events.length - externalCount})
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, venue, city..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8621A]"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl bg-[#0B0F19] border border-zinc-800/90 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-zinc-500 font-mono">
            Loading events repository...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-16 text-center text-xs text-zinc-500">
            No events match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/60 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Event</th>
                  <th className="py-3.5 px-4 font-semibold">Schedule & Location</th>
                  <th className="py-3.5 px-4 font-semibold">Ticketing & Platform</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-zinc-800/30 transition">
                    {/* Event & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 overflow-hidden shrink-0 border border-zinc-800">
                          {event.cover_image ? (
                            <img
                              src={event.cover_image}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-700 font-mono">
                              No Poster
                            </div>
                          )}
                        </div>
                        <div className="max-w-[240px]">
                          <div className="font-bold text-white truncate hover:text-[#FF8442]">
                            {event.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">
                            /{event.slug}
                          </div>
                          {event.ai_generated && event.status === 'draft' && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-semibold mt-1">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span>Bot Ingested • Verify</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Schedule & Location */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="text-zinc-200 font-medium truncate">
                          {event.date || 'TBA'}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span>{event.venue_name || event.city || 'Delhi'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Ticketing & Platform */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-400 font-mono">
                            {event.price_inr ? `₹${event.price_inr}` : 'Free'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                            {event.ticket_type || 'rsvp'}
                          </span>
                        </div>
                        <div>
                          {event.is_external ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-medium">
                              Redirect: {event.platform || 'external'}
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8621A]/10 text-[#FF8442] border border-[#E8621A]/20 font-mono font-medium">
                              Direct Vibe RSVP
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status Toggle / Verify Action */}
                    <td className="py-3 px-4">
                      {event.status === 'draft' ? (
                        <button
                          onClick={() => handleToggleStatus(event)}
                          disabled={actionLoading === `status-${event.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white shadow-sm shadow-emerald-950/40 transition disabled:opacity-50 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify &amp; Publish Live</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(event)}
                          disabled={actionLoading === `status-${event.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
                          title="Click to revert to Draft"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Live</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/${event.slug}`}
                          target="_blank"
                          title="View Live Page"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => setSelectedEvent(event)}
                          title="Edit metadata & pricing"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-[#FF8442] hover:bg-zinc-800 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(event)}
                          disabled={actionLoading === `del-${event.id}`}
                          title="Delete event"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
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
