'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import Magnetic from './MagneticButton';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, isMounted } = useTheme();

  const isDark = !isMounted || theme === 'dark';

  return (
    <Magnetic pullFactor={0.3}>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative overflow-hidden group select-none ${
          isDark
            ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white hover:border-white/20 hover:shadow-[0_0_16px_rgba(255,255,255,0.12)]'
            : 'bg-black/5 hover:bg-black/10 border border-black/10 text-neutral-800 hover:text-black hover:border-black/20 hover:shadow-[0_0_16px_rgba(0,0,0,0.08)]'
        } ${className}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center"
            >
              <Moon className="w-4 h-4 stroke-[2.2] text-amber-200 group-hover:text-amber-100 transition-colors group-hover:rotate-12 duration-300" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-center"
            >
              <Sun className="w-4 h-4 stroke-[2.2] text-[#FF5500] group-hover:text-[#E04B00] transition-colors group-hover:rotate-45 duration-300" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient subtle glow ring */}
        <span
          className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${
            isDark
              ? 'bg-gradient-to-tr from-amber-400/10 via-transparent to-white/10'
              : 'bg-gradient-to-tr from-[#FF5500]/10 via-transparent to-amber-500/10'
          }`}
        />
      </button>
    </Magnetic>
  );
}
