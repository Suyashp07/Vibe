'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] ServiceWorker registration failed:', err);
          });
      });
    }

    // 2. Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user already dismissed install banner in this session
      const dismissed = sessionStorage.getItem('vibe_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('vibe_pwa_dismissed', 'true');
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-[#0F172A] text-white p-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8621A] to-[#F97316] flex items-center justify-center font-black text-white text-base shrink-0 shadow-sm">
          V
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold truncate">Install Vibe WebApp</p>
          <p className="text-[11px] text-[#94A3B8] truncate">Fast offline access & instant RSVP passes</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 bg-white text-[#0F172A] hover:bg-[#F1F5F9] text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-[#E8621A]" />
          <span>Install</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-[#94A3B8] hover:text-white transition"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
