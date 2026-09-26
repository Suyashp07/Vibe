'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  CheckCheck,
  Clock,
  Shield,
  Bot,
  User,
  Info
} from 'lucide-react';
import { EventItem, Conversation, ConversationMessage } from '@/types';
import { useAuth, getLocalAuthSession } from '@/lib/auth';
import { subscribeToConversationRealtime } from '@/lib/supabase';

interface EventConversationModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  guestName?: string;
  guestEmail?: string;
}

export default function EventConversationModal({
  event,
  isOpen,
  onClose,
  guestName,
  guestEmail,
}: EventConversationModalProps) {
  const { user, profile } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Derive stable guest ID, name, and email from session or props
  const localSession = typeof window !== 'undefined' ? getLocalAuthSession() : null;

  const getAnonymousGuestId = () => {
    if (typeof window === 'undefined') return 'anon-guest';
    let anonId = sessionStorage.getItem('vibe_anon_guest_id');
    if (!anonId) {
      anonId = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('vibe_anon_guest_id', anonId);
    }
    return anonId;
  };

  const effectiveGuestId = React.useMemo(() => {
    return user?.id || profile?.id || localSession?.id || localSession?.email || guestEmail || getAnonymousGuestId();
  }, [user?.id, profile?.id, localSession?.id, localSession?.email, guestEmail]);

  const effectiveGuestName =
    profile?.name || user?.user_metadata?.full_name || localSession?.name || guestName || 'Event Guest';
  const effectiveGuestEmail =
    user?.email || profile?.email || localSession?.email || guestEmail || '';

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize or fetch conversation
  useEffect(() => {
    if (!isOpen) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      setConversation(null);
      setMessages([]);
      setErrorBanner(null);
      return;
    }

    let isSubscribed = true;

    async function initConversation() {
      setIsLoading(true);
      setErrorBanner(null);
      try {
        const res = await fetch('/api/communication/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: event.id,
            guestId: effectiveGuestId,
            guestName: effectiveGuestName,
            guestEmail: effectiveGuestEmail,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to open conversation.');
        }

        if (isSubscribed && data.conversation) {
          setConversation(data.conversation);
          await loadMessages(data.conversation.id);
        }
      } catch (err: any) {
        if (isSubscribed) {
          setErrorBanner(err.message || 'Unable to connect to host communication gateway.');
        }
      } finally {
        if (isSubscribed) setIsLoading(false);
      }
    }

    initConversation();

    return () => {
      isSubscribed = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, event.id, effectiveGuestId]);

  // Load messages
  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(
        `/api/communication/conversations/${convId}/messages?guestId=${encodeURIComponent(
          effectiveGuestId
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
        if (data.conversation) {
          setConversation(data.conversation);
        }
      }
    } catch (err) {
      console.warn('[EventConversationModal] Poll fetch error:', err);
    }
  };

  // Set up Supabase Realtime + lightweight 15s fallback poll only when active
  useEffect(() => {
    if (!conversation?.id || !isOpen) return;

    // 1. Supabase Realtime channel
    const unsubscribe = subscribeToConversationRealtime(conversation.id, () => {
      loadMessages(conversation.id);
    });

    // 2. Polite fallback polling every 15s
    pollTimerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadMessages(conversation.id);
      }
    }, 15000);

    return () => {
      unsubscribe();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [conversation?.id, isOpen]);

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    if (isSending) return; // Prevent duplicate submissions

    const text = (textToSend || inputText).trim();
    if (!text || !conversation) return;

    if (conversation.status === 'CLOSED') {
      setErrorBanner('This conversation has been closed by the host.');
      return;
    }

    setIsSending(true);
    setErrorBanner(null);

    // If retrying, filter out the previous failed temporary message
    if (textToSend) {
      setMessages((prev) =>
        prev.filter((m) => !(m.content === textToSend && m.delivery_status === 'FAILED'))
      );
    }

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ConversationMessage = {
      id: tempId,
      conversation_id: conversation.id,
      event_id: event.id,
      sender_id: effectiveGuestId,
      sender_role: 'GUEST',
      content: text,
      channel: 'WEB',
      delivery_status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    if (!textToSend) setInputText('');

    try {
      const res = await fetch(`/api/communication/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: effectiveGuestId,
          content: text,
          senderRole: 'GUEST',
          guestName: effectiveGuestName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to deliver message.');
      }

      // Replace optimistic message with actual persisted message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m))
      );
    } catch (err: any) {
      setErrorBanner(err.message || 'Message delivery failed. You can retry.');
      // Mark optimistic message as FAILED
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, delivery_status: 'FAILED' as const } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time in IST
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  const isClosed = conversation?.status === 'CLOSED';
  const organizerName = event.organizer_name || 'Event Host';

  const modalBody = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-sm shadow-orange-500/20 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white truncate">
                  Ask {organizerName}
                </h3>
                {isClosed ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full">
                    Closed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Host Active
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                Private gateway for <span className="font-medium text-stone-700 dark:text-stone-300">{event.title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Close conversation"
            >
              <X className="w-5 h-5 pointer-events-none" />
            </button>
          </div>
        </div>

        {/* Privacy Notice Subheader */}
        <div className="px-4 py-2 bg-stone-100/60 dark:bg-stone-800/40 border-b border-stone-200/50 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5 truncate">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Private Communication: Host phone number is never exposed.</span>
          </div>
          <span className="shrink-0 text-stone-400 dark:text-stone-500 text-[10px] flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Direct Host Chat
          </span>
        </div>

        {/* Error / Alert Banner */}
        {errorBanner && (
          <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Closed Banner */}
        {isClosed && (
          <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>This conversation has been closed by the host. New messages cannot be sent.</span>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-gradient-to-b from-stone-50/30 to-white dark:from-stone-900/30 dark:to-stone-900">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <p className="text-xs font-medium">Connecting to host...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 max-w-sm mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                  Send your question to {organizerName}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  Ask about venue, parking, timing, or accessibility. The host replies directly to you here.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                {['Is parking available?', 'Can I bring a +1?', 'What is the dress code?'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInputText(suggestion);
                      handleSendMessage(suggestion);
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 border border-stone-200/60 dark:border-stone-700/60 transition"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isGuest = msg.sender_role === 'GUEST';
              const isHost = msg.sender_role === 'HOST';
              const isSystem = msg.sender_role === 'SYSTEM';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200/50 dark:border-stone-700/50">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isGuest ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                      {isGuest ? 'You' : `${organizerName} (Host)`}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isGuest
                        ? 'bg-orange-600 text-white rounded-tr-sm'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-tl-sm border border-stone-200/50 dark:border-stone-700/50'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>

                  {/* Delivery Status Indicator for Guest Messages */}
                  {isGuest && (
                    <div className="flex items-center gap-1 mt-1 px-1 text-[10px]">
                      {msg.delivery_status === 'PENDING' && (
                        <span className="flex items-center gap-1 text-stone-400">
                          <Clock className="w-3 h-3 animate-spin" />
                          <span>Sending to host...</span>
                        </span>
                      )}
                      {msg.delivery_status === 'SENT' && (
                        <span className="flex items-center gap-1 text-stone-400" title="Sent to host">
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Sent</span>
                        </span>
                      )}
                      {msg.delivery_status === 'DELIVERED' && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Delivered to host">
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </span>
                      )}
                      {msg.delivery_status === 'FAILED' && (
                        <button
                          onClick={() => handleSendMessage(msg.content)}
                          className="flex items-center gap-1 text-rose-500 hover:text-rose-600 font-semibold underline transition"
                          title="Click to retry"
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>Delivery failed. Retry?</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Composer Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
          {isClosed ? (
            <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800 text-center text-xs text-stone-500 dark:text-stone-400 font-medium">
              This conversation has been closed by the host.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => {
                      if (e.target.value.length <= 2000) {
                        setInputText(e.target.value);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${organizerName}...`}
                    rows={2}
                    maxLength={2000}
                    disabled={isSending}
                    className="w-full resize-none rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition disabled:opacity-50"
                  />
                  <span className="absolute right-3 bottom-2 text-[10px] text-stone-400">
                    {inputText.length}/2000
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isSending}
                  className="h-11 px-4 rounded-2xl bg-orange-600 hover:bg-orange-500 disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white disabled:text-stone-400 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-orange-600/20 transition-all shrink-0 active:scale-95"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-stone-400 dark:text-stone-500 px-1 text-center sm:text-left">
                Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(modalBody, document.body) : null;
}
