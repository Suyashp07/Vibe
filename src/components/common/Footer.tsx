'use client';

import React from 'react';
import Link from 'next/link';
import {
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';

interface SocialLink {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  customIcon?: React.ReactNode;
  ariaLabel: string;
}

// Official Swaniki Social Media Handles (Cleaned up, removing unnecessary legacy tags)
const SOCIAL_MEDIA_LINKS: SocialLink[] = [
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
  if (minimal) {
    return (
      <footer className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#0A0A0C] py-8 text-neutral-500 dark:text-white/50 font-sans transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 dark:text-white tracking-tight text-base font-outfit">
              vibe<span className="text-[#FF5500]">.</span>
            </span>
            <a
              href="https://swaniki.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 dark:text-white/40 hover:text-neutral-900 dark:hover:text-white font-semibold transition-colors"
            >
              BY SWANIKI
            </a>
          </div>

          <div className="text-center sm:text-left text-[11px] text-neutral-500 dark:text-white/40 max-w-xl">
            © 2026 Swaniki LLP — Swaniki, Swaniki Technologies and Swaniki Labs are operating brand names of Swaniki LLP. All rights reserved.
          </div>

          <div className="flex items-center gap-5 text-xs text-neutral-600 dark:text-white/60">
            <Link href="/disclaimer" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Disclaimer
            </Link>
            <Link href="/terms" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/privacy" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#0A0A0C] mt-16 sm:mt-24 pt-12 sm:pt-16 pb-10 text-neutral-600 dark:text-white/60 font-sans transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-12">
          {/* Column 1: Brand Wordmark + Platform Description + Social Handles */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <Link href="/" className="inline-block group">
                <span className="font-black text-2xl tracking-tight text-neutral-900 dark:text-white block">
                  vibe<span className="text-[#FF5500]">.</span>
                </span>
              </Link>
              <a
                href="https://swaniki.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 dark:text-white/40 hover:text-neutral-900 dark:hover:text-white font-semibold transition-colors block"
              >
                BY SWANIKI
              </a>
            </div>

            <p className="text-xs text-neutral-500 dark:text-white/50 leading-relaxed pr-2">
              India&apos;s experiential event discovery and instant meetup platform. Connecting passionate communities, spontaneous flash vibes, sports, and cultural gatherings across cities.
            </p>

            {/* Social Media Circular Buttons */}
            <div className="flex items-center gap-2 pt-1">
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
                    className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/30 hover:bg-black/10 dark:hover:bg-white/[0.08] flex items-center justify-center transition-all duration-200"
                  >
                    {Icon ? <Icon className="w-3.5 h-3.5" /> : item.customIcon}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Help & Support */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-900 dark:text-white">
              Help &amp; Support
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-600 dark:text-white/60">
              <li>
                <a
                  href="mailto:hello@swaniki.com"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="https://swaniki.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Corporate Announcements
                </a>
              </li>
              <li>
                <a
                  href="mailto:grievance@swaniki.com"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Grievance Redressal
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-900 dark:text-white">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-600 dark:text-white/60">
              <li>
                <Link href="/create" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  List an event
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Host dashboard
                </Link>
              </li>
              <li>
                <Link href="/vibes" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Vibe Instant
                </Link>
              </li>
              <li>
                <Link href="/passes" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  My Booked Passes
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-900 dark:text-white">
              Platform &amp; Legal
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-600 dark:text-white/60">
              <li>
                <a
                  href="https://swaniki.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>About Swaniki</span>
                  <span className="text-[10px] text-neutral-400 dark:text-white/40">↗</span>
                </a>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Platform Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  DPDP Act Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Legal Agreement & Direct Policy Links */}
        <div className="pt-8 border-t border-black/10 dark:border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1.5 max-w-2xl text-neutral-500 dark:text-white/40">
            <p className="text-xs text-neutral-700 dark:text-white/70 font-medium">
              © 2026 Swaniki LLP — Swaniki, Swaniki Technologies and Swaniki Labs are operating brand names of Swaniki LLP. All rights reserved.
            </p>
            <p className="text-[11px] leading-relaxed">
              Vibe by Swaniki is an India-first event discovery and community platform connecting hosts and attendees for live gatherings, sports, music, and social experiences.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-neutral-600 dark:text-white/60 shrink-0 self-start md:self-center">
            <Link
              href="/disclaimer"
              className="hover:text-neutral-900 dark:hover:text-white transition-colors font-medium underline-offset-4 hover:underline"
            >
              Disclaimer
            </Link>
            <Link
              href="/terms"
              className="hover:text-neutral-900 dark:hover:text-white transition-colors font-medium underline-offset-4 hover:underline"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href="/privacy"
              className="hover:text-neutral-900 dark:hover:text-white transition-colors font-medium underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
