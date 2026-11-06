'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Check, X, Compass, Loader2 } from 'lucide-react';
import {
  reverseGeocodeCoords,
  findNearestCity,
  setUserLocation,
  getUserCity,
} from '@/lib/location';

export default function AutoLocationDetector() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [toastCity, setToastCity] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const checkedRef = useRef(false);

  // Helper to fetch coordinates and resolve city
  const performLocationDetection = (isInteractive: boolean) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (isInteractive) {
        localStorage.setItem('vibe_location_prompted', 'true');
        setShowPrompt(false);
        window.dispatchEvent(new CustomEvent('vibe:open_location_modal'));
      }
      return;
    }

    if (isInteractive) {
      setIsLocating(true);
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let detectedCityName = '';
          let detectedState = '';

          try {
            const geocoded = await reverseGeocodeCoords(latitude, longitude);
            detectedCityName = geocoded.cityName;
            detectedState = geocoded.state || '';
          } catch {
            const nearest = findNearestCity(latitude, longitude);
            detectedCityName = nearest.city.name;
            detectedState = nearest.city.state;
          }

          if (detectedCityName) {
            const prevCity = getUserCity();
            setUserLocation(detectedCityName, { lat: latitude, lng: longitude });

            // Display confirmation toast
            setToastCity(detectedState ? `${detectedCityName}, ${detectedState}` : detectedCityName);
            setTimeout(() => {
              setToastCity(null);
            }, 4500);
          }
        } catch (err) {
          console.warn('[AutoLocationDetector] Location resolution error:', err);
        } finally {
          localStorage.setItem('vibe_location_prompted', 'true');
          setIsLocating(false);
          setShowPrompt(false);
        }
      },
      (error) => {
        console.log('[AutoLocationDetector] Geolocation response:', error.message);
        localStorage.setItem('vibe_location_prompted', 'true');
        setIsLocating(false);
        setShowPrompt(false);

        // If user actively clicked allow but browser blocked/denied, offer manual selection
        if (isInteractive) {
          window.dispatchEvent(new CustomEvent('vibe:open_location_modal'));
        }
      },
      {
        timeout: 5000,
        enableHighAccuracy: false,
        maximumAge: 300000,
      }
    );
  };

  useEffect(() => {
    setMounted(true);

    if (checkedRef.current) return;
    checkedRef.current = true;

    if (typeof window === 'undefined') return;

    const alreadyPrompted = localStorage.getItem('vibe_location_prompted') === 'true';

    // Orchestrator: wait for splash screen -> then walkthrough (if new user) -> then location prompt
    const schedulePrompt = () => {
      if (localStorage.getItem('vibe_location_prompted') === 'true') return;

      const triggerPrompt = () => {
        if (localStorage.getItem('vibe_location_prompted') === 'true') return;
        setShowPrompt(true);
      };

      const checkStateAndPrompt = () => {
        if (localStorage.getItem('vibe_location_prompted') === 'true') return;

        // 1. Is splash screen active?
        const isSplashActive =
          (window as any).__vibeSplashActive ||
          (sessionStorage.getItem('vibe_seen_splash') !== '1' && document.getElementById('splash') !== null);

        if (isSplashActive) {
          const onSplashDone = () => {
            window.removeEventListener('vibe:splash_completed', onSplashDone);
            setTimeout(checkStateAndPrompt, 400);
          };
          window.addEventListener('vibe:splash_completed', onSplashDone);
          return;
        }

        // 2. Is walkthrough active or required for a new user?
        const isWalkthroughNeeded =
          window.location.pathname === '/' &&
          localStorage.getItem('vibe_walkthrough_hidden') !== '1';
        const isWalkthroughActive =
          (window as any).__vibeWalkthroughActive || isWalkthroughNeeded;

        if (isWalkthroughActive) {
          const onWalkthroughDone = () => {
            window.removeEventListener('vibe:walkthrough_completed', onWalkthroughDone);
            setTimeout(triggerPrompt, 500);
          };
          window.addEventListener('vibe:walkthrough_completed', onWalkthroughDone);
          return;
        }

        // 3. Both splash and walkthrough are done/inactive: show location grant
        triggerPrompt();
      };

      setTimeout(checkStateAndPrompt, 500);
    };

    // Check browser Permissions API if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            // Already granted by user previously: silently refresh coordinates
            performLocationDetection(false);
          } else if (result.state === 'prompt') {
            // Needs permission: wait for splash screen then user walkthrough
            if (!alreadyPrompted) {
              schedulePrompt();
            }
          }
          // If denied, do nothing (respect user choice)

          result.onchange = () => {
            if (result.state === 'granted') {
              performLocationDetection(false);
            }
          };
        })
        .catch(() => {
          // Fallback if permissions query rejects
          if (!alreadyPrompted) {
            schedulePrompt();
          }
        });
    } else {
      // Browsers without Permissions API (e.g. mobile Safari)
      if (!alreadyPrompted) {
        schedulePrompt();
      }
    }
  }, []);

  const handleAllowClick = () => {
    performLocationDetection(true);
  };

  const handleSelectManually = () => {
    localStorage.setItem('vibe_location_prompted', 'true');
    setShowPrompt(false);
    window.dispatchEvent(new CustomEvent('vibe:open_location_modal'));
  };

  const handleDismiss = () => {
    localStorage.setItem('vibe_location_prompted', 'true');
    setShowPrompt(false);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Onboarding Location Permission Dialog (Asks once after splash & walkthrough) */}
      {showPrompt && (
        <div className="fixed inset-0 z-[9995] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 relative animate-in zoom-in-95 duration-200 text-[#0F172A] dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition cursor-pointer"
              title="Maybe Later"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Compass Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-10 w-10 rounded-2xl bg-[#0038A8]/25 animate-ping opacity-40" />
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0038A8] to-[#1E6BFF] text-white flex items-center justify-center shadow-md shadow-[#0038A8]/30">
                  <Compass className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#0038A8] dark:text-[#4D8CFF] uppercase">
                  Nearby Experiences
                </span>
                <h3 className="text-lg font-black text-[#0F172A] dark:text-white leading-tight font-display">
                  Find Events in Your City
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Allow location access so Vibe can curate underground music gigs, candlelit baithaks, tech mixers, and spontaneous flash vibes closest to you.
            </p>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleAllowClick}
                disabled={isLocating}
                className="w-full py-3 px-4 rounded-xl bg-[#0038A8] hover:bg-[#002B82] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow transition cursor-pointer disabled:opacity-75"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Detecting your city...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 text-white" />
                    <span>Allow Location Access</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSelectManually}
                disabled={isLocating}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Select City Manually</span>
              </button>
            </div>

            {/* Subtle reassurance */}
            <p className="text-[10px] text-slate-400 dark:text-slate-400 text-center mt-4">
              Your location is only used locally to calculate distances. Never shared or tracked.
            </p>
          </div>
        </div>
      )}

      {/* Location Detected Floating Pill Toast */}
      {toastCity && (
        <div className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-none px-4 w-full max-w-sm flex justify-center">
          <div className="pointer-events-auto bg-white/95 dark:bg-[#07133A]/95 text-slate-900 dark:text-white pl-2.5 pr-3 py-1.5 rounded-full shadow-[0_10px_35px_rgba(0,10,40,0.18)] border border-slate-200/90 dark:border-white/15 backdrop-blur-md flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-white/10 text-[#0038A8] dark:text-sky-300 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium truncate">
              Browsing events near <span className="font-bold text-[#0038A8] dark:text-sky-300">{toastCity}</span>
            </span>
            <button
              type="button"
              onClick={() => setToastCity(null)}
              className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-0.5"
              aria-label="Dismiss location toast"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
