'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Database,
  Clock,
  Activity,
  Search,
  RefreshCw,
  UserPlus,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Zap,
  Radio,
  Server,
  Layers,
  BarChart3,
  Calendar,
  Lock,
  Mail,
  Copy,
  Check,
  Globe,
  Loader2
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
    signedUpUsers: Array<{
      id: string;
      email: string;
      name: string;
      handle: string | null;
      avatar_url: string | null;
      role: string;
      created_at: string;
      hosted_events_count: number;
      rsvps_count: number;
      is_super_admin: boolean;
    }>;
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
    eventsBreakdown: {
      total: number;
      live: number;
      draft: number;
      review: number;
      cancelled: number;
    };
    rsvpsBreakdown: {
      total: number;
      confirmed: number;
      checked_in: number;
      today: number;
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
    topPages: Array<{ page: string; hits: number }>;
    hourlyData: Array<{ hour: string; minutes: number }>;
    lastHeartbeatAt: string;
  };
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10); // 10s default
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User search & role filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Grant superadmin modal & form state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantNotes, setGrantNotes] = useState('');
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null);

  // Fetch real-time analytics data
  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) {
        throw new Error(`Failed to load analytics: HTTP ${res.status}`);
      }
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchAnalytics]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit Grant Superadmin Access
  const handleGrantSuperadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantEmail.trim() || !grantEmail.includes('@')) {
      setGrantError('Please provide a valid email address');
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
          notes: grantNotes.trim(),
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to grant superadmin privileges');
      }

      showToast(`Superadmin access granted to ${grantEmail.trim()}!`);
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
    const confirmed = confirm(
      `Are you sure you want to revoke superadmin access for ${cleanEmail}? They will no longer be able to manage accounts or access privileged admin tools.`
    );
    if (!confirmed) return;

    setRevokingEmail(cleanEmail);
    try {
      const res = await fetch(`/api/admin/superadmins/grant?email=${encodeURIComponent(cleanEmail)}`, {
        method: 'DELETE',
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to revoke access');
      }

      // Optimistically remove from UI list immediately
      setData((prev: any) => {
        if (!prev) return prev;
        const currentList = prev.superadmins?.list || [];
        const nextList = currentList.filter((a: any) => a.email.toLowerCase().trim() !== cleanEmail);
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

  // Filter signed-up users list
  const filteredUsers = useMemo(() => {
    if (!data?.usersOverview?.signedUpUsers) return [];
    return data.usersOverview.signedUpUsers.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        return (
          u.email?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q) ||
          u.id?.toLowerCase().includes(q) ||
          (u.handle && u.handle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [data?.usersOverview?.signedUpUsers, userRoleFilter, userSearch]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#07090E] text-white flex flex-col">
        <AdminNavigation activeSection="analytics" />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#FF5500] animate-spin" />
          <span className="text-xs uppercase tracking-widest font-mono text-zinc-400">
            Connecting Real-Time Telemetry & Supabase Metrics...
          </span>
        </div>
      </div>
    );
  }

  const {
    usersOverview = { totalSignedUp: 0, usersToday: 0, usersThisWeek: 0, usersThisMonth: 0, roleCounts: { super_admin: 0, curator: 0, organizer: 0, guest: 0 }, signedUpUsers: [] },
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
      eventsBreakdown: { total: 0, live: 0, draft: 0, review: 0, cancelled: 0 },
      rsvpsBreakdown: { total: 0, confirmed: 0, checked_in: 0, today: 0 },
      supabaseHost: 'supabase.co',
      serviceRoleActive: true,
      writesLast24h: { events: 0, rsvps: 0, users: 0 }
    },
    platformEngagement = {
      cumulativeSeconds: 0,
      totalMinutes: 0,
      totalHours: 0,
      todayMinutes: 0,
      activeVisitorsNow: 1,
      avgSessionMinutes: 0,
      topPages: [],
      hourlyData: [],
      lastHeartbeatAt: ''
    }
  } = data || {};

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F3F4F6] flex flex-col selection:bg-[#FF5500] selection:text-white">
      {/* Universal Admin Navigation */}
      <AdminNavigation activeSection="analytics" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 border border-emerald-500/40 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* Top Control Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-[#0B0F19] border border-zinc-800 shadow-xl">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                Real-Time Analytics & Platform Monitoring
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                LIVE STREAM
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Synchronized monitoring of users, superadmins, Supabase database storage, and cumulative platform engagement.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            {/* Auto refresh dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              <span className="text-zinc-500 text-[11px] font-mono">Sync:</span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value={5} className="bg-zinc-900 text-white">5s (Instant)</option>
                <option value={10} className="bg-zinc-900 text-white">10s (Recommended)</option>
                <option value={30} className="bg-zinc-900 text-white">30s</option>
                <option value={0} className="bg-zinc-900 text-white">Paused</option>
              </select>
            </div>

            {/* Manual refresh button */}
            <button
              onClick={() => fetchAnalytics()}
              disabled={refreshing}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#FF5500] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            {/* Grant Superadmin Action */}
            <button
              onClick={() => setShowGrantModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#E8621A] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#FF5500]/25 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Grant Superadmin Access</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4 PRIMARY METRIC TILES                                    */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TILE 1: Numbers of User of Vibe */}
          <div className="p-5 rounded-2xl bg-[#0B0F19] border border-zinc-800 relative overflow-hidden group hover:border-zinc-700 transition">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-400">Total Vibe Users</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-display tracking-tight">
                {usersOverview.totalSignedUp}
              </span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center">
                +{usersOverview.usersToday} today
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>{usersOverview.usersThisWeek} this week</span>
              <span>{usersOverview.roleCounts.organizer} organizers</span>
            </div>
          </div>

          {/* TILE 2: Superadmin Accounts */}
          <div className="p-5 rounded-2xl bg-[#0B0F19] border border-zinc-800 relative overflow-hidden group hover:border-zinc-700 transition">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-400">Superadmin Access</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-display tracking-tight">
                {superadmins.count}
              </span>
              <span className="text-xs text-amber-400/90 font-medium">
                Privileged accounts
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="text-zinc-400">Owner + Granted IDs</span>
              <button
                onClick={() => setShowGrantModal(true)}
                className="text-[#FF5500] hover:underline font-semibold font-mono"
              >
                + Grant Email
              </button>
            </div>
          </div>

          {/* TILE 3: Supabase Database Utilization */}
          <div className="p-5 rounded-2xl bg-[#0B0F19] border border-zinc-800 relative overflow-hidden group hover:border-zinc-700 transition">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-400">Database Storage</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-display tracking-tight">
                {databaseUtilization.totalMb || 0} <span className="text-base font-normal text-zinc-400">MB</span>
              </span>
              <span className="text-xs text-purple-400 font-mono font-medium">
                {databaseUtilization.percentQuotaUsed || 0}% of 500MB
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {databaseUtilization.pingLatencyMs} ms latency
              </span>
              <span className="text-zinc-400 font-mono">
                {databaseUtilization.totalTrackedRows} rows
              </span>
            </div>
          </div>

          {/* TILE 4: Actual Time Spent by All in Platform */}
          <div className="p-5 rounded-2xl bg-[#0B0F19] border border-zinc-800 relative overflow-hidden group hover:border-zinc-700 transition">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-400">Platform Time Spent</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-display tracking-tight">
                {platformEngagement.totalHours} <span className="text-base font-normal text-zinc-400">hrs</span>
              </span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                {platformEngagement.activeVisitorsNow} live now
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>{platformEngagement.todayMinutes} mins today</span>
              <span>~{platformEngagement.avgSessionMinutes}m avg session</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW: SUPERADMIN ACCESS & DATABASE UTILIZATION             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SECTION: SUPERADMIN ACCESS DIRECTORY (7 COLS) */}
          <div className="lg:col-span-7 bg-[#0B0F19] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Superadmin Accounts & Access Controller</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Accounts holding unrestricted superadmin access. Grant new email IDs or revoke permissions instantly.
                </p>
              </div>

              <button
                onClick={() => setShowGrantModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Grant Email</span>
              </button>
            </div>

            {/* Superadmin Table / List */}
            <div className="overflow-x-auto rounded-xl border border-zinc-800/90 bg-zinc-950/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/60 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Administrator</th>
                    <th className="py-2.5 px-3 font-semibold">Access Source</th>
                    <th className="py-2.5 px-3 font-semibold">Tier</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 font-mono">
                  {superadmins.list.map((admin) => (
                    <tr key={admin.email} className="hover:bg-zinc-900/40 transition">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-[10px]">
                            {admin.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-medium text-xs font-sans">{admin.name || admin.email.split('@')[0]}</div>
                            <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                              <span>{admin.email}</span>
                              <button
                                onClick={() => handleCopy(admin.email, admin.email)}
                                className="text-zinc-500 hover:text-white"
                                title="Copy Email"
                              >
                                {copiedId === admin.email ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${
                          admin.source === 'whitelist'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : admin.source === 'granted'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {admin.source}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        {admin.isPrimaryFounder ? (
                          <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30">
                            Founder (Protected)
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">
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
                            className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition cursor-pointer disabled:opacity-50"
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

          {/* SECTION: SUPABASE DATABASE UTILIZATION (5 COLS) */}
          <div className="lg:col-span-5 bg-[#0B0F19] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Supabase Database Utilization</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Live table storage volume, write velocity, and server connection telemetry.
                </p>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {databaseUtilization.pingLatencyMs}ms
              </span>
            </div>

            {/* Storage Quota Capsule */}
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  <span>Allocated Storage Footprint</span>
                </span>
                <span className="font-mono text-purple-300 font-bold">
                  {databaseUtilization.totalMb || 0} MB <span className="text-zinc-500 text-[10px]">/ {databaseUtilization.quotaMb || 500} MB</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-[#FF5500] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(databaseUtilization.percentQuotaUsed || 2, 2)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>User Data: {databaseUtilization.userDataMb || 0} MB</span>
                <span>Free Remaining: {databaseUtilization.remainingMb || 489} MB</span>
              </div>
            </div>

            {/* Table Records Progress Grid */}
            <div className="space-y-2.5">
              {[
                { label: 'Events Collection', key: 'events', count: databaseUtilization.tableRows.events, sizeKb: databaseUtilization.tableStorageKb?.events ?? 392, color: 'bg-[#FF5500]' },
                { label: 'Registered Profiles', key: 'profiles', count: databaseUtilization.tableRows.profiles, sizeKb: databaseUtilization.tableStorageKb?.profiles ?? 24, color: 'bg-blue-500' },
                { label: 'RSVP Bookings & Passes', key: 'rsvps', count: databaseUtilization.tableRows.rsvps, sizeKb: databaseUtilization.tableStorageKb?.rsvps ?? 16, color: 'bg-emerald-500' },
                { label: 'Event Comments & Q&A', key: 'event_comments', count: databaseUtilization.tableRows.event_comments, sizeKb: databaseUtilization.tableStorageKb?.event_comments ?? 8, color: 'bg-amber-500' },
                { label: 'Security Audit Logs', key: 'audit_logs', count: databaseUtilization.tableRows.audit_logs, sizeKb: databaseUtilization.tableStorageKb?.audit_logs ?? 424, color: 'bg-purple-500' },
                { label: 'Date Polls Created', key: 'date_polls', count: databaseUtilization.tableRows.date_polls, sizeKb: databaseUtilization.tableStorageKb?.date_polls ?? 8, color: 'bg-cyan-500' },
              ].map((row) => {
                const maxRows = Math.max(databaseUtilization.totalTrackedRows, 1);
                const percent = Math.min(Math.round((row.count / maxRows) * 100), 100);
                const sizeText = row.sizeKb >= 1024 ? `${(row.sizeKb / 1024).toFixed(2)} MB` : `${row.sizeKb} KB`;
                return (
                  <div key={row.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{row.label}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-zinc-400 font-semibold">{row.count} rows</span>
                        <span className="text-zinc-500 text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{sizeText}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                      <div
                        className={`h-full ${row.color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Database Specs Capsule */}
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Supabase Host:</span>
                <span className="text-white truncate max-w-[180px]">{databaseUtilization.supabaseHost}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Service Role Auth:</span>
                <span className={databaseUtilization.serviceRoleActive ? 'text-emerald-400' : 'text-amber-400'}>
                  {databaseUtilization.serviceRoleActive ? 'Active (Admin Key)' : 'Anon Only'}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Writes (Past 24h):</span>
                <span className="text-white">
                  +{databaseUtilization.writesLast24h.events} events, +{databaseUtilization.writesLast24h.rsvps} rsvps
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW: PLATFORM ENGAGEMENT & ACTUAL TIME SPENT              */}
        {/* ========================================================= */}
        <div className="bg-[#0B0F19] border border-zinc-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Actual Time Spent by All Users Across Vibe</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time active tab telemetry: tracks seconds visitors spend actively reading, exploring vibes, and submitting RSVPs.
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
                Cumulative: <strong className="text-white font-bold">{platformEngagement.totalHours} hrs</strong> ({platformEngagement.totalMinutes} mins)
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <strong>{platformEngagement.activeVisitorsNow} Active Live</strong>
              </span>
            </div>
          </div>

          {/* 24-Hour Engagement Distribution Bar Graph */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>24-Hour Time Spent Activity Histogram (UTC/IST)</span>
              <span>Average Session: ~{platformEngagement.avgSessionMinutes} mins</span>
            </div>
            
            <div className="h-28 flex items-end gap-1.5 pt-4 px-2 pb-1 bg-zinc-950/60 rounded-xl border border-zinc-800/80 overflow-x-auto">
              {platformEngagement.hourlyData.map((slot, idx) => {
                const maxVal = Math.max(...platformEngagement.hourlyData.map((d) => d.minutes), 1);
                const heightPercent = Math.min(Math.max(Math.round((slot.minutes / maxVal) * 100), 10), 100);
                return (
                  <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-zinc-800 text-[10px] text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20">
                      {slot.hour}: {slot.minutes} mins
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-[#FF5500]/60 to-[#FF8C42] rounded-t group-hover:brightness-125 transition-all"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[9px] text-zinc-500 font-mono scale-90">
                      {idx % 4 === 0 ? slot.hour.split(':')[0] : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Engaged Pages Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {platformEngagement.topPages.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-zinc-800 text-zinc-400 font-mono text-[10px] flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-mono font-semibold text-white">{p.page}</span>
                </div>
                <span className="text-xs font-mono text-zinc-400">{p.hits} sessions</span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW: REGISTERED VIBE USERS EXPLORER (SIGNED-UP IDS)       */}
        {/* ========================================================= */}
        <div className="bg-[#0B0F19] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Signed-Up Vibe Users Directory ({usersOverview.totalSignedUp} total accounts)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every registered ID across the platform with role tags, signup timestamps, and event hosting history.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search email, name, user ID..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF5500]"
                />
              </div>

              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admins ({usersOverview.roleCounts.super_admin})</option>
                <option value="curator">Curators ({usersOverview.roleCounts.curator})</option>
                <option value="organizer">Organizers ({usersOverview.roleCounts.organizer})</option>
                <option value="guest">Guests ({usersOverview.roleCounts.guest})</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-800/90 bg-zinc-950/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">User ID & Profile</th>
                  <th className="py-3 px-4 font-semibold">Email Address</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Hosted</th>
                  <th className="py-3 px-4 font-semibold">Passes</th>
                  <th className="py-3 px-4 font-semibold text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 font-mono">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-zinc-500">
                      No signed up accounts matching your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-900/40 transition">
                      {/* User ID & Profile */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-medium text-xs font-sans">{user.name}</div>
                            <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                              <span>{user.id.slice(0, 12)}...</span>
                              <button
                                onClick={() => handleCopy(user.id, user.id)}
                                className="text-zinc-500 hover:text-white"
                                title="Copy Full ID"
                              >
                                {copiedId === user.id ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-zinc-300 font-sans text-xs">
                        {user.email}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${
                          user.is_super_admin
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-bold'
                            : user.role === 'curator'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : user.role === 'organizer'
                            ? 'bg-[#FF5500]/10 text-[#FF5500] border-[#FF5500]/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}>
                          {user.is_super_admin ? 'SUPER ADMIN' : user.role}
                        </span>
                      </td>

                      {/* Hosted Events */}
                      <td className="py-3 px-4 text-zinc-300">
                        {user.hosted_events_count > 0 ? (
                          <span className="text-white font-bold">{user.hosted_events_count} vibes</span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Passes / RSVPs */}
                      <td className="py-3 px-4 text-zinc-300">
                        {user.rsvps_count > 0 ? (
                          <span className="text-emerald-400 font-bold">{user.rsvps_count} RSVPs</span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: GRANT SUPERADMIN ACCESS                            */}
      {/* ========================================================= */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-[#0D0D10] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Grant Superadmin Access</h3>
                  <p className="text-[11px] text-zinc-400">Promote any email to unrestricted Superadmin tier</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setGrantError(null);
                }}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantSuperadmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Recipient Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={grantEmail}
                    onChange={(e) => setGrantEmail(e.target.value)}
                    placeholder="e.g. colleague@swaniki.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  If they already have an account, their role will be elevated immediately. If not yet signed up, superadmin access will activate upon their first sign-in.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Assignment Note / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={grantNotes}
                  onChange={(e) => setGrantNotes(e.target.value)}
                  placeholder="e.g. Core operations team member"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {grantError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{grantError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={granting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#FF5500] hover:brightness-110 text-white text-xs font-bold transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {granting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{granting ? 'Granting...' : 'Confirm & Grant Access'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
