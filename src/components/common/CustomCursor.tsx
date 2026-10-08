'use client';

import React, { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -200, y: -200 });
  const [cursorType, setCursorType] = useState<'default' | 'pointer' | 'view' | 'text'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Ref for trailing physics with smooth lerp easing
  const trailingRef = useRef({ x: -200, y: -200 });
  const targetPosRef = useRef({ x: -200, y: -200 });
  const ringElementRef = useRef<HTMLDivElement>(null);
  const dotElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable on devices with a mouse/fine pointer (disable on touch/mobile)
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isReducedMotion = reducedMotionQuery.matches;

    const onReducedMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
    };
    reducedMotionQuery.addEventListener('change', onReducedMotionChange);

    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      targetPosRef.current = { x: e.clientX, y: e.clientY };
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Inspect target to determine cursor state
      const target = e.target as HTMLElement | null;
      if (target) {
        if (target.closest('input') || target.closest('textarea')) {
          setCursorType('text');
        } else if (
          target.closest('[data-cursor="view"]') ||
          target.closest('.cursor-view') ||
          target.closest('.spotlight-card')
        ) {
          setCursorType('view');
        } else if (
          target.closest('button') ||
          target.closest('a') ||
          target.closest('select') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer') ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'A'
        ) {
          setCursorType('pointer');
        } else {
          setCursorType('default');
        }
      }
    };

    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Easing loop: turns off lag if reduced motion is enabled, otherwise smooth 0.16 lerp
    const animateTrailing = () => {
      const factor = isReducedMotion ? 1 : 0.16;
      trailingRef.current.x += (targetPosRef.current.x - trailingRef.current.x) * factor;
      trailingRef.current.y += (targetPosRef.current.y - trailingRef.current.y) * factor;

      if (ringElementRef.current) {
        ringElementRef.current.style.transform = `translate3d(${trailingRef.current.x}px, ${trailingRef.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(animateTrailing);
    };

    animationFrameId = requestAnimationFrame(animateTrailing);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      reducedMotionQuery.removeEventListener('change', onReducedMotionChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none">
      {/* 1. Precision Center Dot (Exact mouse tracking, blend-mode difference) */}
      <div
        ref={dotElementRef}
        className="fixed top-0 left-0 rounded-full will-change-transform mix-blend-difference bg-white transition-opacity duration-150"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${
            cursorType === 'pointer' || cursorType === 'view' ? 0 : isMouseDown ? 0.75 : 1
          })`,
          width: cursorType === 'text' ? '2px' : '5px',
          height: cursorType === 'text' ? '18px' : '5px',
          borderRadius: cursorType === 'text' ? '1px' : '9999px',
          opacity: cursorType === 'pointer' || cursorType === 'view' ? 0 : 1,
        }}
      />

      {/* 2. Trailing Ring / Filled Circle / View Label (Smooth lag, blend-mode difference) */}
      <div
        ref={ringElementRef}
        className="fixed top-0 left-0 rounded-full will-change-transform mix-blend-difference flex items-center justify-center transition-[width,height,background-color,border-color,transform] duration-200 ease-out"
        style={{
          width:
            cursorType === 'view'
              ? '76px'
              : cursorType === 'pointer'
              ? '42px'
              : cursorType === 'text'
              ? '4px'
              : '26px',
          height:
            cursorType === 'view'
              ? '76px'
              : cursorType === 'pointer'
              ? '42px'
              : cursorType === 'text'
              ? '22px'
              : '26px',
          border:
            cursorType === 'pointer' || cursorType === 'view'
              ? 'none'
              : cursorType === 'text'
              ? 'none'
              : '1.5px solid #FFFFFF',
          backgroundColor:
            cursorType === 'pointer' || cursorType === 'view'
              ? '#FFFFFF'
              : 'transparent',
          transform: `translate3d(${trailingRef.current.x}px, ${trailingRef.current.y}px, 0) translate(-50%, -50%) scale(${
            isMouseDown ? 0.85 : 1
          })`,
        }}
      >
        {/* Crisp "View" label over cards */}
        {cursorType === 'view' && (
          <span className="text-[11px] font-black uppercase tracking-widest text-black select-none pointer-events-none">
            View
          </span>
        )}
      </div>
    </div>
  );
}
