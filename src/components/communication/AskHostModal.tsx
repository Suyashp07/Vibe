'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  Mail, 
  User, 
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { EventItem } from '@/types';
import { sendEventMessage } from '@/lib/store';

interface AskHostModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultName?: string;
}

export default function AskHostModal({
  event,
  isOpen,
  onClose,
  defaultEmail = '',
  defaultName = ''
}: AskHostModalProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [subjectTag, setSubjectTag] = useState<string>('General Inquiry');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      if (!name && typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('vibe_current_user_v1');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.name) setName(parsed.name);
            if (parsed.email) setEmail(parsed.email);
          } catch {}
        }
      }
    }
  }, [isOpen, name]);

  if (!isOpen) return null;

  const quickTopics = [
    'Venue & Parking',
    'Dietary & Food',
    'Dress Code',
    'Accessibility',
    'Schedule & Timing',
    'General Inquiry'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const hostEmail = (event as any).organizer_email || `${event.organizer_handle || 'host'}@swaniki.com`;
      const subject = `[${subjectTag}] Question about ${event.title}`;

      // 1. Save in store
      sendEventMessage({
        event_id: event.id,
        sender_role: 'guest',
        sender_name: name.trim(),
        sender_email: email.trim(),
        recipient_email: hostEmail,
        subject,
        message: message.trim()
      });

      // 2. Dispatch via API for email alert to host
      try {
        await fetch('/api/communication/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            senderRole: 'guest',
            senderName: name.trim(),
            senderEmail: email.trim(),
            recipientEmail: hostEmail,
            recipientName: event.organizer_name || 'Host',
            subject,
            message: message.trim(),
            event,
            notifyEmail: true
          })
        });
      } catch (apiErr) {
        console.warn('API message notification warning:', apiErr);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setMessage('');
        setIsSubmitting(false);
      }, 800);
    } catch (err) {
      console.error('Failed to submit question to host:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                Ask {event.organizer_name || 'the Host'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-xs">
                Private direct inquiry for <span className="font-medium text-stone-700 dark:text-stone-300">{event.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-50 dark:border-emerald-900/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-stone-900 dark:text-white">Message Sent to Host!</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                  Your question has been forwarded to <strong>{event.organizer_name}</strong>. Their response will be emailed to <strong>{email}</strong>.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold shadow transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Topic Chips */}
              <div>
                <label className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-2">
                  Topic of Inquiry
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickTopics.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSubjectTag(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        subjectTag === t
                          ? 'bg-orange-600 text-white shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Aarav Sharma"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                    Your Email (for response)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g., aarav@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block mb-1">
                  Your Question
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={`Ask ${event.organizer_name} anything regarding entry, schedule, amenities, or special requests...`}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/30 border border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Your contact info is kept strictly private and only shared with {event.organizer_name} to answer your request.</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !email.trim() || !message.trim()}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 disabled:opacity-50 transition"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send to Host
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
