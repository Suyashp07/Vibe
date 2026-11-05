'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, loading, isStaff, signOut } = useAuth();

  // If user session is loaded and they are not staff, redirect to login
  React.useEffect(() => {
    if (!loading && !isStaff) {
      router.replace('/login?denied=admin_access_required');
    }
  }, [loading, isStaff, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex items-center justify-center text-slate-500 dark:text-white/50 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-[#08B9F5] animate-spin" />
          <span className="text-xs uppercase tracking-widest font-mono text-slate-400 dark:text-white/40">
            Verifying Admin Session...
          </span>
        </div>
      </div>
    );
  }

  // Authorization barrier
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex items-center justify-center p-4 text-slate-900 dark:text-[#F3F4F6] transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-[#0D0D10] border border-slate-200 dark:border-white/10 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Access Restricted</h1>
            <p className="text-xs text-slate-500 dark:text-white/60 mt-2">
              The Vibe Admin Panel is strictly reserved for verified administrators.
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-[#111114] rounded-xl border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-white/60 font-mono text-left space-y-1">
            <div>Current Account: <span className="text-slate-900 dark:text-white font-semibold">{profile?.email || 'Anonymous'}</span></div>
            <div>Role: <span className="text-amber-500 dark:text-amber-400 font-semibold">{profile?.role || 'Guest'}</span></div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-2.5 px-4 rounded-full bg-[#08B9F5] hover:bg-[#075CE5] text-white text-xs font-bold transition text-center"
            >
              Back to Home
            </Link>
            <button
              onClick={() => signOut()}
              className="flex-1 py-2.5 px-4 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-semibold border border-red-500/20 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Single clean layout
  return <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-[#F3F4F6] transition-colors">{children}</div>;
}
