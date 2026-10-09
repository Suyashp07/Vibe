'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
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
  const { profile } = useAuth();
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Initialize author name from profile or local storage
  useEffect(() => {
    if (profile?.name) {
      setAuthorName(profile.name);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vibe_guest_name');
      if (saved) setAuthorName(saved);
    }
  }, [profile?.name]);

  // Load comments for the current vibe
  const loadAllComments = useCallback(async () => {
    if (!vibe.id && !vibe.slug) return;
    setIsLoading(true);

    const targetId = vibe.id || vibe.slug || '';
    const map = new Map<string, DisplayComment>();

    // 1. Local store comments
    const storeComments: CommentItem[] = [
      ...(vibe.id ? getComments(vibe.id) : []),
      ...(vibe.slug && vibe.slug !== vibe.id ? getComments(vibe.slug) : []),
    ];

    for (const c of storeComments) {
      map.set(c.id, {
        id: c.id,
        author_name: c.author_name || 'Guest',
        author_avatar: c.author_avatar,
        body: c.body,
        created_at: c.created_at,
      });
    }

    // 2. Database API comments
    try {
      const res = await fetch(`/api/events/comments?eventId=${encodeURIComponent(targetId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.comments)) {
          for (const item of data.comments) {
            map.set(item.id, {
              id: item.id,
              author_name: item.user_name || item.author_name || 'Guest',
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

    const merged = Array.from(map.values());
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
      setTimeout(() => inputRef.current?.focus(), 200);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    const text = commentText.trim();
    if (!text || isSubmitting) return;

    const finalName = authorName.trim() || profile?.name || 'Guest';
    const finalEmail = profile?.email || `${finalName.toLowerCase().replace(/\s+/g, '')}@vibe.community`;
    const targetId = vibe.id || vibe.slug || 'vibe-general';

    setIsSubmitting(true);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vibe_guest_name', finalName);
      }

      // Add to local store immediately for instant UI response
      const stored = addComment(targetId, finalName, finalEmail, text);
      const newDisplayItem: DisplayComment = {
        id: stored.id,
        author_name: finalName,
        body: text,
        created_at: stored.created_at,
      };

      setComments((prev) => [newDisplayItem, ...prev.filter((c) => c.id !== stored.id)]);
      setCommentText('');

      if (onCommentAdded) {
        onCommentAdded(comments.length + 1);
      }

      // Sync with backend API in background
      fetch('/api/events/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: targetId,
          content: text,
          userName: finalName,
          userEmail: finalEmail,
        }),
      }).catch(() => {});

      // Celebration confetti
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#E8621A', '#FF8C42', '#FFA07A'],
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
        className="relative z-10 w-full max-w-lg mx-auto bg-[#0D0F14] border-t border-white/10 rounded-t-3xl max-h-[65vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E8621A]/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#E8621A]" />
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
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 no-scrollbar min-h-[140px] max-h-[35vh]">
          {isLoading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#E8621A]" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/40 text-xs">No comments yet. Be the first! 🎉</p>
            </div>
          ) : (
            comments.map((cmt) => (
              <div key={cmt.id} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8621A] to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {(cmt.author_name || 'G')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {cmt.author_name || 'Guest'}
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

        {/* Comment Input */}
        <div className="px-4 py-3 border-t border-white/10 bg-[#0D0F14]">
          {/* Guest Name input if not logged in */}
          {!profile?.name && (
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 mb-2 focus:outline-none focus:border-[#E8621A]/50"
            />
          )}

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
              placeholder="Add a comment..."
              maxLength={500}
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#E8621A]/50 transition-colors"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!commentText.trim() || isSubmitting}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-90 disabled:opacity-40 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
