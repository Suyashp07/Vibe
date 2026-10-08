'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Link2,
  Plus,
  ExternalLink,
  LogOut
} from 'lucide-react';

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
    <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-black text-base tracking-tight text-[#0A0A0A] hover:opacity-80 transition-opacity">
            VIBE
          </Link>
          <span className="text-[#94A3B8] text-sm">/</span>
          <div className="flex items-center gap-1.5 bg-[#F1F5F9] px-2.5 py-1 rounded-full text-xs font-semibold text-[#0A0A0A]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Admin Queue</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUrlModal}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#0A0A0A] text-[#0A0A0A] text-xs font-semibold rounded-full hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add by URL</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] text-white text-xs font-semibold rounded-full hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#64748B] text-xs font-medium rounded-full hover:border-[#0A0A0A] hover:text-[#0A0A0A] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Live Site</span>
          </Link>

          <div className="h-4 w-px bg-[#E2E8F0] mx-1 hidden sm:block" />

          {/* Staff info capsule & Logout */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[11px] font-medium text-[#64748B] truncate max-w-[140px]" title={email || ''}>
              {email?.split('@')[0]}
            </span>
            <button
              onClick={onSignOut}
              title="Sign out of admin"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] text-[#64748B] text-xs font-medium rounded-full hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer"
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
