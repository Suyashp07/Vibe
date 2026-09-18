'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, MessageCircle, ArrowRight, User, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EventItem } from '@/types';
import { useAuth } from '@/lib/auth';
import { addRSVP, getRSVPs } from '@/lib/store';
import { nanoid } from 'nanoid';

interface QuickJoinModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickJoinModal({ event, isOpen, onClose, onSuccess }: QuickJoinModalProps) {
  const { profile, isLoggedIn } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  // Prefill user data if available
  useEffect(() => {
    if (isOpen) {
      if (profile?.name) setName(profile.name);
      if (profile?.phone) setPhone(profile.phone);
      setConfirmed(false);
      setError('');
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 8) {
      setError('Please enter a valid phone or WhatsApp number');
      return;
    }

    setSubmitting(true);
    setError('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanEmail = profile?.email || `${cleanPhone}@guest.vibe.community`;

    try {
      // 1. Send RSVP to Supabase backend API
      const res = await fetch('/api/rsvps/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          event_slug: event.slug,
          name: name.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          status: 'confirmed',
          custom_responses: {
            channel: 'vibe_reels_instant',
            flash_activity: event.flash_activity || 'casual',
          },
        }),
      });

      // 2. Save locally in store so passes appear in user dashboard
      addRSVP({
        event_id: event.id,
        event_slug: event.slug,
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        status: 'confirmed',
      });

      // Update spot filled in memory
      event.spots_filled = (event.spots_filled || 0) + 1;

      // Trigger celebratory confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F97316', '#EC4899', '#10B981', '#3B82F6', '#FBBF24'],
        });
      } catch {}

      setConfirmed(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Could not confirm spot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hostPhone = event.whatsapp_host_phone || '919820011223';
  const chatMsg = `Hey ${event.organizer_name || 'Host'}! I just joined your Flash Vibe "${event.title}" on Vibe Instant! My name is ${name || 'a fellow guest'}.`;
  const whatsappUrl = `https://wa.me/${hostPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(chatMsg)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-[#12141A] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-[#E8621A]/30 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!confirmed ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E8621A] text-white flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3" />
                <span>Instant Flash RSVP</span>
              </span>
              <span className="text-xs text-white/50">
                {event.spots_limit ? `${event.spots_limit - (event.spots_filled || 0)} spots left` : 'Spots open'}
              </span>
            </div>

            <h3 className="text-xl font-black text-white leading-snug mb-1">
              {event.title}
            </h3>

            <div className="flex items-center gap-4 text-xs text-white/60 mb-5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#E8621A]" />
                {event.location_name}
              </span>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name or nickname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#E8621A] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                  WhatsApp / Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9820011223"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#E8621A] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-1">
                  Used by the host on WhatsApp to coordinate turf rules & meetup spot.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-[#E8621A] to-[#FF8C42] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#E8621A]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>Reserving your spot...</span>
                ) : (
                  <>
                    <span>⚡ Confirm Spot in 1 Tap</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Confirmation State */
          <div className="text-center py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mb-2">
              🎉 Spot Confirmed!
            </span>

            <h3 className="text-2xl font-black text-white mb-2">
              You're in, {name.split(' ')[0]}!
            </h3>

            <p className="text-xs text-white/70 max-w-xs mx-auto mb-6">
              Your spot is reserved for <strong className="text-white">{event.title}</strong> at {event.location_name}.
            </p>

            <div className="space-y-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Chat with Host on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Back to Reels
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
