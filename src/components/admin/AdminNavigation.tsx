'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Users,
  ShieldCheck,
  Ticket,
  FileText,
  Radio,
  ExternalLink,
  LogOut,
  Zap
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ADMIN_BASE_PATH } from '@/lib/adminConstants';

interface AdminNavigationProps {
  activeSection?: 'queue' | 'analytics' | 'users' | 'rsvps' | 'audit' | 'ingestion';
}

export default function AdminNavigation({ activeSection }: AdminNavigationProps) {
  const pathname = usePathname();
  const { profile, user, signOut } = useAuth();
  const email = profile?.email || user?.email || 'admin@vibe.community';

  const navItems = [
    {
      id: 'queue',
      label: 'Queue',
      href: ADMIN_BASE_PATH,
      icon: ShieldCheck,
      badge: null,
      isActive: pathname === ADMIN_BASE_PATH || pathname === '/admin',
    },
    {
      id: 'analytics',
      label: 'Real-Time Analytics',
      href: `${ADMIN_BASE_PATH}/analytics`,
      icon: Activity,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      isActive: pathname.startsWith(`${ADMIN_BASE_PATH}/analytics`) || pathname.startsWith('/admin/analytics'),
    },
    {
      id: 'users',
      label: 'Users & Access',
      href: `${ADMIN_BASE_PATH}/users`,
      icon: Users,
      badge: null,
      isActive: pathname.startsWith(`${ADMIN_BASE_PATH}/users`) || pathname.startsWith('/admin/users'),
    },
    {
      id: 'rsvps',
      label: 'RSVPs',
      href: `${ADMIN_BASE_PATH}/rsvps`,
      icon: Ticket,
      badge: null,
      isActive: pathname.startsWith(`${ADMIN_BASE_PATH}/rsvps`) || pathname.startsWith('/admin/rsvps'),
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      href: `${ADMIN_BASE_PATH}/audit-logs`,
      icon: FileText,
      badge: null,
      isActive: pathname.startsWith(`${ADMIN_BASE_PATH}/audit-logs`) || pathname.startsWith('/admin/audit-logs'),
    },
    {
      id: 'ingestion',
      label: 'Ingestion',
      href: `${ADMIN_BASE_PATH}/ingestion`,
      icon: Radio,
      badge: null,
      isActive: pathname.startsWith(`${ADMIN_BASE_PATH}/ingestion`) || pathname.startsWith('/admin/ingestion'),
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/95 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 group cursor-pointer shrink-0"
              title="Return to Vibe Home"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5500] to-[#FF8C42] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#FF5500]/25 group-hover:scale-105 transition-transform">
                V
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-white tracking-wider font-display leading-tight flex items-center gap-1.5">
                  VIBE <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#FF5500]/20 text-[#FF5500] font-mono border border-[#FF5500]/30">ADMIN</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">Control Center</span>
              </div>
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      item.isActive
                        ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${item.isActive ? 'text-[#FF5500]' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${item.badgeColor || 'bg-zinc-800 text-zinc-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Stack */}
          <div className="flex items-center gap-2.5">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Realtime Connected</span>
            </div>

            {/* Live Site Preview */}
            <Link
              href="/"
              target="_blank"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Open Public Website"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Live Site</span>
            </Link>

            {/* User Capsule */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div className="w-7 h-7 rounded-full bg-[#3D251A] text-[#FF8542] border border-white/10 flex items-center justify-center font-bold text-xs">
                {email.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-white max-w-[130px] truncate" title={email}>
                  {email.split('@')[0]}
                </span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {email === 'pandeysuyash100@gmail.com'
                    ? 'Developer Admin'
                    : email === 'mail.jaiswal@gmail.com'
                    ? 'Owner Admin'
                    : profile?.role === 'super_admin'
                    ? 'Super Admin'
                    : profile?.role || 'Staff'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Horizontal Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-zinc-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  item.isActive
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className={`w-3 h-3 ${item.isActive ? 'text-[#FF5500]' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
