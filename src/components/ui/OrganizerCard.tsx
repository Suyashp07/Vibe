'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserCheck, UserPlus, Sparkles, ExternalLink, X } from 'lucide-react';
import { EventItem } from '@/types';
import { 
  getFollowerCount, 
  isUserFollowing, 
  toggleFollowOrganizer, 
  followOrganizer,
  subscribeToStore 
} from '@/lib/store';
import { useAuth } from '@/lib/auth';

interface OrganizerCardProps {
  event: EventItem;
}

export default function OrganizerCard({ event }: OrganizerCardProps) {
  const { profile } = useAuth();
  const orgKey = event.organizer_handle || event.organizer_id;

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');

  const isOwner = Boolean(
    profile && (
      (profile.id && profile.id === event.organizer_id) ||
      (profile.handle && profile.handle.toLowerCase() === event.organizer_handle?.toLowerCase())
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

  const handleFollow = () => {
    if (isOwner) return;

    if (profile?.email) {
      const res = toggleFollowOrganizer({
        organizer_id: event.organizer_id,
        organizer_handle: event.organizer_handle,
        follower_id: profile.id,
        follower_name: profile.name || profile.email.split('@')[0],
        follower_email: profile.email,
        follower_avatar: profile.avatar_url,
      });
      setIsFollowing(res.isFollowing);
      setFollowerCount(res.count);
      return;
    }

    const savedGuestEmail = typeof window !== 'undefined' ? localStorage.getItem('vibe_guest_email') : null;
    const savedGuestName = typeof window !== 'undefined' ? localStorage.getItem('vibe_guest_name') : null;

    if (savedGuestEmail) {
      const res = toggleFollowOrganizer({
        organizer_id: event.organizer_id,
        organizer_handle: event.organizer_handle,
        follower_name: savedGuestName || savedGuestEmail.split('@')[0],
        follower_email: savedGuestEmail,
      });
      setIsFollowing(res.isFollowing);
      setFollowerCount(res.count);
      return;
    }

    setShowQuickModal(true);
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim()) return;

    const nameToUse = guestName.trim() || guestEmail.split('@')[0];
    const res = followOrganizer({
      organizer_id: event.organizer_id,
      organizer_handle: event.organizer_handle,
      follower_name: nameToUse,
      follower_email: guestEmail.trim(),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe_guest_email', guestEmail.trim().toLowerCase());
      localStorage.setItem('vibe_guest_name', nameToUse);
    }

    setShowQuickModal(false);
    setIsFollowing(true);
    setFollowerCount(res.count);
  };

  return (
    <div className="bg-surface rounded-2xl p-5 border border-border shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative">
      <div className="flex items-center gap-3.5">
        {event.organizer_logo ? (
          <Image
            src={event.organizer_logo}
            alt={event.organizer_name}
            width={48}
            height={48}
            className="rounded-xl object-cover border border-border shadow-sm"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-brand text-gold font-display font-black text-lg flex items-center justify-center">
            {event.organizer_name[0]}
          </div>
        )}

        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base text-ink">
              {event.organizer_name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-ink-secondary font-mono font-medium">
              @{event.organizer_handle}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Verified Host · <strong className="text-ink font-semibold">{followerCount}</strong> community followers on Vibe
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        <Link
          href={`/${event.organizer_handle}`}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-btn bg-surface-3 hover:bg-border text-ink text-xs font-semibold transition-colors"
        >
          <span>All Events</span>
          <ExternalLink className="w-3 h-3 text-ink-muted" />
        </Link>

        {!isOwner && (
          <button
            onClick={handleFollow}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-btn text-xs font-semibold transition-all shadow-sm ${
              isFollowing
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 group'
                : 'bg-brand hover:bg-brand-mid text-white hover-lift'
            }`}
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
                <span>Follow Host</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Quick Follow Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl border border-border shadow-elevated max-w-sm w-full p-6 space-y-4 relative">
            <button
              onClick={() => setShowQuickModal(false)}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <h4 className="font-display font-bold text-lg text-ink">
                Follow @{event.organizer_name}
              </h4>
              <p className="text-xs text-ink-muted">
                Receive early access and notifications on new events from this host.
              </p>
            </div>

            <form onSubmit={handleGuestSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your Name (optional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface-2 text-ink focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <input
                type="email"
                required
                placeholder="Your Email Address *"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface-2 text-ink focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-btn bg-brand hover:bg-brand-mid text-white text-xs font-bold transition-all"
              >
                Follow & Stay Updated →
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
