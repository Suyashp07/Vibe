'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import WhatsOnFeed from '@/components/events/WhatsOnFeed';
import { CallbackHandler } from '@/components/auth/CallbackHandler';

function LandingPageContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');

  // If returning from OAuth (?code=...), seamlessly execute session verification & dashboard redirect
  if (codeParam) {
    return (
      <CallbackHandler
        customTitle="Signing you in with Google..."
        customSubtitle="Redirecting you straight to your dashboard."
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#F3F4F6] font-sans selection:bg-[#FF5500] selection:text-white">
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
