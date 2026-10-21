'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Universal Mobile Scroll & Layout Architecture Manager
 *
 * Guarantees that mobile window scrolling is NEVER locked, frozen, or hijacked
 * when switching between different platform modules (e.g. from Vibe Instant to
 * Discover, Dashboard, Passes, or Create).
 */
export default function ScrollResetManager() {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isPathChange = prevPathnameRef.current !== pathname;
    prevPathnameRef.current = pathname;

    // 1. Forcefully release any stuck body/documentElement inline locks left behind
    // by full-screen views (like /vibes) or closed modals.
    if (pathname !== '/vibes') {
      try {
        document.documentElement.style.removeProperty('overflow');
        document.documentElement.style.removeProperty('height');
        document.documentElement.style.removeProperty('position');
        document.documentElement.classList.remove('vibe-screen-active');

        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('height');
        document.body.style.removeProperty('position');
        document.body.style.removeProperty('overscroll-behavior');
        document.body.style.removeProperty('padding-bottom');
      } catch {}
    }

    // 2. On route change, reset window scroll to top cleanly
    if (isPathChange && pathname !== '/vibes') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        window.scrollTo(0, 0);
      }
    }

    // 3. Trigger a layout recalculation tick so mobile WebKit (iOS Safari)
    // and Chrome mobile immediately measure the new page's full scrollable height.
    const timer = setTimeout(() => {
      if (pathname !== '/vibes') {
        try {
          document.body.style.removeProperty('overflow');
          document.body.style.removeProperty('height');
          document.documentElement.style.removeProperty('overflow');
          document.documentElement.style.removeProperty('height');
        } catch {}
      }
      try {
        window.dispatchEvent(new Event('resize'));
      } catch {}
    }, 40);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
