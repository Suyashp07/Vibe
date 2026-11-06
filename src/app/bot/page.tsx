'use client';

import React from 'react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import BotCreateSection from '@/components/events/BotCreateSection';

export default function BotPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#060A1C] text-slate-900 dark:text-[#F3F4F6] font-sans transition-colors duration-200 selection:bg-[#0038A8] dark:selection:bg-[#08B9F5] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-1 sm:pt-2 pb-12 w-full overflow-x-hidden">
        {/* Create an event as easily as sending a text section */}
        <div className="w-full">
          <BotCreateSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}

