'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { areDuplicates } from '@/lib/aggregation/dedup';
import { useAuth } from '@/lib/auth';
import { calculateEventSurety } from '@/lib/eventSurety';
import {
  AdminEvent,
  isIngestedEvent,
  toDateInputValue,
  toTimeInputValue,
} from '@/components/admin/types';
import AdminHeader from '@/components/admin/AdminHeader';
import {
  CuratorFilterBar,
  BulkActionBar,
  StatusTabItem,
} from '@/components/admin/CuratorTools';
import EventApprovalQueue from '@/components/admin/EventApprovalQueue';
import DetailInspector from '@/components/admin/DetailInspector';
import AddByUrlModal from '@/components/admin/AddByUrlModal';
import CreateEventModal from '@/components/admin/CreateEventModal';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'AUTO_APPROVED' | 'REVIEW' | 'REJECTED'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'VIBE' | 'INGESTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection & Details
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulking, setBulking] = useState<string | null>(null);

  // Modals
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Data Loading
  const fetchEvents = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Compute status counts with 90% Surety Auto-Approval rule and source counts
  const counts = useMemo(() => {
    let pending = 0;
    let autoApproved = 0;
    let live = 0;
    let rejected = 0;
    let vibe = 0;
    let ingested = 0;

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

      if (isIngestedEvent(ev)) {
        ingested++;
      } else {
        vibe++;
      }
    });

    return { pending, autoApproved, live, rejected, vibe, ingested, total: events.length };
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

  // Filtered Events with Status, Source, and Search
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
        return true;
      })
      .filter((ev) => {
        if (sourceFilter === 'VIBE') return !isIngestedEvent(ev);
        if (sourceFilter === 'INGESTED') return isIngestedEvent(ev);
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
  }, [events, statusFilter, sourceFilter, searchQuery]);

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
      const dateVal = toDateInputValue(selectedEvent.date, selectedEvent.start_at);
      const timeVal = toTimeInputValue(selectedEvent.time, selectedEvent.start_at) || '18:00';
      let validStartAt = selectedEvent.start_at;
      if (dateVal) {
        try {
          const combined = new Date(`${dateVal}T${timeVal}:00`);
          if (!isNaN(combined.getTime())) {
            validStartAt = combined.toISOString();
          }
        } catch {}
      }

      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEvent.id,
          updates: {
            title: selectedEvent.title || selectedEvent.name,
            start_at: validStartAt,
            date: dateVal,
            time: timeVal,
            city: selectedEvent.city,
            venue_name: selectedEvent.venue_name || selectedEvent.location_name,
            location_name: selectedEvent.venue_name || selectedEvent.location_name,
            venue_address: selectedEvent.venue_address || selectedEvent.location_address,
            location_address: selectedEvent.venue_address || selectedEvent.location_address,
            category: selectedEvent.category,
            price_text: selectedEvent.price_text || selectedEvent.external_price_text,
            external_price_text: selectedEvent.price_text || selectedEvent.external_price_text,
            external_ticket_url: selectedEvent.external_ticket_url || selectedEvent.ticket_link,
            description: selectedEvent.description,
            cover_image_url: selectedEvent.cover_image_url || selectedEvent.cover_image,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save changes');
      }

      const data = await res.json();
      if (data?.event) {
        setSelectedEvent((prev) => (prev ? { ...prev, ...data.event } : data.event));
      }
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

  const STATUS_TABS: StatusTabItem[] = [
    { id: 'ALL', label: 'All Events', count: counts.total },
    { id: 'LIVE', label: 'Live Published', count: counts.live },
    { id: 'AUTO_APPROVED', label: 'Auto-Approved (≥90%)', count: counts.autoApproved },
    { id: 'REVIEW', label: 'Needs Approval (<90%)', count: counts.pending, alert: counts.pending > 0 },
    { id: 'REJECTED', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] flex flex-col font-sans selection:bg-[#0A0A0A] selection:text-white">
      {/* Top Header */}
      <AdminHeader
        email={profile?.email}
        onOpenUrlModal={() => setShowUrlModal(true)}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onSignOut={() => signOut()}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col">
        {/* Navigation & Controls Bar */}
        <CuratorFilterBar
          statusTabs={STATUS_TABS}
          activeStatus={statusFilter}
          onStatusChange={(status) => {
            setStatusFilter(status);
            setSelectedEvent(null);
          }}
          sourceFilter={sourceFilter}
          onSourceChange={(source) => {
            setSourceFilter(source);
            setSelectedEvent(null);
          }}
          counts={counts}
          filteredCount={filteredEvents.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loading}
          onRefresh={fetchEvents}
        />

        {/* Master-Detail Two-Pane Workstation */}
        <div className="flex-1 flex gap-6 items-start">
          {/* Left Pane: Queue List */}
          <div className={`flex flex-col gap-2 ${selectedEvent ? 'hidden md:flex md:w-[380px] lg:w-[420px] md:shrink-0 md:max-h-[calc(100vh-160px)] md:overflow-y-auto pr-1' : 'w-full'}`}>
            <EventApprovalQueue
              events={filteredEvents}
              loading={loading}
              statusFilter={statusFilter}
              selectedEvent={selectedEvent}
              selectedIds={selectedIds}
              savingAction={savingAction}
              onSelectEvent={setSelectedEvent}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onApprove={handleApprove}
              onReject={handleReject}
              findDuplicateMatch={findDuplicateMatch}
            />
          </div>

          {/* Right Pane: Detail Panel Inspector */}
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
      <BulkActionBar
        selectedCount={selectedIds.size}
        bulking={bulking}
        onApproveAll={() => handleBulkAction('approve')}
        onRejectAll={() => handleBulkAction('reject')}
        onDeleteSelected={() => handleBulkAction('delete')}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Modal: Add Event by URL */}
      <AddByUrlModal
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        onSuccess={fetchEvents}
      />

      {/* Modal: Manual Create Event */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchEvents}
      />
    </div>
  );
}
