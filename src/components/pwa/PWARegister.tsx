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
    <div
      role="dialog"
      aria-label="Install Vibe WebApp"
      className="pwa-install-banner fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[410px] z-[9998] p-3.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl border bg-white/95 dark:bg-[#0D0D10]/95 border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Vibe App Icon Badge */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5500] to-[#E04B00] flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-[#FF5500]/25 select-none">
          <span style={{ color: '#FFFFFF' }} className="text-white font-black">
            V
          </span>
        </div>

        {/* Copy Text */}
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">
            Install Vibe WebApp
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Fast offline access & instant RSVP passes
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleInstallClick}
          className="px-3.5 py-2 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#FF5500]/25 active:scale-95"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: '#FFFFFF' }} />
          <span style={{ color: '#FFFFFF' }}>Install</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          aria-label="Dismiss install banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
