'use client';

import React, { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [trailingPos, setTrailingPos] = useState({ x: -100, y: -100 });
  const [cursorType, setCursorType] = useState<'default' | 'pointer' | 'view' | 'text'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  useEffect(() => {
    // Only enable on non-touch devices
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Detect cursor target type
      const target = e.target as HTMLElement | null;
      if (target) {
        if (target.closest('input') || target.closest('textarea')) {
          setCursorType('text');
        } else if (
          target.closest('.group') ||
          target.closest('[data-cursor="view"]') ||
          target.closest('.spotlight-banner')
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

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth trailing physics loop
    const followLoop = () => {
      setTrailingPos((prev) => ({
        x: prev.x + (position.x - prev.x) * 0.2,
        y: prev.y + (position.y - prev.y) * 0.2,
      }));
      animationFrameId = requestAnimationFrame(followLoop);
    };
    animationFrameId = requestAnimationFrame(followLoop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [position.x, position.y, isVisible]);

  if (!isVisible) return null;

  const isInteractive = cursorType !== 'default';

  return (
    <>
      {/* Precision Core Dot */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${
            isMouseDown ? 0.6 : cursorType === 'view' ? 0.8 : cursorType === 'pointer' ? 1.4 : 1
          })`,
          width: cursorType === 'text' ? '3px' : '7px',
          height: cursorType === 'text' ? '18px' : '7px',
          borderRadius: cursorType === 'text' ? '2px' : '9999px',
          backgroundColor: '#FF5500',
          boxShadow: '0 0 12px rgba(255, 85, 0, 0.95)',
        }}
      />

      {/* Ambient Magnetic Halo Ring */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-250 ease-out"
        style={{
          transform: `translate3d(${trailingPos.x}px, ${trailingPos.y}px, 0) scale(${
            isMouseDown ? 0.85 : 1
          })`,
          width:
            cursorType === 'view'
              ? '54px'
              : cursorType === 'pointer'
              ? '44px'
              : cursorType === 'text'
              ? '24px'
              : '28px',
          height:
            cursorType === 'view'
              ? '54px'
              : cursorType === 'pointer'
              ? '44px'
              : cursorType === 'text'
              ? '24px'
              : '28px',
          border: isInteractive
            ? '1.5px solid rgba(255, 85, 0, 0.75)'
            : '1px solid rgba(255, 85, 0, 0.3)',
          backgroundColor:
            cursorType === 'view'
              ? 'rgba(255, 85, 0, 0.12)'
              : cursorType === 'pointer'
              ? 'rgba(255, 85, 0, 0.08)'
              : 'rgba(255, 85, 0, 0.02)',
          boxShadow: isInteractive ? '0 0 25px rgba(255, 85, 0, 0.35)' : 'none',
        }}
      />
    </>
  );
}
