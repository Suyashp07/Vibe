'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Sparkles,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Trash2,
  Send,
  Terminal,
  ArrowRight,
  TrendingUp,
  Clock,
  MapPin,
  Tag
} from 'lucide-react';
import EventEditModal from '@/components/admin/EventEditModal';

export default function AdminDashboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, logsRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/audit-logs?limit=5'),
      ]);

      if (!eventsRes.ok) {
        throw new Error(`Failed to load events (${eventsRes.status})`);
      }

      const eventsData = await eventsRes.json();
      setEvents(eventsData.events || []);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAuditLogs(logsData.logs || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePublish = async (event: any) => {
    setActionLoading(`pub-${event.id}`);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          updates: { status: 'live' },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to publish');
      }
      await fetchDashboardData();
    } catch (err: any) {
      alert(`Publish error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (event: any) => {
    if (!confirm(`Are you sure you want to discard "${event.title}"?`)) return;
    setActionLoading(`del-${event.id}`);
    try {
      const res = await fetch(`/api/admin/events?id=${event.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete');
      }
      await fetchDashboardData();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveModal = async (updatedFields: Record<string, any>) => {
    if (!selectedEvent) return;
    const res = await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedEvent.id,
        updates: updatedFields,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save updates');
    }
    await fetchDashboardData();
  };

  const drafts = events.filter((e) => e.status === 'draft');
  const published = events.filter((e) => e.status === 'live' || e.status === 'published');
  const external = events.filter((e) => e.is_external);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-display">
            Admin Command Center
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Zero-Trust curated pipeline for Vibe events, link ingestion & staff RBAC
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/ingestion"
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 flex items-center gap-2 transition"
          >
            <Terminal className="w-3.5 h-3.5 text-[#FF8442]" />
            <span>Test Ingestion</span>
          </Link>
          <Link
            href="/create"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#E8621A] to-[#FF8442] hover:opacity-95 text-xs font-semibold text-white flex items-center gap-2 shadow-lg shadow-orange-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800/90 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Pending Review</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-2">
            {drafts.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Requiring curator approval</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800/90">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Live Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {published.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Discoverable on Vibe</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800/90">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>External Redirects</span>
            <ExternalLink className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-2">
            {external.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">District, BookMyShow, Luma</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800/90">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Ingested</span>
            <CalendarDays className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono mt-2">
            {events.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Lifetime events indexed</div>
        </div>
      </div>

      {/* Urgent Drafts Review Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Curator Review Queue
            </h2>
            {drafts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-semibold">
                {drafts.length} pending
              </span>
            )}
          </div>
          <Link
            href="/admin/events"
            className="text-xs text-[#FF8442] hover:text-[#FFA066] font-semibold flex items-center gap-1"
          >
            <span>View All Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500 font-mono">
            Loading review queue...
          </div>
        ) : drafts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0B0F19] border border-dashed border-zinc-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-200">Queue is Clear!</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              All incoming bot ingestions and drafts have been reviewed and published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.slice(0, 6).map((draft) => (
              <div
                key={draft.id}
                className="rounded-2xl bg-[#0B0F19] border border-zinc-800/80 overflow-hidden flex flex-col group hover:border-zinc-700 transition"
              >
                {/* Cover Preview */}
                <div className="h-40 relative bg-zinc-900 overflow-hidden">
                  {draft.cover_image ? (
                    <img
                      src={draft.cover_image}
                      alt={draft.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs font-mono">
                      No Poster Provided
                    </div>
                  )}

                  {/* Badge overlays */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    {draft.ai_generated && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/90 backdrop-blur-md text-purple-300 border border-purple-500/40 font-bold font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Bot Ingested</span>
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30 font-semibold uppercase font-mono">
                      Needs Verification
                    </span>
                    {draft.is_external ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30 font-semibold font-mono">
                        {draft.platform || 'External'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#E8621A]/80 backdrop-blur-md text-white font-semibold font-mono">
                        Vibe RSVP
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                    {draft.price_inr ? `₹${draft.price_inr}` : 'Free'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#FF8442] transition">
                      {draft.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                      {draft.tagline || draft.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{draft.date || 'TBA'} • {draft.time || 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{draft.venue_name || draft.city || 'Delhi'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedEvent(draft)}
                      className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                      title="Edit metadata & pricing"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(draft)}
                      disabled={actionLoading === `del-${draft.id}`}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      title="Discard event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handlePublish(draft)}
                      disabled={actionLoading === `pub-${draft.id}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{actionLoading === `pub-${draft.id}` ? 'Publishing...' : 'Verify & Publish Live'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Audit Snapshot */}
      <div className="rounded-2xl bg-[#0B0F19] border border-zinc-800/90 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Recent Administrative Audit Trail
            </h3>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs text-zinc-400 hover:text-zinc-200 font-semibold"
          >
            Full Log Trail &rarr;
          </Link>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs text-zinc-500 font-mono text-center">
            No audit logs captured yet (actions will appear here in real time).
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-zinc-800 text-zinc-300">
                    {log.action}
                  </span>
                  <span className="text-zinc-300 font-medium">{log.actor_email}</span>
                  <span className="text-zinc-500 hidden sm:inline">
                    &bull; Target: {log.target_type} ({log.target_id?.slice(0, 8)}...)
                  </span>
                </div>
                <div className="text-zinc-500 font-mono text-[11px]">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
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
