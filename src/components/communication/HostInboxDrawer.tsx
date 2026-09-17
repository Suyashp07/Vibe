'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Inbox, 
  MessageSquare, 
  Send, 
  Check, 
  CheckCheck, 
  Clock, 
  User, 
  Calendar, 
  Mail, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { EventItem, EventDirectMessage } from '@/types';
import { 
  getEventMessages, 
  sendEventMessage, 
  markEventMessageRead, 
  subscribeToStore, 
  formatIST 
} from '@/lib/store';

interface HostInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events?: EventItem[];
  selectedEventId?: string;
}

export default function HostInboxDrawer({
  isOpen,
  onClose,
  events = [],
  selectedEventId
}: HostInboxDrawerProps) {
  const [messages, setMessages] = useState<EventDirectMessage[]>([]);
  const [activeEventFilter, setActiveEventFilter] = useState<string>(selectedEventId || 'all');
  const [selectedThreadParentId, setSelectedThreadParentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [search, setSearch] = useState('');

  const loadMessages = () => {
    const all = getEventMessages();
    setMessages(all);
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const unsub = subscribeToStore(() => loadMessages());
      return () => unsub();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedEventId) {
      setActiveEventFilter(selectedEventId);
    }
  }, [selectedEventId]);

  if (!isOpen) return null;

  // Filter messages
  const filteredMessages = messages.filter(m => {
    if (activeEventFilter !== 'all' && m.event_id !== activeEventFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.sender_name.toLowerCase().includes(q) ||
        m.sender_email.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        (m.subject && m.subject.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Group into root inquiries (parent messages without parent_id or where parent_id is null)
  const rootInquiries = filteredMessages.filter(m => !m.parent_id);

  // Active thread
  const activeRoot = selectedThreadParentId 
    ? messages.find(m => m.id === selectedThreadParentId) 
    : rootInquiries[0] || null;

  const threadReplies = activeRoot 
    ? messages.filter(m => m.parent_id === activeRoot.id) 
    : [];

  const activeEvent = events.find(e => e.id === activeRoot?.event_id);

  const handleSelectThread = (rootMsg: EventDirectMessage) => {
    setSelectedThreadParentId(rootMsg.id);
    if (!rootMsg.is_read) {
      markEventMessageRead(rootMsg.id);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeRoot) return;

    setIsReplying(true);
    try {
      const hostName = activeEvent?.organizer_name || 'Event Host';
      const hostEmail = (activeEvent as any)?.organizer_email || `${activeEvent?.organizer_handle || 'host'}@swaniki.com`;

      // 1. Store locally
      const reply = sendEventMessage({
        event_id: activeRoot.event_id,
        sender_role: 'host',
        sender_name: hostName,
        sender_email: hostEmail,
        recipient_email: activeRoot.sender_email,
        parent_id: activeRoot.id,
        subject: `Re: ${activeRoot.subject || 'Your question'}`,
        message: replyText.trim(),
        is_read: true
      });

      // 2. Mark root inquiry as read
      markEventMessageRead(activeRoot.id);

      // 3. Dispatch via API for email alert to guest
      try {
        await fetch('/api/communication/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: activeRoot.event_id,
            senderRole: 'host',
            senderName: hostName,
            senderEmail: hostEmail,
            recipientEmail: activeRoot.sender_email,
            recipientName: activeRoot.sender_name,
            subject: `Re: ${activeRoot.subject || 'Your question'}`,
            message: replyText.trim(),
            parentId: activeRoot.id,
            event: activeEvent,
            notifyEmail: true
          })
        });
      } catch (apiErr) {
        console.warn('API reply notification warning:', apiErr);
      }

      setReplyText('');
      setIsReplying(false);
      loadMessages();
    } catch (err) {
      console.error('Failed to send reply:', err);
      setIsReplying(false);
    }
  };

  const unreadCount = rootInquiries.filter(m => !m.is_read && m.sender_role === 'guest').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-900 dark:text-white flex items-center gap-2">
                Guest Communication Inbox
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Direct Q&A inquiries and private messages from your event attendees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Message list */}
          <div className="w-80 border-r border-stone-200 dark:border-stone-800 flex flex-col bg-stone-50/40 dark:bg-stone-900/40">
            {/* Search & Event selector */}
            <div className="p-3 border-b border-stone-200 dark:border-stone-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search inquiries..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {events.length > 1 && (
                <select
                  value={activeEventFilter}
                  onChange={e => setActiveEventFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
                >
                  <option value="all">All Events ({rootInquiries.length})</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60">
              {rootInquiries.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-stone-400">
                  <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs">No guest messages yet.</p>
                </div>
              ) : (
                rootInquiries.map(item => {
                  const isSelected = activeRoot?.id === item.id;
                  const itemEvent = events.find(e => e.id === item.event_id);
                  const replies = messages.filter(m => m.parent_id === item.id);
                  const hasUnread = !item.is_read && item.sender_role === 'guest';

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectThread(item)}
                      className={`w-full text-left p-3.5 transition flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'bg-orange-500/10 dark:bg-orange-950/40 border-l-4 border-orange-500' 
                          : 'hover:bg-white dark:hover:bg-stone-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-bold truncate ${hasUnread ? 'text-orange-600 dark:text-orange-400' : 'text-stone-900 dark:text-white'}`}>
                          {item.sender_name}
                        </span>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {formatIST(item.created_at)}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-stone-700 dark:text-stone-300 truncate">
                        {item.subject || 'Question regarding event'}
                      </div>

                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-stone-400 truncate max-w-[120px]">
                          {itemEvent ? itemEvent.title : 'Event'}
                        </span>
                        {replies.length > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" />
                            {replies.length} replied
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Active Thread & Reply */}
          <div className="flex-1 flex flex-col bg-white dark:bg-stone-900">
            {activeRoot ? (
              <>
                {/* Thread Header */}
                <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/30 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                      {activeRoot.subject || 'Event Inquiry'}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                      <span>From: <strong>{activeRoot.sender_name}</strong> ({activeRoot.sender_email})</span>
                      {activeEvent && (
                        <span>• Event: <strong>{activeEvent.title}</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Messages conversation flow */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Guest Initial Inquiry */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0">
                      {activeRoot.sender_name.charAt(0)}
                    </div>
                    <div className="max-w-lg bg-stone-100 dark:bg-stone-800 rounded-2xl rounded-tl-none p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs font-bold text-stone-900 dark:text-white">
                          {activeRoot.sender_name}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {formatIST(activeRoot.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
                        {activeRoot.message}
                      </p>
                    </div>
                  </div>

                  {/* Host Replies */}
                  {threadReplies.map(reply => (
                    <div key={reply.id} className="flex items-start justify-end gap-3">
                      <div className="max-w-lg bg-orange-600 text-white rounded-2xl rounded-tr-none p-4 space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-orange-100 flex items-center gap-1">
                            {reply.sender_name} (Host)
                          </span>
                          <span className="text-[10px] text-orange-200">
                            {formatIST(reply.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        H
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={`Reply directly to ${activeRoot.sender_name}...`}
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      className="w-full pl-4 pr-24 py-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    />
                    <button
                      type="submit"
                      disabled={isReplying || !replyText.trim()}
                      className="absolute right-2 px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
                    >
                      {isReplying ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          Reply
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2 px-1">
                    <span>Replies are saved to the thread and emailed to {activeRoot.sender_email}.</span>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
                <Inbox className="w-12 h-12 opacity-30 mb-2" />
                <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">No inquiry selected</h4>
                <p className="text-xs max-w-xs mt-1">Select an inquiry from the left to view the full question and send a response.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
