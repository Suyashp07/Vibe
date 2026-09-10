'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { CommentItem } from '@/types';
import { getComments, addComment, subscribeToStore } from '@/lib/store';

interface GuestCommentsProps {
  eventId: string;
  cardClass?: string;
  innerCardClass?: string;
  borderClass?: string;
  headingClass?: string;
  textSecondary?: string;
  textMuted?: string;
  accentColor?: string;
  buttonPrimary?: string;
}

export default function GuestComments({
  eventId,
  cardClass,
  innerCardClass,
  borderClass,
  headingClass,
  textSecondary,
  textMuted,
  accentColor,
  buttonPrimary
}: GuestCommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>(() => getComments(eventId));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justPosted, setJustPosted] = useState(false);

  useEffect(() => {
    const update = () => setComments(getComments(eventId));
    const unsubscribe = subscribeToStore(update);
    return () => unsubscribe();
  }, [eventId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !body.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      addComment(eventId, name.trim(), email.trim(), body.trim());
      setBody('');
      setIsSubmitting(false);
      setJustPosted(true);
      setTimeout(() => setJustPosted(false), 3000);
    }, 250);
  };

  return (
    <div className={`${cardClass || 'space-y-6'}`}>
      <div className={`flex items-center justify-between border-b ${borderClass || 'border-border'} pb-3.5`}>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" style={{ color: accentColor || '#E8621A' }} />
          <h3 className={headingClass || 'font-display font-bold text-lg text-ink'}>
            Guest Notes & Questions <span className={`text-sm font-normal ${textMuted || 'text-ink-muted'}`}>({comments.length})</span>
          </h3>
        </div>
        <span className={`text-xs ${textMuted || 'text-ink-muted'}`}>All confirmed & prospective guests</span>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className={`${innerCardClass || 'bg-surface text-ink rounded-xl border border-border shadow-sm'} p-4 space-y-3 mt-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full text-sm px-3.5 py-2 rounded-xl border ${borderClass || 'border-border'} bg-black/10 dark:bg-white/5 placeholder:opacity-60 focus:outline-none transition-colors`}
          />
          <input
            type="email"
            required
            placeholder="Your email (kept private)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full text-sm px-3.5 py-2 rounded-xl border ${borderClass || 'border-border'} bg-black/10 dark:bg-white/5 placeholder:opacity-60 focus:outline-none transition-colors`}
          />
        </div>

        <div className="relative">
          <textarea
            required
            rows={2}
            placeholder="Leave a note for the organizer or other guests..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`w-full text-sm px-3.5 py-2 rounded-xl border ${borderClass || 'border-border'} bg-black/10 dark:bg-white/5 placeholder:opacity-60 focus:outline-none transition-colors resize-none`}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          {justPosted ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Note posted!
            </span>
          ) : (
            <span className={`text-xs ${textMuted || 'text-ink-muted'}`}>Be kind and constructive.</span>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !body.trim()}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover-lift disabled:opacity-50 transition-all ${buttonPrimary || 'bg-brand hover:bg-brand-mid text-white'}`}
          >
            <Send className="w-3 h-3" />
            <span>{isSubmitting ? 'Posting...' : 'Post Note'}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3.5 mt-5">
        {comments.length === 0 ? (
          <p className={`text-sm ${textMuted || 'text-ink-muted'} text-center py-6`}>
            No notes yet. Share your excitement or ask a question!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`${innerCardClass || 'bg-surface rounded-xl border border-border shadow-card'} p-4 flex items-start gap-3.5`}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-white/15">
                <Image
                  src={comment.author_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comment.author_name)}`}
                  alt={comment.author_name}
                  width={36}
                  height={36}
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">
                    {comment.author_name}
                  </span>
                  <span className={`text-[11px] ${textMuted || 'text-ink-muted'} whitespace-nowrap`}>
                    {new Date(comment.created_at).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <p className={`text-sm ${textSecondary || 'text-ink-secondary'} leading-relaxed`}>
                  {comment.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
