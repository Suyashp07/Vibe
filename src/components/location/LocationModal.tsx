'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin,
  Compass,
  Search,
  X,
  Sparkles,
  Check,
  Navigation,
  Globe2,
  Building2,
  AlertCircle
} from 'lucide-react';
import {
  INDIAN_CITIES,
  POPULAR_CITIES,
  reverseGeocodeCoords,
  setUserLocation,
  getUserCity,
  CityLocation
} from '@/lib/location';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity?: (city: string) => void;
}

export default function LocationModal({
  isOpen,
  onClose,
  onSelectCity,
}: LocationModalProps) {
  const [search, setSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string>('All India');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const current = getUserCity();
      if (current) setActiveCity(current);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSelect = (city: string, coords?: { lat: number; lng: number } | null) => {
    setUserLocation(city, coords);
    setActiveCity(city);
    if (onSelectCity) onSelectCity(city);
    onClose();
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const geocoded = await reverseGeocodeCoords(latitude, longitude);
          handleSelect(geocoded.cityName, { lat: latitude, lng: longitude });
        } catch (err) {
          setErrorMsg('Could not resolve your city. Please select from the list below.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg('Location permission was denied. Please select your city manually below.');
        } else {
          setErrorMsg('Unable to retrieve your location. Please select manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Filter cities by search query
  const query = search.trim().toLowerCase();
  const searchResults: CityLocation[] = query
    ? Object.values(INDIAN_CITIES).filter(
        (c, idx, arr) =>
          (c.name.toLowerCase().includes(query) ||
            c.state.toLowerCase().includes(query)) &&
          arr.findIndex((x) => x.name.toLowerCase() === c.name.toLowerCase()) === idx
      )
    : [];

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-[#0D121F] border border-zinc-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto text-white relative z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-zinc-800/80 bg-[#090D17]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-zinc-800/70 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8621A]/20 border border-[#E8621A]/30 flex items-center justify-center text-[#FF8442]">
              <Compass className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#FF8442] uppercase">
              Location-Aware Discovery
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
            Where are you exploring events?
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Discover underground gigs, candlelit baithaks, tech summits, and mixers closest to you.
          </p>
        </div>

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto scrollbar-none">
          {/* GPS Auto-Detect Button */}
          <div>
            <button
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#E8621A]/15 via-[#FF8442]/10 to-[#E8621A]/5 border border-[#E8621A]/40 hover:border-[#E8621A] text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8621A] text-white flex items-center justify-center shadow-md shadow-orange-950/50 shrink-0 group-hover:scale-105 transition-transform">
                  <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{isLocating ? 'Detecting your proximity...' : 'Use Current GPS Location'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8621A]/30 text-[#FF8442] font-mono uppercase">
                      Fastest
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Automatically finds the closest cultural & tech hub
                  </div>
                </div>
              </div>
              <span className="text-xs text-[#FF8442] font-semibold group-hover:translate-x-1 transition-transform">
                Detect →
              </span>
            </button>

            {errorMsg && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Indian city, hub, or neighborhood (e.g. Bandra, Indiranagar)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E8621A] transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Autocomplete Results */}
          {query ? (
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-semibold text-zinc-500 uppercase px-1">
                Matching Cities ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
                  No cities found matching &ldquo;{search}&rdquo;. You can still browse all of India!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleSelect(city.name, { lat: city.lat, lng: city.lng })}
                      className="p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 text-left flex items-center justify-between transition cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{city.name}</div>
                        <div className="text-[11px] text-zinc-400">{city.state}</div>
                      </div>
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Popular Hubs Quick Selector */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-zinc-500 uppercase px-1">
                <span>Popular Event Hubs</span>
                <span>Tap to Filter</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POPULAR_CITIES.map((city) => {
                  const isCurrent =
                    activeCity.toLowerCase() === city.name.toLowerCase();
                  return (
                    <button
                      key={city.name}
                      onClick={() => handleSelect(city.name, { lat: city.lat, lng: city.lng })}
                      className={`p-3 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-[#E8621A]/20 border-[#E8621A] text-white shadow-sm'
                          : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-zinc-800/80 text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1">
                          <span>{city.name}</span>
                          {isCurrent && <Check className="w-3 h-3 text-[#FF8442]" />}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate max-w-[120px]">
                          {city.state}
                        </div>
                      </div>
                      <MapPin
                        className={`w-3.5 h-3.5 ${
                          isCurrent ? 'text-[#FF8442]' : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Browse All India Option */}
          <div className="pt-2 border-t border-zinc-800/80">
            <button
              onClick={() => handleSelect('All India', null)}
              className={`w-full p-3 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2 border transition cursor-pointer ${
                activeCity === 'All India' || activeCity === 'All'
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Globe2 className="w-4 h-4 text-[#FF8442]" />
              <span>Explore Events Across All of India (No Filter)</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
