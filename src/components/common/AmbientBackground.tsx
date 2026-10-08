'use client';

import React, { useEffect, useState } from 'react';

export default function AmbientBackground() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [hasMouse, setHasMouse] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!hasMouse) setHasMouse(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hasMouse]);

  return (
    <>
      {/* 1. Subtle Film Grain / Noise Overlay (Analog Editorial Feel) */}
      <div
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.032] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* 2. Ambient Shifting Gradient Mesh Blobs in Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Warm Orange Brand Blob */}
        <div
          className="absolute -top-[10%] left-[15%] w-[550px] h-[550px] rounded-full bg-[#FF5500]/[0.055] blur-[140px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        {/* Deep Violet Horizon Blob */}
        <div
          className="absolute top-[40%] -right-[10%] w-[600px] h-[600px] rounded-full bg-[#7928CA]/[0.045] blur-[160px] animate-pulse"
          style={{ animationDuration: '12s' }}
        />
        {/* Grounding Amber Bloom */}
        <div
          className="absolute -bottom-[10%] left-[25%] w-[500px] h-[500px] rounded-full bg-[#FF7700]/[0.035] blur-[150px] animate-pulse"
          style={{ animationDuration: '10s' }}
        />

        {/* 3. Interactive Cursor Spotlight / Glow */}
        {hasMouse && (
          <div
            className="pointer-events-none fixed inset-0 transition-opacity duration-500 ease-out z-[1]"
            style={{
              background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 85, 0, 0.055), transparent 75%)`,
            }}
          />
        )}
      </div>
    </>
  );
}
