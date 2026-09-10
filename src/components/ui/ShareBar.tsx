'use client';

import React, { useState } from 'react';
import { Share2, Check, Calendar as CalendarIcon, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { EventItem } from '@/types';
import { generateGoogleCalendarUrl, downloadICS } from '@/lib/store';

interface ShareBarProps {
  event: EventItem;
  onOpenBanners?: () => void;
  cardClass?: string;
  innerCardClass?: string;
  borderClass?: string;
  textClass?: string;
  textSecondaryClass?: string;
  textMutedClass?: string;
  accentColor?: string;
}

export default function ShareBar({
  event,
  onOpenBanners,
  cardClass,
  innerCardClass,
  borderClass,
  textClass,
  textSecondaryClass,
  textMutedClass,
  accentColor
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [showCalMenu, setShowCalMenu] = useState(false);

  const eventUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${event.slug}`
    : `https://vibe.swaniki.app/${event.slug}`;

  // Pre-filled WhatsApp message with Indian context & emojis
  const defaultWhatsAppText = event.whatsapp_caption ||
    `Hey! Check out "${event.title}" on ${new Date(event.start_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} in ${event.city}.\n\nRSVP here: ${eventUrl}`;

  const waLink = `https://wa.me/?text=${encodeURIComponent(defaultWhatsAppText + '\n' + eventUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`${cardClass || 'bg-surface rounded-2xl border border-border shadow-card'} p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors`}>
      {/* Left Text */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: accentColor ? `${accentColor}18` : undefined,
            color: accentColor || '#E8621A',
            border: accentColor ? `1px solid ${accentColor}35` : undefined
          }}
        >
          <Share2 className="w-4 h-4" />
        </div>
        <div>
          <span className={`text-xs uppercase font-bold tracking-wider block ${textClass || 'text-ink'}`}>
            Invite Friends & Colleagues
          </span>
          <span className={`text-[11px] ${textMutedClass || 'text-ink-muted'}`}>
            Share on WhatsApp or export to calendar
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* PRIMARY CTA: WhatsApp Share */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold shadow-sm hover-lift transition-all"
        >
          {/* WhatsApp SVG Icon */}
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span>Share on WhatsApp</span>
        </a>

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all hover-lift ${
            innerCardClass || 'bg-surface-3 hover:bg-border text-ink border-border'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 opacity-70" />}
          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>

        {/* Social Banner generator trigger */}
        {onOpenBanners && (
          <button
            onClick={onOpenBanners}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all hover-lift"
            title="Download Instagram & WhatsApp story banners"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Story Banners</span>
          </button>
        )}

        {/* Calendar Menu */}
        <div className="relative">
          <button
            onClick={() => setShowCalMenu(!showCalMenu)}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all hover-lift ${
              innerCardClass || 'bg-surface-3 hover:bg-border text-ink border-border'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" style={{ color: accentColor || '#E8621A' }} />
            <span>Add to Calendar</span>
          </button>

          {showCalMenu && (
            <div className={`absolute right-0 bottom-full mb-2 w-52 rounded-xl border shadow-elevated p-2 z-30 animate-in fade-in zoom-in-95 duration-150 ${
              cardClass || 'bg-surface border-border text-ink'
            }`}>
              <a
                href={generateGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowCalMenu(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-85 ${
                  innerCardClass || 'hover:bg-surface-3 text-ink'
                }`}
              >
                <span>Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
              <button
                onClick={() => {
                  downloadICS(event);
                  setShowCalMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-85 text-left ${
                  innerCardClass || 'hover:bg-surface-3 text-ink'
                }`}
              >
                <span>Apple / Outlook (.ics)</span>
                <Download className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
