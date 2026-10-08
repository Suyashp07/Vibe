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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-[#FF5500] animate-spin" />
          <span className="text-xs uppercase tracking-widest font-mono text-white/40">
            Verifying Admin Session...
          </span>
        </div>
      </div>
    );
  }

  // Authorization barrier
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-[#F3F4F6]">
        <div className="max-w-md w-full bg-[#0D0D10] border border-white/10 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Admin Access Restricted</h1>
            <p className="text-xs text-white/60 mt-2">
              The Vibe Admin Panel is strictly reserved for verified administrators.
            </p>
          </div>
          <div className="p-3.5 bg-[#111114] rounded-xl border border-white/10 text-xs text-white/60 font-mono text-left space-y-1">
            <div>Current Account: <span className="text-white font-semibold">{profile?.email || 'Anonymous'}</span></div>
            <div>Role: <span className="text-amber-400 font-semibold">{profile?.role || 'Guest'}</span></div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-2.5 px-4 rounded-full bg-[#FF5500] hover:bg-[#FF661A] text-white text-xs font-bold transition text-center"
            >
              Back to Home
            </Link>
            <button
              onClick={() => signOut()}
              className="flex-1 py-2.5 px-4 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Single clean layout
  return <div className="min-h-screen bg-[#050505] text-[#F3F4F6]">{children}</div>;
}
