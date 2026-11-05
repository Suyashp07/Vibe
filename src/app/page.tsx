'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import WhatsOnFeed from '@/components/events/WhatsOnFeed';
import { CallbackHandler } from '@/components/auth/CallbackHandler';
import ProductWalkthrough from '@/components/walkthrough/ProductWalkthrough';

function LandingPageContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');

  // If returning from OAuth (?code=...), seamlessly execute session verification & dashboard redirect
  if (codeParam) {
    return (
      <CallbackHandler
        customTitle="Signing you in with Google..."
        customSubtitle="Redirecting you back to Vibe..."
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#F3F4F6] font-sans selection:bg-[#08B9F5] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2.5 sm:pt-3.5 pb-2 sm:pb-4 w-full">
        <WhatsOnFeed />
      </main>

      <Footer />

      {/* Product Walkthrough Spotlight Tour */}
      <ProductWalkthrough />
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#08B9F5]" />
            <p className="text-xs font-bold text-white/50 tracking-wider uppercase">Loading Vibe...</p>
          </div>
        </div>
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}
