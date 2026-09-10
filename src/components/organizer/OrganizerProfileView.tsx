'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  UserCheck, 
  UserPlus, 
  Sparkles, 
  Users, 
  Share2, 
  Check, 
  X, 
  Search, 
  Mail, 
  ExternalLink,
  ShieldCheck,
  Heart,
  Vote,
  Award,
  ArrowRight
} from 'lucide-react';
import { Profile, EventItem, FollowerItem, DatePoll } from '@/types';
import EventCard from '@/components/ui/EventCard';
import { 
  getFollowers, 
  getFollowerCount, 
  isUserFollowing, 
  toggleFollowOrganizer, 
  followOrganizer, 
  subscribeToStore,
  getDatePolls,
  getDatePollsByOrganizer,
  syncDatePollsWithSupabase
} from '@/lib/store';
import { useAuth } from '@/lib/auth';

interface OrganizerProfileViewProps {
  organizer: Profile;
  events: EventItem[];
}

export default function OrganizerProfileView({ organizer, events }: OrganizerProfileViewProps) {
  const { profile } = useAuth();
  const orgKey = organizer.handle || organizer.id;

  const [followersList, setFollowersList] = useState<FollowerItem[]>([]);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [organizerPolls, setOrganizerPolls] = useState<DatePoll[]>([]);
  
  // Follow modal for unauthenticated visitors
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [followSubmitting, setFollowSubmitting] = useState(false);

  // Community drawer / modal
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [communitySearch, setCommunitySearch] = useState('');

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const isOwner = Boolean(
    profile && (
      (profile.id && profile.id === organizer.id) ||
      (profile.handle && profile.handle.toLowerCase() === organizer.handle.toLowerCase()) ||
      (profile.email && profile.email.toLowerCase() === organizer.email.toLowerCase())
    )
  );

  // Sync follower list and current following status
  useEffect(() => {
    const updateFollowStatus = () => {
      const list = getFollowers(orgKey);
      setFollowersList(list);
      setFollowerCount(list.length);

      // Check current user following state
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

      // Sync polls for this organizer
      const allPolls = getDatePolls();
      const matchedPolls = allPolls.filter(p =>
        (p.organizer_id && p.organizer_id === organizer.id) ||
        (p.organizer_handle && p.organizer_handle.toLowerCase() === organizer.handle.toLowerCase()) ||
        (p.organizer_name && p.organizer_name.toLowerCase() === organizer.name.toLowerCase())
      );
      setOrganizerPolls(matchedPolls.length > 0 ? matchedPolls : getDatePollsByOrganizer(orgKey));
    };

    updateFollowStatus();
    syncDatePollsWithSupabase().then(() => updateFollowStatus()).catch(() => {});
    const unsub = subscribeToStore(updateFollowStatus);
    return () => unsub();
  }, [orgKey, profile, organizer]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFollowClick = () => {
    // If logged in, toggle instantly
    if (profile?.email) {
      const res = toggleFollowOrganizer({
        organizer_id: organizer.id,
        organizer_handle: organizer.handle,
        follower_id: profile.id,
        follower_name: profile.name || profile.email.split('@')[0],
        follower_email: profile.email,
        follower_avatar: profile.avatar_url,
      });

      setIsFollowing(res.isFollowing);
      setFollowerCount(res.count);
      showToast(
        res.isFollowing 
          ? `You are now following @${organizer.handle}! You'll receive updates on upcoming experiences.` 
          : `You unfollowed @${organizer.handle}.`
      );
      return;
    }

    // Check if guest email was previously saved
    const savedGuestEmail = typeof window !== 'undefined' ? localStorage.getItem('vibe_guest_email') : null;
    const savedGuestName = typeof window !== 'undefined' ? localStorage.getItem('vibe_guest_name') : null;

    if (savedGuestEmail) {
      const res = toggleFollowOrganizer({
        organizer_id: organizer.id,
        organizer_handle: organizer.handle,
        follower_name: savedGuestName || savedGuestEmail.split('@')[0],
        follower_email: savedGuestEmail,
      });

      setIsFollowing(res.isFollowing);
      setFollowerCount(res.count);
      showToast(
        res.isFollowing 
          ? `You are now following @${organizer.handle}!` 
          : `You unfollowed @${organizer.handle}.`
      );
      return;
    }

    // Otherwise open the guest follow modal
    setShowFollowModal(true);
  };

  const handleGuestFollowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim()) return;

    setFollowSubmitting(true);
    const nameToUse = guestName.trim() || guestEmail.split('@')[0];

    // Save in store
    const res = followOrganizer({
      organizer_id: organizer.id,
      organizer_handle: organizer.handle,
      follower_name: nameToUse,
      follower_email: guestEmail.trim(),
    });

    // Save guest email in localStorage for future visits
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe_guest_email', guestEmail.trim().toLowerCase());
      localStorage.setItem('vibe_guest_name', nameToUse);
    }

    setFollowSubmitting(false);
    setShowFollowModal(false);
    setIsFollowing(true);
    setFollowerCount(res.count);
    showToast(`Welcome to @${organizer.handle}'s community! We'll keep you notified on secret drops.`);
  };

  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/${organizer.handle}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      showToast('Profile URL copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const filteredFollowers = followersList.filter(f => 
    f.follower_name.toLowerCase().includes(communitySearch.toLowerCase()) ||
    f.follower_email.toLowerCase().includes(communitySearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface px-4 py-3 rounded-2xl shadow-elevated border border-white/10 flex items-center gap-3 animate-fade-in text-xs font-medium max-w-sm">
          <Sparkles className="w-4 h-4 text-gold shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
        {/* Banner with Brand Accent */}
        <div
          className="h-36 sm:h-48 w-full relative transition-all"
          style={{
            background: `linear-gradient(135deg, ${organizer.brand_color || '#1A1A2E'}, #0F3460)`
          }}
        >
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>Verified Organizer</span>
          </div>

          {isOwner && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-ink text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>You (Host View)</span>
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 mb-6">
            <div className="relative">
              {organizer.logo_url ? (
                <Image
                  src={organizer.logo_url}
                  alt={organizer.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-surface shadow-elevated bg-surface"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-brand text-gold font-display font-black text-3xl flex items-center justify-center border-4 border-surface shadow-elevated">
                  {organizer.name[0]}
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleShareProfile}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-btn bg-surface-2 hover:bg-surface-3 border border-border text-ink text-xs font-bold transition-all hover-lift"
              >
                {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4 text-ink-muted" />}
                <span>{copiedLink ? 'Copied Link' : 'Share'}</span>
              </button>

              {isOwner ? (
                <Link
                  href="/dashboard"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-btn bg-brand hover:bg-brand-mid text-white text-xs font-bold shadow-sm hover-lift transition-all"
                >
                  <span>Organizer Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gold" />
                </Link>
              ) : (
                <button
                  onClick={handleFollowClick}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-btn text-xs font-bold transition-all shadow-sm ${
                    isFollowing
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 group'
                      : 'bg-accent hover:bg-accent-dark text-white hover-lift'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-emerald-600 group-hover:hidden" />
                      <X className="w-4 h-4 text-red-600 hidden group-hover:inline-block" />
                      <span className="group-hover:hidden">Following</span>
                      <span className="hidden group-hover:inline-block">Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow Organizer</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-w-2xl">
            <div>
              <h1 className="font-display font-black text-3xl text-ink">
                {organizer.name}
              </h1>
              <span className="text-sm font-mono text-accent font-semibold">
                @{organizer.handle}
              </span>
            </div>

            {organizer.bio && (
              <p className="text-sm text-ink-secondary leading-relaxed">
                {organizer.bio}
              </p>
            )}

            {/* Dynamic Community Metrics Bar */}
            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-ink-muted border-t border-border">
              <span><strong>{events.length}</strong> Hosted Experiences</span>
              
              {/* Dynamic Follower Count with Click to View Community */}
              <button
                onClick={() => setShowCommunityModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-ink hover:text-accent font-medium transition-colors group cursor-pointer"
                title="Click to view community members"
              >
                <Users className="w-3.5 h-3.5 text-accent group-hover:scale-110 transition-transform" />
                <span>
                  <strong className="text-ink group-hover:text-accent transition-colors">
                    {followerCount}
                  </strong> Community Followers
                </span>
                <span className="text-[10px] uppercase font-bold text-accent/80 tracking-wider bg-accent/10 px-1.5 py-0.5 rounded">
                  View
                </span>
              </button>

              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: organizer.brand_color || '#E8621A' }} />
                <span>Brand Hex: {organizer.brand_color || '#E8621A'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Date Scheduling Polls Section */}
      {organizerPolls.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-accent-light text-accent flex items-center justify-center shrink-0">
                <Vote className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-display font-bold text-xl text-ink">
                  Community Date Polls
                </h2>
                <p className="text-xs text-ink-muted">
                  Vote on dates for upcoming sessions & gatherings by {organizer.name}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-light text-accent border border-accent/20">
              {organizerPolls.length} Active {organizerPolls.length === 1 ? 'Poll' : 'Polls'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {organizerPolls.map((poll) => {
              const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
              let topOpt = poll.options[0];
              poll.options.forEach(opt => {
                if (opt.votes.length > (topOpt?.votes.length || 0)) topOpt = opt;
              });

              return (
                <div
                  key={poll.id}
                  className="bg-surface rounded-2xl p-6 border border-border shadow-card hover:shadow-elevated transition-all flex flex-col justify-between space-y-4 relative group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-accent bg-accent-light px-2.5 py-0.5 rounded-full">
                        <Vote className="w-3 h-3" /> Live Community Vote
                      </span>
                      <span className="text-xs font-semibold text-ink-muted">
                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-lg text-ink group-hover:text-accent transition-colors">
                      <Link href={`/poll/${poll.slug}`}>{poll.title}</Link>
                    </h3>

                    {poll.description && (
                      <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                        {poll.description}
                      </p>
                    )}

                    {/* Preview of options with progress */}
                    <div className="space-y-1.5 pt-2">
                      {poll.options.slice(0, 3).map((opt) => {
                        const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                        const isLeading = totalVotes > 0 && opt.votes.length === topOpt?.votes.length;
                        return (
                          <div key={opt.id} className="text-xs">
                            <div className="flex items-center justify-between text-[11px] mb-0.5">
                              <span className="font-medium text-ink truncate">{opt.date_label}</span>
                              <span className="font-mono text-ink-muted">{pct}% ({opt.votes.length})</span>
                            </div>
                            <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isLeading ? 'bg-accent' : 'bg-ink-muted/30'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <span className="text-[11px] text-ink-muted">
                      {topOpt && totalVotes > 0 ? `Top: ${topOpt.date_label.split('·')[0]}` : 'Be first to vote'}
                    </span>

                    <Link
                      href={`/poll/${poll.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-bold transition-all shadow-xs hover-lift"
                    >
                      <span>Vote on Date</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hosted Events Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="font-display font-bold text-2xl text-ink">
            Upcoming & Past Experiences
          </h2>
          <span className="text-xs text-ink-muted">{events.length} events total</span>
        </div>

        {events.length === 0 ? (
          <div className="bg-surface rounded-2xl p-10 border border-border text-center space-y-3">
            <Sparkles className="w-8 h-8 text-gold mx-auto" />
            <p className="font-display font-bold text-base text-ink">
              No published events right now
            </p>
            <p className="text-xs text-ink-muted max-w-sm mx-auto">
              Follow @{organizer.handle} to be the first to know when tickets and secret invitations drop.
            </p>
            {!isOwner && (
              <button
                onClick={handleFollowClick}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isFollowing ? 'You Are Following' : 'Follow for Updates'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* GUEST FOLLOW MODAL */}
      {/* ========================================================= */}
      {showFollowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl border border-border shadow-elevated max-w-md w-full p-6 sm:p-8 space-y-6 relative animate-scale-up">
            <button
              onClick={() => setShowFollowModal(false)}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-surface-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent mx-auto flex items-center justify-center">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <h3 className="font-display font-black text-2xl text-ink">
                Follow @{organizer.name}
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed max-w-xs mx-auto">
                Get notified on WhatsApp and email whenever @{organizer.handle} drops secret gatherings, early-bird passes, and curated community mixers.
              </p>
            </div>

            <form onSubmit={handleGuestFollowSubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-ink">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aryan Sharma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-ink">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-2 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <button
                type="submit"
                disabled={followSubmitting}
                className="w-full py-3 rounded-btn bg-accent hover:bg-accent-dark text-white font-bold text-xs shadow-sm hover-lift transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{followSubmitting ? 'Joining Inner Circle...' : 'Follow & Stay Updated →'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* COMMUNITY FOLLOWERS MODAL */}
      {/* ========================================================= */}
      {showCommunityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl border border-border shadow-elevated max-w-lg w-full max-h-[85vh] flex flex-col p-6 sm:p-7 relative animate-scale-up">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink">
                    Community Members
                  </h3>
                  <p className="text-xs text-ink-muted">
                    {followersList.length} followers supporting @{organizer.handle}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCommunityModal(false)}
                className="text-ink-muted hover:text-ink p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter inside community */}
            <div className="py-3">
              <div className="relative">
                <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search community members..."
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-surface-2 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            {/* Followers Roster */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-2">
              {filteredFollowers.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Users className="w-8 h-8 text-ink-muted/40 mx-auto" />
                  <p className="text-sm font-semibold text-ink">
                    {followersList.length === 0 ? 'No followers yet' : 'No matching members found'}
                  </p>
                  <p className="text-xs text-ink-muted max-w-xs mx-auto">
                    {followersList.length === 0 
                      ? `Be the first community member to follow @${organizer.handle}!`
                      : 'Try a different search query.'}
                  </p>
                  {followersList.length === 0 && !isOwner && !isFollowing && (
                    <button
                      onClick={() => {
                        setShowCommunityModal(false);
                        handleFollowClick();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-accent text-white text-xs font-bold hover:bg-accent-dark shadow-sm transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow Now</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredFollowers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border/80 hover:border-accent/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Image
                        src={member.follower_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.follower_name)}`}
                        alt={member.follower_name}
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-xl object-cover bg-surface border border-border shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-ink truncate">
                          {member.follower_name}
                        </div>
                        <div className="text-[11px] text-ink-muted truncate">
                          {member.follower_email ? member.follower_email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Community Member'}
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-ink-muted shrink-0 pl-2">
                      {new Date(member.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-ink-muted">
                100% verified community members
              </span>
              <button
                onClick={() => setShowCommunityModal(false)}
                className="px-4 py-2 rounded-btn bg-surface-2 hover:bg-surface-3 text-xs font-bold text-ink transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
