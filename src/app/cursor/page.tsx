'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import Magnetic from '@/components/common/MagneticButton';
import { ArrowLeft, Sparkles, MoveRight, Eye, ShieldCheck, Laptop, MousePointer2 } from 'lucide-react';

export default function CursorDemoPage() {
  const [clickCount, setClickCount] = useState(0);

  // Helper to update mouse coordinates on spotlight cards
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F3F4F6] flex flex-col font-sans selection:bg-white selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full space-y-16 sm:space-y-24">
        {/* Back Link & Badge */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="nav-link-sweep inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors font-medium py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to home</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-mono">
              <Laptop className="w-3.5 h-3.5 text-white/60" />
              <span>Desktop Mouse Only • Touch Bypassed</span>
            </div>
          </div>

          {/* Underline Sweep Nav Demo Strip */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0D0D10] border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Nav Links Sweep Demo:
            </span>
            <nav className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-semibold text-white/80">
              <a href="#overview" className="nav-link-sweep text-white hover:text-white py-1">
                Overview
              </a>
              <a href="#magnetic" className="nav-link-sweep text-white hover:text-white py-1">
                Magnetic CTA
              </a>
              <a href="#cards" className="nav-link-sweep text-white hover:text-white py-1">
                Spotlight Cards
              </a>
              <a href="#states" className="nav-link-sweep text-white hover:text-white py-1">
                Interactive States
              </a>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div id="overview" className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-white text-xs font-mono">
            <MousePointer2 className="w-3.5 h-3.5" />
            <span>mix-blend-mode: difference</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Custom Cursor & Magnetic Experience
          </h1>

          <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl mx-auto">
            A precision dot that tracks the mouse instantly, paired with a thin trailing ring using smooth lerp easing. Both employ blend-mode difference to naturally invert across any background, with zero amateur glow or trails.
          </p>

          {/* Magnetic CTA Section */}
          <div id="magnetic" className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Magnetic pullFactor={0.35}>
              <button
                type="button"
                onClick={() => setClickCount((c) => c + 1)}
                className="px-7 py-3.5 rounded-full bg-white text-black font-black text-sm tracking-tight transition-transform hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2.5 cursor-pointer"
              >
                <span>Start a project</span>
                <MoveRight className="w-4 h-4" />
              </button>
            </Magnetic>

            <Magnetic pullFactor={0.25}>
              <Link
                href="/create"
                className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm tracking-tight transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Host an event</span>
              </Link>
            </Magnetic>
          </div>

          {clickCount > 0 && (
            <p className="text-xs font-mono text-white/40 pt-1 animate-in fade-in">
              Button clicked {clickCount} {clickCount === 1 ? 'time' : 'times'} (notice the subtle shrink on mousedown)
            </p>
          )}
        </div>

        {/* Interactive Cards Grid with Soft Mouse Spotlight & "View" Cursor */}
        <div id="cards" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Spotlight Cards (Hover for &ldquo;View&rdquo;)
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Move your cursor across these cards to test the soft radial spotlight and the expanded &ldquo;View&rdquo; badge.
              </p>
            </div>
            <span className="text-xs font-mono text-white/40 uppercase tracking-widest shrink-0">
              data-cursor=&quot;view&quot;
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div
              data-cursor="view"
              onMouseMove={handleCardMouseMove}
              className="spotlight-card group rounded-3xl bg-[#0D0D10] border border-white/10 p-5 space-y-4 hover:border-white/30 transition-all duration-300 cursor-pointer"
            >
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-white/5">
                <Image
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80"
                  alt="Tech demo"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-white/15">
                  Tech & AI
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-white group-hover:text-white transition-colors">
                  AI Founders & Builders Mixer
                </h3>
                <p className="text-xs text-white/60 line-clamp-2">
                  Interactive gathering exploring local AI agents, LLM pipelines, and frontier interfaces.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              data-cursor="view"
              onMouseMove={handleCardMouseMove}
              className="spotlight-card group rounded-3xl bg-[#0D0D10] border border-white/10 p-5 space-y-4 hover:border-white/30 transition-all duration-300 cursor-pointer"
            >
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-white/5">
                <Image
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1000&auto=format&fit=crop&q=80"
                  alt="Acoustic live"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-white/15">
                  Live Music
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-white group-hover:text-white transition-colors">
                  Acoustic Rooftop Sessions
                </h3>
                <p className="text-xs text-white/60 line-clamp-2">
                  Intimate open-air performance under starry night skies with indie musicians.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div
              data-cursor="view"
              onMouseMove={handleCardMouseMove}
              className="spotlight-card group rounded-3xl bg-[#0D0D10] border border-white/10 p-5 space-y-4 hover:border-white/30 transition-all duration-300 cursor-pointer"
            >
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-white/5">
                <Image
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000&auto=format&fit=crop&q=80"
                  alt="Morning wellness"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-white/15">
                  Wellness
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-white group-hover:text-white transition-colors">
                  Sunrise Breathwork & Yoga
                </h3>
                <p className="text-xs text-white/60 line-clamp-2">
                  Recharge your mind and body with guided sound meditation and gentle flow.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* States Playground Strip */}
        <div id="states" className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Cursor State Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Hover over each trigger area below to examine the specific cursor behaviors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* State 1 */}
            <div className="p-5 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Default State
              </span>
              <p className="text-xs text-white/70">
                Precision 5px dot tracks mouse instantly with a smooth 26px trailing ring.
              </p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-mono text-white/60">
                Move around freely
              </div>
            </div>

            {/* State 2 */}
            <div className="p-5 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Link & Button Hover
              </span>
              <p className="text-xs text-white/70">
                Ring grows into a 42px filled circle that cleanly inverts the text beneath it.
              </p>
              <button
                type="button"
                className="w-full py-2.5 px-3 rounded-xl bg-white text-black font-bold text-xs cursor-pointer hover:opacity-90"
              >
                Hover This Button
              </button>
            </div>

            {/* State 3 */}
            <div className="p-5 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Card & Flyer Hover
              </span>
              <p className="text-xs text-white/70">
                Ring expands to 76px and displays a bold, inverted &ldquo;View&rdquo; badge.
              </p>
              <div
                data-cursor="view"
                className="p-3 rounded-xl bg-white/10 border border-white/15 text-center text-xs font-bold text-white cursor-pointer hover:bg-white/15 transition-colors"
              >
                Hover for &ldquo;View&rdquo; ↗
              </div>
            </div>

            {/* State 4 */}
            <div className="p-5 rounded-2xl bg-[#0D0D10] border border-white/10 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Click Feedback
              </span>
              <p className="text-xs text-white/70">
                Ring subtly shrinks down to scale(0.85) on mousedown, springing back on release.
              </p>
              <button
                type="button"
                className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs cursor-pointer active:scale-95 transition-transform"
              >
                Click and Hold Me
              </button>
            </div>
          </div>
        </div>

        {/* Feature Checklist Summary */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D0D10] border border-white/10 space-y-4">
          <h3 className="font-bold text-base sm:text-lg text-white">
            Architecture & Refinements Implemented:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-white/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>mix-blend-mode: difference</strong> — inverts across dark, light, or image canvases
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Magnetic spring button</strong> — pulls gently toward pointer and eases back
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>No trails, sparkles, or glow</strong> — clean, editorial, and distraction-free
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>prefers-reduced-motion</strong> — automatically disables lerp lag
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Touch device protection</strong> — coarse pointers use native browser behavior
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Mouse spotlight & nav sweep</strong> — CSS-accelerated micro-interactions
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
