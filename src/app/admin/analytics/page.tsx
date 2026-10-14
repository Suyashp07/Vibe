'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  ShieldCheck,
  Database,
  Clock,
  RefreshCw,
  UserPlus,
  Trash2,
  Copy,
  Check,
  Loader2,
  X,
  Zap,
} from 'lucide-react';
import AdminNavigation from '@/components/admin/AdminNavigation';

interface AnalyticsData {
  timestamp: string;
  caller: {
    email: string;
    role: string;
    isSuperAdmin: boolean;
  };
  usersOverview: {
    totalSignedUp: number;
    usersToday: number;
    usersThisWeek: number;
    usersThisMonth: number;
    roleCounts: {
      super_admin: number;
      curator: number;
      organizer: number;
      guest: number;
    };
  };
  superadmins: {
    count: number;
    list: Array<{
      email: string;
      name?: string;
      source: 'whitelist' | 'database' | 'granted';
      isPrimaryFounder: boolean;
      created_at?: string;
      userId?: string;
    }>;
  };
  databaseUtilization: {
    pingLatencyMs: number;
    status: string;
    totalTrackedRows: number;
    totalMb: number;
    quotaMb: number;
    percentQuotaUsed: number;
    remainingMb: number;
    userDataMb: number;
    tableStorageMb: Record<string, number>;
    tableStorageKb: Record<string, number>;
    tableRows: {
      profiles: number;
      events: number;
      rsvps: number;
      event_comments: number;
      audit_logs: number;
      date_polls: number;
      telegram_curators: number;
    };
    supabaseHost: string;
    serviceRoleActive: boolean;
    writesLast24h: {
      events: number;
      rsvps: number;
      users: number;
    };
  };
  platformEngagement: {
    cumulativeSeconds: number;
    totalMinutes: number;
    totalHours: number;
    todayMinutes: number;
    activeVisitorsNow: number;
    avgSessionMinutes: number;
  };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Grant superadmin modal state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantNotes, setGrantNotes] = useState('');
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  // Revoke state
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(true), 15000); // 15s live refresh
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Grant Superadmin Access
  const handleGrantSuperadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantEmail.trim() || !grantEmail.includes('@')) {
      setGrantError('Please enter a valid email address');
      return;
    }

    setGranting(true);
    setGrantError(null);
    try {
      const res = await fetch('/api/admin/superadmins/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: grantEmail.trim().toLowerCase(),
          notes: grantNotes.trim() || 'Granted via Admin Panel',
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to grant superadmin privileges');

      showToast(`Superadmin access granted to ${grantEmail.trim()}`);
      setGrantEmail('');
      setGrantNotes('');
      setShowGrantModal(false);
      await fetchAnalytics(true);
    } catch (err: any) {
      setGrantError(err.message || 'Operation failed');
    } finally {
      setGranting(false);
    }
  };

  // Revoke Superadmin Access
  const handleRevokeSuperadmin = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const confirmed = confirm(`Are you sure you want to revoke superadmin access for ${cleanEmail}?`);
    if (!confirmed) return;

    setRevokingEmail(cleanEmail);
    try {
      const res = await fetch(`/api/admin/superadmins/grant?email=${encodeURIComponent(cleanEmail)}`, {
        method: 'DELETE',
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to revoke access');

      // Optimistic removal from UI
      setData((prev: any) => {
        if (!prev) return prev;
        const nextList = (prev.superadmins?.list || []).filter(
          (a: any) => a.email.toLowerCase().trim() !== cleanEmail
        );
        return {
          ...prev,
          superadmins: {
            ...prev.superadmins,
            count: nextList.length,
            list: nextList,
          },
        };
      });

      showToast(`Revoked superadmin access for ${cleanEmail}`);
      await fetchAnalytics(true);
    } catch (err: any) {
      alert(err.message || 'Failed to revoke access');
    } finally {
      setRevokingEmail(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-12">
        <AdminNavigation activeSection="analytics" />
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#FF5500] animate-spin" />
          <span className="text-xs uppercase tracking-widest font-mono text-zinc-400">
            Loading Real-Time Analytics...
          </span>
        </div>
      </div>
    );
  }

  const {
    usersOverview = {
      totalSignedUp: 0,
      usersToday: 0,
      usersThisWeek: 0,
      usersThisMonth: 0,
      roleCounts: { super_admin: 0, curator: 0, organizer: 0, guest: 0 },
    },
    superadmins = { count: 0, list: [] },
    databaseUtilization = {
      pingLatencyMs: 0,
      status: 'Optimal',
      totalTrackedRows: 0,
      totalMb: 0,
      quotaMb: 500,
      percentQuotaUsed: 0,
      remainingMb: 500,
      userDataMb: 0,
      tableStorageMb: {},
      tableStorageKb: {},
      tableRows: { profiles: 0, events: 0, rsvps: 0, event_comments: 0, audit_logs: 0, date_polls: 0, telegram_curators: 0 },
      supabaseHost: 'supabase.co',
      serviceRoleActive: true,
      writesLast24h: { events: 0, rsvps: 0, users: 0 },
    },
    platformEngagement = {
      cumulativeSeconds: 0,
      totalMinutes: 0,
      totalHours: 0,
      todayMinutes: 0,
      activeVisitorsNow: 1,
      avgSessionMinutes: 0,
    },
  } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-12">
      <AdminNavigation activeSection="analytics" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs shadow-2xl flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight font-display">
            Real-Time Platform Analytics
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Live monitoring of registered users, superadmin credentials, Supabase database storage in MB, and platform engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAnalytics()}
            disabled={refreshing}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Core Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TILE 1: Registered Users */}
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {usersOverview.totalSignedUp}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {usersOverview.roleCounts.organizer} organizers • +{usersOverview.usersToday} today
          </div>
        </div>

        {/* TILE 2: Superadmin Access */}
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Superadmin Access</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {superadmins.count}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
            <span>Privileged IDs</span>
            <button
              onClick={() => setShowGrantModal(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              + Grant
            </button>
          </div>
        </div>

        {/* TILE 3: Supabase Database Storage */}
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Database Storage</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {databaseUtilization.totalMb} <span className="text-sm font-normal text-zinc-400">MB</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {databaseUtilization.percentQuotaUsed}% of 500MB • {databaseUtilization.totalTrackedRows} rows
          </div>
        </div>

        {/* TILE 4: Platform Time Spent */}
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Platform Time Spent</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            {platformEngagement.totalHours} <span className="text-sm font-normal text-zinc-400">hrs</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">{platformEngagement.activeVisitorsNow} active now</span>
          </div>
        </div>
      </div>

      {/* 2 Focused Modules: Superadmins & Database Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module 1: Superadmin Accounts & Access Controller (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0B0F19] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Superadmin Accounts & Access Controller</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Accounts holding administrative privileges. Grant new emails or revoke access.
              </p>
            </div>
            <button
              onClick={() => setShowGrantModal(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Grant Email</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Administrator</th>
                  <th className="py-2.5 px-3 font-semibold">Tier</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 font-mono">
                {superadmins.list.map((admin) => (
                  <tr key={admin.email} className="hover:bg-zinc-900/40 transition">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                          {admin.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium text-xs font-sans">
                            {admin.name || admin.email.split('@')[0]}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                            <span>{admin.email}</span>
                            <button
                              onClick={() => handleCopy(admin.email)}
                              className="text-zinc-500 hover:text-white"
                              title="Copy Email"
                            >
                              {copiedEmail === admin.email ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      {admin.isPrimaryFounder ? (
                        <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                          Founder (Protected)
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-300 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                          Super Admin
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {admin.isPrimaryFounder ? (
                        <span className="text-[10px] text-zinc-600 font-mono">Protected</span>
                      ) : (
                        <button
                          onClick={() => handleRevokeSuperadmin(admin.email)}
                          disabled={revokingEmail === admin.email}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition disabled:opacity-50"
                          title="Revoke Superadmin Access"
                        >
                          {revokingEmail === admin.email ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Module 2: Supabase Database Utilization (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0B0F19] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>Supabase Database Utilization</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Storage volume in MB across active PostgreSQL collections
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {databaseUtilization.pingLatencyMs}ms
            </span>
          </div>

          {/* Storage Quota Progress Bar */}
          <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Storage Footprint</span>
              <span className="font-mono text-purple-300 font-bold">
                {databaseUtilization.totalMb} MB <span className="text-zinc-500 text-[10px]">/ 500 MB</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-[#FF5500] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(databaseUtilization.percentQuotaUsed || 2, 2)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>User Data: {databaseUtilization.userDataMb} MB</span>
              <span>Free Remaining: {databaseUtilization.remainingMb} MB</span>
            </div>
          </div>

          {/* Table Records List */}
          <div className="space-y-2">
            {[
              { label: 'Events Collection', key: 'events', count: databaseUtilization.tableRows.events, sizeKb: databaseUtilization.tableStorageKb?.events ?? 392, color: 'bg-[#FF5500]' },
              { label: 'Registered Profiles', key: 'profiles', count: databaseUtilization.tableRows.profiles, sizeKb: databaseUtilization.tableStorageKb?.profiles ?? 24, color: 'bg-blue-500' },
              { label: 'RSVP Bookings & Passes', key: 'rsvps', count: databaseUtilization.tableRows.rsvps, sizeKb: databaseUtilization.tableStorageKb?.rsvps ?? 16, color: 'bg-emerald-500' },
              { label: 'Event Comments & Q&A', key: 'event_comments', count: databaseUtilization.tableRows.event_comments, sizeKb: databaseUtilization.tableStorageKb?.event_comments ?? 8, color: 'bg-amber-500' },
              { label: 'Security Audit Logs', key: 'audit_logs', count: databaseUtilization.tableRows.audit_logs, sizeKb: databaseUtilization.tableStorageKb?.audit_logs ?? 424, color: 'bg-purple-500' },
            ].map((row) => {
              const maxRows = Math.max(databaseUtilization.totalTrackedRows, 1);
              const percent = Math.min(Math.round((row.count / maxRows) * 100), 100);
              const sizeText = row.sizeKb >= 1024 ? `${(row.sizeKb / 1024).toFixed(2)} MB` : `${row.sizeKb} KB`;
              return (
                <div key={row.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{row.label}</span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-zinc-400 font-semibold">{row.count} rows</span>
                      <span className="text-zinc-500 text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800/80">{sizeText}</span>
                    </div>
                  </div>
                  <div className="w-full h-1 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className={`h-full ${row.color} rounded-full`}
                      style={{ width: `${Math.max(percent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Database Specs Footer */}
          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Host: {databaseUtilization.supabaseHost}</span>
            <span className="text-emerald-400">Connected</span>
          </div>
        </div>
      </div>

      {/* Grant Superadmin Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0B0F19] border border-zinc-800 p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowGrantModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Grant Superadmin Access</h3>
                <p className="text-xs text-zinc-400">Give full administrative privileges to an email ID</p>
              </div>
            </div>

            {grantError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {grantError}
              </div>
            )}

            <form onSubmit={handleGrantSuperadmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-hidden focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={grantNotes}
                  onChange={(e) => setGrantNotes(e.target.value)}
                  placeholder="e.g. Co-founder / Ops Lead"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs placeholder:text-zinc-600 focus:outline-hidden focus:border-amber-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={granting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {granting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Grant Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
