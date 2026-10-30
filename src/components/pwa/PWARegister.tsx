'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Share2, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';

export function triggerPWAInstall() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vibe:trigger_pwa_install'));
  }
}

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Service Worker cleanup on localhost, registration in production
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

    // Grab early captured prompt if available from layout.tsx inline script
    if (typeof window !== 'undefined' && (window as any).__vibe_deferred_prompt) {
      setDeferredPrompt((window as any).__vibe_deferred_prompt);
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      if (typeof window !== 'undefined') {
        (window as any).__vibe_deferred_prompt = e;
      }
      setDeferredPrompt(e);
    };

    const handlePromptReady = () => {
      if (typeof window !== 'undefined' && (window as any).__vibe_deferred_prompt) {
        setDeferredPrompt((window as any).__vibe_deferred_prompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        (window as any).__vibe_deferred_prompt = null;
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('vibe:deferred_prompt_ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('vibe:app_installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('vibe:deferred_prompt_ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('vibe:app_installed', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    // 1. Native installation prompt (same as the original popup message)
    const prompt =
      (typeof window !== 'undefined' && (window as any).__vibe_deferred_prompt) ||
      deferredPrompt;

    if (prompt) {
      try {
        await prompt.prompt();
        const choiceResult = await prompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          console.log('[PWA] User accepted the install prompt');
        }
      } catch (err) {
        console.warn('[PWA] Install prompt error:', err);
      }
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        (window as any).__vibe_deferred_prompt = null;
      }
      return;
    }

    // 2. If app is already installed and running standalone
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        isInstalled);

    if (isStandalone) {
      setToastMessage('Vibe is already installed on your device!');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // 3. iOS Safari instructions (Safari does not support beforeinstallprompt)
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // 4. Fallback for browsers when beforeinstallprompt has not fired or already triggered
    alert("To install Vibe: Tap your browser's menu (⋮) in the top-right corner and select 'Install app' or 'Add to Home screen'.");
  }, [deferredPrompt, isIOS, isInstalled]);

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
      {/* Toast Notification when already installed */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#0F172A] border border-white/20 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* iOS Installation Modal Guide (Only for Safari iOS where beforeinstallprompt is unsupported) */}
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
    </>
  );
}
