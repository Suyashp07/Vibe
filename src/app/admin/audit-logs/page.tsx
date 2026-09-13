'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Code2,
  Lock,
  User,
  Activity,
  Calendar
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [tablePending, setTablePending] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = targetTypeFilter === 'all'
        ? '/api/admin/audit-logs?limit=100'
        : `/api/admin/audit-logs?limit=100&targetType=${targetTypeFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.tablePending) {
        setTablePending(true);
      } else {
        setTablePending(false);
      }
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [targetTypeFilter]);

  const filteredLogs = logs.filter((log) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.action?.toLowerCase().includes(q) ||
        log.actor_email?.toLowerCase().includes(q) ||
        log.target_id?.toLowerCase().includes(q) ||
        log.target_type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-display">
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Immutable, append-only chronological log of all curator & administrative actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {tablePending && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
          <div className="font-bold flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Database Schema Notice</span>
          </div>
          <p className="text-amber-200/80">
            The <code className="font-mono bg-black/40 px-1 py-0.5 rounded">audit_logs</code> table is configured in <code className="font-mono bg-black/40 px-1 py-0.5 rounded">supabase/admin_schema.sql</code>. If you haven't run the SQL migration yet in your Supabase SQL Editor, run it to activate immutable persistence!
          </p>
        </div>
      )}

      {/* Control Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0F19] p-2.5 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-1 overflow-x-auto">
          {['all', 'event', 'curator', 'rsvp', 'profile'].map((type) => (
            <button
              key={type}
              onClick={() => setTargetTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                targetTypeFilter === type
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {type === 'all' ? 'All Records' : `${type}s`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor, target..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8621A]"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#0B0F19] border border-zinc-800/90 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-zinc-500 font-mono">
            Loading immutable security log trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-xs text-zinc-500">
            No audit records captured matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/60 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Action</th>
                  <th className="py-3.5 px-4 font-semibold">Actor</th>
                  <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Payload Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-zinc-400 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action?.includes('PUBLISH')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : log.action?.includes('DELETE') || log.action?.includes('REVOKE')
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-zinc-200">{log.actor_email}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{log.actor_role || 'staff'}</div>
                    </td>

                    {/* Target */}
                    <td className="py-3 px-4 text-[11px]">
                      <span className="text-zinc-500 capitalize">{log.target_type}:</span>{' '}
                      <span className="text-zinc-300">{log.target_id?.slice(0, 16)}...</span>
                    </td>

                    {/* Metadata view button */}
                    <td className="py-3 px-4 text-right">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] transition font-sans inline-flex items-center gap-1"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>Inspect Diff</span>
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F131E] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-zinc-400">Action:</span>
                <span className="font-bold text-white">{selectedLog.action}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Close &times;
              </button>
            </div>

            <div className="text-xs space-y-1 text-zinc-400">
              <div>Actor: <strong className="text-zinc-200">{selectedLog.actor_email}</strong></div>
              <div>Timestamp: <strong className="text-zinc-200 font-mono">{new Date(selectedLog.created_at).toISOString()}</strong></div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-zinc-400 mb-1.5 uppercase font-semibold">
                Event Metadata Payload:
              </div>
              <pre className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 font-mono overflow-x-auto max-h-64">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
