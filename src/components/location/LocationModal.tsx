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
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white border border-[#E2E8F0] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden my-auto text-[#0F172A] relative z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-[#F1F5F9] bg-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#E8621A] shrink-0">
              <Compass className="w-4 h-4 text-[#E8621A]" />
            </div>
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#E8621A] uppercase">
              Location-Aware Discovery
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] font-display tracking-tight">
            Where are you exploring events?
          </h2>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            Discover underground gigs, candlelit baithaks, tech summits, and mixers closest to you.
          </p>
        </div>

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto scrollbar-none">
          {/* GPS Auto-Detect Button */}
          <div>
            <button
              onClick={handleDetectGPS}
              disabled={isLocating}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white border border-amber-200 hover:border-[#E8621A] text-left flex items-center justify-between group transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8621A] text-white flex items-center justify-center shadow-md shadow-[#E8621A]/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <span>{isLocating ? 'Detecting your proximity...' : 'Use Current GPS Location'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100/90 text-[#9A3412] font-mono font-bold uppercase border border-amber-200">
                      Fastest
                    </span>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Automatically finds the closest cultural & tech hub
                  </div>
                </div>
              </div>
              <span className="text-xs text-[#E8621A] font-bold group-hover:translate-x-1 transition-transform">
                Detect →
              </span>
            </button>

            {errorMsg && (
              <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Indian city, hub, or neighborhood (e.g. Bandra, Indiranagar)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#E2E8F0] focus:border-[#0F172A] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none transition shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#0F172A] transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Autocomplete Results */}
          {query ? (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-bold text-[#64748B] uppercase px-1">
                Matching Cities ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                  No cities found matching &ldquo;{search}&rdquo;. You can still browse all of India!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchResults.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleSelect(city.name, { lat: city.lat, lng: city.lng })}
                      className="p-3 rounded-2xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0F172A] text-left flex items-center justify-between transition cursor-pointer shadow-2xs group"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#0F172A] group-hover:text-[#E8621A] transition-colors">
                          {city.name}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{city.state}</div>
                      </div>
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0F172A] transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Popular Hubs Quick Selector */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#64748B] uppercase px-1">
                <span>Popular Event Hubs</span>
                <span className="text-[10px] text-[#94A3B8]">Tap to Filter</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {POPULAR_CITIES.map((city) => {
                  const isCurrent =
                    activeCity.toLowerCase() === city.name.toLowerCase();
                  return (
                    <button
                      key={city.name}
                      onClick={() => handleSelect(city.name, { lat: city.lat, lng: city.lng })}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between shadow-2xs group ${
                        isCurrent
                          ? 'bg-[#FDF8EE] border-2 border-[#E8621A] text-[#9A3412] shadow-xs'
                          : 'bg-[#F8FAFC] hover:bg-white border-[#E2E8F0] hover:border-[#0F172A] text-[#0F172A]'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className={`text-xs flex items-center gap-1 truncate ${isCurrent ? 'font-black text-[#9A3412]' : 'font-bold text-[#0F172A] group-hover:text-[#E8621A] transition-colors'}`}>
                          <span className="truncate">{city.name}</span>
                          {isCurrent && <Check className="w-3 h-3 text-[#E8621A] shrink-0 stroke-[3]" />}
                        </div>
                        <div className={`text-[10px] font-medium mt-0.5 truncate ${isCurrent ? 'text-[#E8621A]/80' : 'text-[#64748B]'}`}>
                          {city.state}
                        </div>
                      </div>
                      <MapPin
                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isCurrent ? 'text-[#E8621A]' : 'text-[#94A3B8] group-hover:text-[#0F172A]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Browse All India Option */}
          <div className="pt-2 border-t border-[#F1F5F9]">
            <button
              onClick={() => handleSelect('All India', null)}
              className={`w-full p-3 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer shadow-2xs ${
                activeCity === 'All India' || activeCity === 'All'
                  ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-xs'
                  : 'bg-[#F8FAFC] hover:bg-white border-[#E2E8F0] hover:border-[#0F172A] text-[#0F172A]'
              }`}
            >
              <Globe2 className="w-4 h-4 text-[#E8621A]" />
              <span>Explore Events Across All of India (No Filter)</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
