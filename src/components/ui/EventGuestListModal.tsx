'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Download, 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Check,
  CheckCheck
} from 'lucide-react';
import { EventItem, RSVPItem } from '@/types';
import { 
  getEventRSVPs, 
  subscribeToStore, 
  syncRSVPsWithSupabase,
  formatIST, 
  approveWaitlistGuest, 
  rejectWaitlistGuest, 
  approveAllWaitlist 
} from '@/lib/store';

interface EventGuestListModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  defaultFilter?: 'all' | 'confirmed' | 'waitlisted' | 'cancelled';
}

export default function EventGuestListModal({
  event,
  isOpen,
  onClose,
  defaultFilter = 'all'
}: EventGuestListModalProps) {
  const [rsvps, setRsvps] = useState<RSVPItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'waitlisted' | 'cancelled'>(defaultFilter);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (defaultFilter) {
      setStatusFilter(defaultFilter);
    }
  }, [defaultFilter]);

  useEffect(() => {
    const load = () => {
      setRsvps(getEventRSVPs(event.id));
    };
    load();
    syncRSVPsWithSupabase().then(() => load()).catch(() => {});
    const unsub = subscribeToStore(load);
    return () => unsub();
  }, [event.id]);

  if (!isOpen) return null;

  const filtered = rsvps.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.phone && r.phone.includes(search));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const confirmedCount = rsvps.filter((r) => r.status === 'confirmed').length;
  const waitlistCount = rsvps.filter((r) => r.status === 'waitlisted').length;
  const cancelledCount = rsvps.filter((r) => r.status === 'cancelled').length;

  const handleApprove = (rsvp: RSVPItem) => {
    approveWaitlistGuest(rsvp.id);
    setFeedback(`✓ Approved ${rsvp.name}! Pass unlocked & email sent.`);
    setTimeout(() => setFeedback(null), 3000);

    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'rsvp_confirmed',
        to: rsvp.email,
        guestName: rsvp.name,
        event
      })
    }).catch(console.warn);
  };

  const handleReject = (rsvp: RSVPItem) => {
    rejectWaitlistGuest(rsvp.id);
    setFeedback(`Declined waitlist request for ${rsvp.name}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleApproveAll = () => {
    const waitlistedGuests = rsvps.filter(r => r.status === 'waitlisted');
    approveAllWaitlist(event.id);
    setFeedback(`✓ Approved all ${waitlistedGuests.length} waitlisted guests!`);
    setTimeout(() => setFeedback(null), 3500);

    waitlistedGuests.forEach(g => {
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'rsvp_confirmed',
          to: g.email,
          guestName: g.name,
          event
        })
      }).catch(console.warn);
    });
  };

  const exportCSV = () => {
    if (filtered.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'Status', 'Plus One', 'Dietary', 'Registered At'];
    const rows = filtered.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.phone || ''}"`,
      `"${r.status}"`,
      `"${(r.plus_one_name || '').replace(/"/g, '""')}"`,
      `"${r.dietary || ''}"`,
      `"${new Date(r.created_at).toLocaleString('en-IN')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.slug}-attendees-${statusFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border bg-gradient-to-b from-surface-2 to-surface">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-accent">
                  Host Control Center
                </span>
                <span className="text-ink-muted text-xs">•</span>
                <span className="text-xs font-semibold text-ink-secondary truncate max-w-xs">
                  {event.title}
                </span>
              </div>
              <h3 className="font-display font-black text-2xl text-ink mt-0.5">
                Attendee Roster & Guests
              </h3>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-2 hover:bg-surface-3 border border-border text-ink hover:text-accent flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-surface-3 text-ink font-semibold">
              {rsvps.length} Total Registered
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              {confirmedCount} Confirmed
            </span>
            {waitlistCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 font-bold border border-amber-300 animate-pulse">
                {waitlistCount} Waitlist Requests
              </span>
            )}
            {cancelledCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-semibold border border-red-200">
                {cancelledCount} Cancelled
              </span>
            )}
          </div>

          {/* Toast feedback */}
          {feedback && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold animate-fade-in">
              {feedback}
            </div>
          )}
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 border-b border-border bg-surface flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-2 border border-border text-ink text-xs focus:outline-hidden focus:border-accent"
            />
          </div>

          {/* CSV Export */}
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface-2 hover:bg-surface-3 text-ink text-xs font-semibold disabled:opacity-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-accent" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="px-4 py-2 bg-surface-2/60 border-b border-border flex items-center justify-between gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-surface text-ink font-bold shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              All ({rsvps.length})
            </button>
            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-50 text-emerald-800 font-bold shadow-xs border border-emerald-200'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Confirmed ({confirmedCount})
            </button>
            {waitlistCount > 0 && (
              <button
                onClick={() => setStatusFilter('waitlisted')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === 'waitlisted'
                    ? 'bg-amber-50 text-amber-900 font-bold shadow-xs border border-amber-300'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Waitlist ({waitlistCount})
              </button>
            )}
            {cancelledCount > 0 && (
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === 'cancelled'
                    ? 'bg-red-50 text-red-800 font-bold shadow-xs border border-red-200'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            )}
          </div>

          {/* Batch Accept All button when waitlist is active */}
          {waitlistCount > 0 && (statusFilter === 'waitlisted' || statusFilter === 'all') && (
            <button
              onClick={handleApproveAll}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Accept All ({waitlistCount})</span>
            </button>
          )}
        </div>

        {/* Guests List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-surface-2 text-ink-muted mx-auto flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-ink">No attendee records found</p>
              <p className="text-xs text-ink-muted max-w-xs mx-auto">
                {search
                  ? 'Try searching with a different name or email.'
                  : 'Share your event link on WhatsApp or Twitter to get your first RSVPs!'}
              </p>
            </div>
          ) : (
            filtered.map((rsvp) => {
              const isCancelled = rsvp.status === 'cancelled';
              const isWaitlisted = rsvp.status === 'waitlisted';

              return (
                <div
                  key={rsvp.id}
                  className="pt-2.5 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-brand text-gold font-display font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                      {rsvp.name[0]}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink truncate">
                          {rsvp.name}
                        </span>
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full bg-red-100 text-red-700">
                            <XCircle className="w-2.5 h-2.5" /> Cancelled
                          </span>
                        ) : isWaitlisted ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-2.5 h-2.5 text-amber-700" /> Waitlist
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Confirmed Pass
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                        <span className="flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-ink-muted" />
                          {rsvp.email}
                        </span>
                        {rsvp.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-ink-muted" />
                            {rsvp.phone}
                          </span>
                        )}
                      </div>

                      {(rsvp.plus_one_name || rsvp.dietary || rsvp.tshirt_size) && (
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px]">
                          {rsvp.plus_one_name && (
                            <span className="bg-surface-2 px-2 py-0.5 rounded border border-border text-ink">
                              +1: <strong className="font-semibold">{rsvp.plus_one_name}</strong>
                            </span>
                          )}
                          {rsvp.dietary && rsvp.dietary !== 'none' && (
                            <span className="bg-surface-2 px-2 py-0.5 rounded border border-border text-ink">
                              Diet: <strong className="font-semibold">{rsvp.dietary}</strong>
                            </span>
                          )}
                          {rsvp.tshirt_size && (
                            <span className="bg-surface-2 px-2 py-0.5 rounded border border-border text-ink">
                              Size: <strong className="font-semibold">{rsvp.tshirt_size}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Action controls for waitlist OR registration timestamp */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {isWaitlisted ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(rsvp)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                          title="Accept waitlist request & issue pass"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleReject(rsvp)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all"
                          title="Decline request"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-[11px] text-ink-muted">
                        <span className="font-mono block">
                          {formatIST(rsvp.created_at)}
                        </span>
                        <span className="text-[10px] text-accent font-semibold block mt-0.5">
                          {isCancelled ? 'Void' : '1 Admission Pass'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-2 flex items-center justify-between text-xs">
          <span className="text-ink-muted">
            Viewing {filtered.length} of {rsvps.length} attendees
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-border text-ink hover:bg-surface-3 font-semibold transition-colors"
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  );
}
