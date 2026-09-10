'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, X, Sparkles, Heart } from 'lucide-react';
import { 
  getFollowerCount, 
  isUserFollowing, 
  toggleFollowOrganizer, 
  followOrganizer,
  subscribeToStore 
} from '@/lib/store';
import { useAuth } from '@/lib/auth';

interface FollowButtonProps {
  organizerId: string;
  organizerHandle?: string;
  organizerName?: string;
  organizerLogo?: string;
  variant?: 'hero' | 'card' | 'pill' | 'minimal';
  showCount?: boolean;
  className?: string;
}

export default function FollowButton({
  organizerId,
  organizerHandle,
  organizerName = 'Organizer',
  organizerLogo,
  variant = 'pill',
  showCount = true,
  className = ''
}: FollowButtonProps) {
  const { profile } = useAuth();
  const orgKey = organizerHandle || organizerId;

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justFollowed, setJustFollowed] = useState(false);

  // Check if current logged-in user is this organizer
  const isOwner = Boolean(
    profile && (
      (profile.id && profile.id === organizerId) ||
      (profile.handle && organizerHandle && profile.handle.toLowerCase() === organizerHandle.toLowerCase()) ||
      (profile.email && profile.email.toLowerCase() === organizerId.toLowerCase())
    )
  );

  useEffect(() => {
    const updateFollowStatus = () => {
      setFollowerCount(getFollowerCount(orgKey));

      let activeEmail = profile?.email;
      let activeId = profile?.id;
      if (!activeEmail && typeof window !== 'undefined') {
        activeEmail = localStorage.getItem('vibe_guest_email') || undefined;
      }

      if (activeEmail || activeId) {
        setIsFollowing(isUserFollowing(orgKey, activeEmail || activeId));
      } else {
        setIsFollowing(false);
      }
    };

    updateFollowStatus();
    const unsub = subscribeToStore(updateFollowStatus);
    return () => unsub();
  }, [orgKey, profile]);

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOwner) return;

    // 1. Logged in user
    if (profile?.email) {
      const res = toggleFollowOrganizer({
        organizer_id: organizerId,
        organizer_handle: organizerHandle,
        follower_id: profile.id,
        follower_name: profile.name || profile.email.split('@')[0],
        follower_email: profile.email,
        follower_avatar: profile.avatar_url,
      });

      setIsFollowing(res.isFollowing);
      setFollowerCount(res.count);
      if (res.isFollowing) {
        setJustFollowed(true);
        setTimeout(() => setJustFollowed(false), 2000);
      }
      return;
    }

    // 2. Saved guest from previous RSVP / follow
    const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('vibe_guest_email') : null;
    const savedName = typeof window !== 'undefined' ? localStorage.getItem('vibe_guest_name') : null;

    if (savedEmail) {
      const res = toggleFollowOrganizer({
        organizer_id: organizerId,
        organizer_handle: organizerHandle,
        follower_name: savedName || savedEmail.split('@')[0],
        follower_email: savedEmail,
      });

      setIsFollowing(res.isFollowing);
      setFollowerCount(res.count);
      if (res.isFollowing) {
        setJustFollowed(true);
        setTimeout(() => setJustFollowed(false), 2000);
      }
      return;
    }

    // 3. New anonymous visitor -> Prompt email
    setShowQuickModal(true);
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim()) return;

    setSubmitting(true);
    const nameToUse = guestName.trim() || guestEmail.split('@')[0];

    const res = followOrganizer({
      organizer_id: organizerId,
      organizer_handle: organizerHandle,
      follower_name: nameToUse,
      follower_email: guestEmail.trim(),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe_guest_email', guestEmail.trim().toLowerCase());
      localStorage.setItem('vibe_guest_name', nameToUse);
    }

    setSubmitting(false);
    setShowQuickModal(false);
    setIsFollowing(true);
    setFollowerCount(res.count);
    setJustFollowed(true);
    setTimeout(() => setJustFollowed(false), 2000);
  };

  if (isOwner) {
    return null; // Don't show follow button to the host themselves
  }

  // Variant 1: Hero Banner (Translucent glass for dark backgrounds)
  if (variant === 'hero') {
    return (
      <>
        <button
          type="button"
          onClick={handleFollowClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md cursor-pointer ${
            isFollowing
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/40 group'
              : 'bg-white/15 hover:bg-white/25 text-white border border-white/25 hover:scale-105 shadow-sm'
          } ${className}`}
          title={isFollowing ? 'Click to unfollow' : `Follow ${organizerName}`}
        >
          {isFollowing ? (
            <>
              <UserCheck className="w-3.5 h-3.5 text-emerald-300 group-hover:hidden" />
              <X className="w-3.5 h-3.5 text-red-300 hidden group-hover:inline-block" />
              <span className="group-hover:hidden">Following</span>
              <span className="hidden group-hover:inline-block">Unfollow</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5 text-gold" />
              <span>Follow</span>
            </>
          )}

          {showCount && (
            <span className="opacity-75 font-mono text-[11px] ml-0.5">
              · {followerCount}
            </span>
          )}
        </button>

        {showQuickModal && renderQuickModal()}
      </>
    );
  }

  // Variant 2: Card (Full width or standard CTA)
  if (variant === 'card') {
    return (
      <>
        <button
          type="button"
          onClick={handleFollowClick}
          className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
            isFollowing
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 group'
              : 'bg-brand hover:bg-brand-mid text-white hover-lift'
          } ${className}`}
        >
          {isFollowing ? (
            <>
              <UserCheck className="w-4 h-4 text-emerald-600 group-hover:hidden" />
              <X className="w-4 h-4 text-red-600 hidden group-hover:inline-block" />
              <span className="group-hover:hidden">Following @{organizerHandle || organizerName}</span>
              <span className="hidden group-hover:inline-block">Unfollow @{organizerHandle || organizerName}</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 text-gold" />
              <span>Follow {organizerName} {showCount ? `(${followerCount})` : ''}</span>
            </>
          )}
        </button>

        {showQuickModal && renderQuickModal()}
      </>
    );
  }

  // Variant 3: Pill (Standard rounded pill for cards, lists, and badges)
  return (
    <>
      <button
        type="button"
        onClick={handleFollowClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer ${
          isFollowing
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 group'
            : 'bg-accent hover:bg-accent-dark text-white hover-lift'
        } ${className}`}
      >
        {isFollowing ? (
          <>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 group-hover:hidden" />
            <X className="w-3.5 h-3.5 text-red-600 hidden group-hover:inline-block" />
            <span className="group-hover:hidden">Following</span>
            <span className="hidden group-hover:inline-block">Unfollow</span>
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Follow</span>
          </>
        )}

        {showCount && (
          <span className="font-mono text-[10px] opacity-80">
            {followerCount}
          </span>
        )}
      </button>

      {showQuickModal && renderQuickModal()}
    </>
  );

  function renderQuickModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in text-left">
        <div className="bg-surface rounded-2xl border border-border shadow-elevated max-w-sm w-full p-6 space-y-4 relative">
          <button
            type="button"
            onClick={() => setShowQuickModal(false)}
            className="absolute top-4 right-4 text-ink-muted hover:text-ink p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-gold flex items-center justify-center font-display font-black text-lg">
              {organizerName[0]}
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-ink">
                Follow {organizerName}
              </h4>
              <p className="text-xs text-ink-muted">
                @{organizerHandle || 'organizer'}
              </p>
            </div>
          </div>

          <p className="text-xs text-ink-secondary leading-relaxed">
            Get pinged when {organizerName} announces upcoming gatherings, secret invites, and community tickets.
          </p>

          <form onSubmit={handleGuestSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Aarav Mehta"
                className="w-full text-xs px-3 py-2 rounded-input bg-surface-2 text-ink placeholder:text-ink-muted border border-border focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-secondary mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full text-xs px-3 py-2 rounded-input bg-surface-2 text-ink placeholder:text-ink-muted border border-border focus:border-accent focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !guestEmail.trim()}
              className="w-full py-2.5 px-4 rounded-btn bg-brand hover:bg-brand-mid text-white font-bold text-xs shadow-xs hover-lift transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-gold" />
              <span>Confirm & Follow Community</span>
            </button>
          </form>
        </div>
      </div>
    );
  }
}
