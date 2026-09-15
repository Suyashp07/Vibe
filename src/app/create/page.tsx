'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Building2, ArrowRight, ShieldCheck, Compass } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import SingleStepCreateForm from '@/components/events/SingleStepCreateForm';
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

  // Guard: User must be logged in as an organizer to access creation
  if (!isLoggedIn || !isOrganizer) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-2">
        <Navbar />

        <main className="flex-1 max-w-lg mx-auto px-4 sm:px-6 py-16 flex items-center justify-center w-full">
          <div className="bg-surface rounded-2xl p-8 border border-border shadow-elevated text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-brand text-white mx-auto flex items-center justify-center shadow-sm">
              <Building2 className="w-8 h-8 text-accent" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent bg-accent-light px-3 py-1 rounded-full">
                <Lock className="w-3.5 h-3.5" /> Host Account Required
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-ink">
                Sign in to Host Experiences
              </h1>
              <p className="text-xs text-ink-secondary max-w-sm mx-auto leading-relaxed">
                Sign in or register to publish intimate tech summits, rooftop mixers, and community gatherings on Vibe.
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
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-btn bg-brand hover:bg-accent text-white font-bold text-xs transition-all shadow-xs"
                >
                  <span>Create Host Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="pt-2">
                <Link
                  href="/discover"
                  className="text-xs font-semibold text-ink-muted hover:text-accent inline-flex items-center gap-1 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Browse live experiences first</span>
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>Free to host • Instant publishing</span>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Authenticated Organizer: Render Fast Single-Step Creator
  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />
      <main className="flex-1">
        <SingleStepCreateForm />
      </main>
      <Footer />
    </div>
  );
}
