'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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

// Social Media Links configured with placeholder '#' ready for future URLs
const SOCIAL_MEDIA_LINKS: SocialLink[] = [
  {
    name: 'Instagram',
    href: '#', // Provide link in future to connect
    icon: Instagram,
    brandColor: 'hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:text-white hover:border-transparent',
    ariaLabel: 'Follow Vibe on Instagram',
  },
  {
    name: 'X (Twitter)',
    href: '#', // Provide link in future to connect
    customIcon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    brandColor: 'hover:bg-black hover:text-white hover:border-black',
    ariaLabel: 'Follow Vibe on X',
  },
  {
    name: 'LinkedIn',
    href: '#', // Provide link in future to connect
    icon: Linkedin,
    brandColor: 'hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]',
    ariaLabel: 'Connect with Vibe on LinkedIn',
  },
  {
    name: 'YouTube',
    href: '#', // Provide link in future to connect
    icon: Youtube,
    brandColor: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]',
    ariaLabel: 'Subscribe to Vibe on YouTube',
  },
  {
    name: 'Telegram',
    href: '#', // Provide link in future to connect
    icon: Send,
    brandColor: 'hover:bg-[#229ED9] hover:text-white hover:border-[#229ED9]',
    ariaLabel: 'Join Vibe Telegram Community',
  },
  {
    name: 'GitHub',
    href: '#', // Provide link in future to connect
    icon: Github,
    brandColor: 'hover:bg-[#24292F] hover:text-white hover:border-[#24292F]',
    ariaLabel: 'Star Vibe on GitHub',
  },
];

export default function Footer() {
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

  return (
    <footer className="border-t border-[#E2E8F0] bg-[#F8FAFC] mt-20 pt-16 pb-12 text-[#475569] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#E2E8F0]">
          {/* Column 1: Brand Info & Social Media Links (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 group py-1">
              <span className="font-extrabold text-2xl text-[#0F172A] tracking-tight group-hover:text-black transition-colors">
                Vibe
              </span>
              <span className="text-xs font-bold text-[#E8621A] tracking-wider uppercase">
                BY SWANIKI
              </span>
              <span className="text-xs text-[#64748B] border-l border-[#CBD5E1] pl-2 ml-1">
                Live Events &amp; Experiences
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-[#64748B] max-w-sm leading-relaxed">
              India's premier whitelabel event network. Curating cultural gatherings, tech summits, live concerts, and social mixers with AI-streamed verification and pass distribution.
            </p>

            {/* Social Media Section */}
            <div className="pt-2 space-y-2.5">
              <div className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <span>Connect With Us</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8621A]" />
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
                      className={`w-9 h-9 rounded-full bg-white border border-[#E2E8F0] text-[#64748B] flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95 ${item.brandColor}`}
                    >
                      {Icon ? <Icon className="w-4 h-4" /> : item.customIcon}
                    </a>
                  );
                })}
              </div>

              <p className="text-[11px] text-[#94A3B8]">
                Official community handles & social links will connect soon.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#64748B] pt-1">
              <span>Crafted with</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
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
                <Link href="/dashboard" className="hover:text-[#0F172A] hover:font-medium transition-colors">
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
                <Link href="/admin" className="hover:text-[#0F172A] hover:font-medium transition-colors">
                  Admin Verification Queue
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

        {/* Bottom Bar: Copyright & System Status */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex flex-wrap items-center gap-2">
            <span>© {new Date().getFullYear()} Vibe by Swaniki.</span>
            <span className="hidden sm:inline text-[#CBD5E1]">·</span>
            <span>Free in v1 · Zero ticket fees.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All systems live · Asia/Kolkata (IST)</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
