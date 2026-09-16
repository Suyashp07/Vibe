'use client';

import React, { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import WhatsOnFeed from '@/components/events/WhatsOnFeed';

export default function DiscoverPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F172A] font-sans selection:bg-[#0F172A] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full">
        <Suspense
          fallback={
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0F172A]" />
              <p className="text-xs font-bold text-[#64748B]">Loading events...</p>
            </div>
          }
        >
          <WhatsOnFeed />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
