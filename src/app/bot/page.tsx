'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import BotCreateSection from '@/components/events/BotCreateSection';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function BotPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#060A1C] text-slate-900 dark:text-[#F3F4F6] font-sans transition-colors duration-200 selection:bg-[#0038A8] dark:selection:bg-[#08B9F5] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-16 w-full overflow-x-hidden">
        {/* Navigation Breadcrumb */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#0038A8] dark:text-[#08B9F5] text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Event Curator</span>
          </div>
        </div>

        {/* Create an event as easily as sending a text section */}
        <div className="w-full">
          <BotCreateSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}

