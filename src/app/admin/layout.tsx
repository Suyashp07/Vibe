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
      <div className="min-h-screen bg-white flex items-center justify-center text-[#64748B]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-[#0A0A0A] animate-spin" />
          <span className="text-xs uppercase tracking-widest font-mono text-[#94A3B8]">
            Verifying Admin Session...
          </span>
        </div>
      </div>
    );
  }

  // Authorization barrier
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 text-[#0A0A0A]">
        <div className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-5 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-500 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#0A0A0A]">Admin Access Restricted</h1>
            <p className="text-xs text-[#64748B] mt-2">
              The Vibe Admin Panel is strictly reserved for verified administrators.
            </p>
          </div>
          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#64748B] font-mono text-left space-y-1">
            <div>Current Account: <span className="text-[#0A0A0A] font-semibold">{profile?.email || 'Anonymous'}</span></div>
            <div>Role: <span className="text-amber-600 font-semibold">{profile?.role || 'Guest'}</span></div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-2.5 px-4 rounded-full bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold transition text-center"
            >
              Back to Home
            </Link>
            <button
              onClick={() => signOut()}
              className="flex-1 py-2.5 px-4 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold border border-red-200 transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Single clean layout without conflicting dark sidebars
  return <div className="min-h-screen bg-white text-[#0A0A0A]">{children}</div>;
}
