'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  Share2,
  PlusSquare,
  Smartphone,
  CheckCircle2,
  Download,
  Laptop,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export function triggerPWAInstall() {
  if (typeof window !== 'undefined') {
    // If prompt is directly available on window, try it synchronously
    const prompt = (window as any).__vibe_deferred_prompt;
    if (prompt && typeof prompt.prompt === 'function') {
      prompt.prompt().catch((err: any) => {
        console.warn('[PWA] Prompt call error:', err);
      });
      return;
    }
    window.dispatchEvent(new CustomEvent('vibe:trigger_pwa_install'));
  }
}

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showInstalledModal, setShowInstalledModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check if app is installed (standalone mode or installed related apps)
  const checkInstalledState = useCallback(async () => {
    if (typeof window === 'undefined') return false;

    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (standaloneCheck) {
      setIsInstalled(true);
      return true;
    }

    if ('getInstalledRelatedApps' in navigator) {
      try {
        const related = await (navigator as any).getInstalledRelatedApps();
        if (related && related.length > 0) {
          setIsInstalled(true);
          return true;
        }
      } catch (_) {}
    }

    return false;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Immediate Service Worker registration in production
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if ('serviceWorker' in navigator) {
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
        const registerSW = () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => {
              console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
            })
            .catch((err) => {
              console.warn('[PWA] ServiceWorker registration failed:', err);
            });
        };

        if (document.readyState === 'complete') {
          registerSW();
        } else {
          window.addEventListener('load', registerSW);
        }
      }
    }

    // 2. Check installed status
    checkInstalledState();

    // 3. Detect iOS Safari
    const isAppleDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    // 4. Grab early captured prompt if available
    if ((window as any).__vibe_deferred_prompt) {
      setDeferredPrompt((window as any).__vibe_deferred_prompt);
    }

    // 5. Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).__vibe_deferred_prompt = e;
      setDeferredPrompt(e);
    };

    const handlePromptReady = () => {
      if ((window as any).__vibe_deferred_prompt) {
        setDeferredPrompt((window as any).__vibe_deferred_prompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).__vibe_deferred_prompt = null;
      setShowInstallModal(false);
      setShowIOSModal(false);
      setToastMessage('🎉 Vibe installed successfully!');
      setTimeout(() => setToastMessage(null), 3500);
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
  }, [checkInstalledState]);

  // Main install trigger handler
  const handleInstallClick = useCallback(async () => {
    // 1. Native installation prompt if available
    const prompt =
      (typeof window !== 'undefined' && (window as any).__vibe_deferred_prompt) ||
      deferredPrompt;

    if (prompt && typeof prompt.prompt === 'function') {
      try {
        await prompt.prompt();
        const choiceResult = await prompt.userChoice;
        if (choiceResult && choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          (window as any).__vibe_deferred_prompt = null;
          setDeferredPrompt(null);
          setToastMessage('🎉 Installing Vibe...');
          setTimeout(() => setToastMessage(null), 3500);
        }
      } catch (err) {
        console.warn('[PWA] Direct install prompt error:', err);
      }
      return;
    }

    // 2. Check if already installed
    const alreadyInstalled = await checkInstalledState();
    if (alreadyInstalled || isInstalled) {
      setShowInstalledModal(true);
      return;
    }

    // 3. iOS Safari instructions
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // 4. Modern in-app modal (never alert)
    setShowInstallModal(true);
  }, [deferredPrompt, isIOS, isInstalled, checkInstalledState]);

  // Listen for trigger event
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
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#07133A] border border-white/20 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* App Already Installed Modal */}
      {showInstalledModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowInstalledModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#0A1224] border border-slate-200 dark:border-white/15 rounded-3xl p-6 text-slate-900 dark:text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#07133A] dark:text-white leading-tight">
                    Vibe is Installed
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    App is ready on your device
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstalledModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Vibe is already installed on your device. You can launch it from your desktop, applications menu, or by clicking <strong className="text-[#0038A8] dark:text-sky-400 font-semibold">&ldquo;Open in app&rdquo;</strong> in your browser address bar above.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowInstalledModal(false);
                  try {
                    window.open('/', '_blank');
                  } catch (_) {}
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0038A8] hover:bg-[#173DAA] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/20 cursor-pointer"
              >
                <span>Launch App</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowInstalledModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Desktop & Android In-App Direct Installation Modal */}
      {showInstallModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowInstallModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#0A1224] border border-slate-200 dark:border-white/15 rounded-3xl p-6 text-slate-900 dark:text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0038A8]/10 border border-[#0038A8]/20 flex items-center justify-center shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Vibe logo"
                    width={28}
                    height={28}
                    className="object-contain dark:hidden"
                  />
                  <Image
                    src="/logo-dark.png"
                    alt="Vibe logo"
                    width={28}
                    height={28}
                    className="object-contain hidden dark:block"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#07133A] dark:text-white leading-tight">
                    Install Vibe App
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Direct access &amp; instant notifications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <Laptop className="w-4 h-4 text-[#0038A8] dark:text-sky-400 shrink-0 mt-0.5" />
                <p>
                  Click the <strong className="text-[#07133A] dark:text-white font-bold">&ldquo;Install&rdquo;</strong> or <strong className="text-[#07133A] dark:text-white font-bold">&ldquo;Open in app&rdquo;</strong> icon on the right side of your browser address bar above.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const prompt =
                    (typeof window !== 'undefined' && (window as any).__vibe_deferred_prompt) ||
                    deferredPrompt;
                  if (prompt && typeof prompt.prompt === 'function') {
                    try {
                      await prompt.prompt();
                      setShowInstallModal(false);
                    } catch (_) {}
                  } else {
                    setShowInstallModal(false);
                    setToastMessage('Tap the install icon in your browser address bar above');
                    setTimeout(() => setToastMessage(null), 3500);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0038A8] hover:bg-[#173DAA] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Vibe</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Modal Guide */}
      {showIOSModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#0A1224] border border-slate-200 dark:border-white/15 rounded-3xl p-6 text-slate-900 dark:text-white shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0038A8]/10 border border-[#0038A8]/20 flex items-center justify-center shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Vibe logo"
                    width={24}
                    height={24}
                    className="object-contain dark:hidden"
                  />
                  <Image
                    src="/logo-dark.png"
                    alt="Vibe logo"
                    width={24}
                    height={24}
                    className="object-contain hidden dark:block"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#07133A] dark:text-white">
                    Install Vibe on iOS
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add to your Home Screen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-[#0038A8] dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#07133A] dark:text-white">Step 1:</span> Tap the <span className="font-semibold text-[#07133A] dark:text-white">Share</span> button in Safari.
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#07133A] dark:text-white">Step 2:</span> Scroll down and tap <span className="font-semibold text-[#07133A] dark:text-white">&ldquo;Add to Home Screen&rdquo;</span>.
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/80 dark:border-white/5">
                <div className="w-7 h-7 rounded-lg bg-[#0038A8]/10 text-[#0038A8] dark:text-sky-300 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#07133A] dark:text-white">Step 3:</span> Tap <span className="font-semibold text-[#07133A] dark:text-white">Add</span> to launch Vibe as a standalone app!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0038A8] hover:bg-[#173DAA] text-white text-xs font-bold transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
