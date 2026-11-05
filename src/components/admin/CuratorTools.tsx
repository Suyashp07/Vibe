'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Trash2,
  X,
  Loader2,
  Search
} from 'lucide-react';

export interface StatusTabItem {
  id: 'ALL' | 'LIVE' | 'AUTO_APPROVED' | 'REVIEW' | 'REJECTED';
  label: string;
  count: number;
  alert?: boolean;
}

interface CuratorFilterBarProps {
  statusTabs: StatusTabItem[];
  activeStatus: 'ALL' | 'LIVE' | 'AUTO_APPROVED' | 'REVIEW' | 'REJECTED';
  onStatusChange: (status: 'ALL' | 'LIVE' | 'AUTO_APPROVED' | 'REVIEW' | 'REJECTED') => void;
  sourceFilter: 'ALL' | 'VIBE' | 'INGESTED';
  onSourceChange: (source: 'ALL' | 'VIBE' | 'INGESTED') => void;
  counts: {
    total: number;
    vibe: number;
    ingested: number;
  };
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export function CuratorFilterBar({
  statusTabs,
  activeStatus,
  onStatusChange,
  sourceFilter,
  onSourceChange,
  counts,
  filteredCount,
  searchQuery,
  onSearchChange,
  loading,
  onRefresh,
}: CuratorFilterBarProps) {
  return (
    <div className="flex flex-col gap-3.5 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {statusTabs.map((tab) => {
            const active = activeStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onStatusChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    active
                      ? 'bg-white/20 text-white dark:bg-slate-900/10 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search events, venues..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-zinc-800 rounded-full focus:outline-none focus:border-[#08B9F5] transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh queue"
            className="p-2 border border-slate-200 dark:border-zinc-800 rounded-full text-slate-600 hover:text-slate-900 hover:border-slate-400 dark:text-zinc-400 dark:hover:text-white dark:hover:border-zinc-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : 'hidden'}`} />
            {!loading && <span className="text-xs">↻</span>}
          </button>
        </div>
      </div>

      {/* Event Source Filter: All Events, Vibe Specific Events, Ingested Events */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Event Type:
          </span>
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => onSourceChange('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                sourceFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>All Events</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${sourceFilter === 'ALL' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                {counts.total}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSourceChange('VIBE')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceFilter === 'VIBE'
                  ? 'bg-white dark:bg-zinc-800 text-[#075CE5] dark:text-[#00D5E8] shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>⚡ Vibe Specific</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${sourceFilter === 'VIBE' ? 'bg-[#075CE5] text-white' : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                {counts.vibe}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSourceChange('INGESTED')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceFilter === 'INGESTED'
                  ? 'bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>📥 Ingested Events</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${sourceFilter === 'INGESTED' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                {counts.ingested}
              </span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredCount}</strong> {sourceFilter === 'VIBE' ? 'Vibe specific' : sourceFilter === 'INGESTED' ? 'ingested' : ''} events
          </span>
          {sourceFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSourceChange('ALL')}
              className="text-[11px] text-[#075CE5] hover:underline font-bold cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface BulkActionBarProps {
  selectedCount: number;
  bulking: string | null;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({
  selectedCount,
  bulking,
  onApproveAll,
  onRejectAll,
  onDeleteSelected,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-2.5 bg-[#0A0A0A] text-white rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 border border-[#262626]">
      <span className="text-xs font-bold whitespace-nowrap">{selectedCount} selected</span>
      <div className="w-px h-4 bg-white/20" />
      <button
        onClick={onApproveAll}
        disabled={!!bulking}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Approve All</span>
      </button>
      <button
        onClick={onRejectAll}
        disabled={!!bulking}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
      >
        <XCircle className="w-3.5 h-3.5" />
        <span>Reject All</span>
      </button>
      <button
        onClick={onDeleteSelected}
        disabled={!!bulking}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] hover:bg-[#333333] text-white text-xs font-medium rounded-full transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>
      <button
        onClick={onClearSelection}
        title="Clear selection"
        className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
      {bulking && (
        <span className="text-[10px] text-white/70 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing...
        </span>
      )}
    </div>
  );
}
