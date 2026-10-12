'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

/**
 * Client-side platform engagement tracker.
 * Sends periodic heartbeats only when user's tab is actively visible.
 * Seamless, non-intrusive, zero network impact.
 */
export default function PlatformTelemetry() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const sessionIdRef = useRef<string>('');
  const lastPingRef = useRef<number>(Date.now());

  useEffect(() => {
    // Generate persistent session ID per tab session
    if (!sessionIdRef.current && typeof window !== 'undefined') {
      let sid = sessionStorage.getItem('vibe_telemetry_sid');
      if (!sid) {
        sid = 'sid_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
        sessionStorage.setItem('vibe_telemetry_sid', sid);
      }
      sessionIdRef.current = sid;
    }

    const email = profile?.email || user?.email || undefined;

    const sendPing = (durationSeconds: number) => {
      if (typeof window === 'undefined') return;
      const payload = {
        sessionId: sessionIdRef.current,
        pathname: window.location.pathname || '/',
        durationSeconds,
        userEmail: email,
      };

      // Use navigator.sendBeacon if available for non-blocking telemetry
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/telemetry/heartbeat', blob);
      } else {
        fetch('/api/telemetry/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
      lastPingRef.current = Date.now();
    };

    // Initial heartbeat on mount
    sendPing(15);

    // Periodic heartbeat every 30 seconds while window is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const elapsedSeconds = Math.round((Date.now() - lastPingRef.current) / 1000);
        sendPing(Math.min(elapsedSeconds, 45));
      }
    }, 30000);

    // On visibility change / unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const elapsed = Math.round((Date.now() - lastPingRef.current) / 1000);
        if (elapsed >= 5) {
          sendPing(Math.min(elapsed, 60));
        }
      } else {
        lastPingRef.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      const elapsed = Math.round((Date.now() - lastPingRef.current) / 1000);
      if (elapsed >= 3) {
        sendPing(Math.min(elapsed, 60));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, user?.email, profile?.email]);

  return null;
}
