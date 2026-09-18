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
      className={`inline-flex flex-col group select-none py-0.5 ${className}`}
      title="Vibe by Swaniki"
    >
      {/* Elongated 'Vibe' with orange dot on the 'i' */}
      <div className="font-brand font-black text-[26px] sm:text-[30px] text-[#0F172A] tracking-[0.08em] leading-none flex items-baseline select-none">
        <span>V</span>
        <span className="relative inline-flex flex-col items-center justify-end mx-[0.5px]">
          {/* Orange tittle / point on the 'i' */}
          <span className="w-[4.5px] h-[4.5px] sm:w-[5px] sm:h-[5px] rounded-full bg-[#E8621A] mb-[2.5px] sm:mb-[3px] shrink-0 shadow-2xs group-hover:scale-125 group-hover:bg-[#FF6D1F] transition-all duration-200" />
          {/* Dotless i stem in black */}
          <span className="leading-none inline-block">ı</span>
        </span>
        <span>be</span>
      </div>

      {/* Deduced (reduced) 'BY SWANIKI' in sleek black with buzz-friendly tracking */}
      <span className="font-subbrand font-black text-[6.5px] sm:text-[7.5px] tracking-[0.34em] text-[#0F172A] uppercase leading-none pt-1 group-hover:text-black transition-colors">
        BY SWANIKI
      </span>
    </Link>
  );
}

