'use client';

import React from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/common/BrandLogo';
import {
  Instagram,
  Linkedin,
  Youtube,
  ChevronUp,
  Globe,
} from 'lucide-react';

interface SocialLink {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  customIcon?: React.ReactNode;
  ariaLabel: string;
}

// Official Swaniki Social Media Handles
const SOCIAL_MEDIA_LINKS: SocialLink[] = [
  {
    name: 'Swaniki Official',
    href: 'https://swaniki.com',
    icon: Globe,
    ariaLabel: 'Visit Swaniki Official Website',
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/swaniki',
    icon: Linkedin,
    ariaLabel: 'Connect with Swaniki on LinkedIn',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/swaniki/',
    icon: Instagram,
    ariaLabel: 'Follow Swaniki on Instagram',
  },
  {
    name: 'X (Twitter)',
    href: 'https://x.com/swaniki',
    customIcon: (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    ariaLabel: 'Follow Swaniki on X',
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@swaniki',
    icon: Youtube,
    ariaLabel: 'Subscribe to Swaniki on YouTube',
  },
];

export default function Footer({ minimal = false }: { minimal?: boolean }) {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (minimal) {
    return (
      <footer className="border-t border-[#0A1A40] bg-[#00081C] py-8 text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showSubtitle={false} forceDark={true} />
          </div>

          <div className="text-center sm:text-left text-[11px] text-slate-400 max-w-xl">
            © 2026 Swaniki LLP — Swaniki, Swaniki Technologies and Swaniki Labs are operating brand names of Swaniki LLP. All rights reserved.
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link href="/disclaimer" className="hover:text-white transition-colors">
              Disclaimer
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-[#0A1E48] bg-[#000B26] mt-8 sm:mt-12 text-slate-300 font-sans relative overflow-hidden">
      {/* Subtle ambient deep-blue background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0055FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0088FF]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main 4-Column Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-10">
          {/* Column 1: Brand Wordmark + Platform Description + Mission (Takes 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <BrandLogo size="lg" showSubtitle={false} forceDark={true} />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              India&apos;s experiential event discovery and instant meetup platform. Connecting passionate communities, spontaneous flash vibes, sports, live concerts, and cultural gatherings across cities.
            </p>

            {/* Social Media Circular Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {SOCIAL_MEDIA_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.ariaLabel}
                    title={item.name}
                    className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 text-slate-300 hover:text-white hover:border-[#08B9F5]/50 hover:bg-[#0055FF]/20 flex items-center justify-center transition-all duration-200 cursor-pointer"
                  >
                    {Icon ? <Icon className="w-3.5 h-3.5" /> : item.customIcon}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Discover Events */}
          <div className="space-y-3.5">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">
              Discover Events
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/discover" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Events for You
                </Link>
              </li>
              <li>
                <Link href="/vibes" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Vibe Instant
                </Link>
              </li>
              <li>
                <Link href="/bot" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  WhatsApp &amp; Telegram Bot
                </Link>
              </li>
              <li>
                <Link href="/passes" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Get Event Passes
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Organizers */}
          <div className="space-y-3.5">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">
              For Organizers
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/create" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  List Your Event
                </Link>
              </li>
              <li>
                <Link href="/create/ai" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  1-Click AI Creation
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Host Dashboard
                </Link>
              </li>
              <li>
                <Link href="/organizer/check-in" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  QR Pass Scanner
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform & Legal */}
          <div className="space-y-3.5">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">
              Platform &amp; Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="https://swaniki.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:translate-x-0.5 inline-flex items-center gap-1 transition-all"
                >
                  <span>About Swaniki</span>
                  <span className="text-[10px] text-[#08B9F5]">↗</span>
                </a>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Platform Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white hover:translate-x-0.5 inline-block transition-all">
                  DPDP Act Compliance
                </Link>
              </li>
            </ul>

            {/* Standout Join / Host Badge as shown in reference */}
            <div className="pt-2">
              <Link
                href="/create"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#84CC16] hover:bg-[#65A30D] text-[#000B26] font-extrabold text-[11px] uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95"
              >
                <span>HOST AN EVENT</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Middle Sub-footer Links (Matching Reference UI: About, Support, Terms, Privacy, Contact) */}
        <div className="py-6 border-t border-white/[0.08] flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <a
            href="https://swaniki.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            About
          </a>
          <span className="text-white/20 select-none">•</span>
          <a
            href="mailto:careers@swaniki.com"
            className="hover:text-white transition-colors"
          >
            Careers
          </a>
          <span className="text-white/20 select-none">•</span>
          <a
            href="mailto:hello@swaniki.com"
            className="hover:text-white transition-colors"
          >
            Support
          </a>
          <span className="text-white/20 select-none">•</span>
          <a
            href="https://swaniki.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Media Coverage
          </a>
          <span className="text-white/20 select-none">•</span>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <span className="text-white/20 select-none">•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span className="text-white/20 select-none">•</span>
          <a
            href="mailto:hello@swaniki.com"
            className="hover:text-white transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>

      {/* Deepest Navy Bottom Bar with Copyright & Back to Top */}
      <div className="bg-[#00061A] border-t border-white/[0.06] py-5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-400 text-center sm:text-left text-[11px]">
            © Copyright 2026 Swaniki LLP. All Rights Reserved.
          </p>

          <div className="flex items-center gap-3">
            {/* Back to Top Smooth Scroll Button */}
            <button
              type="button"
              onClick={scrollToTop}
              title="Back to top"
              aria-label="Scroll back to top"
              className="w-8 h-8 rounded-full bg-[#0055FF]/25 hover:bg-[#0055FF]/40 border border-[#08B9F5]/40 text-[#08B9F5] hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <ChevronUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
