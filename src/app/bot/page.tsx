'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import BotCreateSection from '@/components/events/BotCreateSection';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function BotPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#F3F4F6] font-sans selection:bg-[#08B9F5] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0066F5]/10 border border-[#0066F5]/25 text-[#08B9F5] text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Event Curator</span>
          </div>
        </div>

        {/* Create an event as easily as sending a text section */}
        <div className="rounded-2xl border border-white/10 bg-[#0B0D13]/80 backdrop-blur-xl overflow-hidden p-2 sm:p-6 shadow-2xl">
          <BotCreateSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}

