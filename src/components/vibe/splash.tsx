'use client';

import React, { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'vibe-splash-seen';

const WORDS = [
  'meetup',
  'fest',
  'get together',
  'conferences',
  'workshop',
  'concert',
  'event',
];

const TILE_MAP = [1, 0, 1, 3, 2, 0, -1];
const OX = [0.18, 0.34, 0.5, 0.66, 0.82];
const AMP = [60, 46, 36, 46, 60];
const PH = [0, 1.3, 2.6, 3.9, 5.2];
const K = [0.07, 0.11, 0.17, 0.11, 0.07];
const HZ = 240;
const TD = 0.5;
const LY = 0.36;

interface BeamState {
  ox: number;
  oy: number;
  base: number;
  A: number;
  ph: number;
  k: number;
  i: number;
  a: number | null;
  el: HTMLElement | null;
}

export function Splash() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const splashRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const biRef = useRef<HTMLDivElement>(null);
  const bmRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLDivElement>(null);
  const darkLogoRef = useRef<HTMLImageElement>(null);
  const lightLogoRef = useRef<HTMLImageElement>(null);

  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const rafRef = useRef<number>(0);
  const frafRef = useRef<number>(0);
  const launchedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('no_splash') === '1') return;
      const forceSplash = urlParams.get('splash') === '1' || urlParams.get('debug_splash') === '1';
      if (!forceSplash && sessionStorage.getItem(STORAGE_KEY) === '1') {
        return;
      }
    } catch (e) {
      // safe fallback
    }

    if (typeof window !== 'undefined') {
      (window as any).__vibeSplashActive = true;
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Lock body scrolling while splash is active
    document.body.style.overflow = 'hidden';

    const brand = brandRef.current;
    const bi = biRef.current;
    const bm = bmRef.current;
    const bg = bgRef.current;
    const tag = tagRef.current;
    const splash = splashRef.current;
    const dust = dustRef.current;
    const container = containerRef.current;

    if (!brand || !bi || !bm || !bg || !tag || !splash || !dust || !container) {
      return;
    }

    const words = tag.querySelectorAll('b');
    const tiles = splash.querySelectorAll<HTMLElement>('.tile');

    let bs: BeamState[] = [];
    let TAB: [number, number, number][] = [];
    let t0 = 0;
    let bw = 0;
    let bh = 0;
    let iw = typeof window !== 'undefined' ? window.innerWidth : 390;
    let ih = typeof window !== 'undefined' ? window.innerHeight : 844;
    let x0 = 0;
    let yL = 0;
    let cur = -1;
    let TI = 0.45;
    const isMobile = iw < 768;

    function sm(x: number) {
      x = Math.max(0, Math.min(1, x));
      return x * x * (3 - 2 * x);
    }

    function at(ms: number, fn: () => void) {
      timersRef.current.push(setTimeout(fn, ms));
    }

    function reduced() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function rig() {
      if (!bm || !dust) return;
      iw = window.innerWidth;
      ih = window.innerHeight;
      const base = Math.hypot(iw, ih) * 1.1;
      let h = '';
      let d = '';
      bs = [];

      if (!isMobile) {
        OX.forEach((f, i) => {
          const ox = iw * f;
          const wd = Math.max(150, iw * 0.17);
          h += `<div class="beam${i % 2 ? ' w' : ''}" style="left:${ox - wd / 2}px;top:0;width:${wd}px;height:${base}px"></div>`;
          bs.push({ ox, oy: 0, base, A: AMP[i], ph: PH[i], k: K[i], i, a: null, el: null });
        });

        bm.innerHTML = h;
        const children = bm.children;
        bs.forEach((b, i) => {
          b.el = children[i] as HTMLElement;
        });

        for (let i = 0; i < 20; i++) {
          const s = 1.5 + Math.random() * 2;
          d += `<i style="left:${28 + Math.random() * 44}%;top:${18 + Math.random() * 55}%;width:${s}px;height:${s}px;--dx:${(Math.random() - 0.5) * 60}px;--dur:${5 + Math.random() * 5}s;--dl:-${Math.random() * 8}s"></i>`;
        }
        dust.innerHTML = d;
      } else {
        bm.innerHTML = '';
        dust.innerHTML = '';
      }
      container?.style.setProperty('--ly', `${ih * LY}px`);
    }

    function measure() {
      if (!brand) return;
      iw = window.innerWidth;
      ih = window.innerHeight;
      const rect = brand.getBoundingClientRect();
      bw = rect.width || brand.offsetWidth || Math.min(340, Math.max(220, iw * 0.72));
      bh = rect.height || brand.offsetHeight || Math.round(bw * (524 / 1034));
      x0 = Math.round((iw - bw) / 2);
      yL = Math.round(ih * LY - bh / 2);

      // Keep CSS variables strictly synchronized with measured dimensions
      container?.style.setProperty('--x0', `${x0}px`);
      container?.style.setProperty('--yL', `${yL}px`);
      container?.style.setProperty('--bw', `${bw}px`);
      container?.style.setProperty('--bh', `${bh}px`);
      brand.style.setProperty('--x0', `${x0}px`);
      brand.style.setProperty('--yL', `${yL}px`);
    }

    function place() {
      if (!brand || !tag) return;
      brand.style.transform = `translate3d(${x0}px, ${-bh - 60}px, 0)`;
      tag.style.top = `${ih * LY + bh / 2 + (isMobile ? 18 : 22)}px`;
    }

    // Gravity + bounce physics with damped spring squash & stretch
    function sim() {
      const g = ih * (isMobile ? 8.2 : 7.5);
      const vmax = ih * 3.4;
      const dt = 1 / HZ;
      let y = -bh - 60;
      let v = 0;
      const n = Math.ceil((isMobile ? 1.8 : 2.8) * HZ);
      let sq = 0;
      let sv = 0;
      let landed = false;
      const startDelay = isMobile ? 0.06 : TD; // Swift immediate entrance on mobile, no dead waiting
      TAB = [];

      for (let i = 0; i < n; i++) {
        const t = i * dt;
        if (t >= startDelay) {
          v = Math.min(v + g * dt, vmax);
          y += v * dt;
          if (y >= yL) {
            y = yL;
            if (v > ih * 0.35) {
              if (!landed) {
                landed = true;
                TI = t;
              }
              sv = -Math.min(5.2, (v / ih) * 1.6);
              v = -v * 0.36;
            } else {
              v = 0;
            }
          }
        }
        sv += (-280 * sq - 24 * sv) * dt;
        sq += sv * dt;
        TAB.push([y, 1 - sq * 0.5, 1 + sq]);
      }
    }

    function frame(now: number) {
      if (!brand || !bi || !bg) return;
      const t = (now - t0) / 1000;
      const idx = Math.min(TAB.length - 1, Math.max(0, Math.round(t * HZ)));
      const s = TAB[idx] || [yL, 1, 1];
      const cx = x0 + bw / 2;
      const cy = s[0] + bh / 2;
      const w = (2 * Math.PI) / 1.4;
      const sc = 1 - sm((t - 0.2) / 0.9);
      const ts = t - TI;
      const sh = ts > 0 && ts < 0.25 ? 3 * Math.exp(-ts * 28) * Math.cos(ts * 60) : 0;

      brand.style.transform = `translate3d(${x0}px, ${s[0]}px, 0)`;
      bi.style.transform = `scale(${s[1]}, ${s[2]})`;

      if (isMobile) {
        bg.style.transform = `translate3d(0, ${sh}px, 0)`;
      } else {
        bs.forEach((b) => {
          if (!b.el) return;
          const aim = (-Math.atan2(cx - b.ox, cy - b.oy) * 180) / Math.PI + b.A * sc * Math.sin(w * t + b.ph);
          if (b.a === null) b.a = aim;
          b.a += ((((aim - b.a + 540) % 360) - 180) * b.k);
          const L = Math.max(60, Math.hypot(cx - b.ox, cy - b.oy) * 1.3);
          b.el.style.transform = `rotate(${b.a}deg) scaleY(${L / b.base})`;
          b.el.style.opacity = `${Math.min(1, Math.max(0, (t - 0.25 - b.i * 0.1) / 0.35))}`;
        });

        bg.style.transform = `translate3d(0, ${sh}px, 0) scale(${1 + 0.04 * sm(t / 4)})`;
      }

      if (!container?.classList.contains('p4')) {
        rafRef.current = requestAnimationFrame(frame);
      }
    }

    function setWord(i: number) {
      const p = cur;
      cur = i;
      words.forEach((b) => b.classList.remove('on', 'out'));
      if (p >= 0 && i >= 0 && p !== i && words[p]) {
        words[p].classList.add('out');
      }
      if (i >= 0 && words[i]) {
        words[i].classList.add('on');
      }
      tiles.forEach((tile, k) => {
        tile.classList.toggle('hl', i >= 0 && k === TILE_MAP[i]);
      });
    }

    function stop() {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(frafRef.current);
      rafRef.current = 0;
      frafRef.current = 0;
    }

    // Curved flight to the navbar logo on desktop, or smooth compositor fade on mobile
    function fly() {
      if (!brand) return;

      if (isMobile) {
        // Silky smooth GPU compositor exit on mobile
        document.body.style.removeProperty('overflow');
        container?.classList.add('mobile-launching');

        // Smoothly float up and dissolve with GPU acceleration
        brand.style.transition = 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease-out';
        brand.style.transform = `translate3d(${x0}px, ${yL - 18}px, 0) scale(0.92)`;
        brand.style.opacity = '0';

        at(380, () => {
          if (splash) splash.style.display = 'none';
          document.body.style.removeProperty('overflow');
          setMounted(false);
          try {
            sessionStorage.setItem(STORAGE_KEY, '1');
          } catch (e) {}
          if (typeof window !== 'undefined') {
            (window as any).__vibeSplashActive = false;
            window.dispatchEvent(new CustomEvent('vibe:splash_completed'));
          }
        });
        return;
      }

      const navLogo =
        (document.querySelector('[data-vibe-logo="true"] img:not(.hidden)') as HTMLElement | null) ||
        (document.querySelector('[data-vibe-logo="true"]') as HTMLElement | null) ||
        (document.querySelector('header a[title="Vibe"]') as HTMLElement | null) ||
        (document.querySelector('header') as HTMLElement | null);

      let targetRect = {
        left: iw * 0.06,
        top: 18,
        width: 120,
        height: 38,
      };

      if (navLogo) {
        const r = navLogo.getBoundingClientRect();
        targetRect = {
          left: r.left,
          top: r.top,
          width: r.width || 120,
          height: r.height || 38,
        };
      }

      const targetH = Math.max(28, Math.min(50, targetRect.height));
      const sc = targetH / bh;
      const dur = reduced() ? 10 : 900;
      const s0 = performance.now();
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const lightLogo = lightLogoRef.current;
      const darkLogo = darkLogoRef.current;

      cancelAnimationFrame(frafRef.current);

      function step(n: number) {
        const p = Math.min(1, (n - s0) / dur);
        const px = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const py = 1 - Math.pow(1 - p, 3);

        if (brand) {
          const curX = x0 + (targetRect.left - x0) * px;
          const curY = yL + (targetRect.top - yL) * py;
          const curScale = 1 + (sc - 1) * px;
          brand.style.transform = `translate3d(${curX}px, ${curY}px, 0) scale(${curScale})`;

          // In light mode, cross-fade to light logo during the flight
          if (!isDark && lightLogo && darkLogo) {
            const crossFade = Math.min(1, Math.max(0, (px - 0.2) / 0.5));
            lightLogo.style.opacity = `${crossFade}`;
            darkLogo.style.opacity = `${1 - crossFade}`;
          }

          if (p > 0.85) {
            brand.style.opacity = `${Math.max(0, (1 - p) / 0.15)}`;
          }
        }

        if (p < 1) {
          frafRef.current = requestAnimationFrame(step);
        } else {
          at(150, () => {
            if (splash) splash.style.display = 'none';
            document.body.style.removeProperty('overflow');
            setMounted(false);
            try {
              sessionStorage.setItem(STORAGE_KEY, '1');
            } catch (e) {}
            if (typeof window !== 'undefined') {
              (window as any).__vibeSplashActive = false;
              window.dispatchEvent(new CustomEvent('vibe:splash_completed'));
            }
          });
        }
      }

      frafRef.current = requestAnimationFrame(step);
    }

    function launch() {
      if (launchedRef.current) return;
      launchedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      // Immediately restore body scrolling so touch & scroll are instantly interactive
      document.body.style.removeProperty('overflow');
      if (bi) bi.style.transform = '';
      if (brand) brand.style.transform = `translate3d(${x0}px, ${yL}px, 0)`;
      container?.classList.add('p4');
      fly();
    }

    function skip() {
      if (container?.classList.contains('p4')) return;
      stop();
      container?.classList.add('p1', 'p2');
      setWord(-1);
      launch();
    }

    function run() {
      stop();
      if (splash) splash.style.display = '';
      if (container) container.className = 'vibe-splash-root';
      if (brand) {
        brand.style.opacity = '1';
        brand.style.transition = '';
      }
      if (darkLogoRef.current) darkLogoRef.current.style.opacity = '1';
      if (lightLogoRef.current) lightLogoRef.current.style.opacity = '0';
      cur = -1;
      setWord(-1);
      rig();
      measure();
      sim();
      place();

      if (reduced()) {
        container?.classList.add('p1', 'p2');
        launch();
        return;
      }

      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      if (urlParams?.get('splash_freeze') === '1') {
        container?.classList.add('p1', 'p2');
        if (brand) brand.style.transform = `translate3d(${x0}px, ${yL}px, 0)`;
        setWord(6);
        return;
      }

      void container?.offsetWidth;
      t0 = performance.now();
      rafRef.current = requestAnimationFrame(frame);
      container?.classList.add('p1');

      const ms = TI * 1000;
      const ws = ms + (isMobile ? 180 : 250);
      at(ms, () => {
        container?.classList.add('p2');
      });

      if (isMobile) {
        // Fast, punchy, fluid sequence on mobile (total ~1.2s so mobile opening never hangs)
        // 1 = fest, 6 = event
        at(ws, () => {
          setWord(1);
        });
        at(ws + 260, () => {
          setWord(6);
        });
        at(ws + 260 + 360, () => {
          launch();
        });
      } else {
        // Full theatrical word cycling on desktop
        for (let k = 0; k < WORDS.length; k++) {
          ((kIdx) => {
            at(ws + kIdx * 330, () => {
              setWord(kIdx);
            });
          })(k);
        }

        at(ws + (WORDS.length - 1) * 330 + 700, () => {
          setWord(-1);
          launch();
        });
      }
    }

    const handleResize = () => {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      if (urlParams?.get('splash_freeze') === '1') {
        measure();
        if (brand) brand.style.transform = `translate3d(${x0}px, ${yL}px, 0)`;
        return;
      }

      if (container?.classList.contains('p4')) {
        iw = window.innerWidth;
        ih = window.innerHeight;
        fly();
      } else {
        rig();
        measure();
        sim();
        place();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        skip();
      }
    };

    splash.addEventListener('click', skip);
    splash.addEventListener('touchstart', skip, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    // Run animation immediately without stalling for font downloads
    run();

    // Safety watchdog: mobile splash NEVER traps the user or hangs
    const safetyTimer = setTimeout(() => {
      if (!launchedRef.current) {
        launch();
      }
    }, isMobile ? 2600 : 5500);
    timersRef.current.push(safetyTimer);

    return () => {
      stop();
      document.body.style.removeProperty('overflow');
      if (typeof window !== 'undefined') {
        (window as any).__vibeSplashActive = false;
      }
      splash.removeEventListener('click', skip);
      splash.removeEventListener('touchstart', skip);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="vibe-splash-root" ref={containerRef}>
      {/* SVG Definitions */}
      <svg width="0" height="0" className="vibe-splash-defs" style={{ position: 'absolute' }}>
        <defs>
          {/* Signature brand blue gradient matching the exact Vibe logo */}
          <linearGradient id="gv" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0038A8" />
            <stop offset="100%" stopColor="#173DAA" />
          </linearGradient>
          <symbol id="i-wave" viewBox="0 0 100 80">
            <g stroke="#4fd8e8" strokeWidth="3.6" strokeLinecap="round">
              <path d="M10 33v14M18 25v30M26 18v44M34 28v24M42 14v52M50 22v36M58 31v18M66 17v46M74 26v28M82 20v40M90 32v16" />
            </g>
          </symbol>
          <symbol id="i-orbit" viewBox="0 0 100 80">
            <g fill="none" stroke="#a58bff" strokeWidth="2.4">
              <ellipse cx="50" cy="40" rx="32" ry="13" />
              <ellipse cx="50" cy="40" rx="32" ry="13" transform="rotate(60 50 40)" />
              <ellipse cx="50" cy="40" rx="32" ry="13" transform="rotate(-60 50 40)" />
            </g>
          </symbol>
          <symbol id="i-aa" viewBox="0 0 100 80">
            <text x="50" y="58" textAnchor="middle" fontFamily="Outfit, sans-serif" fontWeight="700" fontSize="50" fill="#7cc4ff">
              Aa
            </text>
          </symbol>
          <symbol id="i-code" viewBox="0 0 100 80">
            <text x="50" y="56" textAnchor="middle" fontFamily="Outfit, sans-serif" fontWeight="700" fontSize="42" fill="#4fe0b0">
              &lt;/&gt;
            </text>
          </symbol>
        </defs>
      </svg>

      {/* Main Theatrical Stage */}
      <main id="splash" ref={splashRef} title="Click anywhere to continue">
        <div id="bg" ref={bgRef}></div>
        <div id="bm" ref={bmRef}></div>
        <i className="lamp" style={{ left: '18%' }}></i>
        <i className="lamp" style={{ left: '34%' }}></i>
        <i className="lamp" style={{ left: '50%' }}></i>
        <i className="lamp" style={{ left: '66%' }}></i>
        <i className="lamp" style={{ left: '82%' }}></i>
        <div id="dust" ref={dustRef}></div>
        <div className="pool"></div>
        <div className="bloom"></div>
        <div className="flare"></div>
        <div className="tile t0">
          <svg viewBox="0 0 100 80"><use href="#i-wave" /></svg>
        </div>
        <div className="tile t1">
          <svg viewBox="0 0 100 80"><use href="#i-orbit" /></svg>
        </div>
        <div className="tile t2">
          <svg viewBox="0 0 100 80"><use href="#i-aa" /></svg>
        </div>
        <div className="tile t3">
          <svg viewBox="0 0 100 80"><use href="#i-code" /></svg>
        </div>
        <div className="vig"></div>
        <div id="tag" ref={tagRef}>
          <span>Find your next</span>
          <span className="slot">
            {WORDS.map((w, idx) => (
              <b key={idx}>{w}</b>
            ))}
          </span>
        </div>
      </main>

      {/* Brand Lockup: Authentic Vibe logo image matching exact brand asset */}
      <div className="brand" id="brand" ref={brandRef} aria-hidden="true">
        <div className="bi" ref={biRef}>
          <div className="splash-logo-glow" />
          <img
            src="/logo-dark.png"
            alt="Vibe by Swaniki"
            className="splash-brand-logo splash-logo-dark"
            ref={darkLogoRef}
            width={1034}
            height={524}
            loading="eager"
            decoding="sync"
          />
          <img
            src="/logo.png"
            alt="Vibe by Swaniki"
            className="splash-brand-logo splash-logo-light"
            ref={lightLogoRef}
            width={1034}
            height={524}
            loading="eager"
            decoding="sync"
            style={{ opacity: 0 }}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .vibe-splash-root {
          --ink: #eef2ff;
          --teal: #5fe0d6;
          --muted: #8d9bc7;
          --ly: 36vh;
          box-sizing: border-box;
          font-family: Inter, system-ui, sans-serif;
          color: var(--ink);
        }
        .vibe-splash-root * {
          box-sizing: border-box;
          margin: 0;
        }
        #splash {
          position: fixed;
          inset: 0;
          height: 100vh;
          height: 100dvh;
          z-index: 99998;
          overflow: hidden;
          cursor: pointer;
          background: #050816;
          transition: opacity .8s .25s;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .p4 #splash {
          opacity: 0;
          pointer-events: none;
        }
        #splash > * {
          position: absolute;
        }
        #bg {
          inset: -2%;
          background: radial-gradient(ellipse 70% 60% at 50% 42%, #14225a 0%, #0a1031 55%, transparent 100%),
                      repeating-radial-gradient(circle at 50% 42%, transparent 0 210px, rgba(130, 160, 255, .07) 211px 212px);
        }
        .vig {
          inset: 0;
          background: radial-gradient(ellipse 80% 75% at 50% 45%, transparent 45%, rgba(0, 0, 0, .65));
        }
        #bm {
          inset: 0;
          mix-blend-mode: screen;
          opacity: 0;
          transition: opacity .4s;
        }
        .p1 #bm {
          opacity: 1;
        }
        .beam{transform-origin:50% 0;background:url(data:image/png;base64,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) 0 0/100% 100% no-repeat;mix-blend-mode:screen;opacity:0;will-change:transform}
.beam.w{background-image:url(data:image/png;base64,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)}
        .lamp {
          top: 0;
          width: 26px;
          height: 11px;
          transform: translateX(-50%);
          border-radius: 0 0 9px 9px;
          background: #e6eeff;
          box-shadow: 0 0 18px 7px rgba(150, 205, 255, .75);
          opacity: 0;
          transition: opacity .4s;
        }
        .p1 .lamp {
          opacity: 1;
        }
        #dust {
          inset: 0;
          opacity: 0;
          transition: opacity 1s;
          mix-blend-mode: screen;
          pointer-events: none;
        }
        .p2 #dust {
          opacity: 1;
        }
        #dust i {
          position: absolute;
          border-radius: 50%;
          background: #dff0ff;
          box-shadow: 0 0 6px 1px rgba(170, 220, 255, .8);
          opacity: 0;
          animation: dust var(--dur) linear infinite var(--dl);
        }
        @keyframes dust {
          0% { opacity: 0; transform: translate3d(0, 0, 0); }
          20% { opacity: .9; }
          80% { opacity: .5; }
          100% { opacity: 0; transform: translate3d(var(--dx), -130px, 0); }
        }
        .pool {
          left: 50%;
          top: calc(var(--ly) + 13vh);
          width: min(70vw, 720px);
          height: 16vh;
          transform: translateX(-50%);
          background: radial-gradient(ellipse, rgba(120, 170, 255, .4), rgba(60, 100, 255, .1) 50%, transparent 70%);
          filter: blur(8px);
          opacity: 0;
          transition: opacity 1s;
        }
        .p2 .pool {
          opacity: 1;
        }
        .bloom {
          left: 50%;
          top: var(--ly);
          width: min(70vmax, 900px);
          aspect-ratio: 1;
          transform: translate(-50%, -50%) scale(.3);
          background: radial-gradient(circle, rgba(150, 190, 255, .4), rgba(50, 100, 255, .12) 35%, transparent 62%);
          mix-blend-mode: screen;
          opacity: 0;
          pointer-events: none;
        }
        .p2 .bloom {
          animation: bl 1.5s ease-out both;
        }
        @keyframes bl {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(.3); }
          35% { opacity: .7; }
          100% { opacity: .3; transform: translate(-50%, -50%) scale(1); }
        }
        .flare {
          left: 10vw;
          width: 80vw;
          top: var(--ly);
          height: 2px;
          background: linear-gradient(90deg, transparent, #fff 50%, transparent);
          transform: scaleX(0);
          opacity: 0;
        }
        .p2 .flare {
          animation: fz .9s ease-out both;
        }
        @keyframes fz {
          0% { opacity: 0; transform: scaleX(0); }
          30% { opacity: .9; }
          100% { opacity: 0; transform: scaleX(1); }
        }
        .tile {
          --tw: clamp(84px, 12vw, 180px);
          width: var(--tw);
          aspect-ratio: 1.2;
          border-radius: 18px;
          background: linear-gradient(160deg, rgba(32, 52, 110, .8), rgba(12, 20, 52, .9));
          border: 1px solid rgba(150, 180, 255, .22);
          box-shadow: 0 12px 40px rgba(0, 0, 0, .55);
          display: grid;
          place-items: center;
          opacity: 0;
          rotate: var(--r);
          transform: translate(var(--fx), var(--fy)) scale(.3);
        }
        .tile svg {
          width: 78%;
          height: auto;
          animation: fl 4s ease-in-out infinite alternate;
        }
        .p2 .tile {
          opacity: 1;
          transform: none;
          transition: transform .8s cubic-bezier(.2, 1.35, .4, 1) var(--td), opacity .4s var(--td), border-color .3s, box-shadow .3s;
        }
        .p2 .tile.hl {
          transform: scale(1.12);
          border-color: rgba(130, 200, 255, .8);
          box-shadow: 0 0 36px rgba(90, 160, 255, .55), 0 12px 40px rgba(0, 0, 0, .55);
          transition-delay: 0s;
        }
        @keyframes fl {
          to { transform: translateY(-5px); }
        }
        .t0 { left: 9%; top: 24%; --r: -8deg; --fx: 32vw; --fy: 8vh; --td: .05s; }
        .t1 { right: 9%; top: 22%; --r: 7deg; --fx: -32vw; --fy: 8vh; --td: .12s; }
        .t2 { left: 12%; top: 58%; --r: -5deg; --fx: 28vw; --fy: -8vh; --td: .19s; }
        .t3 { right: 11%; top: 56%; --r: 6deg; --fx: -28vw; --fy: -8vh; --td: .26s; }
        @media (max-width: 700px) {
          .tile { --tw: 78px; }
          .t0 { left: 4%; top: 9%; }
          .t1 { right: 4%; top: 9%; }
          .t2 { left: 4%; top: auto; bottom: 9%; }
          .t3 { right: 4%; top: auto; bottom: 9%; }
        }
        #tag {
          left: 0;
          right: 0;
          z-index: 1;
          display: flex;
          justify-content: center;
          align-items: baseline;
          gap: .38em;
          font-size: clamp(22px, 3.7vw, 38px);
          font-weight: 500;
          color: #dfe8ff;
          letter-spacing: .01em;
          opacity: 0;
          transition: opacity .35s;
        }
        #tag::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(86vw, 700px);
          height: 5.5em;
          transform: translate(-50%, -50%);
          background: radial-gradient(ellipse, rgba(110, 160, 255, .28), transparent 68%);
          z-index: -1;
          pointer-events: none;
        }
        .p2 #tag {
          opacity: 1;
        }
        .p4 #tag {
          opacity: 0;
          transition: opacity .25s;
        }
        .slot {
          display: inline-grid;
          overflow: hidden;
          padding: .12em .25em .3em;
          margin: -.12em -.25em -.3em;
        }
        .slot b {
          grid-area: 1/1;
          justify-self: start;
          width: max-content;
          position: relative;
          opacity: 0;
          font-weight: 700;
          background: linear-gradient(90deg, #7fe0ea, #fff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .slot b.on {
          animation: wi .32s cubic-bezier(.2, .8, .2, 1) both;
        }
        .slot b.out {
          animation: wo .22s ease-in both;
        }
        .slot b::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -.06em;
          height: 2px;
          width: 100%;
          background: linear-gradient(90deg, #0038A8, transparent);
          transform: scaleX(0);
          transform-origin: left;
        }
        .slot b.on::after {
          animation: ul .5s .08s ease-out both;
        }
        @keyframes wi {
          from { opacity: 0; transform: translateY(75%) scale(.94); filter: blur(7px); }
          to { opacity: 1; transform: none; filter: none; }
        }
        @keyframes wo {
          from { opacity: 1; transform: none; filter: none; }
          to { opacity: 0; transform: translateY(-75%); filter: blur(7px); }
        }
        @keyframes ul {
          to { transform: scaleX(1); }
        }

        /* Brand Lockup (Flies smoothly to navbar) */
        .brand {
          position: fixed;
          left: 0;
          top: 0;
          z-index: 99999;
          transform-origin: 0 0;
          pointer-events: none;
          width: max-content;
          height: max-content;
        }
        .bi {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: 50% 100%;
          width: clamp(230px, 34vw, 380px);
          aspect-ratio: 1034 / 524;
        }
        .splash-logo-glow {
          position: absolute;
          inset: -15%;
          border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(0, 56, 168, 0.75) 0%, rgba(0, 56, 168, 0.28) 45%, transparent 72%);
          pointer-events: none;
          z-index: -1;
          opacity: 0.85;
          filter: blur(22px);
          transform: translateZ(0);
        }
        .p2 .splash-logo-glow {
          animation: glowPulse .85s ease-out;
        }
        @keyframes glowPulse {
          0% { transform: scale(1.3) translateZ(0); opacity: 1; }
          100% { transform: scale(1) translateZ(0); opacity: 0.85; }
        }
        .splash-brand-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          user-select: none;
          image-rendering: -webkit-optimize-contrast;
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        .splash-logo-light {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .mobile-launching #splash {
          opacity: 0 !important;
          transform: scale(1.03) !important;
          transition: opacity .35s ease-out, transform .35s ease-out !important;
          pointer-events: none !important;
        }
        .mobile-launching .brand {
          opacity: 0 !important;
          transform: translate3d(var(--x0, 0), calc(var(--yL, 0) - 18px), 0) scale(.92) !important;
          transition: opacity .35s ease-out, transform .35s cubic-bezier(.16, 1, .3, 1) !important;
          pointer-events: none !important;
        }

        @media (max-width: 768px) {
          #bm, .lamp, #dust, .tile, .bloom, .flare {
            display: none !important;
          }
          .pool {
            width: 90vw;
            height: 12vh;
            filter: blur(14px);
          }
          #tag {
            font-size: clamp(17px, 4.8vw, 24px);
            white-space: nowrap;
          }
          .bi {
            width: min(290px, 78vw);
            transform: translateZ(0);
          }
          .slot b.on {
            animation: wi-mob .26s cubic-bezier(.2, .8, .2, 1) both;
          }
          .slot b.out {
            animation: wo-mob .18s ease-in both;
          }
        }
        @keyframes wi-mob {
          from { opacity: 0; transform: translateY(60%) scale(.96); }
          to { opacity: 1; transform: none; }
        }
        @keyframes wo-mob {
          from { opacity: 1; transform: none; }
          to { opacity: 0; transform: translateY(-60%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .vibe-splash-root * {
            animation-duration: .01s !important;
            animation-delay: 0s !important;
            transition-duration: .01s !important;
          }
        }
      `}} />
    </div>
  );
}
