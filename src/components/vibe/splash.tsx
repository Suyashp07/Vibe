'use client';

import { useState, useEffect, useRef, useCallback, CSSProperties, Fragment } from 'react';

const STORAGE_KEY = 'vibe-splash-seen';

const WORDS = ['workshop', 'meetup', 'concert', 'hackathon', 'festival'];
const STEPS = [
  'Discovering events near you',
  'Setting the stage',
  'Saving your spot',
  'Doors are open',
];

interface BeamData {
  lx: number;
  bwid: number;
  d: number;
  a: number;
  bd: number;
  type: string;
}

export function Splash() {
  const [mounted, setMounted] = useState(false);
  const [phaseClass, setPhaseClass] = useState<string>(''); // '', 'p1', 'p1 p2', 'p1 p2 p3', 'p4'
  const [wordIdx, setWordIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [wordAnimKey, setWordAnimKey] = useState(0);
  const [stepAnimKey, setStepAnimKey] = useState(0);
  const [beams, setBeams] = useState<BeamData[]>([]);
  const [crowdHtml, setCrowdHtml] = useState<string>('');

  const brandRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const launchedRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  // Calculate beam geometry based on screen dimensions
  const updateRig = useCallback(() => {
    if (typeof window === 'undefined') return;
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    const tx = iw / 2;
    const ty = ih * 0.56;
    const delays = [0.1, 0.3, 0.75, 0.3, 0.1];
    const beamList: BeamData[] = [0.1, 0.3, 0.5, 0.7, 0.9].map((f, i) => {
      const lx = iw * f;
      const dy = ty - 12;
      const dx = tx - lx;
      const d = Math.hypot(dx, dy) * 1.1;
      const a = (-Math.atan2(dx, dy) * 180) / Math.PI;
      const bwid = Math.max(110, iw * (i === 2 ? 0.2 : 0.15));
      return {
        lx,
        bwid,
        d,
        a,
        bd: delays[i],
        type: i === 2 ? 'k' : i % 2 ? 'w' : '',
      };
    });
    setBeams(beamList);
  }, []);

  // Position the brand directly over the intro spacer
  const placeBrand = useCallback(() => {
    if (!spacerRef.current || !brandRef.current) return;
    const bw = brandRef.current.offsetWidth;
    const bh = brandRef.current.offsetHeight;
    spacerRef.current.style.width = `${bw}px`;
    spacerRef.current.style.height = `${bh}px`;
    const r = spacerRef.current.getBoundingClientRect();
    brandRef.current.style.transform = `translate(${r.left}px, ${r.top}px)`;
  }, []);

  // Fly brand to navbar logo and fade out splash
  const flyBrand = useCallback(() => {
    if (!brandRef.current) return;
    const bh = brandRef.current.offsetHeight || 90;
    const navLogo =
      document.querySelector('[data-vibe-logo="true"]') ||
      document.querySelector('header a[title="Vibe"]') ||
      document.querySelector('header');

    if (navLogo) {
      const r = navLogo.getBoundingClientRect();
      const targetH = Math.min(36, r.height || 36);
      const scale = targetH / bh;
      brandRef.current.style.transform = `translate(${r.left}px, ${r.top}px) scale(${scale})`;
      brandRef.current.style.opacity = '0';
    } else {
      brandRef.current.style.transform = `translate(24px, 16px) scale(${34 / bh})`;
      brandRef.current.style.opacity = '0';
    }
  }, []);

  // Launch exit transition
  const launch = useCallback(() => {
    if (launchedRef.current) return;
    launchedRef.current = true;
    clearTimers();
    setPhaseClass((prev) => `${prev} p4`);
    flyBrand();

    // After animation completes, restore body scroll and unmount
    const endTimer = setTimeout(() => {
      document.body.style.removeProperty('overflow');
      setMounted(false);
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch (e) {
        // private mode safe
      }
    }, 750);
    timersRef.current.push(endTimer);
  }, [clearTimers, flyBrand]);

  // Generate crowd silhouettes with glowing mobile screens
  useEffect(() => {
    const W = 1200;
    const H = 170;
    let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">`;
    let lights = '';

    [
      { y: 112, r: 15, c: '#121a40', st: 46 },
      { y: 140, r: 20, c: '#070a1a', st: 62 },
    ].forEach((row, ri) => {
      for (let x = -10; x < W + 60; x += row.st) {
        const cx = x + (Math.random() - 0.5) * row.st * 0.5;
        const cy = row.y + (Math.random() - 0.5) * 10;
        s += `<ellipse cx="${cx}" cy="${cy + row.r * 2.9}" rx="${row.r * 2.3}" ry="${
          row.r * 2.4
        }" fill="${row.c}"/><circle cx="${cx}" cy="${cy}" r="${row.r}" fill="${row.c}"/>`;
        if (Math.random() < 0.36) {
          const lx = cx + (Math.random() - 0.5) * 14;
          const ly = cy - row.r - 14 - Math.random() * 20;
          s += `<rect x="${lx - 2}" y="${ly}" width="4" height="${
            cy - ly - row.r * 0.4
          }" rx="2" fill="${row.c}"/>`;
          lights += `<g class="vibe-splash-lt" style="--t:${(
            Math.random() * 0.9 +
            0.5
          ).toFixed(2)}s"><circle cx="${lx}" cy="${ly - 3}" r="${
            ri ? 16 : 11
          }" fill="url(#g4)"/><circle cx="${lx}" cy="${ly - 3}" r="${
            ri ? 2.8 : 2
          }" fill="#fff5dc"/></g>`;
        }
      }
    });

    setCrowdHtml(s + lights + '</svg>');
  }, []);

  // Main lifecycle & sequence runner
  useEffect(() => {
    // Check if splash was already seen in this session (allow ?splash=1 bypass for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const forceSplash = urlParams.get('splash') === '1';

    let seen = false;
    try {
      seen = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      // private mode
    }

    if (seen && !forceSplash) {
      return;
    }

    setMounted(true);
    document.body.style.overflow = 'hidden';

    // Reduced motion check
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMounted(false);
      document.body.style.removeProperty('overflow');
      return;
    }

    updateRig();

    // Small delay to ensure brand element has rendered for measurement
    const initTimer = setTimeout(() => {
      placeBrand();

      // Phase 1: Spotlights ignition & Drop bounce
      setPhaseClass('p1');

      // Phase 2: Leaf & rib pop, brand wipe
      const t1 = setTimeout(() => {
        setPhaseClass('p1 p2');
      }, 950);
      timersRef.current.push(t1);

      // Phase 3: Tagline & ticket cycle
      const t2 = setTimeout(() => {
        setPhaseClass('p1 p2 p3');
      }, 1450);
      timersRef.current.push(t2);

      // Cycle words
      for (let k = 1; k < WORDS.length; k++) {
        const tw = setTimeout(() => {
          setWordIdx(k);
          setWordAnimKey((prev) => prev + 1);
        }, 1450 + k * 350);
        timersRef.current.push(tw);
      }

      // Cycle steps
      for (let j = 1; j < STEPS.length; j++) {
        const ts = setTimeout(() => {
          setStepIdx(j);
          setStepAnimKey((prev) => prev + 1);
        }, 1450 + j * 420);
        timersRef.current.push(ts);
      }

      // Phase 4: Launch into application
      const tLaunch = setTimeout(() => {
        launch();
      }, 3100);
      timersRef.current.push(tLaunch);
    }, 40);

    timersRef.current.push(initTimer);

    // Resize handler
    const handleResize = () => {
      if (launchedRef.current) {
        flyBrand();
      } else {
        updateRig();
        placeBrand();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimers();
      window.removeEventListener('resize', handleResize);
      document.body.style.removeProperty('overflow');
    };
  }, [clearTimers, flyBrand, launch, placeBrand, updateRig]);

  if (!mounted) return null;

  return (
    <>
      {/* SVG Color Gradients */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2=".45" y2="1">
            <stop offset="0" stopColor="#3f55c4" />
            <stop offset="1" stopColor="#2f6fe8" />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#58b0f4" />
            <stop offset="1" stopColor="#3a94ee" />
          </linearGradient>
          <radialGradient id="g3" cx=".35" cy=".3" r=".8">
            <stop offset="0" stopColor="#9aeaee" />
            <stop offset="1" stopColor="#2cb3c8" />
          </radialGradient>
          <radialGradient id="g4">
            <stop offset="0" stopColor="#ffe3a8" stopOpacity=".95" />
            <stop offset=".35" stopColor="#ffcf7a" stopOpacity=".45" />
            <stop offset="1" stopColor="#ffcf7a" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Theatrical Splash Overlay */}
      <div
        id="vibe-splash"
        className={`vibe-splash-container ${phaseClass}`}
        onClick={() => launch()}
        title="Click anywhere to skip intro"
      >
        {/* Overhead Lighting Rig & Converging Spot Beams */}
        <div className="vibe-splash-rig" />
        <div className="vibe-splash-lights">
          {beams.map((b, i) => (
            <Fragment key={i}>
              <span
                className="vibe-splash-lamp"
                style={
                  {
                    left: `${b.lx}px`,
                    '--bd': `${b.bd}s`,
                  } as CSSProperties
                }
              />
              <div
                className={`vibe-splash-beam ${b.type ? b.type : ''}`}
                style={
                  {
                    left: `${b.lx - b.bwid / 2}px`,
                    width: `${b.bwid}px`,
                    height: `${b.d}px`,
                    transform: `rotate(${b.a}deg)`,
                    '--bd': `${b.bd}s`,
                  } as CSSProperties
                }
              />
            </Fragment>
          ))}
        </div>

        {/* Stage Curtains */}
        <div className="vibe-splash-cur vibe-splash-cl" />
        <div className="vibe-splash-cur vibe-splash-cr" />

        {/* Illuminated Stage Floor Pool */}
        <div className="vibe-splash-pool" />

        {/* Glowing Crowd Silhouettes */}
        <div
          className="vibe-splash-crowd"
          dangerouslySetInnerHTML={{ __html: crowdHtml }}
        />

        {/* Content Intro Group */}
        <div className="vibe-splash-intro">
          <div className="vibe-splash-spacer" ref={spacerRef} />

          {/* Cycling Tagline */}
          <div className="vibe-splash-tag">
            <span>Find your next</span>
            <b key={wordAnimKey} className="vibe-splash-sw">
              {WORDS[wordIdx]}
            </b>
          </div>

          {/* Progress Pass */}
          <div className="vibe-splash-ticket">
            <em>Entry pass</em>
            <span key={stepAnimKey} className="vibe-splash-sw">
              {STEPS[stepIdx]}
            </span>
            <i className="vibe-splash-pg" />
          </div>
        </div>

        {/* Tap to skip pill */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            launch();
          }}
          className="vibe-splash-skip"
        >
          Skip intro ✕
        </button>
      </div>

      {/* Brand Group (Positioned centrally, flies seamlessly to nav on launch) */}
      <div
        className={`vibe-splash-brand ${phaseClass}`}
        ref={brandRef}
        aria-hidden="true"
      >
        <svg className="vibe-splash-mark" viewBox="0 0 300 270" aria-hidden="true">
          <path
            className="vibe-splash-leaf"
            fill="url(#g1)"
            d="M8 72Q58 68 106 88Q128 150 122 226Q116 236 108 224Z"
          />
          <path
            className="vibe-splash-rib"
            fill="url(#g2)"
            d="M126 170Q160 108 216 100Q276 94 283 114Q284 168 216 238Q172 272 136 250Q116 236 126 170Z"
          />
          <circle
            className="vibe-splash-dot"
            cx="252"
            cy="48"
            r="38"
            fill="url(#g3)"
          />
        </svg>
        <span className="vibe-splash-word">vibe</span>
      </div>

      {/* Scoped CSS Styles for Splash Screen */}
      <style dangerouslySetInnerHTML={{ __html: `
        .vibe-splash-container {
          --bg: #070b1b;
          --ink: #eef2ff;
          --muted: #a9b4d6;
          --accent: #2f7bff;
          --teal: #5fd6df;
          --cy: #1cc6f4;
          --line: rgba(255, 255, 255, 0.2);
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: grid;
          place-items: center;
          overflow: hidden;
          cursor: pointer;
          background: radial-gradient(
            ellipse 80% 70% at 50% 42%,
            #132150 0%,
            #080d22 58%,
            #03050e 100%
          );
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: var(--font-inter), system-ui, sans-serif;
          color: var(--ink);
        }

        .vibe-splash-container.p4 {
          opacity: 0;
          pointer-events: none;
        }

        /* Top Lighting Rig */
        .vibe-splash-rig {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 12px;
          background: linear-gradient(#34406f, #0f1538);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          z-index: 3;
        }

        /* Spot Lamps */
        .vibe-splash-lamp {
          position: absolute;
          top: 8px;
          width: 24px;
          height: 15px;
          transform: translateX(-50%);
          border-radius: 4px 4px 9px 9px;
          background: #d9e1ff;
          box-shadow: 0 0 22px 8px rgba(130, 195, 255, 0.65);
          opacity: 0.12;
          transition: opacity 0.15s var(--bd);
          z-index: 3;
        }
        .p1 .vibe-splash-lamp,
        .p2 .vibe-splash-lamp,
        .p3 .vibe-splash-lamp {
          opacity: 1;
          animation: vibe-fl 0.5s var(--bd) both;
        }
        @keyframes vibe-fl {
          0% {
            opacity: 0.1;
          }
          30% {
            opacity: 1;
          }
          45% {
            opacity: 0.25;
          }
          70% {
            opacity: 1;
          }
          100% {
            opacity: 1;
          }
        }

        /* Beams */
        .vibe-splash-beam {
          position: absolute;
          top: 12px;
          transform-origin: 50% 0;
          clip-path: polygon(46% 0, 54% 0, 100% 100%, 0 100%);
          filter: blur(12px);
          opacity: 0;
          background: linear-gradient(
            rgba(130, 190, 255, 0.36),
            rgba(95, 214, 223, 0.03) 92%
          );
          transition: opacity 0.45s var(--bd);
        }
        .vibe-splash-beam.w {
          background: linear-gradient(rgba(255, 190, 150, 0.26), transparent 92%);
        }
        .vibe-splash-beam.k {
          background: linear-gradient(
            rgba(255, 255, 255, 0.6),
            rgba(160, 210, 255, 0.07) 94%
          );
        }
        .p1 .vibe-splash-beam,
        .p2 .vibe-splash-beam,
        .p3 .vibe-splash-beam {
          opacity: 0.95;
        }

        /* Curtains */
        .vibe-splash-cur {
          position: absolute;
          top: 12px;
          bottom: 0;
          width: clamp(26px, 10vw, 170px);
          z-index: 2;
          pointer-events: none;
          opacity: 0.2;
          transition: opacity 1s 0.6s;
          background: repeating-linear-gradient(
            90deg,
            #1b2b73 0 16px,
            #0d1646 16px 34px,
            #16225f 34px 50px
          );
          -webkit-mask-image: linear-gradient(90deg, #000 55%, transparent);
          mask-image: linear-gradient(90deg, #000 55%, transparent);
          box-shadow: inset 0 -90px 90px -40px #050818;
        }
        .p1 .vibe-splash-cur,
        .p2 .vibe-splash-cur,
        .p3 .vibe-splash-cur {
          opacity: 0.9;
        }
        .vibe-splash-cl {
          left: 0;
        }
        .vibe-splash-cr {
          right: 0;
          transform: scaleX(-1);
        }

        /* Floor Pool */
        .vibe-splash-pool {
          position: absolute;
          left: 50%;
          top: 60%;
          width: min(80vw, 820px);
          height: 20vh;
          transform: translateX(-50%);
          background: radial-gradient(
            ellipse,
            rgba(190, 235, 255, 0.5),
            rgba(90, 168, 255, 0.16) 45%,
            transparent 70%
          );
          filter: blur(10px);
          opacity: 0;
          transition: opacity 0.6s;
        }
        .p2 .vibe-splash-pool,
        .p3 .vibe-splash-pool {
          opacity: 1;
        }

        /* Crowd */
        .vibe-splash-crowd {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 22vh;
          z-index: 1;
          pointer-events: none;
        }
        .vibe-splash-crowd svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .vibe-splash-lt {
          opacity: 0;
        }
        .p1 .vibe-splash-lt,
        .p2 .vibe-splash-lt,
        .p3 .vibe-splash-lt {
          animation: vibe-lit 1s var(--t) both,
            vibe-tw 2.4s calc(var(--t) + 1s) ease-in-out infinite alternate;
        }
        @keyframes vibe-lit {
          to {
            opacity: 1;
          }
        }
        @keyframes vibe-tw {
          from {
            opacity: 1;
          }
          to {
            opacity: 0.5;
          }
        }

        /* Content Intro Group */
        .vibe-splash-intro {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(16px, 3.5vh, 28px);
          margin-top: -6vh;
          transition: opacity 0.4s;
        }
        .p4 .vibe-splash-intro {
          opacity: 0;
        }
        .vibe-splash-spacer {
          --u: clamp(70px, 15vw, 128px);
        }
        .vibe-splash-tag {
          display: flex;
          justify-content: center;
          gap: 0.4em;
          font-size: clamp(17px, 2.6vw, 22px);
          font-weight: 500;
          color: var(--muted);
          opacity: 0;
          transition: opacity 0.4s;
          line-height: 1.4;
        }
        .vibe-splash-tag b {
          width: 6em;
          text-align: left;
          color: var(--teal);
          font-weight: 600;
        }
        .vibe-splash-sw {
          animation: vibe-sw 0.35s both;
        }
        @keyframes vibe-sw {
          from {
            opacity: 0;
            transform: translateY(0.45em);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .vibe-splash-ticket {
          position: relative;
          display: flex;
          align-items: center;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(6px);
          font-size: 13px;
          letter-spacing: 0.05em;
          color: var(--ink);
          opacity: 0;
          transition: opacity 0.4s;
          overflow: hidden;
        }
        .vibe-splash-ticket em {
          font-style: normal;
          padding: 12px 16px;
          border-right: 1.5px dashed var(--line);
          font-size: 10px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--teal);
          font-weight: 600;
        }
        .vibe-splash-ticket span {
          padding: 12px 18px;
          width: min(17em, 60vw);
        }
        .vibe-splash-pg {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          width: 0;
          background: linear-gradient(90deg, var(--teal), var(--accent));
        }
        .p3 .vibe-splash-tag,
        .p3 .vibe-splash-ticket {
          opacity: 1;
        }
        .p3 .vibe-splash-pg {
          animation: vibe-fill 1.8s linear forwards;
        }
        @keyframes vibe-fill {
          to {
            width: 100%;
          }
        }

        /* Brand Fly to Nav */
        .vibe-splash-brand {
          --u: clamp(70px, 15vw, 128px);
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100000;
          display: flex;
          align-items: center;
          gap: calc(var(--u) * 0.14);
          transform-origin: 0 0;
          pointer-events: none;
        }
        .p4 .vibe-splash-brand {
          transition: transform 0.8s cubic-bezier(0.7, 0, 0.2, 1),
            opacity 0.75s ease;
        }
        .vibe-splash-mark {
          height: var(--u);
          width: calc(var(--u) * 1.11);
          overflow: visible;
        }
        .vibe-splash-mark * {
          transform-box: fill-box;
        }
        .vibe-splash-leaf,
        .vibe-splash-rib,
        .vibe-splash-word {
          opacity: 0;
        }
        .vibe-splash-dot {
          opacity: 0;
          transform-origin: 50% 100%;
        }
        .p1 .vibe-splash-dot {
          animation: vibe-drop 0.75s 0.35s cubic-bezier(0.5, 0, 0.9, 0.5) both;
        }
        @keyframes vibe-drop {
          0% {
            opacity: 1;
            transform: translateY(-900px);
          }
          60% {
            opacity: 1;
            transform: none;
          }
          70% {
            opacity: 1;
            transform: scale(1.35, 0.65);
          }
          85% {
            opacity: 1;
            transform: translateY(-34px) scale(0.96, 1.04);
          }
          100% {
            opacity: 1;
            transform: none;
          }
        }
        .p2 .vibe-splash-dot,
        .p3 .vibe-splash-dot,
        .p4 .vibe-splash-dot {
          opacity: 1;
          animation: none;
        }
        .vibe-splash-leaf {
          transform-origin: 0 0;
        }
        .vibe-splash-rib {
          transform-origin: 30% 100%;
        }
        .p2 .vibe-splash-leaf,
        .p3 .vibe-splash-leaf,
        .p4 .vibe-splash-leaf {
          animation: vibe-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .p2 .vibe-splash-rib,
        .p3 .vibe-splash-rib,
        .p4 .vibe-splash-rib {
          animation: vibe-pop 0.5s 0.08s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes vibe-pop {
          from {
            opacity: 0;
            transform: scale(0.6) translateY(14px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .vibe-splash-word {
          font-family: var(--font-outfit), 'Outfit', sans-serif;
          font-weight: 700;
          font-size: calc(var(--u) * 0.8);
          letter-spacing: -0.02em;
          line-height: 1;
          margin-top: calc(var(--u) * 0.1);
          color: var(--ink);
          clip-path: inset(-10% 100% -10% -5%);
        }
        .p2 .vibe-splash-word,
        .p3 .vibe-splash-word,
        .p4 .vibe-splash-word {
          opacity: 1;
          animation: vibe-wipe 0.6s 0.2s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        @keyframes vibe-wipe {
          from {
            clip-path: inset(-10% 100% -10% -5%);
            transform: translateX(-18px);
          }
          to {
            clip-path: inset(-10% -5% -10% -5%);
            transform: none;
          }
        }
        .p4 .vibe-splash-word {
          color: #0f1a44;
          transition: color 0.7s 0.2s;
        }

        /* Skip Button */
        .vibe-splash-skip {
          position: absolute;
          right: 20px;
          bottom: 20px;
          z-index: 10;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          padding: 6px 14px;
          border-radius: 999px;
          backdrop-filter: blur(8px);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .vibe-splash-skip:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.3);
        }

        @media (prefers-reduced-motion: reduce) {
          .vibe-splash-container,
          .vibe-splash-container * {
            animation-duration: 0.01s !important;
            animation-delay: 0s !important;
            transition-duration: 0.01s !important;
          }
        }
      ` }} />
    </>
  );
}

export default Splash;
