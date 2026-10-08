'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface BrandLogoProps {
  className?: string;
  href?: string;
}

export default function BrandLogo({ className = '', href = '/' }: BrandLogoProps) {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`relative inline-flex flex-col group select-none py-0.5 whitespace-nowrap leading-none cursor-pointer ${className}`}
      title="Vibe by Swaniki"
    >
      {/* Animated Ripple Waves upon click */}
      <AnimatePresence>
        {clickCount > 0 && (
          <motion.div
            key={clickCount}
            initial={{ scale: 0.8, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF5500]/30 to-amber-500/20 blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* 'vibe.' with bold modern lowercase typography and vibrant orange dot */}
      <motion.div
        key={`logo-${clickCount}`}
        animate={
          clickCount > 0
            ? {
                scale: [1, 1.15, 0.95, 1.05, 1],
                y: [0, -3, 1, -1, 0],
                rotate: [0, -1.5, 1.5, 0],
              }
            : {}
        }
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex items-baseline font-sans font-black text-[25px] sm:text-[28px] text-white tracking-tight leading-none select-none group-hover:scale-[1.02] transition-transform duration-200"
      >
        <span className="text-white group-hover:text-white transition-colors">vibe</span>

        {/* Vibrant Brand Orange Dot with animated pulse glow */}
        <span
          className="relative ml-[2px] inline-block w-[6px] h-[6px] sm:w-[6.5px] sm:h-[6.5px] rounded-full bg-[#FF5500] shadow-[0_0_12px_rgba(255,85,0,0.85)] group-hover:scale-125 transition-transform duration-200"
          aria-hidden="true"
        >
          {clickCount > 0 && (
            <motion.span
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute -inset-1 rounded-full bg-[#FF5500]"
            />
          )}
        </span>
      </motion.div>

      {/* 'BY SWANIKI' in sleek minimalist uppercase tracking */}
      <motion.span
        key={`sub-${clickCount}`}
        animate={
          clickCount > 0
            ? {
                color: ['#FF5500', '#FFFFFF', 'rgba(255, 255, 255, 0.6)'],
                letterSpacing: ['0.38em', '0.3em'],
              }
            : {}
        }
        transition={{ duration: 0.5 }}
        className="font-mono text-[7px] sm:text-[7.5px] font-bold tracking-[0.3em] text-white/50 uppercase leading-none pt-1 group-hover:text-white/80 transition-all select-none"
      >
        BY SWANIKI
      </motion.span>
    </Link>
  );
}
