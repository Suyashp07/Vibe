'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { ADMIN_BASE_PATH } from '@/lib/adminConstants';

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Do NOT run Lenis on mobile/touch screens or full-viewport app pages
    const isTouchDevice =
      window.matchMedia('(pointer: coarse)').matches ||
      window.innerWidth < 768 ||
      'ontouchstart' in window;

    if (
      isTouchDevice ||
      pathname === '/vibes' ||
      pathname?.startsWith('/vibes') ||
      pathname === '/admin' ||
      pathname?.startsWith('/admin') ||
      pathname === ADMIN_BASE_PATH ||
      pathname?.startsWith(ADMIN_BASE_PATH) ||
      pathname === '/dashboard' ||
      pathname?.startsWith('/dashboard')
    ) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Initialize buttery smooth desktop scroll with Lenis (Zero touch interception)
    const lenis = new Lenis({
      duration: 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 0, // Never hijack native touch momentum
      syncTouch: false,
    });

    lenisRef.current = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]);

  return <>{children}</>;
}
