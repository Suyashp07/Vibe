'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'vibe-splash-seen';
const SHOW_MS = 1900;
const EXIT_MS = 520;

export function Splash() {
  const [phase, setPhase] = useState<'hidden' | 'in' | 'out'>('hidden');

  const dismiss = useCallback((remember: boolean) => {
    setPhase('out');
    window.setTimeout(() => {
      setPhase('hidden');
      document.body.style.removeProperty('overflow');
      if (remember) {
        try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* private mode */ }
      }
    }, EXIT_MS);
  }, []);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(STORAGE_KEY) === '1'; } catch { /* private mode */ }
    if (seen) return;
    setPhase('in');
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => dismiss(true), SHOW_MS);
    return () => {
      window.clearTimeout(timer);
      document.body.style.removeProperty('overflow');
    };
  }, [dismiss]);

  if (phase === 'hidden') return null;
  return (
    <div
      className={`splash ${phase === 'out' ? 'splash-exit' : ''}`}
      aria-hidden={phase === 'out'}
      onClick={() => phase === 'in' && dismiss(true)}
    >
      <span className="splash-glow" aria-hidden="true" />
      <div className="splash-inner">
        <div className="splash-word">
          <span>vibe</span>
          <span className="splash-dot" aria-hidden="true" />
        </div>
        <span className="splash-by">BY SWANIKI</span>
        <p className="splash-tagline">Good people. Real connections.</p>
        <span className="splash-bar" aria-hidden="true"><i /></span>
      </div>
      <button type="button" className="splash-skip" tabIndex={-1}>tap to skip</button>
    </div>
  );
}

export default Splash;
