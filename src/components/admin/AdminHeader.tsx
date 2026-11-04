'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Link2,
  Plus,
  ExternalLink,
  LogOut,
  Activity,
} from 'lucide-react';
import { ADMIN_BASE_PATH } from '@/lib/adminConstants';
import ThemeToggle from '@/components/common/ThemeToggle';

interface AdminHeaderProps {
  email?: string;
  onOpenUrlModal: () => void;
  onOpenCreateModal: () => void;
  onSignOut: () => void;
}

export default function AdminHeader({
  email,
  onOpenUrlModal,
  onOpenCreateModal,
  onSignOut,
}: AdminHeaderProps) {
  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#0B0F19] sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-black text-base tracking-tight text-slate-900 dark:text-white hover:opacity-80 transition-opacity">
            VIBE
          </Link>
          <span className="text-slate-400 dark:text-zinc-600 text-sm">/</span>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Admin Queue</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark & Light Theme Toggle */}
          <ThemeToggle className="w-8 h-8 sm:w-8 sm:h-8" />

          <Link
            href={`${ADMIN_BASE_PATH}/analytics`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold rounded-full transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-mono font-bold">LIVE</span>
          </Link>
          <button
            onClick={onOpenUrlModal}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add by URL</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold rounded-full transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-medium rounded-full hover:border-slate-400 dark:hover:border-zinc-600 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Live Site</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

          {/* Staff info capsule & Logout */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[11px] font-medium text-slate-500 dark:text-zinc-400 truncate max-w-[140px]" title={email || ''}>
              {email?.split('@')[0]}
            </span>
            <button
              onClick={onSignOut}
              title="Sign out of admin"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-medium rounded-full hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
