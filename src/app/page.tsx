'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import WhatsOnFeed from '@/components/events/WhatsOnFeed';

function LandingPageContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');

  // If returning from OAuth (?code=...), display clean instant redirect state
  if (codeParam) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="font-sans font-bold text-xl text-[#0F172A]">Signing you in with Google...</h2>
            <p className="text-xs text-[#64748B]">Redirecting you straight to your dashboard.</p>
          </div>
          <Loader2 className="w-6 h-6 text-[#0F172A] animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-texture-paper text-[#0F172A] font-sans selection:bg-[#0F172A] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full">
        <WhatsOnFeed />
      </main>

      <Footer />
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0F172A]" />
            <p className="text-xs font-bold text-[#64748B]">Loading...</p>
          </div>
        </div>
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}
