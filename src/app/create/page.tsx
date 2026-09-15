'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Wand2,
  PenLine,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  LogIn
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
          <div className="w-7 h-7 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  // Guard: If not logged in, show clean authentication prompt
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-[#0A0A0A]">
        <Navbar />

        <main className="flex-1 max-w-md mx-auto px-4 py-16 flex items-center justify-center w-full">
          <div className="w-full bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0A0A0A] mx-auto flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 text-[#0A0A0A]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-sans font-bold text-2xl text-[#0A0A0A]">
                Sign in to Create Event
              </h1>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                Sign in to publish your gathering, manage private guest lists, and collect attendee RSVPs.
              </p>
            </div>

            {/* Quick Google Login */}
            <button
              onClick={() => signInWithGoogle('organizer', '/create')}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0A0A0A] text-xs font-semibold transition flex items-center justify-center gap-3 shadow-xs hover:border-[#0A0A0A] cursor-pointer"
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
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/login?redirect=/create"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0A0A0A] font-semibold text-xs transition-all hover:border-[#0A0A0A]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/signup?redirect=/create"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold text-xs transition-all shadow-xs"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free to host • Instant publishing</span>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0A0A0A]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0A0A0A] font-medium transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Create an Event
          </h1>
          <p className="text-sm text-[#64748B] mt-1.5">
            Select how you would like to set up and structure your gathering.
          </p>
        </div>

        {/* Dual Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Create with AI */}
          <Link
            href="/create/ai"
            className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#0F172A] hover:shadow-md transition-all text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center border border-[#E2E8F0] group-hover:bg-[#0F172A] group-hover:text-white transition-colors">
                  <Wand2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-[#475569] bg-[#F1F5F9] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                  AI Assisted
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#0F172A] tracking-tight group-hover:text-[#0F172A]">
                  Auto-Create with AI
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
                  Provide an event flyer image, paste an existing event URL, or write raw text notes. AI will extract and structure all details in seconds.
                </p>
              </div>

              <div className="pt-2 space-y-2 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2 text-xs text-[#475569]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Poster & flyer OCR vision extraction</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#475569]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>BookMyShow, Luma & District link scraper</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#475569]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Auto-fills venue, date, time & description</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>Continue with AI</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Manual Creation */}
          <Link
            href="/create/manual"
            className="group relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#0F172A] hover:shadow-md transition-all text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center border border-[#E2E8F0] group-hover:bg-[#0F172A] group-hover:text-white transition-colors">
                  <PenLine className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-[#475569] bg-[#F1F5F9] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                  Full Control
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#0F172A] tracking-tight group-hover:text-[#0F172A]">
                  Manual Event Setup
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
                  Enter event details, venue location, schedule, ticketing, and guest registration requirements with complete manual precision.
                </p>
              </div>

              <div className="pt-2 space-y-2 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2 text-xs text-[#475569]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Interactive Google Map venue preview</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#475569]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Public discovery or private personal invite</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#475569]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Custom question builder & pass controls</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-semibold text-[#0F172A]">
              <span>Continue Manually</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
