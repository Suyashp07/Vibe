'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface BrandLogoProps {
  className?: string;
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  forceDark?: boolean;
}

export default function BrandLogo({
  className = '',
  href = '/',
  size = 'md',
  showSubtitle = true,
  forceDark = false,
}: BrandLogoProps) {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    setClickCount((prev) => prev + 1);
  };

  const imgHeightClass = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-11',
    xl: 'h-12 sm:h-14',
  }[size];

  return (
    <Link
      href={href}
      onClick={handleClick}
      data-vibe-logo="true"
      className={`relative inline-flex flex-col group select-none py-0.5 cursor-pointer shrink-0 ${className}`}
      title="Vibe"
    >
      {/* Animated Ripple Waves upon click */}
      <AnimatePresence>
        {clickCount > 0 && (
          <motion.div
            key={clickCount}
            initial={{ scale: 0.8, opacity: 0.9 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/25 to-cyan-500/25 blur-md pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div
        key={`logo-${clickCount}`}
        animate={
          clickCount > 0
            ? {
                scale: [1, 1.08, 0.96, 1.03, 1],
                y: [0, -2, 1, 0],
              }
            : {}
        }
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex items-center group-hover:scale-[1.03] transition-transform duration-200"
      >
        <Image
          src="/logo.png"
          alt="Vibe"
          width={180}
          height={66}
          priority
          className={`${imgHeightClass} w-auto object-contain ${forceDark ? 'hidden' : 'dark:hidden'}`}
        />
        <Image
          src="/logo-dark.png"
          alt="Vibe"
          width={180}
          height={66}
          priority
          className={`${imgHeightClass} w-auto object-contain ${forceDark ? 'block' : 'hidden dark:block'}`}
        />
      </motion.div>

      {showSubtitle && (
        <span className={`font-mono text-[6.5px] sm:text-[7px] font-bold tracking-[0.25em] ${
          forceDark
            ? 'text-white/60 group-hover:text-white'
            : 'text-neutral-500 dark:text-white/50 group-hover:text-neutral-900 dark:group-hover:text-white'
        } uppercase leading-none pt-1 select-none transition-colors`}>
          BY SWANIKI
        </span>
      )}
    </Link>
  );
}
