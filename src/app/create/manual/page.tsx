'use client';

import React from 'react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import SingleStepCreateForm from '@/components/events/SingleStepCreateForm';
import { useAuth, signInWithGoogle, getLocalAuthSession } from '@/lib/auth';
import { Sparkles, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function CreateManualPage() {
  const { isLoggedIn, loading } = useAuth();
  const localSession = typeof window !== 'undefined' ? getLocalAuthSession() : null;
  const isAuth = isLoggedIn || Boolean(localSession);

  if (loading && !localSession) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050505] text-[#F3F4F6]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-7 h-7 border-2 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuth && !loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050505] text-[#F3F4F6]">
        <Navbar />

        <main className="flex-1 max-w-md mx-auto px-4 py-16 flex items-center justify-center w-full">
          <div className="w-full bg-[#0D0D10] rounded-2xl p-8 border border-white/10 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white mx-auto flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 text-[#FF5500]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-sans font-bold text-2xl text-white">
                Sign in to Create Event
              </h1>
              <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                Sign in to publish your gathering and start collecting RSVPs.
              </p>
            </div>

            <button
              onClick={() => signInWithGoogle('organizer', '/create/manual')}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition flex items-center justify-center gap-3 shadow-xs hover:border-white/30 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/login?redirect=/create/manual"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all hover:border-white/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/signup?redirect=/create/manual"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#FF5500] hover:bg-[#FF661A] text-white font-semibold text-xs transition-all shadow-md"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-1.5 text-[11px] text-white/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Free to host • Instant publishing</span>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#F3F4F6]">
      <Navbar />
      <main className="flex-1">
        <SingleStepCreateForm mode="manual" />
      </main>
      <Footer />
    </div>
  );
}
