'use client';

import React, { useRef, useState, ReactNode } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number; // max tilt degrees (e.g. 7)
  scaleHover?: number; // scale on hover (e.g. 1.015)
  glare?: boolean;
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 6.5,
  scaleHover = 1.012,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scale = useMotionValue(1);

  const springRotateX = useSpring(rotateX, { stiffness: 260, damping: 22, mass: 0.3 });
  const springRotateY = useSpring(rotateY, { stiffness: 260, damping: 22, mass: 0.3 });
  const springScale = useSpring(scale, { stiffness: 260, damping: 22, mass: 0.3 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    // Invert Y for standard perspective tilt
    rotateX.set(-yPct * maxTilt * 2);
    rotateY.set(xPct * maxTilt * 2);
    scale.set(scaleHover);

    if (glare) {
      setGlarePos({
        x: Math.round((mouseX / width) * 100),
        y: Math.round((mouseY / height) * 100),
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
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

        {/* Dynamic glare highlight reflection on card glass */}
        {glare && isHovered && (
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl z-30 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 320px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.12), transparent 70%)`,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
