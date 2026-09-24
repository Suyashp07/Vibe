'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  Plus,
  LogOut,
  Loader2,
  RefreshCw,
  Search,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Upload,
  Wand2,
  Link2,
  Archive,
  Trash2,
  Edit3,
  Eye,
  Check,
  Tag,
  ShieldCheck,
  Copy,
  ChevronRight,
  Layers
} from 'lucide-react';
import { areDuplicates } from '@/lib/aggregation/dedup';
import { useAuth } from '@/lib/auth';
import { calculateEventSurety } from '@/lib/eventSurety';

interface AdminEvent {
  id: string;
  title: string;
  name?: string;
  tagline?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  date?: string;
  time?: string;
  city?: string;
  location_name?: string;
  venue_name?: string;
  location_address?: string;
  venue_address?: string;
  cover_image?: string;
  cover_image_url?: string;
  image_url?: string;
  status: string;
  is_public?: boolean;
  is_external?: boolean;
  source_platform?: string;
  source_type?: string;
  external_ticket_url?: string;
  ticket_link?: string;
  price_inr?: number;
  external_price_text?: string;
  price_text?: string;
  category?: string;
  slug?: string;
  created_at?: string;
  profiles?: {
    id: string;
    name?: string;
    email?: string;
    handle?: string;
    logo_url?: string;
  } | null;
}

const CATEGORIES = [
  'Tech & AI',
  'Music & Concerts',
  'Comedy & Standup',
  'Social & Mixers',
  'Design & Creative',
  'Wellness & Fitness',
  'Culture & Baithak',
  'Food & Drinks',
  'Other'
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { profile, isStaff, signOut } = useAuth();

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  // Tabs: Review (draft/<90% surety), Auto-Approved (>=90%), Live (published), Rejected (cancelled), External, All
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'AUTO_APPROVED' | 'REVIEW' | 'EXTERNAL' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulking, setBulking] = useState<string | null>(null);

  // Modals
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const [urlResult, setUrlResult] = useState<{ ok: boolean; message: string } | null>(null);


  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    city: 'Mumbai',
    venue_name: '',
    category: 'Tech & AI',
    price_text: 'Free Entry',
    cover_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    external_ticket_url: '',
    status: 'live',
  });

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/events');
      if (res.status === 401) {
        router.push('/login?next=/admin');
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load events (${res.status})`);
      }
      const data = await res.json();
      const rawEvents: AdminEvent[] = data.events || [];
      setEvents(rawEvents);

      // Keep selected event synced if still present
      if (selectedEvent) {
        const matched = rawEvents.find((e) => e.id === selectedEvent.id);
        if (matched) setSelectedEvent(matched);
      }
    } catch (err: any) {
      console.error('Error loading admin events:', err);
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Compute status counts with 90% Surety Auto-Approval rule
  const counts = useMemo(() => {
    let pending = 0;
    let autoApproved = 0;
    let live = 0;
    let rejected = 0;
    let external = 0;
    events.forEach((ev) => {
      const st = (ev.status || '').toLowerCase();
      const isDraft = st === 'draft' || st === 'review';
      const surety = calculateEventSurety(ev);

      if (isDraft || !surety.autoApproved) {
        pending++;
      } else {
        autoApproved++;
      }

      if (st === 'live' || st === 'published') live++;
      else if (st === 'cancelled' || st === 'rejected') rejected++;

      if (ev.is_external || ev.source_type === 'external' || ev.external_ticket_url) {
        external++;
      }
    });
    return { pending, autoApproved, live, rejected, external, total: events.length };
  }, [events]);

  // Duplicate Finder
  const findDuplicateMatch = (event: AdminEvent): AdminEvent | undefined => {
    return events.find((other) => {
      if (other.id === event.id) return false;
      return areDuplicates(
        {
          name: event.title || event.name || '',
          date: event.date || (event.start_at ? event.start_at.split('T')[0] : null),
          venue: event.venue_name || event.location_name || event.city
        },
        {
          name: other.title || other.name || '',
          date: other.date || (other.start_at ? other.start_at.split('T')[0] : null),
          venue: other.venue_name || other.location_name || other.city
        }
      );
    });
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        const st = (ev.status || '').toLowerCase();
        const isDraft = st === 'draft' || st === 'review';
        const surety = calculateEventSurety(ev);

        if (statusFilter === 'REVIEW') return isDraft || !surety.autoApproved;
        if (statusFilter === 'AUTO_APPROVED') return !isDraft && surety.autoApproved;
        if (statusFilter === 'LIVE') return st === 'live' || st === 'published';
        if (statusFilter === 'REJECTED') return st === 'cancelled' || st === 'rejected';
        if (statusFilter === 'EXTERNAL') return ev.is_external || ev.source_type === 'external' || Boolean(ev.external_ticket_url);
        return true;
      })
      .filter((ev) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (ev.title || '').toLowerCase().includes(q) ||
          (ev.city || '').toLowerCase().includes(q) ||
          (ev.venue_name || ev.location_name || '').toLowerCase().includes(q) ||
          (ev.category || '').toLowerCase().includes(q) ||
          (ev.source_platform || '').toLowerCase().includes(q)
        );
      });
  }, [events, statusFilter, searchQuery]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredEvents.map((e) => e.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id));
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // 1-Click Approve
  const handleApprove = async (event: AdminEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavingAction(`approve-${event.id}`);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          updates: { status: 'live', is_public: true },
        }),
      });
      if (!res.ok) throw new Error('Failed to approve event');
      await fetchEvents();
      if (selectedEvent?.id === event.id) {
        setSelectedEvent((prev) => (prev ? { ...prev, status: 'live', is_public: true } : null));
      }
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setSavingAction(null);
    }
  };

  // 1-Click Reject
  const handleReject = async (event: AdminEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavingAction(`reject-${event.id}`);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: event.id,
          updates: { status: 'cancelled', is_public: false },
        }),
      });
      if (!res.ok) throw new Error('Failed to reject event');
      await fetchEvents();
      if (selectedEvent?.id === event.id) {
        setSelectedEvent((prev) => (prev ? { ...prev, status: 'cancelled', is_public: false } : null));
      }
    } catch (err: any) {
      alert(`Reject error: ${err.message}`);
    } finally {
      setSavingAction(null);
    }
  };

  // Delete Permanently
  const handleDeletePermanently = async (id: string) => {
    if (!confirm('Permanently delete this event from the database? This cannot be undone.')) return;
    setSavingAction(`delete-${id}`);
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete event');
      if (selectedEvent?.id === id) setSelectedEvent(null);
      await fetchEvents();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setSavingAction(null);
    }
  };

  // Save Inline Edits in Inspector
  const handleSaveInspectorEdits = async () => {
    if (!selectedEvent) return;
    setSavingAction('saving-edits');
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEvent.id,
          updates: {
            title: selectedEvent.title,
            date: selectedEvent.date,
            time: selectedEvent.time,
            city: selectedEvent.city,
            venue_name: selectedEvent.venue_name,
            location_name: selectedEvent.venue_name,
            venue_address: selectedEvent.venue_address,
            location_address: selectedEvent.venue_address,
            category: selectedEvent.category,
            price_text: selectedEvent.price_text || selectedEvent.external_price_text,
            external_price_text: selectedEvent.price_text || selectedEvent.external_price_text,
            external_ticket_url: selectedEvent.external_ticket_url || selectedEvent.ticket_link,
            description: selectedEvent.description,
            cover_image_url: selectedEvent.cover_image_url || selectedEvent.cover_image,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to save changes');
      await fetchEvents();
      alert('Event changes saved successfully.');
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSavingAction(null);
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (action === 'delete' && !confirm(`Permanently delete ${ids.length} selected event(s)?`)) return;

    setBulking(action);
    try {
      if (action === 'approve') {
        for (const id of ids) {
          await fetch('/api/admin/events', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, updates: { status: 'live', is_public: true } }),
          });
        }
      } else if (action === 'reject') {
        for (const id of ids) {
          await fetch('/api/admin/events', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, updates: { status: 'cancelled', is_public: false } }),
          });
        }
      } else if (action === 'delete') {
        for (const id of ids) {
          await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
        }
      }
      setSelectedIds(new Set());
      await fetchEvents();
    } catch (err: any) {
      alert(`Bulk action error: ${err.message}`);
    } finally {
      setBulking(null);
    }
  };

  // Add Event by URL (Batch up to 8)
  const handleAddByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const urls = urlInput
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      setUrlResult({ ok: false, message: 'Please enter at least one URL.' });
      return;
    }
    const invalid = urls.find((u) => !/^https?:\/\//i.test(u));
    if (invalid) {
      setUrlResult({ ok: false, message: `Invalid link (must start with http:// or https://): ${invalid}` });
      return;
    }

    setAddingUrl(true);
    setUrlResult(null);

    let created = 0;
    let duplicates = 0;
    let failed = 0;

    for (const u of urls.slice(0, 8)) {
      try {
        const res = await fetch('/api/admin/events/from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: u }),
        });
        const data = await res.json();
        if (res.ok && (data.success || data.ok)) {
          if (data.isDuplicate) duplicates++;
          else created++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setAddingUrl(false);
    setUrlResult({
      ok: failed === 0,
      message: `Ingested ${created} new event(s), flagged ${duplicates} duplicate(s), ${failed} failed.`,
    });
    if (created > 0 || duplicates > 0) {
      await fetchEvents();
    }
  };

  // Manual Quick Create
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAction('creating-event');
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          time: '18:00',
          city: 'Mumbai',
          venue_name: '',
          category: 'Tech & AI',
          price_text: 'Free Entry',
          cover_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
          external_ticket_url: '',
          status: 'live',
        });
        await fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create event');
      }
    } catch (err: any) {
      alert(`Create event error: ${err.message}`);
    } finally {
      setSavingAction(null);
    }
  };

  const STATUS_TABS = [
    { id: 'ALL', label: 'All Events', count: counts.total },
    { id: 'LIVE', label: 'Live Published', count: counts.live },
    { id: 'AUTO_APPROVED', label: 'Auto-Approved (≥90%)', count: counts.autoApproved },
    { id: 'REVIEW', label: 'Needs Approval (<90%)', count: counts.pending, alert: counts.pending > 0 },
    { id: 'EXTERNAL', label: 'External Aggregated', count: counts.external },
    { id: 'REJECTED', label: 'Rejected', count: counts.rejected },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col font-sans selection:bg-[#0A0A0A] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-black text-base tracking-tight text-[#0A0A0A] hover:opacity-80 transition-opacity">
              VIBE
            </Link>
            <span className="text-[#94A3B8] text-sm">/</span>
            <div className="flex items-center gap-1.5 bg-[#F1F5F9] px-2.5 py-1 rounded-full text-xs font-semibold text-[#0A0A0A]">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Queue</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUrlModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0A0A0A] text-[#0A0A0A] text-xs font-semibold rounded-full hover:bg-[#F8FAFC] transition-colors"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add by URL</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] text-white text-xs font-semibold rounded-full hover:bg-[#262626] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#64748B] text-xs font-medium rounded-full hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Live Site</span>
            </Link>

            <div className="h-4 w-px bg-[#E2E8F0] mx-1 hidden sm:block" />

            {/* Staff info capsule & Logout */}
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[11px] font-medium text-[#64748B] truncate max-w-[140px]" title={profile?.email || ''}>
                {profile?.email?.split('@')[0]}
              </span>
              <button
                onClick={() => signOut()}
                title="Sign out of admin"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#64748B] text-xs font-medium rounded-full hover:border-red-300 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setSelectedEvent(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
                    active ? 'bg-[#0A0A0A] text-white' : 'text-[#64748B] hover:text-[#0A0A0A] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#475569]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search events, venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-full focus:outline-none focus:border-[#0A0A0A] transition-colors placeholder:text-[#94A3B8]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0A0A0A]">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={fetchEvents}
              disabled={loading}
              title="Refresh queue"
              className="p-2 border border-[#E2E8F0] rounded-full text-[#64748B] hover:text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Master-Detail Two-Pane Workstation */}
        <div className="flex-1 flex gap-6 items-start">
          {/* Left Pane: Queue List */}
          <div className={`flex flex-col gap-2 ${selectedEvent ? 'hidden md:flex md:w-[380px] lg:w-[420px] md:shrink-0 md:max-h-[calc(100vh-160px)] md:overflow-y-auto pr-1' : 'w-full'}`}>
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#94A3B8]">
                <Loader2 className="w-6 h-6 animate-spin text-[#0A0A0A]" />
                <span className="text-xs font-medium">Loading event queue...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-24 border border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center text-center p-6">
                <Layers className="w-8 h-8 text-[#CBD5E1] mb-2" />
                <p className="text-sm font-semibold text-[#0A0A0A]">No events in this view</p>
                <p className="text-xs text-[#64748B] mt-1 max-w-xs">
                  {statusFilter === 'REVIEW'
                    ? 'Great job! The review queue is currently clear.'
                    : 'Try selecting another status tab or importing new links.'}
                </p>
              </div>
            ) : (
              <>
                {/* Select All Bar */}
                <div className="flex items-center justify-between px-2 py-1 select-none">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filteredEvents.length > 0 && filteredEvents.every((e) => selectedIds.has(e.id))}
                      onChange={toggleSelectAll}
                      className="accent-[#0A0A0A] w-3.5 h-3.5 rounded cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-[#64748B]">
                      Select all · {filteredEvents.length} shown
                    </span>
                  </label>
                  <span className="text-[10px] text-[#94A3B8]">Sorted by recent</span>
                </div>

                {/* Queue Cards */}
                <div className="space-y-2">
                  {filteredEvents.map((event) => {
                    const isSelected = selectedEvent?.id === event.id;
                    const isChecked = selectedIds.has(event.id);
                    const duplicate = findDuplicateMatch(event);
                    const isPending = (event.status || '').toLowerCase() === 'draft' || (event.status || '').toLowerCase() === 'review';
                    const isLive = (event.status || '').toLowerCase() === 'live' || (event.status || '').toLowerCase() === 'published';
                    const isRejected = (event.status || '').toLowerCase() === 'cancelled' || (event.status || '').toLowerCase() === 'rejected';

                    const coverImg = event.cover_image_url || event.cover_image || event.image_url;
                    const surety = calculateEventSurety(event);

                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(isSelected ? null : event)}
                        className={`group relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0A0A0A] bg-[#F8FAFC] shadow-sm ring-1 ring-[#0A0A0A]'
                            : 'border-[#E2E8F0] bg-white hover:border-[#0A0A0A] hover:shadow-xs'
                        }`}
                      >
                        {/* Multi-select Checkbox */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(event.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-[#0A0A0A] w-4 h-4 shrink-0 rounded cursor-pointer"
                        />

                        {/* Poster Thumbnail */}
                        <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[#F1F5F9] relative border border-[#E2E8F0]">
                          {coverImg ? (
                            <Image
                              src={coverImg}
                              alt={event.title || ''}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-[#94A3B8]">
                              NO IMG
                            </div>
                          )}
                        </div>

                        {/* Card Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-xs truncate leading-tight text-[#0A0A0A]">
                              {event.title || event.name || 'Untitled Event'}
                            </h3>
                          </div>

                          <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                            {event.date || 'TBA'} {event.time ? `· ${event.time}` : ''}
                            {event.venue_name || event.city ? ` · ${event.venue_name || event.city}` : ''}
                          </p>

                          {/* Badges Bar */}
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {/* Event Surety Completeness Badge */}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${surety.badgeColor}`}
                              title={`Event completeness: ${surety.score}% (${surety.filledCount}/${surety.totalCount} details verified)`}
                            >
                              <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                              <span>{surety.score}% Surety</span>
                            </span>

                            {event.source_platform && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#F1F5F9] text-[#475569]">
                                {event.source_platform}
                              </span>
                            )}
                            {event.category && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#F1F5F9] text-[#64748B]">
                                {event.category}
                              </span>
                            )}
                            {duplicate && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Dup: {duplicate.title.slice(0, 14)}...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status & 1-Click Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {isPending && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleApprove(event, e)}
                                disabled={savingAction === `approve-${event.id}`}
                                title="1-Click Approve (Publish Live)"
                                className="p-1.5 rounded-full hover:bg-green-50 text-[#94A3B8] hover:text-green-600 transition-colors"
                              >
                                {savingAction === `approve-${event.id}` ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={(e) => handleReject(event, e)}
                                disabled={savingAction === `reject-${event.id}`}
                                title="1-Click Reject"
                                className="p-1.5 rounded-full hover:bg-red-50 text-[#94A3B8] hover:text-red-500 transition-colors"
                              >
                                {savingAction === `reject-${event.id}` ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}

                          {isLive && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 rounded-full">
                              Live
                            </span>
                          )}

                          {isRejected && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 rounded-full">
                              Rejected
                            </span>
                          )}

                          <ChevronRight className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-[#0A0A0A]' : 'text-[#CBD5E1] group-hover:text-[#0A0A0A]'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right Pane: Detail Panel Inspector (Only visible when an event is selected) */}
          {selectedEvent && (
            <div className="fixed inset-0 z-40 bg-white md:static md:z-auto md:flex-1 md:min-w-0 md:border md:border-[#E2E8F0] md:rounded-2xl md:p-5 md:shadow-xs md:max-h-[calc(100vh-160px)] md:overflow-y-auto">
              <DetailInspector
                event={selectedEvent}
                duplicate={findDuplicateMatch(selectedEvent)}
                savingAction={savingAction}
                onClose={() => setSelectedEvent(null)}
                onSave={handleSaveInspectorEdits}
                onApprove={() => handleApprove(selectedEvent)}
                onReject={() => handleReject(selectedEvent)}
                onDelete={() => handleDeletePermanently(selectedEvent.id)}
                onChange={(field, value) => {
                  setSelectedEvent((prev) => (prev ? { ...prev, [field]: value } : null));
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-2.5 bg-[#0A0A0A] text-white rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 border border-[#262626]">
          <span className="text-xs font-bold whitespace-nowrap">{selectedIds.size} selected</span>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={() => handleBulkAction('approve')}
            disabled={!!bulking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-full transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve All</span>
          </button>
          <button
            onClick={() => handleBulkAction('reject')}
            disabled={!!bulking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full transition-colors disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject All</span>
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={!!bulking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-white text-xs font-medium rounded-full transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            title="Clear selection"
            className="p-1 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {bulking && (
            <span className="text-[10px] text-white/70 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </span>
          )}
        </div>
      )}

      {/* Modal: Add Event by URL */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-[#E2E8F0] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-[#0A0A0A]">Add Event by URL</h2>
                <p className="text-[11px] text-[#64748B]">Batch ingest up to 8 links at once</p>
              </div>
              <button
                onClick={() => {
                  setShowUrlModal(false);
                  setUrlResult(null);
                  setUrlInput('');
                }}
                className="text-[#94A3B8] hover:text-[#0A0A0A]"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddByUrl} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-[#64748B] mb-2 leading-relaxed">
                  Paste event links from BookMyShow, Luma, District, etc. (one per line). AI will scrape full details, posters, and queue them for review.
                </p>
                <textarea
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  rows={5}
                  placeholder={'https://in.bookmyshow.com/events/...\nhttps://lu.ma/...\nhttps://www.district.in/events/...'}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A] font-mono transition-colors placeholder:text-[#94A3B8]"
                />
              </div>

              {urlResult && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-xl text-xs whitespace-pre-wrap ${
                    urlResult.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {urlResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{urlResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={addingUrl || !urlInput.trim()}
                className="w-full py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-[#262626] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addingUrl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting & Queueing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Ingest URLs to Review Queue</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Modal: Manual Create Event */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-[#E2E8F0] shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="font-bold text-sm text-[#0A0A0A]">Create Event Manually</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#94A3B8] hover:text-[#0A0A0A]">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Pune Tech Founders Mixer"
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Date</label>
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Time</label>
                  <input
                    type="time"
                    value={createForm.time}
                    onChange={(e) => setCreateForm((p) => ({ ...p, time: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">City</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Venue Name</label>
                  <input
                    type="text"
                    value={createForm.venue_name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, venue_name: e.target.value }))}
                    placeholder="WeWork / Cafe"
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Price</label>
                  <input
                    type="text"
                    value={createForm.price_text}
                    onChange={(e) => setCreateForm((p) => ({ ...p, price_text: e.target.value }))}
                    placeholder="Free Entry or ₹499"
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={createForm.cover_image_url}
                  onChange={(e) => setCreateForm((p) => ({ ...p, cover_image_url: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">External Ticket URL (Optional)</label>
                <input
                  type="url"
                  value={createForm.external_ticket_url}
                  onChange={(e) => setCreateForm((p) => ({ ...p, external_ticket_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Event overview..."
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingAction === 'creating-event'}
                className="w-full py-2.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-[#262626] transition-colors disabled:opacity-50"
              >
                {savingAction === 'creating-event' ? 'Creating...' : 'Create & Publish Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Detail Inspector Component (Right-Hand Pane)
function DetailInspector({
  event,
  duplicate,
  savingAction,
  onClose,
  onSave,
  onApprove,
  onReject,
  onDelete,
  onChange,
}: {
  event: AdminEvent;
  duplicate?: AdminEvent;
  savingAction: string | null;
  onClose: () => void;
  onSave: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onChange: (field: string, value: any) => void;
}) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [refetchUrl, setRefetchUrl] = useState(event.external_ticket_url || event.ticket_link || '');
  const [refetching, setRefetching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coverImg = event.cover_image_url || event.cover_image || event.image_url;
  const isPending = (event.status || '').toLowerCase() === 'draft' || (event.status || '').toLowerCase() === 'review';

  // Handle local file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          onChange('cover_image_url', result);
          onChange('cover_image', result);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Rescan from URL
  const handleRescan = async () => {
    if (!refetchUrl.trim()) return;
    setRefetching(true);
    try {
      const res = await fetch('/api/admin/events/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: refetchUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.extracted) {
        if (data.extracted.title) onChange('title', data.extracted.title);
        if (data.extracted.city) onChange('city', data.extracted.city);
        if (data.extracted.venue_name) onChange('venue_name', data.extracted.venue_name);
        if (data.extracted.cover_image_url) onChange('cover_image_url', data.extracted.cover_image_url);
        if (data.extracted.description) onChange('description', data.extracted.description);
        if (data.extracted.price_text) onChange('price_text', data.extracted.price_text);
        alert('Refreshed fields from URL.');
      } else {
        alert(data.error || 'Rescan failed');
      }
    } catch (err: any) {
      alert(`Rescan error: ${err.message}`);
    } finally {
      setRefetching(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="min-w-0">
          <h2 className="font-black text-base text-[#0A0A0A] truncate max-w-md">
            {event.title || event.name || 'Untitled Event'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                (event.status || '').toLowerCase() === 'live' || (event.status || '').toLowerCase() === 'published'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : (event.status || '').toLowerCase() === 'cancelled'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {event.status || 'Draft'}
            </span>
            {event.source_platform && (
              <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full font-medium">
                {event.source_platform}
              </span>
            )}
            {event.slug && (
              <Link
                href={`/${event.slug}`}
                target="_blank"
                className="text-[10px] text-[#2563EB] hover:underline flex items-center gap-0.5"
              >
                <span>{isPending || (event.status || '').toLowerCase() !== 'live' && (event.status || '').toLowerCase() !== 'published' ? 'View Draft' : 'View Live'}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isPending && (
            <>
              <button
                onClick={onApprove}
                disabled={savingAction === `approve-${event.id}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-[#262626] transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                onClick={onReject}
                disabled={savingAction === `reject-${event.id}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#E2E8F0] text-[#64748B] text-xs font-medium rounded-full hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}
          <button onClick={onClose} title="Close inspector" className="p-1 text-[#94A3B8] hover:text-[#0A0A0A]">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Duplicate Alert Banner */}
      {duplicate && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Potential Duplicate Detected</p>
            <p className="text-[11px] mt-0.5">
              Matches existing event <span className="font-semibold">"{duplicate.title}"</span> scheduled for{' '}
              {duplicate.date || 'same date'} at {duplicate.venue_name || duplicate.city}.
            </p>
          </div>
        </div>
      )}

      {/* Event Surety & Details Comparison Section */}
      {(() => {
        const surety = calculateEventSurety(event);
        return (
          <div className={`p-3.5 rounded-xl border ${surety.borderColor} ${surety.bgColor} space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${surety.textColor}`} />
                <div>
                  <h3 className="font-bold text-xs text-[#0A0A0A]">
                    Event Surety: <span className={surety.textColor}>{surety.score}%</span> ({surety.tier})
                  </h3>
                  <p className="text-[10px] text-[#64748B]">
                    {surety.filledCount} of {surety.totalCount} details verified
                  </p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${surety.badgeColor}`}>
                {surety.tier} Surety
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  surety.score >= 80 ? 'bg-emerald-500' : surety.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${surety.score}%` }}
              />
            </div>

            {/* Field Details Comparison Breakdown */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {surety.checks.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-[10px] bg-white border ${
                    c.present ? 'border-emerald-100' : 'border-rose-200'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <p className="font-semibold text-[#0A0A0A] truncate">{c.label}</p>
                    <p className="text-[9px] text-[#64748B] truncate">{c.value || c.tip}</p>
                  </div>
                  <span className="shrink-0">
                    {c.present ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[9px] flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        <span>OK</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[9px]">
                        Missing
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {surety.missingCritical.length > 0 && (
              <div className="text-[10px] text-rose-800 bg-rose-100/80 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>
                  Missing critical details: <strong className="font-semibold">{surety.missingCritical.join(', ')}</strong>. Please update before approving.
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Poster Section */}
      <div className="flex items-start gap-4">
        <div className="w-24 h-32 shrink-0 rounded-xl overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] relative">
          {coverImg ? (
            <Image src={coverImg} alt={event.title || ''} fill unoptimized className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center text-[10px] text-[#94A3B8] p-2">
              No Poster
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor="inspector-poster-upload"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-full text-xs font-semibold text-[#0A0A0A] cursor-pointer hover:border-[#0A0A0A] transition-colors"
            >
              <Upload className="w-3 h-3" />
              <span>{coverImg ? 'Replace Poster' : 'Upload Poster'}</span>
            </label>
            <input
              id="inspector-poster-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => setShowLinkInput((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-full text-xs font-semibold text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors"
            >
              <Link2 className="w-3 h-3" />
              <span>Link URL</span>
            </button>

            {coverImg && (
              <button
                type="button"
                onClick={() => {
                  onChange('cover_image_url', null);
                  onChange('cover_image', null);
                }}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
              >
                Remove
              </button>
            )}
          </div>

          {showLinkInput && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://... image link"
                className="flex-1 px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0A0A0A]"
              />
              <button
                type="button"
                onClick={() => {
                  if (linkUrl.trim()) {
                    onChange('cover_image_url', linkUrl.trim());
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }
                }}
                className="px-3 py-1.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-lg hover:bg-[#262626]"
              >
                Set
              </button>
            </div>
          )}

          <p className="text-[10px] text-[#94A3B8]">
            Poster displays on public event pages and discovery feeds. 1200x800 recommended.
          </p>
        </div>
      </div>

      {/* Re-scan from URL Box */}
      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
        <p className="text-xs font-bold text-[#475569] flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Auto-fill / Refresh from URL</span>
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={refetchUrl}
            onChange={(e) => setRefetchUrl(e.target.value)}
            placeholder="https://in.bookmyshow.com/... or https://lu.ma/..."
            className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0A0A0A] font-mono"
          />
          <button
            type="button"
            onClick={handleRescan}
            disabled={refetching || !refetchUrl.trim()}
            className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {refetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            <span>{refetching ? 'Scanning...' : 'Update'}</span>
          </button>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Event Title</label>
          <input
            type="text"
            value={event.title || event.name || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Date</label>
            <input
              type="date"
              value={event.date || ''}
              onChange={(e) => onChange('date', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Time</label>
            <input
              type="time"
              value={event.time || ''}
              onChange={(e) => onChange('time', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">City</label>
            <input
              type="text"
              value={event.city || ''}
              onChange={(e) => onChange('city', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Category</label>
            <select
              value={event.category || 'Tech & AI'}
              onChange={(e) => onChange('category', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Venue Name</label>
          <input
            type="text"
            value={event.venue_name || event.location_name || ''}
            onChange={(e) => onChange('venue_name', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Price</label>
            <input
              type="text"
              value={event.price_text || event.external_price_text || ''}
              onChange={(e) => onChange('price_text', e.target.value)}
              placeholder="Free Entry or ₹499"
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">External Ticket URL</label>
            <input
              type="url"
              value={event.external_ticket_url || event.ticket_link || ''}
              onChange={(e) => onChange('external_ticket_url', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Description</label>
          <textarea
            rows={4}
            value={event.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A] resize-y"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={savingAction === 'saving-edits'}
            className="px-4 py-2 border border-[#0A0A0A] text-[#0A0A0A] text-xs font-bold rounded-full hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
          >
            {savingAction === 'saving-edits' ? 'Saving...' : 'Save Changes'}
          </button>
          {isPending && (
            <button
              type="button"
              onClick={onApprove}
              disabled={savingAction === `approve-${event.id}`}
              className="px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-[#262626] transition-colors disabled:opacity-50"
            >
              Approve & Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
