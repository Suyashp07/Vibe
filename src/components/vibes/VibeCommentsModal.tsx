'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  MessageSquare,
  Send,
  X,
  Heart,
  Sparkles,
  CheckCircle2,
  Users,
  CornerDownRight,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CommentItem } from '@/types';
import { getComments, addComment, subscribeToStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';

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

export default function VibeCommentsModal({
  isOpen,
  onClose,
  vibe,
  onCommentAdded,
}: VibeCommentsModalProps) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load name from profile or local storage
  useEffect(() => {
    if (profile?.name) {
      setAuthorName(profile.name);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vibe_guest_name');
      if (saved) setAuthorName(saved);
    }
  }, [profile?.name]);

  // Sync comments for current vibe
  useEffect(() => {
    if (!vibe.id && !vibe.slug) return;
    const loadComments = () => {
      // Check both ID and slug in case comments were saved under either
      const byId = vibe.id ? getComments(vibe.id) : [];
      const bySlug = vibe.slug && vibe.slug !== vibe.id ? getComments(vibe.slug) : [];
      const merged = [...byId];
      for (const c of bySlug) {
        if (!merged.some((m) => m.id === c.id)) {
          merged.push(c);
        }
      }
      // Sort newest first
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setComments(merged);
    };

    loadComments();
    const unsubscribe = subscribeToStore(loadComments);
    return () => unsubscribe();
  }, [vibe.id, vibe.slug]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    const finalName = authorName.trim() || profile?.name || 'Anonymous Guest';
    const finalEmail = profile?.email || `${finalName.toLowerCase().replace(/\s+/g, '')}@vibe.community`;

    setIsSubmitting(true);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vibe_guest_name', finalName);
      }

      // Add to store with vibe.id (or vibe.slug)
      const targetId = vibe.id || vibe.slug || 'vibe-general';
      const newComment = addComment(targetId, finalName, finalEmail, text);

      setComments((prev) => [newComment, ...prev]);
      setCommentText('');

      if (onCommentAdded) {
        onCommentAdded(comments.length + 1);
      }

      // Small confetti burst
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#FF5500', '#FF8C42', '#FFA07A'],
      });
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCommentLike = (commentId: string) => {
    setLikedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-text"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer / Modal Container */}
      <div
        className="relative z-10 w-full md:max-w-md bg-[#111115] border-t md:border border-white/15 rounded-t-[32px] md:rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.85)] max-h-[85dvh] md:max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-250 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull handle on mobile */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#141419]/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#FF5500]/15 border border-[#FF5500]/30 flex items-center justify-center text-[#FF5500] shrink-0">
              <MessageSquare className="w-4 h-4 fill-[#FF5500]/20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight truncate">
                  Comments
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                  {comments.length}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 truncate max-w-[220px] sm:max-w-[280px]">
                {vibe.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
            aria-label="Close comments"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comments Feed */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar min-h-[220px]">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
                <Sparkles className="w-6 h-6 text-[#FF5500]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">No comments yet</p>
                <p className="text-xs text-neutral-400 mt-1 max-w-[240px]">
                  Be the first to share your thoughts, ask questions, or hype up this vibe!
                </p>
              </div>
            </div>
          ) : (
            comments.map((comment) => {
              const isLiked = likedComments[comment.id];
              const isHost = vibe.host_name && comment.author_name.toLowerCase().includes(vibe.host_name.toLowerCase());

              return (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 group animate-in fade-in duration-200"
                >
                  {/* Author Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#FF5500] to-purple-600 flex items-center justify-center text-white text-xs font-black shrink-0 border border-white/15 shadow-sm">
                    {comment.author_avatar ? (
                      <img
                        src={comment.author_avatar}
                        alt={comment.author_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      comment.author_name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  {/* Comment Bubble */}
                  <div className="flex-1 min-w-0 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 rounded-2xl p-3 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-white truncate">
                          {comment.author_name}
                        </span>
                        {isHost && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30 shrink-0">
                            Host
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 shrink-0">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-200 leading-relaxed break-words">
                      {comment.body}
                    </p>

                    {/* Quick Reaction Bar */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                      <span className="text-[10px] text-neutral-500">
                        {isLiked ? 'Liked by you' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCommentLike(comment.id)}
                        className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer px-1.5 py-0.5 rounded-md ${
                          isLiked
                            ? 'text-[#FF5500] font-bold'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isLiked ? 'fill-[#FF5500] text-[#FF5500]' : ''
                          }`}
                        />
                        <span>{isLiked ? 1 : 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Composer Input Form */}
        <form
          onSubmit={handleSubmit}
          className="p-3.5 border-t border-white/10 bg-[#141419] shrink-0 space-y-2"
        >
          {/* Author Name row (if guest/not logged in) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider shrink-0">
              Posting as:
            </span>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
              className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-white placeholder-white/30 focus:outline-none focus:border-[#FF5500]/60 transition-colors"
            />
          </div>

          {/* Text Input + Send Button */}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Add a comment or ask a question..."
              maxLength={400}
              className="flex-1 text-xs bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#FF5500]/60 transition-colors resize-none leading-relaxed max-h-24"
            />

            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="w-9 h-9 rounded-xl bg-[#FF5500] hover:bg-[#E04B00] disabled:opacity-40 disabled:hover:bg-[#FF5500] text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-[0_0_15px_rgba(255,85,0,0.3)] active:scale-95"
              title="Post comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500 px-1">
            <span>Press Enter to send</span>
            <span>{commentText.length}/400</span>
          </div>
        </form>
      </div>
    </div>
  );
}
