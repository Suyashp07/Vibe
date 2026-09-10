import React from 'react';
import Link from 'next/link';
import { Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-20 py-12 text-ink-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-gold">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display font-black text-xl text-brand">
                Vibe <span className="font-tagline italic text-accent font-normal text-lg">by Swaniki</span>
              </span>
            </div>
            <p className="text-sm text-ink-muted max-w-md leading-relaxed">
              India-first whitelabel event platform. 5 bespoke editorial templates, AI-streamed copy, and instant social share banners. Made for creators, founders, and cultural curators.
            </p>
            <div className="flex items-center gap-2 text-xs text-ink-muted pt-2">
              <span>Crafted with</span>
              <Heart className="w-3.5 h-3.5 text-accent fill-accent" />
              <span>in Mumbai & Bengaluru</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-ink mb-3 font-sans">Templates</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/create?template=grove" className="hover:text-accent transition-colors">Grove (Community & Networking)</Link></li>
              <li><Link href="/create?template=sprint" className="hover:text-accent transition-colors">Sprint (Sports & Fitness)</Link></li>
              <li><Link href="/create?template=bloom" className="hover:text-accent transition-colors">Bloom (Celebrations & Social)</Link></li>
              <li><Link href="/create?template=vertex" className="hover:text-accent transition-colors">Vertex (Corporate & Tech)</Link></li>
              <li><Link href="/create?template=ember" className="hover:text-accent transition-colors">Ember (Culture & Community)</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-ink mb-3 font-sans">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/discover" className="hover:text-accent transition-colors">Discover Events</Link></li>
              <li><Link href="/create" className="hover:text-accent transition-colors">Host an Event</Link></li>
              <li><Link href="/dashboard" className="hover:text-accent transition-colors">Organizer Dashboard</Link></li>
              <li><Link href="/guest" className="hover:text-accent transition-colors">My Guest RSVPs</Link></li>
              <li><Link href="/poll/mumbai-founders-dinner-date" className="hover:text-accent transition-colors">Date Polling</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div>
            © {new Date().getFullYear()} Vibe by Swaniki. Free to use in v1. No ticket fees.
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-bg text-success font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
              All systems live · Asia/Kolkata (IST)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
