'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export interface MobileNavModule {
  id: string;
  path: string;
  label: string;
}

export const MOBILE_NAV_MODULES: MobileNavModule[] = [
  { id: 'discover', path: '/', label: 'Discover' },
  { id: 'vibes', path: '/vibes', label: 'Instant' },
  { id: 'create', path: '/create', label: '+ Host' },
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard' },
  { id: 'passes', path: '/passes', label: 'Passes' },
];

/**
 * Returns the module index (0 to 4) based on current pathname.
 */
export function getModuleIndex(pathname: string): number {
  if (!pathname || pathname === '/') return 0;
  if (pathname.startsWith('/vibes') || pathname.startsWith('/vibe')) return 1;
  if (pathname.startsWith('/create')) return 2;
  if (pathname.startsWith('/dashboard')) return 3;
  if (pathname.startsWith('/passes') || pathname.startsWith('/guest')) return 4;
  return -1;
}

interface UseMobileGesturesOptions {
  enabled?: boolean;
  enableGlobalSwipe?: boolean;
  navRef?: React.RefObject<HTMLElement | null>;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useMobileGestures({
  enabled = true,
  enableGlobalSwipe = true,
  navRef,
  onSwipeLeft,
  onSwipeRight,
}: UseMobileGesturesOptions = {}) {
  const pathname = usePathname();
  const router = useRouter();

  const [gestureFeedback, setGestureFeedback] = useState<{
    message: string;
    direction: 'left' | 'right';
  } | null>(null);

  const touchState = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    isNavTouch: boolean;
    isIgnored: boolean;
  }>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isNavTouch: false,
    isIgnored: false,
  });

  const feedbackTimer = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = useCallback((message: string, direction: 'left' | 'right') => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setGestureFeedback({ message, direction });
    feedbackTimer.current = setTimeout(() => {
      setGestureFeedback(null);
    }, 900);
  }, []);

  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(14);
      } catch {}
    }
  }, []);

  // Helper to navigate modules
  const navigateToModule = useCallback(
    (direction: 'next' | 'prev') => {
      const currentIndex = getModuleIndex(pathname);
      if (currentIndex === -1) {
        // If on child/sub-page and user swipes right, act as back/return to discover
        if (direction === 'prev') {
          triggerHaptic();
          showFeedback('← Discover', 'right');
          router.push('/');
        }
        return;
      }

      if (direction === 'next') {
        // Left swipe -> navigate to right module (next module)
        if (currentIndex < MOBILE_NAV_MODULES.length - 1) {
          const nextModule = MOBILE_NAV_MODULES[currentIndex + 1];
          triggerHaptic();
          showFeedback(`${nextModule.label} →`, 'left');
          router.push(nextModule.path);
        }
      } else {
        // Right swipe -> navigate to left module (prev module)
        if (currentIndex > 0) {
          const prevModule = MOBILE_NAV_MODULES[currentIndex - 1];
          triggerHaptic();
          showFeedback(`← ${prevModule.label}`, 'right');
          router.push(prevModule.path);
        }
      }
    },
    [pathname, router, showFeedback, triggerHaptic]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Only active on mobile viewport
    const isMobile = () => window.innerWidth < 768;

    const shouldIgnoreElement = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const tagName = el.tagName.toLowerCase();
      if (['input', 'textarea', 'select', 'button'].includes(tagName)) return true;
      if (el.isContentEditable) return true;
      if (el.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')) return true;
      if (el.closest('.no-swipe, [data-no-swipe], [role="dialog"], .modal-dialog, .vibe-reel-card, [data-reel-feed]')) return true;
      if (pathname.startsWith('/vibes') || pathname.startsWith('/vibe')) return true;

      // Check if inside a horizontal scroll container
      let current: HTMLElement | null = el;
      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const overflowX = style.overflowX;
        if (
          (overflowX === 'auto' || overflowX === 'scroll') &&
          current.scrollWidth > current.clientWidth + 10
        ) {
          return true;
        }
        current = current.parentElement;
      }
      return false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!isMobile() || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const target = e.target as HTMLElement;

      const isNav = navRef?.current ? navRef.current.contains(target) : false;
      const isIgnored = !isNav && shouldIgnoreElement(target);

      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isNavTouch: isNav,
        isIgnored,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isMobile() || e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const { startX, startY, startTime, isNavTouch, isIgnored } = touchState.current;

      if (isIgnored) return;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const duration = Date.now() - startTime;

      // Swiping directly on the bottom navigation dock: lower threshold, high responsiveness
      if (isNavTouch) {
        if (duration < 650 && Math.abs(deltaX) > 30) {
          if (deltaX < 0) {
            // Left swipe on dock -> next module on right
            onSwipeLeft ? onSwipeLeft() : navigateToModule('next');
          } else {
            // Right swipe on dock -> prev module on left
            onSwipeRight ? onSwipeRight() : navigateToModule('prev');
          }
        }
        return;
      }

      // Screen-wide swipe: stricter heuristic to avoid interfering with vertical scrolling
      if (enableGlobalSwipe) {
        const minDistance = 50;
        const maxDuration = 700;

        if (
          duration < maxDuration &&
          Math.abs(deltaX) >= minDistance &&
          Math.abs(deltaX) > Math.abs(deltaY) * 1.5
        ) {
          if (deltaX < 0) {
            // Left swipe on screen -> next module on right
            onSwipeLeft ? onSwipeLeft() : navigateToModule('next');
          } else {
            // Right swipe on screen -> prev module on left
            onSwipeRight ? onSwipeRight() : navigateToModule('prev');
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, enableGlobalSwipe, navRef, navigateToModule, onSwipeLeft, onSwipeRight]);

  return {
    gestureFeedback,
    navigateToModule,
  };
}
