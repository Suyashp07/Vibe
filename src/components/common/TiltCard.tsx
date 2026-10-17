'use client';

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  scaleHover?: number;
  glare?: boolean;
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 5,
  scaleHover = 1.012,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ width: number; height: number; left: number; top: number } | null>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouch(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
    }
  }, []);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);

  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 25, mass: 0.25 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 25, mass: 0.25 });
  const springScale = useSpring(scale, { stiffness: 300, damping: 25, mass: 0.25 });

  // On touch screens: render pure, crisp, uncompromised native cards (no 3D blur/GPU layer thrashing)
  if (isTouch) {
    return <div className={`w-full ${className}`}>{children}</div>;
  }

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      rectRef.current = {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
      };
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = '1';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rectRef.current) return;
    const { width, height, left, top } = rectRef.current;

    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    rotateX.set(-yPct * maxTilt * 2);
    rotateY.set(xPct * maxTilt * 2);
    scale.set(scaleHover);

    if (glare && glareRef.current) {
      const gX = Math.round((mouseX / width) * 100);
      const gY = Math.round((mouseY / height) * 100);
      glareRef.current.style.background = `radial-gradient(circle 300px at ${gX}% ${gY}%, rgba(255, 255, 255, 0.12), transparent 70%)`;
    }
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className={`relative inline-block w-full ${className}`}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          scale: springScale,
          transformStyle: 'preserve-3d',
        }}
        className="w-full relative rounded-2xl will-change-transform"
      >
        {children}

        {/* Glare without React re-renders */}
        {glare && (
          <div
            ref={glareRef}
            className="pointer-events-none absolute inset-0 rounded-2xl z-30 transition-opacity duration-200 opacity-0"
          />
        )}
      </motion.div>
    </div>
  );
}
