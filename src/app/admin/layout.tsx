'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
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
    label: 'Events & Review',
    href: '/admin/events',
    icon: CalendarDays,
    badge: null,
  },
  {
    label: 'Guest RSVPs',
    href: '/admin/rsvps',
    icon: Users,
    badge: null,
  },
  {
    label: 'URL Ingestion & AI',
    href: '/admin/ingestion',
    icon: Sparkles,
    badge: null,
  },
  {
    label: 'User Accounts',
    href: '/admin/users',
    icon: UserCheck,
    badge: null,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, isStaff, isSuperAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user session is loaded and they are not staff, instantly kick out to dashboard
  React.useEffect(() => {
    if (!loading && !isStaff) {
      router.replace('/dashboard?denied=admin_access_required');
    }
  }, [loading, isStaff, router]);

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
              The Vibe Admin Panel is strictly reserved for verified super administrators.
            </p>
          </div>
          <div className="p-3.5 bg-black/40 rounded-xl border border-zinc-800 text-xs text-zinc-400 font-mono text-left">
            <div>Current Account: <span className="text-zinc-200">{profile?.email || 'Anonymous'}</span></div>
            <div>Role: <span className="text-amber-400">{profile?.role || 'Guest'}</span></div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold transition"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => signOut()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold border border-red-500/30 transition cursor-pointer"
            >
              Sign Out
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

          <Link href="/admin/events" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#E8621A] flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-black text-sm">
              V
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white leading-tight">
                Vibe <span className="text-[#E8621A] text-xs font-semibold">Admin</span>
              </span>
              <span className="text-[9px] text-zinc-400 font-mono tracking-wider uppercase">Console</span>
            </div>
          </Link>
        </div>

        {/* User Menu & Live Link */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#E8621A]" />
          </Link>

          <div className="h-4 w-px bg-zinc-800" />

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
                {isSuperAdmin ? 'Super Admin' : 'Staff'}
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
        <aside className="hidden md:flex w-56 flex-col bg-[#0B0F19] border-r border-zinc-800/80 p-3.5 space-y-4">
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#E8621A]/15 text-[#FF8442] border border-[#E8621A]/30 shadow-sm shadow-[#E8621A]/10 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
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

          {/* Clean Helper Note */}
          <div className="mt-auto p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-[11px] text-zinc-400">
            <p className="font-semibold text-zinc-300 text-xs">Vibe Admin</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Quickly review drafts and publish live events.</p>
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
