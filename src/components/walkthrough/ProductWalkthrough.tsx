'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Compass,
  Zap,
  Bot,
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  MapPin,
  Ticket,
  Users,
  MessageCircle,
  Send,
  Calendar,
  Radio,
} from 'lucide-react';

interface StepItem {
  id: string;
  target?: string;
  fallbackTarget?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  cta: string;
  skip?: string;
}

const ALL_STEPS: StepItem[] = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Welcome to Vibe',
    text: 'Find events, join last-minute meetups, or host your own. A 30-second tour.',
    cta: 'Start →',
    skip: 'Skip',
  },
  {
    id: 'categories',
    target: '#vt-categories-grid',
    fallbackTarget: '#vt-categories',
    icon: Compass,
    title: 'Pick your vibe',
    text: 'Tap a category to see matching events near you.',
    cta: 'Next →',
  },
  {
    id: 'instant',
    target: '#vt-instant',
    fallbackTarget: '#vt-instant-mobile',
    icon: Zap,
    title: 'Vibe Instant',
    text: 'Spontaneous meetups happening right now. Just show up.',
    cta: 'Next →',
  },
  {
    id: 'bot',
    target: '#vt-bot',
    fallbackTarget: '#vt-bot-mobile',
    icon: Bot,
    title: 'Vibe AI Bot',
    text: 'Chat on WhatsApp or Telegram to discover vibes, book passes, or host in seconds.',
    cta: 'Next →',
  },
  {
    id: 'host',
    target: '#vt-host',
    fallbackTarget: '#vt-host-mobile',
    icon: Plus,
    title: 'Host an event',
    text: 'Create an event in minutes — or straight from WhatsApp or Telegram.',
    cta: 'Got it 🎉',
  },
];

const STORAGE_KEY = 'vibe_walkthrough_hidden';
const AUTO_START_DELAY = 850;

export default function ProductWalkthrough() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [activeSteps, setActiveSteps] = useState<StepItem[]>(ALL_STEPS);
  const [isMounted, setIsMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX.current;
    if (diffX < -45) {
      // Swiped left -> next
      handleNext();
    } else if (diffX > 45) {
      // Swiped right -> back
      handleBack();
    }
    touchStartX.current = null;
  };

  // Helper to find visible target DOM element across Desktop and Mobile
  const findElement = useCallback((step: StepItem): HTMLElement | null => {
    if (!step.target && !step.fallbackTarget) return null;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // Prefer mobile fallback if on small viewport
    const targets = isMobile
      ? [step.fallbackTarget, step.target].filter(Boolean) as string[]
      : [step.target, step.fallbackTarget].filter(Boolean) as string[];

    for (const sel of targets) {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        // Check element has non-zero size and is visible
        // (Do NOT use offsetParent !== null because position:fixed elements return offsetParent === null)
        if (rect.width > 0 && rect.height > 0) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
            return el;
          }
        }
      }
    }
    return null;
  }, []);

  // Update target rect for current step
  const updatePosition = useCallback(() => {
    if (!isOpen) return;
    const step = activeSteps[currentStep];
    if (!step || !step.target) {
      setTargetRect(null);
      return;
    }
    const el = findElement(step);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect(rect);
  }, [isOpen, activeSteps, currentStep, findElement]);

  // Handle tour open check on mount / navigation
  useEffect(() => {
    setIsMounted(true);
    if (pathname !== '/') return;

    const filtered = ALL_STEPS.filter((s) => {
      if (!s.target) return true;
      return findElement(s) !== null;
    });
    setActiveSteps(filtered.length > 0 ? filtered : ALL_STEPS);

    const isForced = /[?&](tour|walkthrough)=1/.test(window.location.search);
    const isExplicitlyDisabled = /[?&](no_tour|no_walkthrough|no_splash)=1/.test(window.location.search);
    const isHidden = isExplicitlyDisabled || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) === '1' : false);

    if (isForced || !isHidden) {
      if (typeof window !== 'undefined') {
        (window as any).__vibeWalkthroughActive = true;
      }

      const startTour = () => {
        const currentFiltered = ALL_STEPS.filter((s) => {
          if (!s.target) return true;
          return findElement(s) !== null;
        });
        setActiveSteps(currentFiltered.length > 0 ? currentFiltered : ALL_STEPS);
        setCurrentStep(0);
        setIsOpen(true);
      };

      const isSplashActive = typeof window !== 'undefined' && (
        (window as any).__vibeSplashActive ||
        (sessionStorage.getItem('vibe_seen_splash') !== '1' && document.getElementById('splash') !== null)
      );

      if (isSplashActive) {
        const onSplashDone = () => {
          window.removeEventListener('vibe:splash_completed', onSplashDone);
          setTimeout(startTour, 450);
        };
        window.addEventListener('vibe:splash_completed', onSplashDone);
        return () => window.removeEventListener('vibe:splash_completed', onSplashDone);
      } else {
        const timer = setTimeout(startTour, AUTO_START_DELAY);
        return () => clearTimeout(timer);
      }
    } else {
      if (typeof window !== 'undefined') {
        (window as any).__vibeWalkthroughActive = false;
      }
    }
  }, [pathname, findElement]);

  // Support manual tour trigger via global event
  useEffect(() => {
    const handleStartTour = () => {
      const filtered = ALL_STEPS.filter((s) => {
        if (!s.target) return true;
        return findElement(s) !== null;
      });
      setActiveSteps(filtered.length > 0 ? filtered : ALL_STEPS);
      setCurrentStep(0);
      if (typeof window !== 'undefined') {
        (window as any).__vibeWalkthroughActive = true;
      }
      setIsOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('vibe:start_tour', handleStartTour);
    return () => window.removeEventListener('vibe:start_tour', handleStartTour);
  }, [findElement]);

  // Handle step change & scrolling target into view
  useEffect(() => {
    if (!isOpen) return;

    const step = activeSteps[currentStep];
    if (step && step.id) {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      if (step.id === 'categories') {
        const el = findElement(step);
        if (el) {
          const topOffset = el.getBoundingClientRect().top + window.scrollY - (isMobile ? 80 : 130);
          window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
        }
      } else if (step.id === 'instant' || step.id === 'host' || step.id === 'bot') {
        if (!isMobile) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (step.id === 'bot') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }

    const timer = setTimeout(updatePosition, 320);
    return () => clearTimeout(timer);
  }, [isOpen, currentStep, activeSteps, findElement, updatePosition]);

  // Resize and scroll listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => updatePosition();
    const handleScroll = () => requestAnimationFrame(updatePosition);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTour();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handleBack();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const closeTour = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, '1');
      (window as any).__vibeWalkthroughActive = false;
      window.dispatchEvent(new CustomEvent('vibe:walkthrough_completed'));
    }
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      closeTour();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isMounted || pathname !== '/') return null;

  const currentStepData = activeSteps[currentStep] || ALL_STEPS[0];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === activeSteps.length - 1;
  const StepIcon = currentStepData.icon || Sparkles;

  // Calculate Tooltip position & caret orientation relative to viewport
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const cardWidth = typeof window !== 'undefined' ? Math.min(390, window.innerWidth - 32) : 380;
  const cardHeight = cardRef.current ? cardRef.current.offsetHeight : 240;

  let computedTop = 0;
  let computedLeft = 0;
  let arrowPlacement: 'up' | 'down' | 'none' = 'none';
  let arrowOffsetLeft = cardWidth / 2 - 8;

  if (targetRect && !isFirstStep) {
    if (isMobile) {
      const currentId = activeSteps[currentStep]?.id;
      const actualCardLeft = typeof window !== 'undefined'
        ? (window.innerWidth > 422 ? (window.innerWidth - Math.min(390, window.innerWidth - 32)) / 2 : 16)
        : 16;
      const targetCenter = targetRect.left + targetRect.width / 2;
      arrowOffsetLeft = Math.max(
        20,
        Math.min(cardWidth - 28, targetCenter - actualCardLeft - 7)
      );

      if (currentId === 'bot') {
        arrowPlacement = 'up';
      } else if (currentId === 'instant' || currentId === 'host') {
        arrowPlacement = 'down';
      } else {
        arrowPlacement = 'none';
      }
    } else {
      const margin = 18;
      // Prefer positioning below the target
      if (targetRect.bottom + cardHeight + margin < window.innerHeight) {
        computedTop = targetRect.bottom + margin;
        arrowPlacement = 'up';
      } else {
        // Position above the target
        computedTop = Math.max(margin, targetRect.top - cardHeight - margin);
        arrowPlacement = 'down';
      }

      computedLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;
      computedLeft = Math.max(margin, Math.min(computedLeft, window.innerWidth - cardWidth - margin));

      arrowOffsetLeft = Math.max(
        18,
        Math.min(cardWidth - 28, targetRect.left + targetRect.width / 2 - computedLeft - 8)
      );
    }
  }

  return (
    <>
      {/* Main Walkthrough Modal & Spotlight Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[9990] select-none font-sans"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
          >
            {/* 1. Backdrop for Welcome Modal (Step 1 only) - Crisp dark scrim without any blur */}
            {isFirstStep && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-[#040A1E]/75"
                onClick={closeTour}
              />
            )}

            {/* Click-outside dismiss handler for Steps 2-5 (Completely transparent - zero blur, zero dimming) */}
            {!isFirstStep && (
              <div
                className="fixed inset-0 bg-transparent z-[9991]"
                onClick={closeTour}
              />
            )}

            {/* 2. Animated Spotlight Cutout with Crisp High-Contrast Ring */}
            {targetRect && !isFirstStep && (
              <motion.div
                initial={false}
                animate={(() => {
                  const currentId = activeSteps[currentStep]?.id;
                  let top = Math.max(0, targetRect.top - 8);
                  let left = Math.max(0, targetRect.left - 8);
                  let width = targetRect.width + 16;
                  let height = targetRect.height + 16;
                  let radius = '24px';

                  if (isMobile) {
                    if (currentId === 'categories') {
                      height = Math.min(height, window.innerHeight * 0.38);
                      radius = '20px';
                    } else if (currentId === 'instant') {
                      width = Math.max(width, 58);
                      height = Math.max(height, 58);
                      left = targetRect.left + targetRect.width / 2 - width / 2;
                      top = targetRect.top + targetRect.height / 2 - height / 2;
                      radius = '9999px';
                    } else if (currentId === 'bot') {
                      width = Math.max(width, 48);
                      height = Math.max(height, 48);
                      left = targetRect.left + targetRect.width / 2 - width / 2;
                      top = targetRect.top + targetRect.height / 2 - height / 2;
                      radius = '9999px';
                    } else if (currentId === 'host') {
                      width = Math.max(width, 62);
                      height = Math.max(height, 62);
                      left = targetRect.left + targetRect.width / 2 - width / 2;
                      top = targetRect.top + targetRect.height / 2 - height / 2;
                      radius = '9999px';
                    }
                  } else {
                    radius = targetRect.height > 60 ? '24px' : '9999px';
                  }

                  return {
                    top,
                    left,
                    width,
                    height,
                    borderRadius: radius,
                  };
                })()}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed pointer-events-none z-[9992] shadow-[0_0_0_9999px_rgba(4,10,30,0.76),0_0_0_2.5px_#FFFFFF,0_0_25px_rgba(0,102,245,0.8)]"
              >
                {/* Crisp Glowing Accent Outline */}
                <div className="absolute -inset-1 rounded-[inherit] border-2 border-[#0038A8] dark:border-sky-400 shadow-[0_0_15px_rgba(0,56,168,0.7)] pointer-events-none" />
              </motion.div>
            )}

            {/* 3. Refined Tour Card Popup with Dynamic Content & Micro-Animations */}
            <motion.div
              ref={cardRef}
              key={currentStep}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.22, ease: [0.2, 0.9, 0.3, 1] }}
              style={(() => {
                if (!targetRect || isFirstStep) {
                  return {
                    position: 'fixed',
                    inset: 0,
                    margin: 'auto',
                    width: 'calc(100vw - 32px)',
                    maxWidth: '390px',
                    height: 'fit-content',
                    maxHeight: 'calc(100vh - 32px)',
                    zIndex: 9995,
                  };
                }

                if (isMobile) {
                  const currentId = activeSteps[currentStep]?.id;
                  if (currentId === 'bot') {
                    return {
                      position: 'fixed',
                      top: `${Math.max(16, targetRect ? targetRect.bottom + 14 : 70)}px`,
                      left: '16px',
                      right: '16px',
                      maxWidth: '390px',
                      margin: '0 auto',
                      width: 'calc(100vw - 32px)',
                      zIndex: 9995,
                    };
                  }
                  // Mobile bottom navigation bar sits at bottom (~64-70px), clear it cleanly
                  const bottomPx = currentId === 'instant' || currentId === 'host' ? 82 : 78;
                  return {
                    position: 'fixed',
                    bottom: `${bottomPx}px`,
                    left: '16px',
                    right: '16px',
                    maxWidth: '390px',
                    margin: '0 auto',
                    width: 'calc(100vw - 32px)',
                    zIndex: 9995,
                  };
                }

                return {
                  position: 'fixed',
                  top: `${computedTop}px`,
                  left: `${computedLeft}px`,
                  width: `${cardWidth}px`,
                  zIndex: 9995,
                };
              })()}
              className="relative text-slate-900 dark:text-white"
            >
              {/* Pointed Triangular Arrow / Caret (Desktop & Mobile) */}
              {!isFirstStep && arrowPlacement !== 'none' && (
                <div
                  style={{ left: `${arrowOffsetLeft}px` }}
                  className={`absolute w-3.5 h-3.5 bg-white dark:bg-[#0D1527] z-10 transform rotate-45 ${
                    arrowPlacement === 'up'
                      ? '-top-1.5 border-l border-t border-slate-200/90 dark:border-white/10'
                      : '-bottom-1.5 border-r border-b border-slate-200/90 dark:border-white/10'
                  }`}
                />
              )}

              {isFirstStep ? (
                /* ========================================================================= */
                /* STEP 1: WELCOME MODAL                                                     */
                /* ========================================================================= */
                <div className="bg-white dark:bg-[#0D1527] w-full max-w-[390px] rounded-3xl p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,10,40,0.5)] border border-slate-200/90 dark:border-white/10 text-center relative mx-auto">
                  {/* Close Button 'X' */}
                  <button
                    type="button"
                    onClick={closeTour}
                    aria-label="Close walkthrough"
                    className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Sparkles Icon in Light Blue Rounded Square */}
                  <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] dark:bg-[#0038A8]/20 text-[#0038A8] dark:text-sky-300 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Sparkles className="w-6 h-6 stroke-[2] animate-pulse" />
                  </div>

                  {/* Step Counter: 1 / 4 */}
                  <div className="text-xs font-bold text-[#0038A8] dark:text-sky-300 tracking-wider mb-1.5">
                    1 / {activeSteps.length}
                  </div>

                  {/* Title */}
                  <h2
                    id="tour-title"
                    className="text-xl sm:text-2xl font-black text-[#07133A] dark:text-white tracking-tight mb-2"
                  >
                    {currentStepData.title}
                  </h2>

                  {/* One-Line Description */}
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto mb-4">
                    {currentStepData.text}
                  </p>

                  {/* Animated Feature Pillars Preview */}
                  <div className="grid grid-cols-4 gap-1.5 py-3 px-2 bg-slate-50 dark:bg-white/[0.04] rounded-2xl border border-slate-100 dark:border-white/5 mb-5 text-[10px] font-semibold text-slate-700 dark:text-neutral-200">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/20 text-[#0038A8] dark:text-sky-300 flex items-center justify-center">
                        <Compass className="w-3.5 h-3.5" />
                      </div>
                      <span>Local Vibes</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <span>Instant</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 stroke-[2]" />
                      </div>
                      <span>AI Bot</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span>Host</span>
                    </div>
                  </div>

                  {/* Bottom Bar: Stepper Dots + Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Stepper Dots */}
                    <div className="flex items-center gap-1.5">
                      {activeSteps.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentStep
                              ? 'w-5 bg-[#0038A8] dark:bg-sky-400'
                              : 'w-1.5 bg-slate-200 dark:bg-white/20'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={closeTour}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Skip
                      </button>

                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-5 sm:px-6 py-2.5 rounded-full bg-[#0038A8] hover:bg-[#173DAA] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-900/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                        style={{
                          backgroundColor: '#0038A8',
                          color: '#FFFFFF',
                          WebkitTextFillColor: '#FFFFFF',
                        }}
                      >
                        <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Start</span>
                        <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                      </button>
                    </div>
                  </div>

                  {/* Don't show again checkbox */}
                  <div className="pt-3.5 border-t border-slate-100 dark:border-white/5 mt-4">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/20 text-[#0038A8] focus:ring-[#0038A8]"
                      />
                      <span>Don&apos;t show again</span>
                    </label>
                  </div>
                </div>
              ) : (
                /* ========================================================================= */
                /* STEPS 2 to 4: FEATURE SPOTLIGHT CARDS WITH CLEAR ANIMATIONS               */
                /* ========================================================================= */
                <div className="bg-white dark:bg-[#0D1527] w-full max-w-[390px] rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_-10px_rgba(0,10,40,0.45)] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white relative mx-auto">
                  {/* Top Row: Icon Badge + Step Counter + Close Button */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#EFF6FF] dark:bg-[#0038A8]/20 text-[#0038A8] dark:text-sky-300 flex items-center justify-center shrink-0">
                        <StepIcon className="w-4 h-4 stroke-[2]" />
                      </div>
                      <span className="text-xs font-bold text-[#0038A8] dark:text-sky-300 tracking-wider">
                        {currentStep + 1} / {activeSteps.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={closeTour}
                      aria-label="Close walkthrough"
                      className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <h3
                    id="tour-title"
                    className="text-base sm:text-lg font-black text-[#07133A] dark:text-white tracking-tight mb-1"
                  >
                    {currentStepData.title}
                  </h3>

                  {/* One-Line Description */}
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    {currentStepData.text}
                  </p>

                  {/* FEATURE-SPECIFIC MICRO-ANIMATIONS TO SHOW THE WORKING */}
                  <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/5 overflow-hidden">
                    {currentStepData.id === 'categories' && (
                      <div className="space-y-2">
                        {/* Animated category tap simulation */}
                        <div className="flex items-center gap-2 overflow-x-hidden">
                          <motion.div
                            animate={{ scale: [1, 1.05, 1], backgroundColor: ['#0038A8', '#173DAA', '#0038A8'] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="px-3 py-1 rounded-full bg-[#0038A8] text-white text-[11px] font-bold flex items-center gap-1 shrink-0 shadow-xs"
                          >
                            <span>🎵 Music</span>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </motion.div>
                          <div className="px-3 py-1 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[11px] font-medium shrink-0">
                            🎉 Parties
                          </div>
                          <div className="px-3 py-1 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[11px] font-medium shrink-0">
                            🏏 Sports
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Filters all events on the page in 1 tap without page reloads</span>
                        </div>
                      </div>
                    )}

                    {currentStepData.id === 'instant' && (
                      <div className="space-y-2">
                        {/* Animated Live Instant Radar */}
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <span>HAPPENING RIGHT NOW</span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">0.8 km away</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white dark:bg-white/10 border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <Zap className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <div className="truncate">
                              <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate">Box Cricket Match</p>
                              <p className="text-[9px] text-slate-400 truncate">2 players needed • Starts in 15m</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-[#0038A8] text-white text-[9px] font-bold shrink-0">
                            Join
                          </span>
                        </div>
                      </div>
                    )}

                    {currentStepData.id === 'bot' && (
                      <div className="space-y-2">
                        {/* Animated Chat Simulation with WhatsApp & Telegram */}
                        <div className="space-y-1.5 text-[11px]">
                          {/* User Message Bubble */}
                          <div className="flex justify-end">
                            <div className="bg-[#0038A8] text-white px-2.5 py-1.5 rounded-2xl rounded-tr-xs max-w-[85%] text-[10px] font-medium shadow-2xs">
                              Find concerts or tech events this week 🎟
                            </div>
                          </div>
                          {/* Bot Reply Bubble */}
                          <div className="flex items-start gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Bot className="w-3 h-3 stroke-[2.2]" />
                            </div>
                            <div className="bg-white dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-2xl rounded-tl-xs max-w-[88%] text-[10px]">
                              <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">Vibe AI Curator</p>
                              Found 3 events near you! Tap below to get instant passes directly in chat.
                            </div>
                          </div>
                        </div>
                        {/* Quick Channel Badges */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            <MessageCircle className="w-3 h-3" />
                            <span>WhatsApp Bot</span>
                          </div>
                          <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                            <Send className="w-3 h-3" />
                            <span>Telegram Bot</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStepData.id === 'host' && (
                      <div className="space-y-1.5">
                        {/* Animated 3-step host pipeline */}
                        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                          <div className="p-1.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200/80 dark:border-white/10">
                            <MessageCircle className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
                            <span className="font-semibold block truncate">1. Text Bot</span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200/80 dark:border-white/10">
                            <Sparkles className="w-3.5 h-3.5 mx-auto mb-1 text-[#0038A8] dark:text-sky-300" />
                            <span className="font-semibold block truncate">2. AI Flyer</span>
                          </div>
                          <div className="p-1.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200/80 dark:border-white/10">
                            <Ticket className="w-3.5 h-3.5 mx-auto mb-1 text-purple-500" />
                            <span className="font-semibold block truncate">3. QR Passes</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-center text-slate-400 pt-0.5">
                          List your event in seconds via Web, WhatsApp, or Telegram.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Stepper Dots + Back Circle + Primary Next / Got it Button */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Stepper Dots */}
                    <div className="flex items-center gap-1.5">
                      {activeSteps.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentStep
                              ? 'w-5 bg-[#0038A8] dark:bg-sky-400'
                              : 'w-1.5 bg-slate-200 dark:bg-white/20'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Action Buttons: Back Circle + Primary CTA */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleBack}
                        title="Previous step"
                        aria-label="Previous step"
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" />
                      </button>

                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-5 sm:px-6 py-2.5 rounded-full bg-[#0038A8] hover:bg-[#173DAA] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-900/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                        style={{
                          backgroundColor: '#0038A8',
                          color: '#FFFFFF',
                          WebkitTextFillColor: '#FFFFFF',
                        }}
                      >
                        <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{currentStepData.cta}</span>
                        {isLastStep ? (
                          <Check className="w-4 h-4 text-white stroke-[2.5]" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
