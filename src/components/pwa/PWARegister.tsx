'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, Monitor, Info } from 'lucide-react';

export function triggerPWAInstall() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vibe:trigger_pwa_install'));
  }
}

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDesktopGuideModal, setShowDesktopGuideModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker (Disable and auto-clean on localhost to avoid stale cache)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (isLocal) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((names) => {
            for (const name of names) {
              caches.delete(name);
            }
          });
        }
      } else {
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
    }

    // Check standalone state
    const standaloneCheck =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true);
    setIsInstalled(standaloneCheck);

    // Detect iOS
    const isAppleDevice =
      typeof window !== 'undefined' &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowDesktopGuideModal(true);
    }
  }, [deferredPrompt, isIOS]);

  // Listen for global trigger event dispatched from Navbar install button
  useEffect(() => {
    const onTrigger = () => {
      handleInstallClick();
    };
    window.addEventListener('vibe:trigger_pwa_install', onTrigger);
    return () => {
      window.removeEventListener('vibe:trigger_pwa_install', onTrigger);
    };
  }, [handleInstallClick]);

  return (
    <>
      {/* 1. iOS Installation Modal Guide */}
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
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5500] to-[#C2410C] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#FF5500]/30">
                  v.
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Install Vibe on iPhone / iPad</h3>
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
                  <span className="font-semibold text-white">Step 1:</span> Tap the <span className="text-white font-medium">Share</span> button in Safari.
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">Step 2:</span> Scroll down and tap <span className="text-white font-medium">&quot;Add to Home Screen&quot;</span>.
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">Step 3:</span> Tap <span className="text-white font-medium">Add</span> to launch Vibe as a standalone app!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* 2. Desktop & Browser Installation Guide Modal */}
      {showDesktopGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowDesktopGuideModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0F172A] border border-white/15 rounded-3xl p-6 text-white shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5500] to-[#C2410C] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#FF5500]/30">
                  v.
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Install Vibe App</h3>
                  <p className="text-[11px] text-slate-400">Web &amp; Mobile experience</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDesktopGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">On Desktop:</span> Look for the <span className="text-white font-medium">Install App icon (⊕ or ⭳)</span> on the right side of your browser address bar.
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white">On Mobile:</span> Tap browser menu <span className="text-white font-medium">(⋮)</span> and choose <span className="text-white font-medium">&quot;Install app&quot;</span> or <span className="text-white font-medium">&quot;Add to Home screen&quot;</span>.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDesktopGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
