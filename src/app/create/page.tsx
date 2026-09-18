'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  MapPin,
  Ticket,
  FileText,
  Lock,
  MessageCircle
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { useAuth, signInWithGoogle } from '@/lib/auth';

export default function CreateEventHubPage() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
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

  // Guard: If not logged in, show clean authentication prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FAF8F5] via-white to-[#F8FAFC] text-[#0A0A0A]">
        <Navbar />

        <main className="flex-1 max-w-md mx-auto px-4 py-16 sm:py-24 flex items-center justify-center w-full">
          <div className="w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#E2E8F0] shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95">
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FAF8F5] via-white to-[#F8FAFC] text-[#0A0A0A] relative overflow-hidden">
      {/* Decorative ambient background blur lights */}
      <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#E8621A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-48 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full relative z-10">
        {/* Navigation Breadcrumb & Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-xs text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-all hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8621A]/10 text-[#E8621A] text-xs font-black uppercase tracking-wider mb-3 border border-[#E8621A]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Event Creator Hub</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-[#0F172A] leading-tight">
            How would you like to host?
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] mt-3 leading-relaxed">
            Choose between instant 1-click AI creation from any poster flyer or link, or step into our full custom event studio.
          </p>
        </div>

        {/* Dual Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {/* Card 1: 1-Click Instant AI */}
          <Link
            href="/create/ai"
            className="group relative flex flex-col justify-between p-7 sm:p-9 rounded-3xl bg-white border-2 border-[#E2E8F0] hover:border-[#E8621A] hover:shadow-2xl hover:shadow-[#E8621A]/15 hover:-translate-y-1.5 transition-all duration-300 text-left overflow-hidden cursor-pointer"
          >
            {/* Top Glowing Gradient Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E8621A] to-amber-400 opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-6">
              {/* Top Row: Icon + Badge */}
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E8621A] to-[#FF8C42] text-white flex items-center justify-center shadow-lg shadow-[#E8621A]/30 group-hover:scale-110 transition-transform duration-300">
                  <Wand2 className="w-7 h-7" />
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#E8621A] bg-[#E8621A]/10 border border-[#E8621A]/30 px-3 py-1 rounded-full shadow-xs">
                  <Zap className="w-3.5 h-3.5 fill-[#E8621A]" />
                  <span>Fastest · 30 Seconds</span>
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-black text-[#0F172A] tracking-tight group-hover:text-[#E8621A] transition-colors">
                  1-Click Instant AI
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2.5 leading-relaxed font-normal">
                  Bypass tedious forms completely. Upload an event flyer, paste an external link, or drop simple notes — AI vision extracts all details and prepares your live gathering in seconds.
                </p>
              </div>

              {/* Capability Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E2E8F0] text-[11px] font-semibold text-[#475569] flex items-center gap-1">
                  <span>🖼️ Flyer & Poster OCR</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E2E8F0] text-[11px] font-semibold text-[#475569] flex items-center gap-1">
                  <span>🔗 BookMyShow / Luma Link</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E2E8F0] text-[11px] font-semibold text-[#475569] flex items-center gap-1">
                  <span>✨ Auto-Magic Copy</span>
                </span>
              </div>

              {/* Key Features Checklist */}
              <div className="pt-3 space-y-2.5 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2.5 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Single-click live publishing — zero form filling</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Smart extraction of dates, timing & venue</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Auto-generates social captions & hashtags</span>
                </div>
              </div>
            </div>

            {/* Bottom CTA Button */}
            <div className="mt-8 pt-5 border-t border-[#F1F5F9]">
              <div className="w-full py-3 px-5 rounded-2xl bg-[#0F172A] group-hover:bg-[#E8621A] text-white font-black text-xs sm:text-sm flex items-center justify-between transition-colors shadow-md group-hover:shadow-lg group-hover:shadow-[#E8621A]/25">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Create with AI Magic</span>
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card 2: Custom Event Studio (Completely free of "manual") */}
          <Link
            href="/create/manual"
            className="group relative flex flex-col justify-between p-7 sm:p-9 rounded-3xl bg-white border-2 border-[#E2E8F0] hover:border-[#3B82F6] hover:shadow-2xl hover:shadow-[#3B82F6]/15 hover:-translate-y-1.5 transition-all duration-300 text-left overflow-hidden cursor-pointer"
          >
            {/* Top Glowing Gradient Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#3B82F6] to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-6">
              {/* Top Row: Icon + Badge */}
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F172A] to-[#1E293B] text-white flex items-center justify-center shadow-lg shadow-slate-900/30 group-hover:scale-110 transition-transform duration-300">
                  <SlidersHorizontal className="w-7 h-7 text-blue-400" />
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full shadow-xs">
                  <span>Full Creative Control</span>
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-black text-[#0F172A] tracking-tight group-hover:text-[#3B82F6] transition-colors">
                  Custom Event Studio
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2.5 leading-relaxed font-normal">
                  Design every detail of your gathering with complete creative control. Configure interactive Google Maps coordinates, ticketing tiers, and custom registration questionnaires.
                </p>
              </div>

              {/* Capability Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E2E8F0] text-[11px] font-semibold text-[#475569] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-500" />
                  <span>Google Maps Venue</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E2E8F0] text-[11px] font-semibold text-[#475569] flex items-center gap-1">
                  <Ticket className="w-3 h-3 text-amber-500" />
                  <span>Custom Ticket Tiers</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E2E8F0] text-[11px] font-semibold text-[#475569] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-blue-500" />
                  <span>RSVP Question Builder</span>
                </span>
              </div>

              {/* Key Features Checklist */}
              <div className="pt-3 space-y-2.5 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2.5 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pin-point venue selection with Google Maps</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Public explore feed discovery or private invite-only</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#334155] font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tailored RSVP forms, questions & pass controls</span>
                </div>
              </div>
            </div>

            {/* Bottom CTA Button */}
            <div className="mt-8 pt-5 border-t border-[#F1F5F9]">
              <div className="w-full py-3 px-5 rounded-2xl bg-[#F8FAFC] group-hover:bg-[#0F172A] border border-[#E2E8F0] group-hover:border-transparent text-[#0F172A] group-hover:text-white font-black text-xs sm:text-sm flex items-center justify-between transition-colors shadow-xs group-hover:shadow-lg">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Start Custom Setup</span>
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Helpful Trust & Feature Reassurance Footer Strip */}
        <div className="mt-12 max-w-4xl mx-auto p-5 sm:p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              0%
            </div>
            <div>
              <span className="font-bold text-[#0F172A] block">Zero Platform Fees</span>
              <span>100% free hosting for community meetups</span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-[#E2E8F0]" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#0F172A] block">Flexible Privacy</span>
              <span>Public feed discovery or private pass link</span>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-[#E2E8F0]" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#0F172A] block">WhatsApp & Telegram</span>
              <span>Instant attendee updates & communication</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
