'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  href?: string;
}

export default function BrandLogo({ className = '', href = '/' }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex flex-col group select-none py-0.5 whitespace-nowrap leading-none ${className}`}
      title="Vibe by Swaniki"
    >
      {/* Elongated 'Vibe' with vibrant orange dot on the 'i' */}
      <div className="font-brand font-black text-[26px] sm:text-[30px] text-[#0F172A] tracking-[0.07em] leading-none flex items-baseline whitespace-nowrap select-none">
        <span>V</span>
        <span className="relative inline-flex items-baseline justify-center mx-[0.5px]">
          {/* Base letter i with top black dot clipped cleanly so only the authentic Outfit stem renders */}
          <span className="text-[#0F172A] [clip-path:inset(28%_0_0_0)] select-none">i</span>
          {/* Vibrant brand orange point/tittle precisely positioned over the i */}
          <span
            className="absolute top-[2px] sm:top-[2.5px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] sm:w-[5.5px] sm:h-[5.5px] rounded-full bg-[#E8621A] pointer-events-none shadow-2xs group-hover:scale-125 group-hover:bg-[#FF6D1F] transition-all duration-200"
            aria-hidden="true"
          />
        </span>
        <span>be</span>
      </div>

      {/* Deduced (reduced) 'BY SWANIKI' in sleek black with buzz-friendly tracking */}
      <span className="font-subbrand font-extrabold text-[7px] sm:text-[7.5px] tracking-[0.34em] text-[#0F172A] uppercase leading-none pt-1.5 group-hover:text-black transition-colors select-none">
        BY SWANIKI
      </span>
    </Link>
  );
}

