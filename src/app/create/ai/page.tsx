'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Wand2,
  Upload,
  Link2,
  FileText,
  Globe,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
  Zap,
  LogIn,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { useAuth, signInWithGoogle } from '@/lib/auth';
import { saveEvent } from '@/lib/store';

export default function SingleClickCreateAIPage() {
  const router = useRouter();
  const { isLoggedIn, loading, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inputs
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [posterBase64, setPosterBase64] = useState<string | null>(null);
  const [posterName, setPosterName] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  // Execution State
  const [isCreating, setIsCreating] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          setPosterBase64(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePoster = () => {
    setPosterBase64(null);
    setPosterName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1-Click Instant Creation Handler (Exact same pipeline as Telegram bot)
  const handleSingleClickCreate = async () => {
    if (!posterBase64 && !url.trim() && !text.trim()) {
      setErrorMessage('Please provide a flyer poster, an event URL, or text notes to create your event.');
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    try {
      if (posterBase64) {
        setProgressStep('Analyzing flyer poster with Gemini Vision OCR...');
      } else if (url.trim()) {
        setProgressStep('Crawling event link metadata...');
      } else {
        setProgressStep('Extracting event details with AI...');
      }

      const res = await fetch('/api/events/ai-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim() || undefined,
          imageBase64: posterBase64 || undefined,
          text: text.trim() || undefined,
          isPublic,
          organizerId: profile?.id,
          organizerName: profile?.name || profile?.handle || 'Event Host',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to auto-create event.');
      }

      setProgressStep('Structuring venue, schedule & RSVP passes...');
      const data = await res.json();

      if (!data.slug || !data.event) {
        throw new Error('Event created but slug was not returned.');
      }

      // Save to local store for instant offline & client state synchronization
      saveEvent(data.event);

      setProgressStep('Submitted for Superadmin Approval! Opening preview...');
      
      // Redirect to the private preview page
      router.push(`/${data.slug}`);
    } catch (err: any) {
      console.error('Instant create error:', err);
      setErrorMessage(err.message || 'Single-click event creation failed. Please try again.');
      setIsCreating(false);
      setProgressStep(null);
    }
  };

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

  // Auth Guard
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-[#0A0A0A]">
        <Navbar />

        <main className="flex-1 max-w-md mx-auto px-4 py-16 flex items-center justify-center w-full">
          <div className="w-full bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0A0A0A] mx-auto flex items-center justify-center shadow-xs">
              <Wand2 className="w-6 h-6 text-[#0A0A0A]" />
            </div>

            <div className="space-y-2">
              <h1 className="font-sans font-bold text-2xl text-[#0A0A0A]">
                Sign in to Create Event
              </h1>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                Sign in to instantly publish your gathering with AI in a single click.
              </p>
            </div>

            <button
              onClick={() => signInWithGoogle('organizer', '/create/ai')}
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

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/login?redirect=/create/ai"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0A0A0A] font-semibold text-xs transition-all hover:border-[#0A0A0A]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/signup?redirect=/create/ai"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#262626] text-white font-semibold text-xs transition-all shadow-xs"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free to host • Instant 1-click publishing</span>
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

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0A0A0A] font-medium transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Creation Options</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
            Single-Click Event Creation
          </h1>
          <p className="text-sm text-[#64748B] mt-1.5">
            Create an event in one click without filling forms. Provide a poster, event URL, or prompt and AI publishes your live gathering instantly.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1-Click Workstation Box */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm space-y-6">
          {/* Method A: Poster Upload */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-2">
              Option 1: Event Poster / Flyer Image (Vision OCR)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {!posterBase64 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 px-4 border-2 border-dashed border-[#CBD5E1] hover:border-[#0F172A] rounded-xl bg-[#F8FAFC] hover:bg-white text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] shadow-xs">
                  <Upload className="w-5 h-5 text-[#64748B]" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-[#0F172A]">Click to upload event poster</span>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">JPEG, PNG, or WebP</p>
                </div>
              </button>
            ) : (
              <div className="relative rounded-xl border border-[#E2E8F0] overflow-hidden p-3 bg-[#F8FAFC] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#E2E8F0] shrink-0 bg-white">
                    <Image
                      src={posterBase64}
                      alt="Uploaded event flyer"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#0F172A] truncate">
                      {posterName || 'Event Poster Attached'}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready for AI Vision analysis</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePoster}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-red-600 hover:bg-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E2E8F0] w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider absolute">
              or
            </span>
          </div>

          {/* Method B: Event Link */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Option 2: Event Webpage Link
            </label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="url"
                placeholder="https://in.bookmyshow.com/... or https://lu.ma/... or district.in"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors placeholder:text-[#94A3B8]"
              />
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">
              Supports BookMyShow, Luma, District, Paytm Insider, and Unstop links.
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E2E8F0] w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider absolute">
              or
            </span>
          </div>

          {/* Method C: Raw Prompt / Text Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Option 3: Quick Event Notes / Prompt
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Subko Bandra coffee cupping session this Saturday at 5pm. Free entry for coffee enthusiasts."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors resize-none placeholder:text-[#94A3B8]"
            />
          </div>

          {/* Privacy Setting */}
          <div className="pt-2 border-t border-[#F1F5F9]">
            <label className="block text-xs font-semibold text-[#475569] mb-2">
              Event Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  isPublic
                    ? 'border-[#0F172A] bg-[#F8FAFC] ring-1 ring-[#0F172A]'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                }`}
              >
                <Globe className="w-4 h-4 text-[#0F172A]" />
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Public</div>
                  <div className="text-[10px] text-[#64748B]">Discovery feed</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  !isPublic
                    ? 'border-[#0F172A] bg-[#F8FAFC] ring-1 ring-[#0F172A]'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                }`}
              >
                <Lock className="w-4 h-4 text-[#0F172A]" />
                <div>
                  <div className="text-xs font-bold text-[#0F172A]">Private</div>
                  <div className="text-[10px] text-[#64748B]">Secret invite link only</div>
                </div>
              </button>
            </div>
          </div>

          {/* Single-Click Action Button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={handleSingleClickCreate}
              disabled={isCreating || (!posterBase64 && !url.trim() && !text.trim())}
              className="w-full py-3.5 px-5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{progressStep || 'Creating Event Instantly...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Create Event Instantly (Single-Click)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-[#94A3B8] text-center mt-2">
              Bypasses the bot and creates a live published event with passes in one click.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
