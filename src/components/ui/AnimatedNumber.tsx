'use client';

import React, { useState, useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedNumber({
  value,
  duration = 800,
  className = '',
  prefix = '',
  suffix = ''
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isPopping, setIsPopping] = useState(false);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out exponential
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(startValue + (value - startValue) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    setIsPopping(true);
    const popTimer = setTimeout(() => setIsPopping(false), 200);

    const animId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(animId);
      clearTimeout(popTimer);
    };
  }, [value, duration]);

  return (
    <span className={`inline-block transition-transform duration-150 ${isPopping ? 'scale-[1.08]' : 'scale-100'} ${className}`}>
      {prefix}{displayValue.toLocaleString('en-IN')}{suffix}
    </span>
  );
}
