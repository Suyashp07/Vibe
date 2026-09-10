'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Building2, ArrowRight, ShieldCheck, Compass } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import EventWizard from '@/components/wizard/EventWizard';
import { useAuth } from '@/lib/auth';

export default function CreateEventPage() {
  const router = useRouter();
  const { isLoggedIn, isOrganizer, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-2">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  // Guard: User must be logged in as an organizer to access the wizard
  if (!isLoggedIn || !isOrganizer) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-2">
        <Navbar />

        <main className="flex-1 max-w-lg mx-auto px-4 sm:px-6 py-16 flex items-center justify-center w-full">
          <div className="bg-surface rounded-2xl p-8 border border-border shadow-elevated text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-brand text-gold mx-auto flex items-center justify-center shadow-sm">
              <Building2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent bg-accent-light px-3 py-1 rounded-full">
                <Lock className="w-3.5 h-3.5" /> Organizer Authentication Required
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-ink">
                Sign in to Host Experiences
              </h1>
              <p className="text-xs text-ink-secondary max-w-sm mx-auto leading-relaxed">
                To prevent unverified events, only authenticated organizers can access the 6-step creation wizard, Gemini AI studio, and publish event pages.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login?redirect=/create&role=organizer"
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-btn border border-border bg-surface hover:bg-surface-3 text-ink font-bold text-xs transition-all"
                >
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/signup?redirect=/create&role=organizer"
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-xs hover-lift transition-all"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <Link
                href="/discover"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-btn bg-surface hover:bg-surface-3 border border-border text-ink text-xs font-semibold transition-colors"
              >
                <Compass className="w-4 h-4 text-ink-muted" />
                <span>Explore Events First</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] text-ink-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>Free to host • Zero ticketing fees in v1</span>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Authenticated Organizer: Render full 6-Step Wizard
  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />
      <main className="flex-1">
        <EventWizard />
      </main>
      <Footer />
    </div>
  );
}
