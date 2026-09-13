'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Ticket,
  Mail,
  RefreshCw,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function AdminRsvpsPage() {
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCheckin, setFilterCheckin] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRsvps = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rsvps');
      if (!res.ok) throw new Error('Failed to fetch RSVPs');
      const data = await res.json();
      setRsvps(data.rsvps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRsvps();
  }, []);

  const handleToggleCheckin = async (rsvp: any) => {
    const nextState = !rsvp.checked_in;
    setActionLoading(`check-${rsvp.id}`);
    try {
      const res = await fetch('/api/admin/rsvps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rsvp.id,
          checked_in: nextState,
        }),
      });
      if (!res.ok) throw new Error('Failed to update check-in status');
      await fetchRsvps();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRsvps = rsvps.filter((r) => {
    if (filterCheckin === 'checked_in' && !r.checked_in) return false;
    if (filterCheckin === 'pending' && r.checked_in) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.pass_id?.toLowerCase().includes(q) ||
        r.events?.title?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalAttendees = rsvps.length;
  const checkedInCount = rsvps.filter((r) => r.checked_in).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-display">
            Global Attendee Database & Gate Check-In
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time RSVP verification, attendee lookups, and audit-logged gate check-ins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRsvps}
            disabled={loading}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-zinc-800">
          <div className="text-zinc-400 text-xs">Total Registered Attendees</div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {totalAttendees}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-zinc-800">
          <div className="text-zinc-400 text-xs">Admitted & Checked In</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {checkedInCount}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0B0F19] border border-zinc-800">
          <div className="text-zinc-400 text-xs">Pending Gate Admission</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {totalAttendees - checkedInCount}
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0F19] p-2.5 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterCheckin('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterCheckin === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Guests ({rsvps.length})
          </button>
          <button
            onClick={() => setFilterCheckin('checked_in')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterCheckin === 'checked_in'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Admitted ({checkedInCount})
          </button>
          <button
            onClick={() => setFilterCheckin('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterCheckin === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pending ({totalAttendees - checkedInCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, pass ID..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8621A]"
          />
        </div>
      </div>

      {/* RSVPs Table */}
      <div className="rounded-2xl bg-[#0B0F19] border border-zinc-800/90 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-zinc-500 font-mono">
            Loading attendee database...
          </div>
        ) : filteredRsvps.length === 0 ? (
          <div className="p-16 text-center text-xs text-zinc-500">
            No attendees found matching the query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/60 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Guest</th>
                  <th className="py-3.5 px-4 font-semibold">Event</th>
                  <th className="py-3.5 px-4 font-semibold">Pass ID</th>
                  <th className="py-3.5 px-4 font-semibold">Registered</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredRsvps.map((rsvp) => (
                  <tr key={rsvp.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{rsvp.name || 'Anonymous Guest'}</div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-zinc-500" />
                        <span>{rsvp.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-200 truncate max-w-[200px]">
                        {rsvp.events?.title || 'Unknown Event'}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {rsvp.events?.date || 'TBA'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-orange-300 text-[11px]">
                      {rsvp.pass_id || `RSVP-${rsvp.id?.slice(0, 6)}`}
                    </td>

                    <td className="py-3 px-4 text-zinc-400 text-[11px] font-mono">
                      {rsvp.created_at ? new Date(rsvp.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleCheckin(rsvp)}
                        disabled={actionLoading === `check-${rsvp.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-mono border transition ${
                          rsvp.checked_in
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                        }`}
                      >
                        {rsvp.checked_in ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Admitted</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Mark Admitted</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
