'use client';

import React, { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -200, y: -200 });
  const [cursorType, setCursorType] = useState<'default' | 'pointer' | 'view' | 'text'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Ref for trailing physics with lerp easing
  const trailingRef = useRef({ x: -200, y: -200 });
  const targetPosRef = useRef({ x: -200, y: -200 });
  const ringElementRef = useRef<HTMLDivElement>(null);
  const dotElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable on devices with a mouse/fine pointer (disable on touch/mobile)
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

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
          target.closest('.group') ||
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

    // High performance Lerp (Linear Interpolation) loop: trailing = trailing + (target - trailing) * factor
    const LERP_FACTOR = 0.18;
    const animateTrailing = () => {
      trailingRef.current.x += (targetPosRef.current.x - trailingRef.current.x) * LERP_FACTOR;
      trailingRef.current.y += (targetPosRef.current.y - trailingRef.current.y) * LERP_FACTOR;

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
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const isInteractive = cursorType !== 'default';

  return (
    <>
      {/* 1. Precision Center Dot (Instant Response) */}
      <div
        ref={dotElementRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full will-change-transform transition-all duration-75 ease-out"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${
            isMouseDown ? 0.6 : cursorType === 'view' ? 0 : cursorType === 'pointer' ? 1.4 : 1
          })`,
          width: cursorType === 'text' ? '3px' : '6px',
          height: cursorType === 'text' ? '18px' : '6px',
          borderRadius: cursorType === 'text' ? '2px' : '9999px',
          backgroundColor: '#FF5500',
          boxShadow: '0 0 10px rgba(255, 85, 0, 0.9)',
        }}
      />

      {/* 2. Trailing Ring with Lerp Lag & Mix-Blend-Mode Difference */}
      <div
        ref={ringElementRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full will-change-transform flex items-center justify-center transition-[width,height,background-color,border-color,box-shadow,transform] duration-200 ease-out"
        style={{
          width:
            cursorType === 'view'
              ? '64px'
              : cursorType === 'pointer'
              ? '44px'
              : cursorType === 'text'
              ? '24px'
              : '26px',
          height:
            cursorType === 'view'
              ? '64px'
              : cursorType === 'pointer'
              ? '44px'
              : cursorType === 'text'
              ? '24px'
              : '26px',
          border:
            cursorType === 'view'
              ? '1px solid rgba(255, 255, 255, 0.4)'
              : isInteractive
              ? '1.5px solid rgba(255, 85, 0, 0.85)'
              : '1px solid rgba(255, 255, 255, 0.35)',
          backgroundColor:
            cursorType === 'view'
              ? 'rgba(0, 0, 0, 0.6)'
              : cursorType === 'pointer'
              ? 'rgba(255, 85, 0, 0.1)'
              : 'rgba(255, 255, 255, 0.03)',
          backdropFilter: cursorType === 'view' ? 'blur(8px)' : 'none',
          boxShadow:
            cursorType === 'pointer'
              ? '0 0 20px rgba(255, 85, 0, 0.35)'
              : cursorType === 'view'
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : 'none',
        }}
      >
        {/* Dynamic "VIEW ↗" Badge on Card/Flyer Hover */}
        {cursorType === 'view' && (
          <span className="text-[10px] font-black tracking-wider text-white select-none animate-in fade-in zoom-in-90 duration-150">
            VIEW ↗
          </span>
        )}
      </div>
    </>
  );
}
