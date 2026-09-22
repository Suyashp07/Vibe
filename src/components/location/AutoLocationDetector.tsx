'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Check, X } from 'lucide-react';
import {
  reverseGeocodeCoords,
  findNearestCity,
  setUserLocation,
  getUserCity,
} from '@/lib/location';

export default function AutoLocationDetector() {
  const promptedRef = useRef(false);
  const [toastCity, setToastCity] = useState<string | null>(null);

  useEffect(() => {
    // Only prompt once per page session
    if (promptedRef.current) return;
    promptedRef.current = true;

    if (typeof window === 'undefined' || !navigator.geolocation) return;

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

            // Surface smooth confirmation toast if city detected
            if (prevCity !== detectedCityName) {
              setToastCity(detectedState ? `${detectedCityName}, ${detectedState}` : detectedCityName);
              setTimeout(() => {
                setToastCity(null);
              }, 4000);
            }
          }
        } catch (err) {
          console.warn('[AutoLocationDetector] Location resolution error:', err);
        }
      },
      (error) => {
        // User denied permission or browser blocked: gracefully retain default or current selection
        console.log('[AutoLocationDetector] Geolocation prompt:', error.message);
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 0, // Fresh detection on every website visit
      }
    );
  }, []);

  if (!toastCity) return null;

  return (
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
  );
}
