'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, Loader2, LogIn, User } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommentItem } from '@/types';
import { getComments, addComment, subscribeToStore } from '@/lib/store';
import { useAuth, getLocalAuthSession } from '@/lib/auth';
import AuthModal from '@/components/auth/AuthModal';

interface VibeCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vibe: {
    id: string;
    slug?: string;
    title: string;
    host_name?: string;
    cover_image_url?: string;
    comments_count?: number;
  };
  onCommentAdded?: (newCount: number) => void;
}

interface DisplayComment {
  id: string;
  author_name: string;
  author_avatar?: string;
  body: string;
  created_at: string;
}

export default function VibeCommentsModal({
  isOpen,
  onClose,
  vibe,
  onCommentAdded,
}: VibeCommentsModalProps) {
  const { profile, user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Determine authenticated state
  const localUser = typeof window !== 'undefined' ? getLocalAuthSession() : null;
  const currentProfile = profile || localUser;
  const isAuthenticated = Boolean(
    (currentProfile && (currentProfile.id || currentProfile.email)) ||
    user?.id
  );

  // Load comments for the current vibe with robust deduplication
  const loadAllComments = useCallback(async () => {
    if (!vibe.id && !vibe.slug) return;
    setIsLoading(true);

    const isUUID = (str?: string) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
    const targetId = isUUID(vibe.id) ? vibe.id : (vibe.slug || vibe.id || '');

    // 1. Gather local store comments
    const rawStoreComments: CommentItem[] = [
      ...(vibe.id ? getComments(vibe.id) : []),
      ...(vibe.slug && vibe.slug !== vibe.id ? getComments(vibe.slug) : []),
    ];

    const localComments: DisplayComment[] = rawStoreComments.map((c) => ({
      id: c.id,
      author_name: c.author_name || 'Guest',
      author_avatar: c.author_avatar,
      body: c.body,
      created_at: c.created_at,
    }));

    // 2. Database API comments
    const dbComments: DisplayComment[] = [];
    try {
      const res = await fetch(`/api/events/comments?eventId=${encodeURIComponent(targetId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.comments)) {
          for (const item of data.comments) {
            dbComments.push({
              id: item.id,
              author_name: item.user_name || item.author_name || 'User',
              author_avatar: item.user_avatar || item.author_avatar,
              body: item.content || item.body || '',
              created_at: item.created_at,
            });
          }
        }
      }
    } catch {
      // Fallback cleanly to store comments
    }

    // 3. Strict Deduplication: DB comments take priority, followed by local comments
    const seenSignatures = new Set<string>();
    const seenIds = new Set<string>();
    const merged: DisplayComment[] = [];

    // Process database comments first
    for (const c of dbComments) {
      const cleanBody = (c.body || '').trim().toLowerCase();
      const cleanAuthor = (c.author_name || '').trim().toLowerCase();
      const signature = `${cleanAuthor}:::${cleanBody}`;

      if (!seenSignatures.has(signature) && !seenIds.has(c.id)) {
        seenSignatures.add(signature);
        seenIds.add(c.id);
        merged.push(c);
      }
    }

    // Process local store comments (only add if not already in DB comments)
    for (const c of localComments) {
      const cleanBody = (c.body || '').trim().toLowerCase();
      const cleanAuthor = (c.author_name || '').trim().toLowerCase();
      const signature = `${cleanAuthor}:::${cleanBody}`;

      if (!seenSignatures.has(signature) && !seenIds.has(c.id)) {
        seenSignatures.add(signature);
        seenIds.add(c.id);
        merged.push(c);
      }
    }

    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setComments(merged);
    setIsLoading(false);
  }, [vibe.id, vibe.slug]);

  useEffect(() => {
    if (!isOpen) return;
    loadAllComments();
    const unsubscribe = subscribeToStore(loadAllComments);
    return () => unsubscribe();
  }, [isOpen, loadAllComments]);

  // Focus input and escape key listener
  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        setTimeout(() => inputRef.current?.focus(), 200);
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, isAuthenticated]);

  const handleSubmit = async () => {
    // Auth gate check
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    const text = commentText.trim();
    if (!text || isSubmitting) return;

    const finalName = currentProfile?.name || 'Vibe Member';
    const finalEmail = currentProfile?.email || '';
    const finalAvatar = currentProfile?.avatar_url || '';

    const isUUID = (str?: string) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
    const targetId = isUUID(vibe.id) ? vibe.id : (vibe.slug || vibe.id || 'vibe-general');

    setIsSubmitting(true);

    try {
      // 1. Add to local store ONCE using canonical targetId
      const primaryKey = vibe.id || targetId;
      const stored = addComment(primaryKey, finalName, finalEmail, text);

      const newDisplayItem: DisplayComment = {
        id: stored.id,
        author_name: finalName,
        author_avatar: finalAvatar,
        body: text,
        created_at: stored.created_at,
      };

      // 2. Immediately update state without duplicates
      setComments((prev) => {
        const filtered = prev.filter(
          (c) =>
            c.id !== stored.id &&
            !(
              c.author_name.trim().toLowerCase() === finalName.trim().toLowerCase() &&
              c.body.trim().toLowerCase() === text.trim().toLowerCase()
            )
        );
        return [newDisplayItem, ...filtered];
      });

      setCommentText('');

      if (onCommentAdded) {
        onCommentAdded(comments.length + 1);
      }

      // 3. Sync with backend API in background
      try {
        const res = await fetch('/api/events/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: targetId,
            content: text,
            userName: finalName,
            userEmail: finalEmail,
            userAvatar: finalAvatar,
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          // Update the optimistic item with canonical DB id
          if (resData.comment?.id) {
            setComments((prev) =>
              prev.map((c) => (c.id === stored.id ? { ...c, id: resData.comment.id } : c))
            );
          }
        }
      } catch (apiErr) {
        console.warn('Comments API sync note:', apiErr);
      }

      // Celebration confetti
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#FF5500', '#FF8C42', '#FFA07A'],
        });
      } catch {}
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return 'Recently';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="dark-dialog fixed inset-0 z-50 flex flex-col justify-end"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Drawer */}
        <div
          className="relative z-10 w-full max-w-lg mx-auto bg-[#0D0F14] border-t border-white/10 rounded-t-3xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FF5500]/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#FF5500]" />
              </div>
              <span className="text-sm font-black text-white">
                Comments <span className="text-white/50 font-normal">({comments.length})</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 no-scrollbar min-h-[140px] max-h-[45vh]">
            {isLoading && comments.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#FF5500]" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/40 text-xs">No comments yet. Be the first to start the vibe! 🎉</p>
              </div>
            ) : (
              comments.map((cmt) => (
                <div key={cmt.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF5500] to-amber-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm">
                    {(cmt.author_name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {cmt.author_name || 'Member'}
                      </span>
                      <span className="text-[10px] text-white/30 shrink-0">
                        {formatDate(cmt.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed mt-0.5 break-words">
                      {cmt.body}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Auth Gate: User must be signed in to comment */}
          {!isAuthenticated ? (
            <div className="px-5 py-4 border-t border-white/10 bg-[#0D0F14] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0">
                  <User className="w-4.5 h-4.5 text-[#FF5500]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Join the conversation</p>
                  <p className="text-[11px] text-white/40 truncate">Sign in or create an account to comment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FF8C42] hover:opacity-90 text-xs font-bold text-white transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Sign Up</span>
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 border-t border-white/10 bg-[#0D0F14]">
              {/* Authenticated Member Tag */}
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <div className="w-4 h-4 rounded-full bg-[#FF5500]/20 flex items-center justify-center text-[9px] font-bold text-[#FF5500]">
                  {(currentProfile?.name || 'U')[0].toUpperCase()}
                </div>
                <span className="text-[11px] font-medium text-white/40">
                  Commenting as <span className="text-white font-semibold">{currentProfile?.name || currentProfile?.email}</span>
                </span>
              </div>

              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={`What's your take, ${currentProfile?.name?.split(' ')[0] || ''}?`}
                  maxLength={500}
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#FF5500]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!commentText.trim() || isSubmitting}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF5500] to-[#FF8C42] hover:opacity-90 disabled:opacity-40 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal for 1-tap sign in / sign up without losing context */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode="signin"
        onAuthenticated={() => {
          setAuthModalOpen(false);
        }}
      />
    </>
  );
}
