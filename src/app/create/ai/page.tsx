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
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { useAuth, signInWithGoogle } from '@/lib/auth';
import { saveEvent } from '@/lib/store';

type InputMode = 'poster' | 'link' | 'notes';

export default function SingleClickCreateAIPage() {
  const router = useRouter();
  const { isLoggedIn, loading, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode & Inputs
  const [activeMode, setActiveMode] = useState<InputMode>('poster');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [posterBase64, setPosterBase64] = useState<string | null>(null);
  const [posterName, setPosterName] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showExtraNotes, setShowExtraNotes] = useState(false);
  const [extraNotes, setExtraNotes] = useState('');

  // Execution State
  const [isCreating, setIsCreating] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Upload Handlers
  const handleFileProcess = (file: File) => {
    if (file && file.type.startsWith('image/')) {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleRemovePoster = () => {
    setPosterBase64(null);
    setPosterName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1-Click Instant Creation Handler
  const handleSingleClickCreate = async () => {
    const combinedText = [text.trim(), extraNotes.trim()].filter(Boolean).join('\n');
    const hasInput = Boolean(posterBase64 || url.trim() || combinedText);

    if (!hasInput) {
      setErrorMessage('Please provide an event poster, webpage link, or brief notes.');
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    try {
      if (posterBase64) {
        setProgressStep('Analyzing flyer poster with Gemini Vision OCR...');
      } else if (url.trim()) {
        setProgressStep('Crawling event webpage link & metadata...');
      } else {
        setProgressStep('Extracting event details with AI...');
      }

      const res = await fetch('/api/events/ai-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim() || undefined,
          imageBase64: posterBase64 || undefined,
          text: combinedText || undefined,
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

      // Save to local store for instant client synchronization
      saveEvent(data.event);

      setProgressStep('Event created! Opening preview...');
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
          <div className="w-8 h-8 border-3 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  // Auth Guard
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FAF8F5] via-white to-[#F8FAFC] text-[#0A0A0A]">
        <Navbar />

        <main className="flex-1 max-w-md mx-auto px-4 py-16 flex items-center justify-center w-full">
          <div className="w-full bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E8621A] to-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-[#E8621A]/25">
              <Wand2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-black text-2xl text-[#0F172A] tracking-tight">
                Sign in to Create
              </h1>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                Sign in to instantly publish your gathering with AI in a single click.
              </p>
            </div>

            <button
              onClick={() => signInWithGoogle('organizer', '/create/ai')}
              type="button"
              className="w-full py-3 px-4 rounded-2xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs sm:text-sm font-bold transition flex items-center justify-center gap-3 shadow-xs hover:border-[#0F172A] cursor-pointer"
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
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-bold text-xs transition-all hover:border-[#0F172A]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/signup?redirect=/create/ai"
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs transition-all shadow-md"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Free to host • Instant 1-click publishing</span>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  const hasAnyInput = Boolean(posterBase64 || url.trim() || text.trim() || extraNotes.trim());

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FAF8F5] via-white to-[#F8FAFC] text-[#0A0A0A] relative overflow-hidden">
      {/* Decorative ambient lights */}
      <div className="absolute -top-32 left-1/3 w-80 h-80 bg-[#E8621A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-48 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <Navbar />

      <main className="flex-1 max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full relative z-10 flex flex-col justify-center">
        {/* Compact Breadcrumb & Header */}
        <div className="mb-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-2xs text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-all"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back</span>
            </Link>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8621A]/10 text-[#E8621A] text-[11px] font-black uppercase tracking-wider border border-[#E8621A]/20">
              <Sparkles className="w-3 h-3" />
              <span>1-Click AI</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-[#0F172A]">
            Single-Click Event Creation
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-md mx-auto">
            Provide a poster flyer, ticket link, or prompt — AI auto-extracts and publishes your event in seconds.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Compact 1-Click Workstation Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xl shadow-slate-900/[0.04] space-y-4">
          {/* Segmented Mode Selector (Saves vertical scrolling!) */}
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0]/60 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('poster')}
              className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'poster'
                  ? 'bg-white text-[#0F172A] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#E8621A]" />
              <span>Flyer / Poster</span>
              {posterBase64 && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('link')}
              className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'link'
                  ? 'bg-white text-[#0F172A] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Web Link</span>
              {url.trim() && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('notes')}
              className={`py-2 px-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'notes'
                  ? 'bg-white text-[#0F172A] shadow-xs border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              <span>Prompt / Notes</span>
              {text.trim() && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
            </button>
          </div>

          {/* Active Input View */}
          <div className="pt-1">
            {/* Mode 1: Poster Upload Dropzone */}
            {activeMode === 'poster' && (
              <div className="space-y-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {!posterBase64 ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`py-5 sm:py-6 px-4 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      isDragging
                        ? 'border-[#E8621A] bg-[#E8621A]/10 scale-[1.01]'
                        : 'border-[#CBD5E1] hover:border-[#E8621A] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#E8621A] shadow-xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-[#0F172A]">
                        Drop flyer image here, or <span className="text-[#E8621A] underline">browse</span>
                      </div>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">JPEG, PNG, or WebP · Gemini Vision OCR</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-2.5 sm:p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-200 shrink-0 bg-white shadow-xs">
                        <Image
                          src={posterBase64}
                          alt="Event flyer preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#0F172A] truncate">
                          {posterName || 'Flyer attached'}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Ready for Vision OCR extraction</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePoster}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer shrink-0"
                      title="Remove flyer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Event Webpage Link */}
            {activeMode === 'link' && (
              <div className="space-y-2">
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="url"
                    placeholder="https://in.bookmyshow.com/... or https://lu.ma/... or district.in"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors placeholder:text-[#94A3B8]"
                  />
                  {url.trim() && (
                    <button
                      type="button"
                      onClick={() => setUrl('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#64748B]">
                  <span className="font-semibold text-[#475569]">Supported:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">BookMyShow</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">Luma</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">District</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">Paytm Insider</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">Unstop</span>
                </div>
              </div>
            )}

            {/* Mode 3: Prompt / Text Notes */}
            {activeMode === 'notes' && (
              <div>
                <textarea
                  rows={2}
                  placeholder="e.g. Subko Bandra coffee cupping session this Saturday at 5pm. Free entry for coffee enthusiasts."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0F172A] bg-white transition-colors resize-none placeholder:text-[#94A3B8]"
                />
              </div>
            )}

            {/* Compact Optional Context Toggle (Available for poster & link) */}
            {activeMode !== 'notes' && (
              <div className="pt-1.5">
                {!showExtraNotes ? (
                  <button
                    type="button"
                    onClick={() => setShowExtraNotes(true)}
                    className="text-[11px] font-semibold text-[#E8621A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Add extra notes or prompt (optional)</span>
                  </button>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B]">
                      <span>Extra notes (optional):</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtraNotes(false);
                          setExtraNotes('');
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Bring your own badminton racquet, RSVP deadline 4pm"
                      value={extraNotes}
                      onChange={(e) => setExtraNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0F172A] bg-white"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compact Visibility Selector */}
          <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#475569]">Visibility:</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPublic
                    ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#64748B]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Public Feed</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isPublic
                    ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-xs'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#64748B]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Private Link</span>
              </button>
            </div>
          </div>

          {/* 1-Click Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSingleClickCreate}
              disabled={isCreating || !hasAnyInput}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] hover:from-[#E8621A] hover:to-[#FF8C42] text-white text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shadow-md hover:shadow-lg hover:shadow-[#E8621A]/20 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{progressStep || 'Extracting & Publishing Event...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Create Event Instantly</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-[#94A3B8] text-center mt-1.5">
              Live published immediately with passes • Superadmin reviewed
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
