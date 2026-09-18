'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Wand2,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  LogIn,
  Zap,
  Lock,
  MessageCircle
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { useAuth, signInWithGoogle, getLocalAuthSession } from '@/lib/auth';

export default function CreateEventHubPage() {
  const { isLoggedIn, loading } = useAuth();
  const localSession = typeof window !== 'undefined' ? getLocalAuthSession() : null;
  const isAuth = isLoggedIn || Boolean(localSession);

  // Synchronous session check eliminates loading spinner flash for logged-in users
  if (loading && !localSession) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-[#0A0A0A]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-8 h-8 border-3 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  // Guard: If unauthenticated, show clean sign-in prompt
  if (!isAuth && !loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FAF8F5] via-white to-[#F8FAFC] text-[#0A0A0A]">
        <Navbar />

        <main className="flex-1 max-w-md mx-auto px-4 py-12 sm:py-20 flex items-center justify-center w-full">
          <div className="w-full bg-white rounded-3xl p-7 sm:p-9 border border-[#E2E8F0] shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E8621A] to-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-[#E8621A]/25">
              <Sparkles className="w-7 h-7 fill-white" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
                Sign in to Host
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-sm mx-auto leading-relaxed">
                Publish your event, manage your private guest list, and track live RSVPs in real time.
              </p>
            </div>

            {/* Quick Google Login */}
            <button
              onClick={() => signInWithGoogle('organizer', '/create')}
              type="button"
              className="w-full py-3 px-4 rounded-2xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs sm:text-sm font-bold transition flex items-center justify-center gap-3 shadow-xs hover:border-[#0F172A] cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
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

            {/* Email Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Link
                href="/login?redirect=/create"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-bold text-xs transition-all hover:border-[#0F172A]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/signup?redirect=/create"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs transition-all shadow-md"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-2 text-xs text-[#64748B]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Free to host • Zero setup fees</span>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Authenticated: Clean, compact, mobile-friendly 2-option creator choice
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#0A0A0A] relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute -top-32 left-1/4 w-80 h-80 bg-[#E8621A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-48 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full relative z-10 flex flex-col justify-center">
        {/* Header Strip - Compact & Informative */}
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-2xs text-[11px] font-bold text-[#E8621A] mb-2.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 fill-[#E8621A]" />
            <span>Create & Publish</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-tight text-[#0F172A]">
            How would you like to host?
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
            Choose instant AI flyer extraction or launch our step-by-step custom studio.
          </p>
        </div>

        {/* Dual Option Cards: Compact, Responsive, Low-Scroll */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Option 1: 1-Click Instant AI */}
          <Link
            href="/create/ai"
            className="group relative flex flex-col justify-between p-5 sm:p-7 rounded-3xl bg-white border-2 border-[#E2E8F0] hover:border-[#E8621A] hover:shadow-xl hover:shadow-[#E8621A]/10 transition-all duration-200 text-left overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E8621A] to-amber-400 opacity-90 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-4">
              {/* Badge & Icon Header */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E8621A] to-[#FF8C42] text-white flex items-center justify-center shadow-md shadow-[#E8621A]/25 group-hover:scale-105 transition-transform duration-200">
                  <Wand2 className="w-6 h-6" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#E8621A] bg-[#E8621A]/10 border border-[#E8621A]/20 px-2.5 py-1 rounded-full shadow-2xs">
                  <Zap className="w-3 h-3 fill-[#E8621A]" />
                  <span>Fastest · 30s</span>
                </span>
              </div>

              {/* Title & Concise Description */}
              <div>
                <h2 className="text-lg sm:text-xl font-display font-black text-[#0F172A] tracking-tight group-hover:text-[#E8621A] transition-colors">
                  1-Click AI Fast Track
                </h2>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Drop an event poster flyer, paste a BookMyShow/Luma link, or prompt in text. AI extracts dates, venue, and descriptions automatically.
                </p>
              </div>

              {/* Feature Points */}
              <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Flyer Poster Vision OCR & Smart Parsing</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Import from Luma, BookMyShow or Instagram</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant live publishing — zero typing</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
              <div className="w-full py-2.5 px-4 rounded-xl bg-[#0F172A] group-hover:bg-[#E8621A] text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-colors shadow-sm">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Create with AI</span>
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Option 2: Custom Event Studio (Completely free of "manual" wording) */}
          <Link
            href="/create/manual"
            className="group relative flex flex-col justify-between p-5 sm:p-7 rounded-3xl bg-white border-2 border-[#E2E8F0] hover:border-[#3B82F6] hover:shadow-xl hover:shadow-[#3B82F6]/10 transition-all duration-200 text-left overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3B82F6] to-indigo-500 opacity-90 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-4">
              {/* Badge & Icon Header */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] text-white flex items-center justify-center shadow-md shadow-slate-900/25 group-hover:scale-105 transition-transform duration-200">
                  <SlidersHorizontal className="w-6 h-6 text-blue-400" />
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full shadow-2xs">
                  <span>Full Creative Control</span>
                </span>
              </div>

              {/* Title & Concise Description */}
              <div>
                <h2 className="text-lg sm:text-xl font-display font-black text-[#0F172A] tracking-tight group-hover:text-[#3B82F6] transition-colors">
                  Custom Event Studio
                </h2>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Design every aspect of your event with precision. Interactive Google Maps venue pins, custom ticketing tiers, and registration questionnaires.
                </p>
              </div>

              {/* Feature Points */}
              <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Google Maps venue pin-point coordinates</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Free / Paid ticket passes & guest capacity</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Custom RSVP questions & pass approvals</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
              <div className="w-full py-2.5 px-4 rounded-xl bg-[#F8FAFC] group-hover:bg-[#0F172A] border border-[#E2E8F0] group-hover:border-transparent text-[#0F172A] group-hover:text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-colors shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Start Custom Setup</span>
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Compact Trust Footer Strip */}
        <div className="mt-6 sm:mt-8 p-3.5 sm:p-4 rounded-2xl bg-white/80 backdrop-blur-xs border border-[#E2E8F0] shadow-2xs flex flex-wrap items-center justify-around gap-3 text-[11px] text-[#64748B]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-[10px]">
              0%
            </span>
            <span className="font-semibold text-[#0F172A]">Zero Host Fees</span>
          </div>

          <div className="hidden sm:block w-px h-4 bg-[#E2E8F0]" />

          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold text-[#0F172A]">Public or Invite-Only</span>
          </div>

          <div className="hidden sm:block w-px h-4 bg-[#E2E8F0]" />

          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-[#0F172A]">WhatsApp & Telegram Alerts</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
