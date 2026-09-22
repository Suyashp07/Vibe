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
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    setMounted(true);

    if (checkedRef.current) return;
    checkedRef.current = true;

    if (typeof window === 'undefined') return;

    const alreadyPrompted = localStorage.getItem('vibe_location_prompted') === 'true';

    // Check browser Permissions API if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          if (result.state === 'granted') {
            // Already granted by user previously: silently refresh coordinates
            performLocationDetection(false);
          } else if (result.state === 'prompt') {
            // Needs permission: ask once upon starting if not previously prompted
            if (!alreadyPrompted) {
              const timer = setTimeout(() => {
                setShowPrompt(true);
              }, 700);
              return () => clearTimeout(timer);
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
            const timer = setTimeout(() => {
              setShowPrompt(true);
            }, 700);
            return () => clearTimeout(timer);
          }
        });
    } else {
      // Browsers without Permissions API (e.g. mobile Safari)
      if (!alreadyPrompted) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 700);
        return () => clearTimeout(timer);
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
      {/* Onboarding Location Permission Dialog (Asks once upon starting) */}
      {showPrompt && (
        <div className="fixed inset-0 z-[99998] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white border border-[#E2E8F0] w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 relative animate-in zoom-in-95 duration-200 text-[#0F172A]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="Maybe Later"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Compass Badge */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-10 w-10 rounded-2xl bg-[#E8621A]/25 animate-ping opacity-40" />
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#E8621A] to-[#FF8442] text-white flex items-center justify-center shadow-md shadow-[#E8621A]/20">
                  <Compass className="w-5 h-5" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-[#E8621A] uppercase">
                  Nearby Experiences
                </span>
                <h3 className="text-lg font-black text-[#0F172A] leading-tight font-display">
                  Find Events in Your City
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Allow location access so Vibe can curate underground music gigs, candlelit baithaks, tech mixers, and spontaneous flash vibes closest to you.
            </p>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleAllowClick}
                disabled={isLocating}
                className="w-full py-3 px-4 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow transition cursor-pointer disabled:opacity-75"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF8442]" />
                    <span>Detecting your city...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 text-[#FF8442]" />
                    <span>Allow Location Access</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSelectManually}
                disabled={isLocating}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-200 transition cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Select City Manually</span>
              </button>
            </div>

            {/* Subtle reassurance */}
            <p className="text-[10px] text-slate-400 text-center mt-4">
              Your location is only used locally to calculate distances. Never shared or tracked.
            </p>
          </div>
        </div>
      )}

      {/* Location Detected Toast */}
      {toastCity && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-none">
          <div className="pointer-events-auto bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs max-w-sm">
            <div className="w-8 h-8 rounded-xl bg-[#E8621A]/20 text-[#E8621A] flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 rotate-45" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-100 flex items-center gap-1.5 truncate">
                <span>Location Detected</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              </p>
              <p className="text-slate-300 text-[11px] truncate">
                Browsing events near <span className="text-[#FF8442] font-semibold">{toastCity}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastCity(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              aria-label="Dismiss location toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
