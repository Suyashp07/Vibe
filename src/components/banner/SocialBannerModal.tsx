'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Square,
  Monitor,
  Zap,
  BookOpen,
  Ticket,
  Palette,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { EventItem, TemplateType } from '@/types';
import { formatIST } from '@/lib/store';

interface SocialBannerModalProps {
  event: EventItem;
  isOpen: boolean;
  onClose: () => void;
}

type BannerFormat = 'whatsapp' | 'story' | 'post';
export type BannerStyle = 'poster' | 'cyber' | 'editorial' | 'ticket' | 'classic';

export default function SocialBannerModal({ event, isOpen, onClose }: SocialBannerModalProps) {
  const [activeFormat, setActiveFormat] = useState<BannerFormat>('whatsapp');
  const [activeStyle, setActiveStyle] = useState<BannerStyle>('poster');
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(event.template || 'grove');
  const [isZipping, setIsZipping] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  // Format dimensions & metadata
  const formats = {
    whatsapp: {
      name: 'WhatsApp Banner',
      ratio: '16:9',
      width: 1280,
      height: 720,
      aspectClass: 'aspect-video w-full max-w-xl',
      icon: Monitor,
      desc: 'Ideal for WhatsApp broadcasts, chat attachments & Twitter/LinkedIn previews'
    },
    story: {
      name: 'Instagram Story',
      ratio: '9:16',
      width: 1080,
      height: 1920,
      aspectClass: 'aspect-[9/16] max-h-[480px] w-auto',
      icon: Smartphone,
      desc: 'Optimized for full-screen mobile Instagram and WhatsApp status stories'
    },
    post: {
      name: 'Instagram Post',
      ratio: '1:1',
      width: 1080,
      height: 1080,
      aspectClass: 'aspect-square max-h-[440px] w-auto',
      icon: Square,
      desc: 'Square post format for feeds and carousels'
    }
  };

  // Aesthetic Visual Styles
  const bannerStyles: Array<{
    id: BannerStyle;
    name: string;
    icon: any;
    desc: string;
    badge: string;
  }> = [
    {
      id: 'poster',
      name: 'Vibrant Poster',
      icon: Sparkles,
      desc: 'High-contrast hero visual with vivid gradient glow & prominent cover art',
      badge: 'POPULAR'
    },
    {
      id: 'cyber',
      name: 'Neo-Cyber',
      icon: Zap,
      desc: 'Brutalist tech grid with punchy neon borders & monospace tags',
      badge: 'TECH'
    },
    {
      id: 'editorial',
      name: 'Minimal Editorial',
      icon: BookOpen,
      desc: 'Sophisticated luxury serif typography with elegant architectural frame',
      badge: 'CHIC'
    },
    {
      id: 'ticket',
      name: 'VIP Pass Ticket',
      icon: Ticket,
      desc: 'Collectible admission stub with dashed perforation & barcode',
      badge: 'VIP'
    },
    {
      id: 'classic',
      name: 'Atmospheric Dark',
      icon: Layers,
      desc: 'Signature ambient dark mode with glowing color orbs & frosted pills',
      badge: 'ORIGINAL'
    }
  ];

  // Palette color presets
  const palettes: Array<{ id: TemplateType; name: string; hex: string }> = [
    { id: 'grove', name: 'Grove', hex: '#2DD4BF' },
    { id: 'sprint', name: 'Sprint', hex: '#38BDF8' },
    { id: 'bloom', name: 'Bloom', hex: '#FB923C' },
    { id: 'vertex', name: 'Vertex', hex: '#C084FC' },
    { id: 'ember', name: 'Ember', hex: '#F59E0B' },
  ];

  const currentFmt = formats[activeFormat];

  // Dynamic Satori OG URL with full query parameters to prevent fallback mismatch
  const getBannerUrl = (fmt: BannerFormat = activeFormat, st: BannerStyle = activeStyle, tm: TemplateType = activeTemplate) => {
    const params = new URLSearchParams();
    params.set('format', fmt);
    params.set('style', st);
    params.set('template', tm);
    if (event.title) params.set('title', event.title);
    if (event.tagline) params.set('tagline', event.tagline);
    if (event.city) params.set('city', event.city);
    if (event.location_name) params.set('location', event.location_name);
    if (event.organizer_name) params.set('organizer', event.organizer_name);
    if (event.cover_image_url) params.set('cover', event.cover_image_url);
    if (event.start_at) params.set('date', event.start_at);
    if (event.organizer_brand_color) params.set('accent', event.organizer_brand_color);
    params.set('t', String(event.updated_at || event.created_at || '1'));

    const slugParam = event.slug || 'preview';
    return `/api/og/${encodeURIComponent(slugParam)}?${params.toString()}`;
  };

  const handleDownload = async (fmt: BannerFormat) => {
    setIsDownloading(true);
    try {
      const url = getBannerUrl(fmt, activeStyle, activeTemplate);
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${event.slug || 'event'}-${fmt}-${activeStyle}.png`;
      link.href = blobUrl;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Failed to download banner:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const formatsList: BannerFormat[] = ['whatsapp', 'story', 'post'];

      for (const fmt of formatsList) {
        const url = getBannerUrl(fmt, activeStyle, activeTemplate);
        const res = await fetch(url);
        const blob = await res.blob();
        zip.file(`${event.slug || 'event'}-${fmt}-${activeStyle}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.download = `${event.slug || 'event'}-${activeStyle}-social-pack.zip`;
      link.href = downloadUrl;
      link.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleCopyCaption = () => {
    const caption = event.instagram_caption ||
      `${event.title}\n\n${event.tagline}\n\n📅 ${formatIST(event.start_at)}\n📍 ${event.location_name}, ${event.city}\n\nClaim your pass: link in bio! #VibeBySwaniki #${event.city}Events`;
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyBannerLink = () => {
    const fullUrl = `${window.location.origin}${getBannerUrl(activeFormat, activeStyle, activeTemplate)}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-border shadow-elevated max-w-5xl w-full overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-surface-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg sm:text-xl text-ink">
                  Social Share Banners
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-extrabold uppercase tracking-wide border border-accent/20">
                  Live Satori Engine
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Customized for {event.title || 'your event'} · {event.city || 'India'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-3 text-ink-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Notification Banner */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold">✓ Event Published</span>
            <span className="hidden sm:inline text-emerald-600/60">•</span>
            <span className="truncate">Confirmation email with public and dashboard links dispatched to your registered email.</span>
          </div>
          <a
            href={`/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 ml-2"
          >
            Preview Page ↗
          </a>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Customizers & Actions */}
          <div className="lg:col-span-5 space-y-5">
            {/* Step 1: Visual Style Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-accent" />
                  1. Visual Banner Style
                </span>
                <span className="text-[10px] text-ink-muted font-medium">5 unique aesthetics</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {bannerStyles.map((st) => {
                  const Icon = st.icon;
                  const isSelected = activeStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      onClick={() => setActiveStyle(st.id)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-accent/10 border-accent text-ink shadow-sm'
                          : 'bg-surface-2 border-border hover:bg-surface-3 text-ink-secondary'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-accent text-white' : 'bg-surface border border-border text-ink-muted'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink">{st.name}</span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${isSelected ? 'bg-accent text-white' : 'bg-surface-3 text-ink-muted'}`}>
                            {st.badge}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-ink-muted leading-tight mt-0.5">
                          {st.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Format Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                2. Canvas Format
              </span>

              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(formats) as BannerFormat[]).map((fmtKey) => {
                  const item = formats[fmtKey];
                  const Icon = item.icon;
                  const isSelected = activeFormat === fmtKey;

                  return (
                    <button
                      key={fmtKey}
                      onClick={() => setActiveFormat(fmtKey)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'bg-accent text-white border-accent shadow-sm'
                          : 'bg-surface-2 border-border hover:bg-surface-3 text-ink-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-xs font-bold leading-tight">{item.name.replace(' Banner', '').replace('Instagram ', '')}</span>
                      <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-ink-muted'}`}>
                        {item.ratio}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Color Theme Override */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                3. Color Palette
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {palettes.map((p) => {
                  const isSelected = activeTemplate === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveTemplate(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/10 text-ink shadow-xs'
                          : 'border-border bg-surface-2 text-ink-secondary hover:bg-surface-3'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.hex }} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Instagram Caption Box */}
            <div className="bg-surface-2 rounded-xl p-3.5 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  Social Caption
                </span>
                <button
                  onClick={handleCopyCaption}
                  className="text-[11px] text-accent hover:underline flex items-center gap-1 font-semibold"
                >
                  {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy Caption'}</span>
                </button>
              </div>
              <p className="text-xs text-ink-secondary line-clamp-3 italic leading-relaxed">
                {event.instagram_caption || `${event.title} — ${event.tagline} #VibeBySwaniki`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleDownload(activeFormat)}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-btn bg-brand hover:bg-brand-mid text-white text-xs font-bold shadow-sm hover-lift disabled:opacity-50 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Rendering Image...' : `Download ${currentFmt.name} (PNG)`}</span>
              </button>

              <button
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-btn bg-accent hover:bg-accent-dark text-white text-xs font-bold shadow-sm hover-lift disabled:opacity-50 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isZipping ? 'Bundling ZIP...' : 'Download All 3 Formats (.ZIP)'}</span>
              </button>

              <button
                onClick={handleCopyBannerLink}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-btn bg-surface-2 hover:bg-surface-3 border border-border text-ink text-xs font-semibold transition-all"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-accent" />}
                <span>{copiedUrl ? 'Copied Banner Link!' : 'Copy Dynamic Image URL'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Satori Dynamic Banner Preview */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-brand-deep/5 rounded-2xl p-4 sm:p-6 border border-border min-h-[440px]">
            <div className="relative w-full flex items-center justify-center overflow-hidden">
              <img
                key={`${activeFormat}-${activeStyle}-${activeTemplate}`}
                src={getBannerUrl(activeFormat, activeStyle, activeTemplate)}
                alt={`${event.title} - ${currentFmt.name} (${activeStyle})`}
                className={`rounded-xl shadow-elevated border border-white/20 object-contain transition-all duration-300 ${currentFmt.aspectClass}`}
              />
            </div>

            <div className="flex items-center justify-between w-full mt-3 px-2 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Satori Engine ({currentFmt.width}×{currentFmt.height}px) · Style: <strong className="text-ink capitalize">{activeStyle}</strong>
              </span>
              <a
                href={getBannerUrl(activeFormat, activeStyle, activeTemplate)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline font-semibold"
              >
                Open Full Resolution ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
