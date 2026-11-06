'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
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
    id: 'host',
    target: '#vt-host',
    fallbackTarget: '#vt-host-mobile',
    icon: Plus,
    title: 'Host an event',
    text: 'Create an event in minutes — or straight from WhatsApp or Telegram.',
    cta: 'Got it',
  },
];

const STORAGE_KEY = 'vibe_walkthrough_hidden';
const AUTO_START_DELAY = 900;

export default function ProductWalkthrough() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [activeSteps, setActiveSteps] = useState<StepItem[]>(ALL_STEPS);
  const cardRef = useRef<HTMLDivElement>(null);

  // Helper to find visible target DOM element
  const findElement = useCallback((step: StepItem): HTMLElement | null => {
    if (!step.target && !step.fallbackTarget) return null;
    const targets = [step.target, step.fallbackTarget].filter(Boolean) as string[];
    for (const sel of targets) {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (el && el.offsetParent !== null) {
        return el;
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

  // Handle tour open check
  useEffect(() => {
    if (pathname !== '/') return;

    // Filter steps based on targets available on current device
    const filtered = ALL_STEPS.filter((s) => {
      if (!s.target) return true;
      return findElement(s) !== null;
    });
    setActiveSteps(filtered.length > 0 ? filtered : ALL_STEPS);

    const isForced = /[?&]tour=1/.test(window.location.search);
    const isHidden = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) === '1' : false;

    if (isForced || !isHidden) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setCurrentStep(0);
      }, AUTO_START_DELAY);
      return () => clearTimeout(timer);
    }
  }, [pathname, findElement]);

  // Support manual tour trigger via event (e.g., clicking "How it works" in navbar)
  useEffect(() => {
    const handleStartTour = () => {
      const filtered = ALL_STEPS.filter((s) => {
        if (!s.target) return true;
        return findElement(s) !== null;
      });
      setActiveSteps(filtered.length > 0 ? filtered : ALL_STEPS);
      setCurrentStep(0);
      setIsOpen(true);
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
          const topOffset = el.getBoundingClientRect().top + window.scrollY - (isMobile ? 75 : 120);
          window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
        }
      } else if (step.id === 'host') {
        if (!isMobile) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (step.id === 'instant') {
        if (!isMobile) {
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const closeTour = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, '1');
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

  if (!isOpen || pathname !== '/') return null;

  const currentStepData = activeSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === activeSteps.length - 1;
  const StepIcon = currentStepData?.icon || Sparkles;

  // Calculate Tooltip position relative to viewport
  const getTooltipStyle = (): React.CSSProperties => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (!targetRect || isFirstStep) {
      // Centered Welcome Modal
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100vw - 32px)',
        maxWidth: '380px',
        zIndex: 9995,
      };
    }

    if (isMobile) {
      // DOCKED FLOATING BOTTOM CARD ON MOBILE
      const currentId = activeSteps[currentStep]?.id;
      // If targeting the fixed bottom navigation bar (Vibe Instant or Host), dock card right above it
      const bottomPx = currentId === 'instant' || currentId === 'host' ? 76 : 16;

      return {
        position: 'fixed',
        bottom: `${bottomPx}px`,
        left: '16px',
        right: '16px',
        maxWidth: '380px',
        margin: '0 auto',
        zIndex: 9995,
      };
    }

    const margin = 16;
    const cardWidth = Math.min(380, window.innerWidth - 32);
    const cardHeight = cardRef.current ? cardRef.current.offsetHeight : 210;

    let top = targetRect.bottom + margin;
    // If not enough room below, place above target
    if (top + cardHeight > window.innerHeight - margin) {
      top = Math.max(margin, targetRect.top - cardHeight - margin);
    }

    // Center horizontally on target, clamped within screen margins
    let left = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
      zIndex: 9995,
    };
  };

  return (
    <div
      className="fixed inset-0 z-[9990] select-none font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      {/* 1. Backdrop Spotlight / Dimming */}
      <div
        className="fixed inset-0 bg-[#050C22]/70 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={closeTour}
      />

      {/* 2. Spotlight Cutout / Ring around Active Target */}
      {targetRect && !isFirstStep && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out z-[9992]"
          style={(() => {
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            const currentId = activeSteps[currentStep]?.id;

            let top = Math.max(0, targetRect.top - 8);
            let left = Math.max(0, targetRect.left - 8);
            let width = targetRect.width + 16;
            let height = targetRect.height + 16;
            let radius = '24px';

            if (isMobile) {
              if (currentId === 'categories') {
                height = Math.min(height, window.innerHeight * 0.42);
                radius = '20px';
              } else if (currentId === 'instant') {
                width = Math.max(width, 54);
                height = Math.max(height, 54);
                radius = '9999px';
              } else if (currentId === 'host') {
                radius = '9999px';
              }
            } else {
              radius = targetRect.height > 60 ? '24px' : '9999px';
            }

            return {
              top: `${top}px`,
              left: `${left}px`,
              width: `${width}px`,
              height: `${height}px`,
              borderRadius: radius,
              boxShadow: '0 0 0 9999px rgba(5, 12, 34, 0.72), 0 0 0 2.5px #FFFFFF, 0 0 25px rgba(0, 102, 245, 0.5)',
            };
          })()}
        />
      )}

      {/* 3. Refined Tour Card Popup */}
      <div
        ref={cardRef}
        style={getTooltipStyle()}
        className="animate-in fade-in zoom-in-95 duration-200"
      >
        {isFirstStep ? (
          /* ========================================================================= */
          /* STEP 1: WELCOME MODAL (Exactly matching Screenshot 1)                     */
          /* ========================================================================= */
          <div className="bg-white dark:bg-[#0D1527] w-[90vw] max-w-[390px] rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,10,40,0.5)] border border-slate-200/90 dark:border-white/10 text-center relative text-slate-900 dark:text-white">
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
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] dark:bg-[#0066F5]/15 text-[#0066F5] dark:text-[#08B9F5] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Sparkles className="w-6 h-6 stroke-[2]" />
            </div>

            {/* Step Counter: 1 / 4 */}
            <div className="text-xs font-bold text-[#0066F5] dark:text-[#08B9F5] tracking-wider mb-1.5">
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
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto mb-6">
              {currentStepData.text}
            </p>

            {/* Bottom Bar: Stepper Dots on Left + Skip & Start Buttons on Right */}
            <div className="flex items-center justify-between pt-1">
              {/* Stepper Dots (Pill for Active) */}
              <div className="flex items-center gap-1.5">
                {activeSteps.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? 'w-5 bg-[#0066F5] dark:bg-[#08B9F5]'
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
                  className="px-5 py-2 rounded-full bg-[#0066F5] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span>Start</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Don't show again checkbox below footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-5">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/20 text-[#0066F5] focus:ring-[#0066F5]"
                />
                <span>Don&apos;t show again</span>
              </label>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STEPS 2 to 5: SPOTLIGHT CARDS (Matching Screenshots 2, 3, 4, 5)           */
          /* ========================================================================= */
          <div className="bg-white dark:bg-[#0D1527] rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_-10px_rgba(0,10,40,0.45)] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white relative">
            {/* Top Row: Icon Badge + Step Counter + Close Button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#EFF6FF] dark:bg-[#0066F5]/15 text-[#0066F5] dark:text-[#08B9F5] flex items-center justify-center shrink-0">
                  <StepIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="text-xs font-bold text-[#0066F5] dark:text-[#08B9F5] tracking-wider">
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

            {/* Single Line Description */}
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
              {currentStepData.text}
            </p>

            {/* Bottom Row: Stepper Dots + Back Arrow Circle + Next/Got it Button */}
            <div className="flex items-center justify-between pt-1">
              {/* Stepper Dots (Pill for Active) */}
              <div className="flex items-center gap-1.5">
                {activeSteps.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? 'w-5 bg-[#0066F5] dark:bg-[#08B9F5]'
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
                  className="px-5 py-2 rounded-full bg-[#0066F5] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <span>{currentStepData.cta}</span>
                  {isLastStep ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : null}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
