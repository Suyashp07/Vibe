'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  CalendarDays,
  Sparkles,
  Users,
  Terminal,
  Activity,
  LogOut,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Lock,
  UserCheck,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/admin',
    icon: Activity,
    badge: null,
  },
  {
    label: 'Events & Drafts',
    href: '/admin/events',
    icon: CalendarDays,
    badge: 'Live',
  },
  {
    label: 'Ingestion & Curators',
    href: '/admin/ingestion',
    icon: Terminal,
    badge: null,
  },
  {
    label: 'Global RSVPs',
    href: '/admin/rsvps',
    icon: Users,
    badge: null,
  },
  {
    label: 'Accounts & Users',
    href: '/admin/users',
    icon: UserCheck,
    badge: 'RBAC',
  },
  {
    label: 'Audit Trail',
    href: '/admin/audit-logs',
    icon: ShieldAlert,
    badge: 'Security',
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, loading, isStaff, isSuperAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fallback while loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#E8621A] border-t-transparent animate-spin" />
          <span className="text-xs uppercase tracking-widest font-mono text-zinc-400">Authenticating Staff Session...</span>
        </div>
      </div>
    );
  }

  // Authorization barrier
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-4 text-zinc-100">
        <div className="max-w-md w-full bg-[#0F131D] border border-red-500/30 rounded-2xl p-8 text-center space-y-5 shadow-2xl shadow-red-950/20">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Access Restricted</h1>
            <p className="text-sm text-zinc-400 mt-2">
              The Vibe Admin Panel is strictly reserved for verified super administrators and telegram curators.
            </p>
          </div>
          <div className="p-3.5 bg-black/40 rounded-xl border border-zinc-800 text-xs text-zinc-400 font-mono text-left">
            <div>Current Account: <span className="text-zinc-200">{profile?.email || 'Anonymous'}</span></div>
            <div>Role: <span className="text-amber-400">{profile?.role || 'Guest'}</span></div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold transition"
            >
              Back to Home
            </Link>
            <button
              onClick={() => signOut()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold border border-red-500/30 transition"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-zinc-100 flex flex-col antialiased selection:bg-[#E8621A]/30">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 h-16 bg-[#0B0F19]/90 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E8621A] to-[#FF8442] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-wide text-white uppercase font-mono">Vibe</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8621A]/10 border border-[#E8621A]/30 text-[#FF8442] font-semibold">
                  Admin
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 -mt-0.5">Command Center</span>
            </div>
          </Link>
        </div>

        {/* Status indicator & User Menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Edge Zero-Trust Active</span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          {/* User profile capsule */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500/30 to-purple-500/30 border border-orange-500/40 flex items-center justify-center text-xs font-bold text-orange-200">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-medium text-zinc-200 leading-tight">
                {profile?.name || profile?.email?.split('@')[0]}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {isSuperAdmin ? 'Super Admin' : 'Curator'}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex w-64 flex-col bg-[#0B0F19] border-r border-zinc-800/80 p-4 space-y-6">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-3 py-1 font-semibold">
              Management
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#E8621A]/15 text-[#FF8442] border border-[#E8621A]/30 shadow-sm shadow-[#E8621A]/10 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF8442]' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/90 border border-zinc-700 text-zinc-300 font-mono">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick System Status Card */}
          <div className="mt-auto p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Telegram Bot</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Supabase RLS</span>
              <span className="text-emerald-400 font-mono">Enforced</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Security Logs</span>
              <span className="text-cyan-400 font-mono">Immutable</span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex">
            <div className="w-72 bg-[#0B0F19] border-r border-zinc-800 h-full p-4 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E8621A] flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-sm text-white">Admin Command</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                        isActive
                          ? 'bg-[#E8621A]/20 text-[#FF8442] border border-[#E8621A]/30'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="text-xs text-zinc-400 truncate max-w-[170px]">{profile?.email}</div>
                <button
                  onClick={() => signOut()}
                  className="p-2 text-zinc-400 hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
