'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone } from 'lucide-react';

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

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

    // Check standalone state
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true);

    if (isStandalone) {
      return; // Already installed and running as PWA
    }

    // Detect iOS
    const isAppleDevice =
      typeof window !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    // 2. Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('vibe_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 3. Fallback timer for mobile browsers (iOS Safari or Chromium where event already fired)
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('vibe_pwa_dismissed');
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      if (!dismissed && !isStandalone && isMobile) {
        setShowInstallBanner(true);
      }
    }, 2200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback for Android browsers without deferredPrompt
      alert("To install Vibe: Tap your browser's menu (⋮) in the top-right corner and select 'Install app' or 'Add to Home screen'.");
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('vibe_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* 1. Main Install Banner / Toast */}
      {showInstallBanner && (
        <div
          role="dialog"
          aria-label="Install Vibe App"
          className="pwa-install-banner fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[410px] z-[9998] p-3.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl border bg-[#0F172A]/95 border-white/10 text-white flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Vibe App Icon Badge */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8621A] to-[#C2410C] flex items-center justify-center font-black text-base shrink-0 shadow-md shadow-[#E8621A]/30 select-none border border-white/10">
              <span style={{ color: '#FFFFFF' }} className="text-white font-black tracking-tight font-outfit">
                v.
              </span>
            </div>

            {/* Copy Text */}
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold text-white truncate tracking-tight">
                Install Vibe App
              </p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Instant access & fullscreen experience
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 bg-[#E8621A] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#E8621A]/30 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: '#FFFFFF' }} />
              <span style={{ color: '#FFFFFF' }}>Install</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 text-slate-400 hover:text-white transition rounded-xl hover:bg-white/10 cursor-pointer"
              aria-label="Dismiss install banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. iOS Installation Modal Guide */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0F172A] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8621A] to-[#C2410C] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#E8621A]/30">
                  v.
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Install Vibe on iPhone</h3>
                  <p className="text-[11px] text-slate-400">Add to your home screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">Step 1:</span> Tap the <span className="text-white font-medium">Share</span> button at the bottom of Safari.
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">Step 2:</span> Scroll down and tap <span className="text-white font-medium">"Add to Home Screen"</span>.
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-[#E8621A]/20 text-[#E8621A] flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">Step 3:</span> Tap <span className="text-white font-medium">Add</span> in the top-right corner to launch Vibe!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIOSModal(false);
                setShowInstallBanner(false);
                sessionStorage.setItem('vibe_pwa_dismissed', 'true');
              }}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
