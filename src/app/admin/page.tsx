'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  RefreshCw,
  Search,
  Plus,
  Link2,
  ListFilter,
  ArrowUpRight,
  Clock,
  MapPin,
  Tag,
  Check,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import EventEditModal from '@/components/admin/EventEditModal';
import { formatIST } from '@/lib/store';
import { areDuplicates } from '@/lib/aggregation/dedup';

export default function AdminDashboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Filter & Search
  const [activeTab, setActiveTab] = useState<'review' | 'live' | 'external' | 'bot' | 'all'>('review');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // URL Import Modal
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [importingUrl, setImportingUrl] = useState(false);
  const [urlResult, setUrlResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Listing Crawl Modal
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingUrl, setListingUrl] = useState('');
  const [crawlingListing, setCrawlingListing] = useState(false);
  const [discoveredLinks, setDiscoveredLinks] = useState<string[]>([]);
  const [listingResult, setListingResult] = useState<{ ok: boolean; message: string } | null>(null);

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

  // 1-Click Approve (Publish Live)
  const handleApprove = async (event: any) => {
    setActionLoading(`pub-${event.id}`);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          updates: { status: 'live', is_public: true },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to approve event');
      }
      await fetchDashboardData();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Discard / Reject
  const handleDiscard = async (event: any) => {
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
      alert(`Discard error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk Approve Selected
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Approve and publish all ${selectedIds.size} selected events?`)) return;

    setActionLoading('bulk-approve');
    try {
      for (const id of Array.from(selectedIds)) {
        await fetch('/api/admin/events', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            updates: { status: 'live', is_public: true },
          }),
        });
      }
      setSelectedIds(new Set());
      await fetchDashboardData();
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk Discard Selected
  const handleBulkDiscard = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Permanently discard all ${selectedIds.size} selected events?`)) return;

    setActionLoading('bulk-discard');
    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
      }
      setSelectedIds(new Set());
      await fetchDashboardData();
    } finally {
      setActionLoading(null);
    }
  };

  // Import single URL
  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setImportingUrl(true);
    setUrlResult(null);

    try {
      const res = await fetch('/api/admin/events/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed');

      setUrlResult({
        ok: true,
        message: data.duplicateWarning
          ? `Ingested successfully! ${data.duplicateWarning}`
          : 'Event extracted and added to Review Queue!',
      });
      setUrlInput('');
      await fetchDashboardData();
    } catch (err: any) {
      setUrlResult({ ok: false, message: err.message || 'Failed to ingest URL' });
    } finally {
      setImportingUrl(false);
    }
  };

  // Crawl Listing Page
  const handleCrawlListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingUrl.trim()) return;

    setCrawlingListing(true);
    setListingResult(null);
    setDiscoveredLinks([]);

    try {
      const res = await fetch('/api/admin/events/import-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingUrl: listingUrl.trim(), max: 15 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Crawl failed');

      setDiscoveredLinks(data.links || []);
      setListingResult({
        ok: true,
        message: `Discovered ${data.found} deep-links on ${data.platform}! Click any link to ingest below.`,
      });
    } catch (err: any) {
      setListingResult({ ok: false, message: err.message || 'Failed to crawl listing' });
    } finally {
      setCrawlingListing(false);
    }
  };

  // Counts
  const pendingCount = events.filter((e) => e.status !== 'live').length;
  const liveCount = events.filter((e) => e.status === 'live').length;
  const externalCount = events.filter((e) => e.source_type === 'external').length;
  const botCount = events.filter((e) => e.ai_generated).length;

  // Filtered Events
  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.source_platform?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'review') return e.status !== 'live';
    if (activeTab === 'live') return e.status === 'live';
    if (activeTab === 'external') return e.source_type === 'external';
    if (activeTab === 'bot') return e.ai_generated;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Ingestion Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>High-Efficiency Ingestion & Curation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand font-sans tracking-tight">
            Event Command Workstation
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Review incoming drafts, crawl BookMyShow / Eventbrite, and approve events with 1 click.
          </p>
        </div>

        {/* Quick Ingest Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowUrlModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand hover:bg-accent text-white text-xs font-bold transition shadow-xs"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>+ Ingest by URL</span>
          </button>

          <button
            onClick={() => setShowListingModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-border hover:bg-surface-3 text-ink text-xs font-bold transition shadow-xs"
          >
            <ListFilter className="w-3.5 h-3.5 text-accent" />
            <span>Crawl Listing Page</span>
          </button>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-3 text-ink-secondary hover:text-ink transition"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('review')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'review'
              ? 'bg-orange-500/10 border-orange-500 text-orange-950 shadow-xs'
              : 'bg-surface border-border hover:bg-surface-3'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Review Queue</div>
          <div className="text-2xl font-black text-accent mt-1">{pendingCount}</div>
          <div className="text-[10px] text-ink-muted">Awaiting publication</div>
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'live'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 shadow-xs'
              : 'bg-surface border-border hover:bg-surface-3'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Live Published</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{liveCount}</div>
          <div className="text-[10px] text-ink-muted">Visible on discovery feed</div>
        </button>

        <button
          onClick={() => setActiveTab('external')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'external'
              ? 'bg-sky-500/10 border-sky-500 text-sky-950 shadow-xs'
              : 'bg-surface border-border hover:bg-surface-3'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Aggregated Feeds</div>
          <div className="text-2xl font-black text-sky-600 mt-1">{externalCount}</div>
          <div className="text-[10px] text-ink-muted">BookMyShow / District</div>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'all'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'bg-surface border-border hover:bg-surface-3'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Total Platform</div>
          <div className="text-2xl font-black text-ink mt-1">{events.length}</div>
          <div className="text-[10px] text-ink-muted">Database event rows</div>
        </button>
      </div>

      {/* Filter & Bulk Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, venue, city, or platform..."
            className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl bg-surface-2 border border-border focus:outline-none focus:border-brand transition"
          />
        </div>

        {/* Bulk Action Buttons if items selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink px-2">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleBulkApprove}
              disabled={actionLoading === 'bulk-approve'}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Bulk Publish</span>
            </button>
            <button
              onClick={handleBulkDiscard}
              disabled={actionLoading === 'bulk-discard'}
              className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition flex items-center gap-1 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Discard</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Events List */}
      {loading ? (
        <div className="p-12 text-center bg-surface rounded-2xl border border-border">
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
          <div className="text-xs text-ink-muted">Syncing with Supabase events table...</div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-2xl border border-border space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="text-sm font-bold text-ink">Review Queue is Clean!</div>
          <div className="text-xs text-ink-muted max-w-sm mx-auto">
            All events have been reviewed. Paste a BookMyShow or Eventbrite link using &quot;+ Ingest by URL&quot; to crawl new events.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => {
            const isLive = evt.status === 'live';
            const isSelected = selectedIds.has(evt.id);

            // Duplicate detection: check against other events in list
            const duplicateMatch = events.find((other) => {
              if (other.id === evt.id) return false;
              return areDuplicates(
                { name: evt.title, date: evt.start_at, venue: evt.location_name },
                { name: other.title, date: other.start_at, venue: other.location_name }
              );
            });

            return (
              <div
                key={evt.id}
                className={`p-4 rounded-2xl bg-surface border transition shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !isLive
                    ? 'border-orange-500/40 bg-orange-50/20'
                    : 'border-border hover:border-border-strong'
                }`}
              >
                {/* Left: Checkbox + Poster + Info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const next = new Set(selectedIds);
                      if (e.target.checked) next.add(evt.id);
                      else next.delete(evt.id);
                      setSelectedIds(next);
                    }}
                    className="mt-1 sm:mt-0 w-4 h-4 rounded text-brand focus:ring-0 cursor-pointer"
                  />

                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-surface-3 border border-border shrink-0">
                    {evt.cover_image_url ? (
                      <Image
                        src={evt.cover_image_url}
                        alt={evt.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[10px] text-ink-muted">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          isLive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-orange-100 text-orange-800 animate-pulse'
                        }`}
                      >
                        {isLive ? 'Live' : 'Draft / Review'}
                      </span>

                      {evt.source_platform && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                          {evt.source_platform.toUpperCase()}
                        </span>
                      )}

                      {duplicateMatch && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Duplicate of &ldquo;{duplicateMatch.title.slice(0, 24)}...&rdquo;</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-ink truncate font-sans">
                      <Link href={`/${evt.slug}`} target="_blank" className="hover:text-accent transition">
                        {evt.title}
                      </Link>
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-accent" />
                        <span>{formatIST(evt.start_at)}</span>
                      </span>

                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span>{evt.location_name || evt.city}</span>
                      </span>

                      {evt.external_price_text && (
                        <span className="font-semibold text-ink">
                          {evt.external_price_text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {evt.external_ticket_url && (
                    <a
                      href={evt.external_ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-border hover:bg-surface-3 text-ink-muted hover:text-ink transition"
                      title="Open source ticketing URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => setSelectedEvent(evt)}
                    className="px-3 py-1.5 rounded-xl border border-border hover:bg-surface-3 text-xs font-semibold text-ink transition flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {!isLive ? (
                    <button
                      onClick={() => handleApprove(evt)}
                      disabled={actionLoading === `pub-${evt.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1"
                    >
                      {actionLoading === `pub-${evt.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve Live</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDiscard(evt)}
                      disabled={actionLoading === `del-${evt.id}`}
                      className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition"
                      title="Discard event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {!isLive && (
                    <button
                      onClick={() => handleDiscard(evt)}
                      disabled={actionLoading === `del-${evt.id}`}
                      className="p-2 rounded-xl text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Reject and discard"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Ingest Single URL */}
      {showUrlModal && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-elevated p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-ink">Ingest Event from URL</h3>
              </div>
              <button onClick={() => setShowUrlModal(false)} className="text-ink-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Event Link (BookMyShow, District, Eventbrite, Luma)
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://in.bookmyshow.com/events/... or https://district.in/events/..."
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-border bg-surface-2 focus:outline-none"
                  required
                />
              </div>

              {urlResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    urlResult.ok
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {urlResult.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importingUrl}
                  className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-accent transition flex items-center gap-1.5"
                >
                  {importingUrl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting with Jina + Gemini...</span>
                    </>
                  ) : (
                    <span>Extract & Ingest</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Listing Page Crawler */}
      {showListingModal && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface border border-border w-full max-w-xl rounded-2xl shadow-elevated p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold text-ink">Crawl Event Listing Page</h3>
              </div>
              <button onClick={() => setShowListingModal(false)} className="text-ink-muted hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrawlListing} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Listing Page URL
                </label>
                <input
                  type="url"
                  value={listingUrl}
                  onChange={(e) => setListingUrl(e.target.value)}
                  placeholder="e.g. https://www.eventbrite.com/d/india--pune/all-events/"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-border bg-surface-2 focus:outline-none"
                  required
                />
              </div>

              {listingResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    listingResult.ok
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {listingResult.message}
                </div>
              )}

              {/* Discovered Deep Links List */}
              {discoveredLinks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="text-xs font-bold text-ink">
                    Discovered Links ({discoveredLinks.length}):
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {discoveredLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-surface-2 border border-border text-xs flex items-center justify-between gap-2"
                      >
                        <span className="truncate text-ink-muted font-mono">{link}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setUrlInput(link);
                            setShowUrlModal(true);
                            setShowListingModal(false);
                          }}
                          className="px-2 py-1 rounded bg-brand text-white text-[10px] font-bold hover:bg-accent shrink-0"
                        >
                          Ingest
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowListingModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-surface-2"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={crawlingListing}
                  className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-accent transition flex items-center gap-1.5"
                >
                  {crawlingListing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Crawling with Jina Reader...</span>
                    </>
                  ) : (
                    <span>Start Crawl</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {selectedEvent && (
        <EventEditModal
          event={selectedEvent}
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
          onSave={async (fields) => {
            const res = await fetch('/api/admin/events', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: selectedEvent.id, updates: fields }),
            });
            if (res.ok) {
              setSelectedEvent(null);
              await fetchDashboardData();
            }
          }}
        />
      )}
    </div>
  );
}
