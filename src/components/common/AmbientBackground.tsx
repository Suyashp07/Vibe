'use client';

import React, { useEffect, useRef } from 'react';

export default function AmbientBackground() {
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Completely disable interactive mouse spotlight on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    let rafId: number | null = null;
    let currentX = -1000;
    let currentY = -1000;

    const updateSpotlight = () => {
      if (spotlightRef.current) {
        spotlightRef.current.style.background = `radial-gradient(600px circle at ${currentX}px ${currentY}px, rgba(255, 85, 0, 0.045), transparent 75%)`;
        spotlightRef.current.style.opacity = '1';
      }
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      currentX = e.clientX;
      currentY = e.clientY;
      if (!rafId) {
        rafId = requestAnimationFrame(updateSpotlight);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* 1. Subtle Film Grain / Noise Overlay (Analog Editorial Feel) */}
      <div
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.025] mix-blend-overlay contain-strict"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* 2. Static GPU-Optimized Ambient Gradient Blobs (Zero continuous repaint) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
        {/* Warm Orange Brand Blob */}
        <div
          className="absolute -top-[10%] left-[15%] w-[480px] h-[480px] rounded-full bg-[#FF5500]/[0.04] blur-[110px]"
          style={{ transform: 'translate3d(0,0,0)' }}
        />
        {/* Deep Violet Horizon Blob */}
        <div
          className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[#7928CA]/[0.035] blur-[120px]"
          style={{ transform: 'translate3d(0,0,0)' }}
        />
        {/* Grounding Amber Bloom */}
        <div
          className="absolute -bottom-[10%] left-[25%] w-[440px] h-[440px] rounded-full bg-[#FF7700]/[0.03] blur-[110px]"
          style={{ transform: 'translate3d(0,0,0)' }}
        />

        {/* 3. High-Performance RAF Spotlight (Zero React Re-renders) */}
        <div
          ref={spotlightRef}
          className="pointer-events-none fixed inset-0 transition-opacity duration-300 ease-out z-[1] opacity-0"
        />
      </div>
    </>
  );
}
