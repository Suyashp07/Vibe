'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import Magnetic from '@/components/common/MagneticButton';
import {
  ArrowLeft,
  Sparkles,
  MoveRight,
  Eye,
  ShieldCheck,
  Laptop,
  MousePointer2,
  Sliders,
  RotateCcw,
  Zap
} from 'lucide-react';
import {
  RibbonConfig,
  DEFAULT_RIBBON_CONFIG,
  RIBBON_PRESETS,
  getStoredRibbonConfig,
  saveRibbonConfig,
  triggerRibbonFlick,
} from '@/lib/ribbonConfig';

export default function CursorDemoPage() {
  const [clickCount, setClickCount] = useState(0);
  const [config, setConfig] = useState<RibbonConfig>(DEFAULT_RIBBON_CONFIG);

  useEffect(() => {
    setConfig(getStoredRibbonConfig());
  }, []);

  const updateConfig = (partial: Partial<RibbonConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    saveRibbonConfig(updated);
  };

  const handleReset = () => {
    setConfig(DEFAULT_RIBBON_CONFIG);
    saveRibbonConfig(DEFAULT_RIBBON_CONFIG);
  };

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
              <span>Desktop Mouse Active • 56-Node Spring Chain</span>
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
              <a href="#controls" className="nav-link-sweep text-white hover:text-white py-1">
                Live Ribbon Controls
              </a>
              <a href="#magnetic" className="nav-link-sweep text-white hover:text-white py-1">
                Magnetic CTA
              </a>
              <a href="#cards" className="nav-link-sweep text-white hover:text-white py-1">
                Spotlight Cards
              </a>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <div id="overview" className="space-y-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-white text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
            <span>Interactive 3D Ribbon Trail Physics</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Ribbon Trail Cursor
          </h1>

          <p className="text-sm sm:text-base text-white/60 leading-relaxed max-w-2xl mx-auto">
            Move your cursor to twist the ribbon in real time. Click anywhere to trigger an elastic 360° flick. Powered by a 56-node spring chain solver with 3D polygon facet rendering and cosine curvature shading.
          </p>

          {/* Magnetic CTA Section */}
          <div id="magnetic" className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Magnetic pullFactor={0.35}>
              <button
                type="button"
                onClick={() => {
                  setClickCount((c) => c + 1);
                  triggerRibbonFlick();
                }}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#5227ff] to-[#e0409a] text-white font-black text-sm tracking-tight transition-transform hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2.5 cursor-pointer"
              >
                <span>Flick & Click Me</span>
                <MoveRight className="w-4 h-4" />
              </button>
            </Magnetic>

            <button
              type="button"
              onClick={triggerRibbonFlick}
              className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm tracking-tight transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#FF5500]" />
              <span>Trigger 360° Flick</span>
            </button>
          </div>

          {clickCount > 0 && (
            <p className="text-xs font-mono text-white/40 pt-1 animate-in fade-in">
              Clicked {clickCount} {clickCount === 1 ? 'time' : 'times'} • Flick impulse active!
            </p>
          )}
        </div>

        {/* ========================================================================= */}
        {/* LIVE RIBBON CONTROLLER PANEL                                              */}
        {/* ========================================================================= */}
        <div id="controls" className="p-6 sm:p-8 rounded-3xl bg-[#0D0D10] border border-white/10 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF5500]">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Ribbon Trail Physics & Style Tuner
                </h2>
                <p className="text-xs text-white/60">
                  Tweak parameters live — changes reflect immediately on your cursor across the site.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={triggerRibbonFlick}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#5227ff] to-[#e0409a] hover:opacity-90 text-white text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
              >
                🎲 Flick
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition cursor-pointer"
                title="Reset to default parameters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Presets Strip */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">
              Color Palette Presets
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {RIBBON_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => updateConfig({ frontColor: preset.front, backColor: preset.back })}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    config.frontColor.toLowerCase() === preset.front.toLowerCase() &&
                    config.backColor.toLowerCase() === preset.back.toLowerCase()
                      ? 'border-[#FF5500] bg-white/10 text-white shadow-xs'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${preset.front} 50%, ${preset.back} 50%)`,
                    }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Parameter Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {/* Front Color */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Front Face Color</span>
                <span className="text-[11px] font-mono text-white/60 uppercase">{config.frontColor}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.frontColor}
                  onChange={(e) => updateConfig({ frontColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-white/20 cursor-pointer bg-transparent overflow-hidden"
                />
                <span className="text-xs text-white/50">Primary forward ribbon facet</span>
              </div>
            </div>

            {/* Back Color */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Back Face Color</span>
                <span className="text-[11px] font-mono text-white/60 uppercase">{config.backColor}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.backColor}
                  onChange={(e) => updateConfig({ backColor: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-white/20 cursor-pointer bg-transparent overflow-hidden"
                />
                <span className="text-xs text-white/50">Inverted reverse ribbon facet</span>
              </div>
            </div>

            {/* Width */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Ribbon Width</span>
                <span className="text-[11px] font-mono text-white/60">{config.width}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="60"
                value={config.width}
                onChange={(e) => updateConfig({ width: Number(e.target.value) })}
                className="w-full accent-[#5227ff] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>8px</span>
                <span>Default 28px</span>
                <span>60px</span>
              </div>
            </div>

            {/* Trail Length */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Spring Trail</span>
                <span className="text-[11px] font-mono text-white/60">{config.trail.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                value={Math.round(config.trail * 10)}
                onChange={(e) => updateConfig({ trail: Number(e.target.value) / 10 })}
                className="w-full accent-[#e0409a] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>Snappy (0.5)</span>
                <span>Default (1.9)</span>
                <span>Long (4.0)</span>
              </div>
            </div>

            {/* Bounce */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Spring Bounce</span>
                <span className="text-[11px] font-mono text-white/60">{Math.round(config.bounce * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(config.bounce * 100)}
                onChange={(e) => updateConfig({ bounce: Number(e.target.value) / 100 })}
                className="w-full accent-[#5227ff] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>Damped (0%)</span>
                <span>Default (40%)</span>
                <span>Elastic (100%)</span>
              </div>
            </div>

            {/* Angle */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Tilt Angle</span>
                <span className="text-[11px] font-mono text-white/60">{config.angle}°</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                value={config.angle}
                onChange={(e) => updateConfig({ angle: Number(e.target.value) })}
                className="w-full accent-[#e0409a] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>-90°</span>
                <span>Default -35°</span>
                <span>+90°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Cards Grid with Soft Mouse Spotlight */}
        <div id="cards" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Interactive Canvas Testing Cards
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Move your cursor across these cards to see how the ribbon gracefully sweeps and contrasts across varied surfaces.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div
              onMouseMove={handleCardMouseMove}
              className="spotlight-card group relative p-6 rounded-3xl bg-[#0D0D10] border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/25 flex flex-col justify-between h-[360px] cursor-pointer"
            >
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 text-[#5227ff]" />
                </div>
                <h3 className="font-bold text-lg text-white">Spring Dynamics</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Sub-stepped Euler integration solves 56 spring links with 4 sub-steps per frame, guaranteeing jitter-free ribbon flow.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50">
                <span>sub: 4 steps</span>
                <span className="text-white group-hover:translate-x-1 transition-transform">↗</span>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onMouseMove={handleCardMouseMove}
              className="spotlight-card group relative p-6 rounded-3xl bg-[#0D0D10] border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/25 flex flex-col justify-between h-[360px] cursor-pointer"
            >
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                  <Zap className="w-5 h-5 text-[#e0409a]" />
                </div>
                <h3 className="font-bold text-lg text-white">360° Elastic Flick</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Pointer click flips direction and introduces an angular spiral impulse, snapping the ribbon through a dramatic twist.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50">
                <span>fT / fDir impulse</span>
                <span className="text-white group-hover:translate-x-1 transition-transform">↗</span>
              </div>
            </div>

            {/* Card 3 */}
            <div
              onMouseMove={handleCardMouseMove}
              className="spotlight-card group relative p-6 rounded-3xl bg-[#0D0D10] border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/25 flex flex-col justify-between h-[360px] cursor-pointer"
            >
              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
                  <Eye className="w-5 h-5 text-[#FF5500]" />
                </div>
                <h3 className="font-bold text-lg text-white">Lissajous Idle Dance</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  When the mouse leaves the browser or stays still, an ambient harmonic wave gracefully takes over so the ribbon stays alive.
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/50">
                <span>tau: 0.25 harmonic</span>
                <span className="text-white group-hover:translate-x-1 transition-transform">↗</span>
              </div>
            </div>
          </div>
        </div>

        {/* Architectural Specs Summary */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D0D10] border border-white/10 space-y-4">
          <h3 className="font-bold text-base sm:text-lg text-white">
            Ribbon Trail Architecture:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-white/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Hardware-accelerated Canvas</strong> — 60-120 FPS render loop with devicePixelRatio scaling
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Zero Click Blocking</strong> — Canvas has pointer-events: none, all underlying UI clicks pass through
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Curvature-based Facet Shading</strong> — Computes normal vectors and cosine shading across front and back faces
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>prefers-reduced-motion check</strong> — Disables automatic ambient idle movement for accessibility
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Touch Bypass</strong> — Coarse pointers (smartphones/tablets) use native touch with zero lag
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Pixel-Accurate Tip</strong> — High-contrast tip dot ensures precision clicking on links, buttons, and text
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
