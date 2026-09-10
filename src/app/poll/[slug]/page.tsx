'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  Calendar,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  Vote,
  Share2,
  Check,
  Award,
  Clock
} from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import { getDatePollBySlug, fetchDatePollBySlug, voteDatePoll, subscribeToStore } from '@/lib/store';
import { DatePoll } from '@/types';

export default function DatePollPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState<DatePoll | undefined>(undefined);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!slug) {
      setLoading(false);
      return;
    }

    const loadPoll = async () => {
      const found = await fetchDatePollBySlug(slug);
      setPoll(found);
      setLoading(false);

      // Check if current guest already voted
      if (typeof window !== 'undefined') {
        const storedEmail = localStorage.getItem('vibe_guest_email') || '';
        if (storedEmail) {
          setEmail(storedEmail);
          if (found && found.options.some(opt => opt.votes.includes(storedEmail.toLowerCase().trim()))) {
            setHasVoted(true);
          }
        }
      }
    };

    loadPoll();

    const unsub = subscribeToStore(() => {
      const p = getDatePollBySlug(slug);
      if (p) setPoll(p);
    });
    return () => unsub();
  }, [slug]);

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOptionId || !email.trim() || !poll) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe_guest_email', trimmedEmail);
    }

    await voteDatePoll(slug, selectedOptionId, trimmedEmail);
    setHasVoted(true);

    // Confetti celebration
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#E8621A', '#C9A84C', '#1A1A2E']
    });
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pollUrl = typeof window !== 'undefined' ? window.location.href : `https://vibe.swaniki.app/poll/${slug}`;
  const waShareText = poll ? `Hey! Help choose the best date for "${poll.title}":\n\nVote here: ${pollUrl}` : '';
  const waLink = `https://wa.me/?text=${encodeURIComponent(waShareText)}`;

  // 1. Initial Loading Skeleton (identical on server and client to prevent hydration mismatch)
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-2">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-9 h-9 border-3 border-accent/25 border-t-accent rounded-full animate-spin" />
          <p className="text-xs text-ink-muted">Loading live date poll...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Not Found State
  if (!poll) {
    return (
      <div className="min-h-screen bg-surface-2 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Vote className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-2xl text-ink">Date Poll Not Found</h2>
          <p className="text-xs text-ink-muted max-w-sm">
            This scheduling poll may have concluded, converted to an official event, or the link may be mistyped.
          </p>
          <Link href="/discover" className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-mid transition-all shadow-xs">
            <span>Explore Community Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

  // Find leading option
  let leadingOption = poll.options[0];
  poll.options.forEach(opt => {
    if (opt.votes.length > (leadingOption?.votes.length || 0)) {
      leadingOption = opt;
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface-2">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 w-full space-y-6">
        {/* Poll Header Card */}
        <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent bg-accent-light px-3 py-1 rounded-full border border-accent/20">
                <Vote className="w-3.5 h-3.5" /> Community Date Poll
              </span>
              <span className="text-xs font-medium text-ink-muted">
                by <strong className="text-ink">{poll.organizer_name}</strong>
              </span>
            </div>

            {/* Sharing Bar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-xs hover-lift transition-all"
              >
                <span>WhatsApp</span>
              </a>

              <button
                onClick={handleShare}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-xs font-semibold text-ink transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5 text-ink-muted" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-ink leading-tight">
              {poll.title}
            </h1>

            {poll.description && (
              <p className="text-sm text-ink-secondary leading-relaxed mt-2">
                {poll.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted pt-3 border-t border-border">
            <span className="flex items-center gap-1.5 font-semibold text-ink">
              <Users className="w-4 h-4 text-accent" />
              <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} recorded live</span>
            </span>
            {totalVotes > 0 && leadingOption && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200">
                  <Award className="w-3 h-3 text-emerald-600" />
                  <span>Leading: {leadingOption.date_label.split('·')[0]}</span>
                </span>
              </>
            )}
            <span>·</span>
            <span>Timezone: Asia/Kolkata (IST)</span>
          </div>
        </div>

        {/* Voting Form / Live Results Card */}
        <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3.5">
            <div>
              <h2 className="font-display font-bold text-xl text-ink">
                {hasVoted ? '✨ Current Community Votes' : 'Which date works best for you?'}
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                {hasVoted ? 'Thank you for casting your vote! Live standings are updated below.' : 'Select your preferred date option and submit your vote.'}
              </p>
            </div>

            {hasVoted && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Vote Recorded
              </span>
            )}
          </div>

          <form onSubmit={handleVote} className="space-y-4">
            <div className="space-y-3">
              {poll.options.map((opt) => {
                const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                const isSelected = selectedOptionId === opt.id;
                const isWinner = totalVotes > 0 && opt.votes.length === (leadingOption?.votes.length || 0);

                return (
                  <label
                    key={opt.id}
                    className={`block relative p-4 rounded-xl border cursor-pointer transition-all overflow-hidden ${
                      isSelected
                        ? 'border-accent bg-accent-light/30 ring-2 ring-accent/20'
                        : isWinner && totalVotes > 0
                        ? 'border-emerald-500/40 bg-emerald-50/20 hover:bg-emerald-50/30'
                        : 'border-border bg-surface-2 hover:bg-surface-3'
                    }`}
                  >
                    {/* Background fill percentage bar */}
                    <div
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-500 pointer-events-none ${
                        isWinner && totalVotes > 0 ? 'bg-emerald-500/15' : 'bg-accent/15'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <input
                          type="radio"
                          name="poll_option"
                          checked={isSelected}
                          onChange={() => setSelectedOptionId(opt.id)}
                          className="w-4 h-4 text-accent focus:ring-accent border-border"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-ink block">
                              {opt.date_label}
                            </span>
                            {isWinner && totalVotes > 0 && (
                              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                                Leading
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-ink-muted">
                            {opt.votes.length} {opt.votes.length === 1 ? 'vote' : 'votes'}
                          </span>
                        </div>
                      </div>

                      <span className="text-sm font-bold font-mono text-ink">
                        {percentage}%
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Email input & vote submission */}
            {!hasVoted ? (
              <div className="pt-4 border-t border-border space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary mb-1">
                    Your Email (to register vote) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-surface-2 border border-border focus:border-accent focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedOptionId || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-md hover-lift disabled:opacity-50 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit My Vote</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-surface-2 border border-border text-center space-y-1">
                <span className="text-xs text-ink font-semibold">Want to change your vote or vote on another option?</span>
                <div>
                  <button
                    type="button"
                    onClick={() => setHasVoted(false)}
                    className="text-xs text-accent hover:underline font-bold"
                  >
                    Change vote preference
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Organizer Convert to Event CTA */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-2 p-4 sm:p-5 rounded-2xl">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Are you the organizer ({poll.organizer_name})?</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Lock in the winning date and spin up an official admission event page in 1 click.
              </p>
            </div>

            <Link
              href={`/create?title=${encodeURIComponent(poll.title)}&date=${encodeURIComponent(leadingOption?.date_label || '')}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-mid transition-all shadow-sm hover-lift whitespace-nowrap"
            >
              <span>Convert Winner to Event →</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
