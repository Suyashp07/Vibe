import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  Trash2,
  Upload,
  Link2,
  Wand2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Check,
  Maximize2,
  Sparkles,
  Eye,
  Layers
} from 'lucide-react';
import { getCategoryCover } from '@/lib/ai/eventExtractor';
import { calculateEventSurety } from '@/lib/eventSurety';
import {
  AdminEvent,
  CATEGORIES,
  isIngestedEvent,
  toDateInputValue,
  toTimeInputValue,
  getCategoryValue
} from './types';

interface DetailInspectorProps {
  event: AdminEvent;
  duplicate?: AdminEvent;
  savingAction: string | null;
  onClose: () => void;
  onSave: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onChange: (field: string, value: any) => void;
}

export default function DetailInspector({
  event,
  duplicate,
  savingAction,
  onClose,
  onSave,
  onApprove,
  onReject,
  onDelete,
  onChange,
}: DetailInspectorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [refetchUrl, setRefetchUrl] = useState(event.external_ticket_url || event.ticket_link || '');
  const [refetching, setRefetching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coverImg = event.cover_image_url || event.cover_image || event.image_url;
  const isPending = (event.status || '').toLowerCase() === 'draft' || (event.status || '').toLowerCase() === 'review';

  // State for dynamic resolution detection & proxy fallback
  const [imageError, setImageError] = useState(false);
  const [isUsingProxy, setIsUsingProxy] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [showLightbox, setShowLightbox] = useState(false);
  const [imgMeta, setImgMeta] = useState<{
    width: number;
    height: number;
    ratio: string;
    label: string;
    quality: string;
  } | null>(null);

  // Use proxy if direct image loading fails
  const effectiveCoverImg = useMemo(() => {
    if (!coverImg) return '';
    if (isUsingProxy && coverImg.startsWith('http') && !coverImg.startsWith('/api/image-proxy')) {
      return `/api/image-proxy?url=${encodeURIComponent(coverImg)}`;
    }
    return coverImg;
  }, [coverImg, isUsingProxy]);

  useEffect(() => {
    setImageError(false);
    setIsUsingProxy(false);
    setImgMeta(null);
  }, [coverImg]);

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(false);
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w && h) {
      let label = 'Square (1:1)';
      if (w > h * 1.1) {
        label = w / h >= 1.9 ? 'Widescreen (2:1)' : w / h >= 1.55 ? 'Landscape (16:9)' : 'Standard (4:3)';
      } else if (h > w * 1.1) {
        label = h / w >= 1.6 ? 'Story Flyer (9:16)' : h / w >= 1.4 ? 'Flyer (2:3)' : 'Portrait (3:4)';
      }
      let quality = 'SD';
      if (w >= 3840 || h >= 3840) quality = '4K UHD';
      else if (w >= 1920 || h >= 1920) quality = 'Full HD';
      else if (w >= 1080 || h >= 1080) quality = 'HD';

      setImgMeta({
        width: w,
        height: h,
        ratio: `${(w / h).toFixed(2)}:1`,
        label,
        quality,
      });
    }
  };

  const handleImgError = () => {
    if (!isUsingProxy && coverImg && coverImg.startsWith('http') && !coverImg.startsWith('/api/image-proxy')) {
      console.warn('Direct poster load failed (CORS/hotlink), switching to proxy:', coverImg);
      setIsUsingProxy(true);
    } else {
      setImageError(true);
    }
  };

  // High-performance client-side canvas optimizer for ANY resolution upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const rawDataUrl = uploadEvent.target?.result as string;
      if (!rawDataUrl) return;

      const img = new (window as any).Image();
      img.onload = () => {
        const originW = img.naturalWidth || img.width;
        const originH = img.naturalHeight || img.height;

        const MAX_DIM = 1920;
        let targetW = originW;
        let targetH = originH;

        if (targetW > MAX_DIM || targetH > MAX_DIM) {
          if (targetW > targetH) {
            targetH = Math.round((targetH * MAX_DIM) / targetW);
            targetW = MAX_DIM;
          } else {
            targetW = Math.round((targetW * MAX_DIM) / targetH);
            targetH = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const optimizedDataUrl = canvas.toDataURL('image/webp', 0.88);
          onChange('cover_image_url', optimizedDataUrl);
          onChange('cover_image', optimizedDataUrl);
        } else {
          onChange('cover_image_url', rawDataUrl);
          onChange('cover_image', rawDataUrl);
        }
      };
      img.onerror = () => {
        onChange('cover_image_url', rawDataUrl);
        onChange('cover_image', rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUseCategoryCover = () => {
    const curCat = event.category || 'music';
    const fallback = getCategoryCover(curCat, event.title);
    onChange('cover_image_url', fallback);
    onChange('cover_image', fallback);
  };

  // Rescan from URL (extractOnly to avoid creating duplicate events)
  const handleRescan = async () => {
    if (!refetchUrl.trim()) return;
    setRefetching(true);
    // Sanitize URL in case of accidental noisy trailing characters
    const sanitizedUrl = refetchUrl.trim().replace(/(?:htt|http|https);*$/i, '');
    try {
      const res = await fetch('/api/admin/events/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sanitizedUrl, extractOnly: true }),
      });
      const data = await res.json();
      const ext = data.extracted || data.event;
      if (res.ok && ext) {
        if (ext.title) onChange('title', ext.title);
        if (ext.city) onChange('city', ext.city);
        if (ext.venue_name || ext.location_name) {
          onChange('venue_name', ext.venue_name || ext.location_name);
          onChange('location_name', ext.venue_name || ext.location_name);
        }
        if (ext.venue_address || ext.location_address) {
          onChange('venue_address', ext.venue_address || ext.location_address);
          onChange('location_address', ext.venue_address || ext.location_address);
        }
        if (ext.cover_image_url || ext.cover_image) {
          onChange('cover_image_url', ext.cover_image_url || ext.cover_image);
          onChange('cover_image', ext.cover_image_url || ext.cover_image);
        }
        if (ext.description) onChange('description', ext.description);
        if (ext.price_text || ext.external_price_text) {
          onChange('price_text', ext.price_text || ext.external_price_text);
          onChange('external_price_text', ext.price_text || ext.external_price_text);
        }
        if (ext.external_ticket_url || ext.ticket_link) {
          onChange('external_ticket_url', ext.external_ticket_url || ext.ticket_link);
        }
        if (ext.date) onChange('date', ext.date);
        if (ext.time) onChange('time', ext.time);
        if (ext.start_at) {
          onChange('start_at', ext.start_at);
          const d = new Date(ext.start_at);
          if (!isNaN(d.getTime())) {
            const dateStr = d.toISOString().split('T')[0];
            const timeStr = d.toTimeString().slice(0, 5);
            onChange('date', dateStr);
            onChange('time', timeStr);
          }
        }
        if (ext.category) onChange('category', getCategoryValue(ext.category));
        alert('Refreshed fields from URL. Click "Save Changes" below to apply.');
      } else {
        alert(data.error || 'Rescan failed');
      }
    } catch (err: any) {
      alert(`Rescan error: ${err.message}`);
    } finally {
      setRefetching(false);
    }
  };

  const surety = calculateEventSurety(event);

  return (
    <div className="flex flex-col min-h-full space-y-5 pb-8">
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="min-w-0">
          <h2 className="font-black text-base text-[#0A0A0A] truncate max-w-md">
            {event.title || event.name || 'Untitled Event'}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                (event.status || '').toLowerCase() === 'live' || (event.status || '').toLowerCase() === 'published'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : (event.status || '').toLowerCase() === 'cancelled'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {event.status || 'Draft'}
            </span>
            {isIngestedEvent(event) ? (
              <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                📥 Ingested ({event.source_platform || 'External'})
              </span>
            ) : (
              <span className="text-[10px] text-[#E8621A] bg-[#E8621A]/10 border border-[#E8621A]/20 px-2 py-0.5 rounded-full font-bold">
                ⚡ Vibe Specific Event
              </span>
            )}
            {event.slug && (
              <Link
                href={`/${event.slug}`}
                target="_blank"
                className="text-[10px] text-[#2563EB] hover:underline flex items-center gap-0.5"
              >
                <span>{isPending || (event.status || '').toLowerCase() !== 'live' && (event.status || '').toLowerCase() !== 'published' ? 'View Draft' : 'View Live'}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isPending && (
            <>
              <button
                onClick={onApprove}
                disabled={savingAction === `approve-${event.id}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-[#262626] transition-colors disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                onClick={onReject}
                disabled={savingAction === `reject-${event.id}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#E2E8F0] text-[#64748B] text-xs font-medium rounded-full hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          )}
          <button onClick={onClose} title="Close inspector" className="p-1 text-[#94A3B8] hover:text-[#0A0A0A] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Duplicate Alert Banner */}
      {duplicate && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Potential Duplicate Detected</p>
            <p className="text-[11px] mt-0.5">
              Matches existing event <span className="font-semibold">&quot;{duplicate.title}&quot;</span> scheduled for{' '}
              {duplicate.date || 'same date'} at {duplicate.venue_name || duplicate.city}.
            </p>
          </div>
        </div>
      )}

      {/* Event Surety & Details Comparison Section */}
      <div className={`p-3.5 rounded-xl border ${surety.borderColor} ${surety.bgColor} space-y-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${surety.textColor}`} />
            <div>
              <h3 className="font-bold text-xs text-[#0A0A0A]">
                Event Surety: <span className={surety.textColor}>{surety.score}%</span> ({surety.tier})
              </h3>
              <p className="text-[10px] text-[#64748B]">
                {surety.filledCount} of {surety.totalCount} details verified
              </p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${surety.badgeColor}`}>
            {surety.tier} Surety
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              surety.score >= 80 ? 'bg-emerald-500' : surety.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${surety.score}%` }}
          />
        </div>

        {/* Field Details Comparison Breakdown */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          {surety.checks.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between p-2 rounded-lg text-[10px] bg-white border ${
                c.present ? 'border-emerald-100' : 'border-rose-200'
              }`}
            >
              <div className="min-w-0 pr-1">
                <p className="font-semibold text-[#0A0A0A] truncate">{c.label}</p>
                <p className="text-[9px] text-[#64748B] truncate">{c.value || c.tip}</p>
              </div>
              <span className="shrink-0">
                {c.present ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[9px] flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" />
                    <span>OK</span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[9px]">
                    Missing
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {surety.missingCritical.length > 0 && (
          <div className="text-[10px] text-rose-800 bg-rose-100/80 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>
              Missing critical details: <strong className="font-semibold">{surety.missingCritical.join(', ')}</strong>. Please update before approving.
            </span>
          </div>
        )}
      </div>

      {/* Poster Studio & Multi-Resolution Inspector */}
      <div className="p-4 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Event Artwork / Poster
            </span>
            {imgMeta && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                imgMeta.quality === '4K UHD' || imgMeta.quality === 'Full HD'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {imgMeta.quality} · {imgMeta.width}×{imgMeta.height}
              </span>
            )}
            {isUsingProxy && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Via Proxy
              </span>
            )}
          </div>

          {/* Fit Mode Toggle & Lightbox Zoom */}
          {coverImg && !imageError && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setFitMode('contain')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    fitMode === 'contain' ? 'bg-slate-900 text-white shadow-2xs' : 'hover:text-slate-900'
                  }`}
                  title="Full Flyer (shows entire artwork without cropping any text)"
                >
                  Full Flyer
                </button>
                <button
                  type="button"
                  onClick={() => setFitMode('cover')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    fitMode === 'cover' ? 'bg-slate-900 text-white shadow-2xs' : 'hover:text-slate-900'
                  }`}
                  title="Cinema Fill"
                >
                  Fill
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowLightbox(true)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Inspect Full High-Resolution Poster"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Poster Viewer Container - Adapts to any aspect ratio */}
        <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center group shadow-xs">
          {coverImg ? (
            imageError ? (
              <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 bg-slate-900 text-white w-full h-full">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-xs font-bold text-white">Poster failed to load from direct URL</p>
                  <p className="text-[10px] text-slate-400 max-w-sm mt-0.5">
                    External CDN may have blocked hotlinking or the link has expired.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setImageError(false);
                      setIsUsingProxy(true);
                    }}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Load via Proxy</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCategoryCover}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Use Curated Art</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Ambient Blurred Backdrop for Full Flyer mode */}
                {fitMode === 'contain' && (
                  <img
                    src={effectiveCoverImg}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover filter blur-md opacity-40 scale-110 pointer-events-none"
                  />
                )}

                {/* Foreground Image - Supports Any Resolution */}
                <img
                  src={effectiveCoverImg}
                  alt={event.title || 'Event Artwork'}
                  referrerPolicy="no-referrer"
                  onLoad={handleImgLoad}
                  onError={handleImgError}
                  className={`relative z-10 w-full h-full transition-all ${
                    fitMode === 'contain' ? 'object-contain' : 'object-cover'
                  }`}
                />

                {/* Hover overlay hint */}
                <div
                  onClick={() => setShowLightbox(true)}
                  className="absolute inset-0 z-20 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold gap-1.5 backdrop-blur-2xs"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Inspect Full Resolution</span>
                </div>
              </>
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-1.5">
              <Upload className="w-6 h-6 text-slate-500" />
              <p className="text-xs font-bold text-slate-300">No artwork attached</p>
              <p className="text-[10px] text-slate-500">Upload a flyer or link any image URL</p>
            </div>
          )}
        </div>

        {/* Action Controls & Format Helper */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor="inspector-poster-upload"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{coverImg ? 'Replace Poster' : 'Upload Poster'}</span>
            </label>
            <input
              id="inspector-poster-upload"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => setShowLinkInput((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Link2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Link Any URL</span>
            </button>

            <button
              type="button"
              onClick={handleUseCategoryCover}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              title="Pick curated HD aesthetic cover for this event category"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Curated Art</span>
            </button>

            {coverImg && (
              <button
                type="button"
                onClick={() => {
                  onChange('cover_image_url', null);
                  onChange('cover_image', null);
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          {imgMeta && (
            <span className="text-[11px] font-mono text-slate-500">
              {imgMeta.label} ({imgMeta.ratio})
            </span>
          )}
        </div>

        {/* Link Input Row */}
        {showLinkInput && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Paste any poster link (BookMyShow, Luma, Unsplash, etc.)..."
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => {
                if (linkUrl.trim()) {
                  onChange('cover_image_url', linkUrl.trim());
                  onChange('cover_image', linkUrl.trim());
                  setShowLinkInput(false);
                  setLinkUrl('');
                }
              }}
              className="px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer shadow-2xs"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Modal for 100% Full-Resolution Inspection */}
      {showLightbox && coverImg && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={effectiveCoverImg}
              alt={event.title || 'Artwork'}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            {imgMeta && (
              <div className="mt-3 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-mono backdrop-blur-md">
                {imgMeta.width} × {imgMeta.height} px · {imgMeta.label} ({imgMeta.quality})
              </div>
            )}
          </div>
        </div>
      )}

      {/* Re-scan from URL Box */}
      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
        <p className="text-xs font-bold text-[#475569] flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Auto-fill / Refresh from URL</span>
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={refetchUrl}
            onChange={(e) => setRefetchUrl(e.target.value)}
            placeholder="https://in.bookmyshow.com/... or https://lu.ma/..."
            className="flex-1 min-w-0 px-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#0A0A0A] font-mono"
          />
          <button
            type="button"
            onClick={handleRescan}
            disabled={refetching || !refetchUrl.trim()}
            className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {refetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            <span>{refetching ? 'Scanning...' : 'Auto-fill Fields'}</span>
          </button>
        </div>
        <p className="text-[10px] text-[#64748B]">
          Extracts and populates fields into this form without creating duplicates. Click &quot;Save Changes&quot; below to apply.
        </p>
      </div>

      {/* Editable Fields */}
      <div className="space-y-3 pt-2">
        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Event Title</label>
          <input
            type="text"
            value={event.title || event.name || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Date</label>
            <input
              type="date"
              value={toDateInputValue(event.date, event.start_at)}
              onChange={(e) => onChange('date', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Time</label>
            <input
              type="time"
              value={toTimeInputValue(event.time, event.start_at)}
              onChange={(e) => onChange('time', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">City</label>
            <input
              type="text"
              value={event.city || ''}
              onChange={(e) => onChange('city', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Category</label>
            <select
              value={getCategoryValue(event.category)}
              onChange={(e) => onChange('category', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Venue Name</label>
          <input
            type="text"
            value={event.venue_name || event.location_name || ''}
            onChange={(e) => {
              onChange('venue_name', e.target.value);
              onChange('location_name', e.target.value);
            }}
            placeholder="e.g. The Mills"
            className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Venue Address / Landmark</label>
          <input
            type="text"
            value={event.venue_address || event.location_address || ''}
            onChange={(e) => {
              onChange('venue_address', e.target.value);
              onChange('location_address', e.target.value);
            }}
            placeholder="Detailed street address or landmark"
            className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Price</label>
            <input
              type="text"
              value={event.price_text || event.external_price_text || ''}
              onChange={(e) => onChange('price_text', e.target.value)}
              placeholder="Free Entry or ₹499"
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">External Ticket URL</label>
            <input
              type="url"
              value={event.external_ticket_url || event.ticket_link || ''}
              onChange={(e) => onChange('external_ticket_url', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1">Description</label>
          <textarea
            rows={4}
            value={event.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0A0A0A] resize-y"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={savingAction === 'saving-edits'}
            className="px-4 py-2 border border-[#0A0A0A] text-[#0A0A0A] text-xs font-bold rounded-full hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {savingAction === 'saving-edits' ? 'Saving...' : 'Save Changes'}
          </button>
          {isPending && (
            <button
              type="button"
              onClick={onApprove}
              disabled={savingAction === `approve-${event.id}`}
              className="px-4 py-2 bg-[#0A0A0A] text-white text-xs font-bold rounded-full hover:bg-[#262626] transition-colors disabled:opacity-50 cursor-pointer"
            >
              Approve & Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
