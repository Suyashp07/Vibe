'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import BrandLogo from '@/components/common/BrandLogo';
import {
  Sparkles,
  Heart,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Send,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface SocialLink {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  customIcon?: React.ReactNode;
  brandColor: string;
  ariaLabel: string;
}

// Official Swaniki Social Media Links
const SOCIAL_MEDIA_LINKS: SocialLink[] = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/swanikitech/',
    icon: Instagram,
    brandColor: 'hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:text-white hover:border-transparent',
    ariaLabel: 'Follow Swaniki on Instagram',
  },
  {
    name: 'X (Twitter)',
    href: 'https://x.com/swanikitech',
    customIcon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    brandColor: 'hover:bg-black hover:text-white hover:border-black',
    ariaLabel: 'Follow Swaniki on X',
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/swanikitech',
    icon: Linkedin,
    brandColor: 'hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]',
    ariaLabel: 'Connect with Swaniki on LinkedIn',
  },
  {
    name: 'Threads',
    href: 'https://www.threads.com/@swanikitech',
    customIcon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.004 0C5.373 0 0 5.373 0 12.004c0 6.63 5.373 12.004 12.004 12.004 4.672 0 8.73-2.67 10.73-6.554l-2.383-1.229c-1.574 3.056-4.767 5.155-8.347 5.155-5.183 0-9.376-4.193-9.376-9.376s4.193-9.376 9.376-9.376c5.183 0 9.376 4.193 9.376 9.376 0 .61-.06 1.205-.17 1.78l2.585.518c.14-.744.213-1.512.213-2.298C24.008 5.373 18.635 0 12.004 0z" />
        <path d="M12.004 7.426a4.578 4.578 0 100 9.156 4.578 4.578 0 000-9.156zm0 6.528a1.95 1.95 0 110-3.9 1.95 1.95 0 010 3.9z" />
      </svg>
    ),
    brandColor: 'hover:bg-black hover:text-white hover:border-black',
    ariaLabel: 'Follow Swaniki on Threads',
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@swanikitech',
    icon: Youtube,
    brandColor: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]',
    ariaLabel: 'Subscribe to Swaniki on YouTube',
  },
];

export default function Footer({ minimal = false }: { minimal?: boolean }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
    }, 2500);
  };

  if (minimal) {
    return (
      <footer className="border-t border-white/10 bg-[#050505] mt-12 py-8 text-white/50 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-sm">
                vibe<span className="text-[#FF5500]">.</span>
              </span>
              <a
                href="https://swaniki.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-widest uppercase text-white/40 hover:text-white font-semibold transition-colors"
                title="Swaniki Official Website"
              >
                BY SWANIKI
              </a>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-xs flex-wrap justify-center">
              <Link href="/disclaimer" className="hover:text-white transition-colors">
                Disclaimer
              </Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy (DPDP)
              </Link>
            </div>

            <div className="flex items-center gap-1 text-white/50 text-xs">
              <span>© {new Date().getFullYear()} Vibe by</span>
              <a
                href="https://swaniki.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#FF5500] font-semibold transition-colors underline underline-offset-2"
              >
                Swaniki
              </a>
            </div>
          </div>

          <p className="text-[11px] text-white/40 text-center sm:text-left leading-relaxed border-t border-white/5 pt-3">
            <strong>Disclaimer:</strong> Vibe by Swaniki is an event discovery and technology intermediary. Third-party partner events and external tickets are fulfilled directly by respective partners.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-white/10 bg-[#050505] mt-12 sm:mt-20 pt-10 sm:pt-16 pb-12 text-white/60 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Column 1: Brand Info & Social Media Links (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo />

            <p className="text-xs sm:text-sm text-white/60 max-w-sm leading-relaxed">
              India's premier whitelabel event network. Curating cultural gatherings, tech summits, live concerts, and social mixers with AI-streamed verification and pass distribution.
            </p>

            {/* Social Media Section */}
            <div className="pt-2 space-y-2.5">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Connect With Us</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
              </div>

              {/* Social Media Icon Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {SOCIAL_MEDIA_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target={item.href !== '#' ? '_blank' : undefined}
                      rel={item.href !== '#' ? 'noopener noreferrer' : undefined}
                      aria-label={item.ariaLabel}
                      title={item.name}
                      className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95 hover:bg-[#FF5500] hover:text-white hover:border-[#FF5500]"
                    >
                      {Icon ? <Icon className="w-4 h-4" /> : item.customIcon}
                    </a>
                  );
                })}
              </div>

              <p className="text-[11px] text-white/40">
                Official handles for Swaniki product launches, open source & updates.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-white/40 pt-1">
              <span>Created with</span>
              <Heart className="w-3.5 h-3.5 text-[#FF5500] fill-[#FF5500] animate-pulse" />
              <span>by</span>
              <a
                href="https://swaniki.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#FF5500] font-bold underline underline-offset-2 transition-colors cursor-pointer"
                title="Swaniki Technologies"
              >
                Swaniki
              </a>
              <span>in Mumbai & Bengaluru</span>
            </div>
          </div>

          {/* Column 2: Discover */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#0F172A]">
              Discover
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/discover" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Explore All Events
                </Link>
              </li>
              <li>
                <Link href="/discover?cat=Music" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Live Music & Concerts
                </Link>
              </li>
              <li>
                <Link href="/discover?cat=Comedy" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Standup & Comedy
                </Link>
              </li>
              <li>
                <Link href="/discover?cat=Technology" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Founders & AI Tech
                </Link>
              </li>
              <li>
                <Link href="/discover?cat=Food" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Dining & Social Mixers
                </Link>
              </li>
              <li>
                <Link href="/poll/mumbai-founders-dinner-date" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Crowdsourced Date Polls
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Organizers */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#0F172A]">
              Organizers
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/create" className="text-[#E8621A] font-semibold hover:underline flex items-center gap-1">
                  <span>+ List New Event</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Host Dashboard
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  My Profile & Brand
                </Link>
              </li>
              <li>
                <Link href="/passes" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Guest Passes & Tickets
                </Link>
              </li>
              <li>
                <Link href="/create/ai" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  AI Instant Event Builder
                </Link>
              </li>
              <li>
                <Link href="/create/manual" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Manual Form Publisher
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Host Organizer Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Stay in the Loop (Newsletter Box) */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#0F172A]">
              Stay in the Loop
            </h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Curated weekly digest of premier underground gigs, founder mixers, and cultural experiences.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>You're on the list! Welcome to Vibe.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent transition-all shadow-2xs"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to weekly events"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#0F172A] text-white hover:bg-[#E8621A] transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Zero spam. Unsubscribe anytime.</span>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Platform Legal Disclaimer & Compliance Box */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0D0D10] border border-white/10 text-[11px] sm:text-xs text-white/60 leading-relaxed space-y-1.5">
            <div className="font-bold text-white uppercase tracking-wider text-[10px] sm:text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5500]" />
              <span>Platform Legal Disclaimer & Compliance Advisory</span>
            </div>
            <p>
              Vibe by Swaniki operates as an event discovery and technology intermediary under the Information Technology Act, 2000. Experiences curated from external ticketing partners (such as District, BookMyShow, Paytm Insider, Unstop, Luma) are fulfilled directly on their respective official platforms; Vibe assumes no liability for external ticket sales, gate entries, or refunds. Community hosts are independently responsible for event licensing, safety protocols, and venue capacity. We process personal data in strict compliance with India&apos;s Digital Personal Data Protection (DPDP) Act, 2023.
            </p>
          </div>

          {/* Bottom Bar: Copyright, Tagline & Legal Policy Links */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50 pt-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white/70">Good people. Real connections.</span>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center text-xs">
              <Link href="/disclaimer" className="hover:text-white transition-colors">
                Disclaimer
              </Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy (DPDP)
              </Link>
              <span>·</span>
              <a href="mailto:safety@swaniki.com" className="hover:text-white transition-colors">
                Grievance Officer
              </a>
            </div>

            <div className="flex items-center gap-1.5">
              <span>© {new Date().getFullYear()} Vibe by</span>
              <a
                href="https://swaniki.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#FF5500] font-semibold transition-colors underline-offset-2 hover:underline"
              >
                Swaniki
              </a>
              <span className="text-[#FF5500]">↗</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
